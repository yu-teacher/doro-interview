// 가짜 Doro 의 규격 시험: node --test scripts/rehearse/fake-doro.test.mjs
import assert from 'node:assert/strict';
import { createPublicKey, verify } from 'node:crypto';
import { after, before, describe, it } from 'node:test';
import { COOKIE, CSRF_HEADER, createFakeDoro, DEFAULT_USER, INTERNAL_TOKEN, KID, safeReturnPath } from './fake-doro.mjs';

const OTHER = '11111111-1111-1111-1111-111111111111';
let doro; let base;

before(async () => {
  doro = createFakeDoro();
  base = `http://127.0.0.1:${await doro.listen(0)}`;
});
after(() => doro.close());

const get = (path, headers = {}) => fetch(base + path, { headers, redirect: 'manual' });
const sidFrom = (res) => /doro_interview_session=([^;]+)/.exec(res.headers.get('set-cookie') ?? '')?.[1];
const decode = (jwt) => JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString());

async function login(user) {
  const res = await get('/bff/interview/login?return=%2Fq%2Ftx-01', user ? { cookie: `fake_user=${user}` } : {});
  return { res, sid: sidFrom(res) };
}

describe('JWKS·토큰', () => {
  it('JWKS 공개 키로 발급한 토큰의 서명이 검증되고 SDK 가 읽는 클레임이 있다', async () => {
    const { keys } = await (await get('/.well-known/jwks.json')).json();
    assert.equal(keys.length, 1);
    assert.equal(keys[0].kid, KID);
    assert.equal(keys[0].kty, 'RSA');
    assert.equal(keys[0].alg, 'RS256');
    assert.equal(keys[0].d, undefined, '개인 키가 노출되면 안 된다');

    const { token } = await (await get(`/dev/token?user=${OTHER}`)).json();
    const [h, p, s] = token.split('.');
    const ok = verify('RSA-SHA256', Buffer.from(`${h}.${p}`), createPublicKey({ key: keys[0], format: 'jwk' }), Buffer.from(s, 'base64url'));
    assert.equal(ok, true);
    const header = JSON.parse(Buffer.from(h, 'base64url').toString());
    assert.deepEqual([header.alg, header.kid], ['RS256', KID]);
    const claims = decode(token);
    assert.equal(claims.sub, OTHER);
    assert.equal(claims.cid, 'doro-interview');
    assert.ok(claims.exp > Date.now() / 1000 && claims.exp - claims.iat <= 1000);
    assert.ok(claims.sid && claims.email && claims.role);
  });

  it('사용자 id 가 UUID 가 아니면 400', async () => {
    assert.equal((await get('/dev/token?user=not-a-uuid')).status, 400);
  });
});

describe('로그인·로그아웃', () => {
  it('로그인은 HttpOnly 세션 쿠키를 심고 서비스 안의 경로로 돌려보낸다', async () => {
    const { res, sid } = await login();
    assert.equal(res.status, 302);
    assert.equal(res.headers.get('location'), '/interview/q/tx-01');
    assert.ok(sid && sid.length >= 24);
    const cookie = res.headers.get('set-cookie');
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /Path=\/interview/);
    assert.match(cookie, /SameSite=Lax/);
  });

  it('돌아갈 경로는 서비스 안의 절대 경로만 받는다(열린 리다이렉트 금지)', () => {
    for (const bad of ['//evil.example', 'https://evil.example', '/\\evil.example', 'relative', '/a\r\nSet-Cookie: x=1', undefined, null, '/x://y']) {
      assert.equal(safeReturnPath(bad), '/', String(bad));
    }
    assert.equal(safeReturnPath('/t/transaction?tier=BASIC'), '/t/transaction?tier=BASIC');
  });

  it('로그아웃은 CSRF 헤더가 있어야 하고 세션을 지운다', async () => {
    const { sid } = await login();
    const cookie = `${COOKIE}=${sid}`;
    assert.equal((await fetch(`${base}/bff/interview/logout`, { method: 'POST', headers: { cookie } })).status, 403);
    assert.equal((await get('/internal/auth', { cookie, 'x-doro-service': 'interview', 'x-original-method': 'GET' })).headers.get('x-doro-access-token') !== null, true);
    const out = await fetch(`${base}/bff/interview/logout`, { method: 'POST', headers: { cookie, [CSRF_HEADER]: '1' } });
    assert.equal(out.status, 200);
    assert.match(out.headers.get('set-cookie'), /Max-Age=0/);
    assert.equal((await get('/internal/auth', { cookie, 'x-doro-service': 'interview', 'x-original-method': 'GET' })).headers.get('x-doro-access-token'), null);
  });
});

describe('/internal/auth (게이트웨이 auth_request)', () => {
  const auth = (cookie, method = 'GET', extra = {}) =>
    get('/internal/auth', { 'x-doro-service': 'interview', 'x-original-method': method, ...(cookie ? { cookie } : {}), ...extra });

  it('쿠키가 없거나 모르는 세션이면 204 에 토큰이 없다(익명)', async () => {
    for (const cookie of [undefined, `${COOKIE}=nope`, 'other=1']) {
      const res = await auth(cookie);
      assert.equal(res.status, 204);
      assert.equal(res.headers.get('x-doro-access-token'), null);
    }
  });

  it('세션이 있으면 그 사용자의 토큰을 준다(사용자마다 다르다)', async () => {
    const a = await login(); const b = await login(OTHER);
    const ta = (await auth(`${COOKIE}=${a.sid}`)).headers.get('x-doro-access-token');
    const tb = (await auth(`${COOKIE}=${b.sid}`)).headers.get('x-doro-access-token');
    assert.equal(decode(ta).sub, DEFAULT_USER);
    assert.equal(decode(tb).sub, OTHER);
  });

  it('쿠키가 있고 쓰기 요청인데 CSRF 헤더가 없으면 403, 있으면 통과', async () => {
    const { sid } = await login();
    const cookie = `${COOKIE}=${sid}`;
    for (const method of ['PUT', 'POST', 'DELETE', 'PATCH']) {
      assert.equal((await auth(cookie, method)).status, 403, method);
      assert.equal((await auth(cookie, method, { [CSRF_HEADER]: '1' })).status, 204, method);
    }
    assert.equal((await auth(cookie, 'GET')).status, 204);
  });

  it('다른 서비스 이름으로 부르면 400', async () => {
    assert.equal((await get('/internal/auth', { 'x-doro-service': 'blog' })).status, 400);
  });
});

describe('내부 API: 탈퇴 목록', () => {
  it('서비스 토큰이 없거나 틀리면 401', async () => {
    assert.equal((await get('/internal/v1/deleted-users')).status, 401);
    assert.equal((await get('/internal/v1/deleted-users', { 'x-doro-service-token': 'wrong' })).status, 401);
  });

  it('탈퇴 목록을 오래된 순으로 주고 since 이후만 준다', async () => {
    await fetch(`${base}/dev/deleted?user=${OTHER}`, { method: 'POST' });
    const res = await get('/internal/v1/deleted-users?since=1970-01-01T00:00:00Z&limit=10', { 'x-doro-service-token': INTERNAL_TOKEN });
    const body = await res.json();
    assert.equal(body.success, true);
    assert.deepEqual(body.data.items.map((i) => i.userId), [OTHER]);
    assert.ok(body.data.nextSince);
    const later = await get(`/internal/v1/deleted-users?since=${encodeURIComponent(new Date(Date.now() + 60000).toISOString())}`, { 'x-doro-service-token': INTERNAL_TOKEN });
    assert.deepEqual((await later.json()).data.items, []);
  });
});

it('모르는 경로는 404', async () => {
  assert.equal((await get('/nope')).status, 404);
});
