// 가짜 Doro(IAM + BFF + 내부 API): 통합 e2e·배포 리허설에서 실제 Doro 없이 로그인 흐름을 흉내 낸다. Node 내장 모듈만 쓴다.
//
// 흉내 내는 것(우리가 읽은 규격대로이며, 규격을 잘못 읽었다면 이 스텁도 같이 틀린다 — docs/M2-PLAN.md A1):
//   GET  /.well-known/jwks.json            IAM 의 JWKS(RS256 공개 키)
//   GET  /dev/token?user=<uuid>            시험용 액세스 토큰 발급(클레임: sub, email, sid, role, cid, iat, exp)
//   GET  /bff/interview/login?return=<경로>  BFF 로그인: 세션 쿠키를 심고 서비스 안의 경로로 돌려보낸다(PKCE·IAM 로그인 화면은 생략)
//   GET  /bff/interview/callback           돌아오는 곳(스텁은 바로 서비스 첫 화면으로)
//   POST /bff/interview/logout             세션을 지운다(CSRF 헤더 필수)
//   GET  /internal/auth                    게이트웨이의 auth_request: 쿠키 → 204 + X-Doro-Access-Token, 쿠키 없음/모르는 세션 → 204(토큰 없음),
//                                          쿠키가 있고 쓰기 요청인데 CSRF 헤더가 없으면 403
//   GET  /internal/v1/deleted-users        IAM 내부 API(서비스 토큰 필요)
//   POST /dev/deleted?user=<uuid>          탈퇴 목록에 사용자를 넣는다(시험 조작용)
//   POST /v1beta/models/<model>:generateContent  가짜 Gemini(M6 기본 공급자): 키는 x-goog-api-key, 본문에 FAIL-ME 가 있으면 500
//   POST /v1/messages                      가짜 AI 공급자(Anthropic Messages API 모양, M6): 키가 AI_KEY 와 같아야 하고, 본문에 FAIL-ME 가 있으면 500
//   GET  /dev/ai-last                      마지막으로 받은 AI 요청(키는 헤더 이름과 일치 여부만, 값은 돌려주지 않는다)
//   POST /dev/outage?on=1|0                BFF 장애를 흉내 낸다(켜면 /internal/auth 가 500)
//
// 로그인할 사용자는 쿠키 fake_user=<uuid>(없으면 고정 사용자)로 고른다. 실제 서비스 이름·쿠키 이름은 이 서비스의 것이다.
import { createServer as createHttpServer } from 'node:http';
import { generateKeyPairSync, randomUUID, randomBytes, sign } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const SERVICE = 'interview';
export const COOKIE = 'doro_interview_session';
export const CSRF_HEADER = 'x-interview-csrf';
export const CLIENT_ID = 'doro-interview';
export const KID = 'fake-doro-kid';
export const INTERNAL_TOKEN = 'fake-internal-token';
/** 가짜 AI 공급자가 받아들이는 키(통합 e2e 의 백엔드가 같은 값을 ANTHROPIC_API_KEY 로 받는다) */
export const AI_KEY = 'fake-ai-key-for-e2e';
export const DEFAULT_USER = '00000000-0000-0000-0000-000000000001';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const b64url = (buf) => Buffer.from(buf).toString('base64url');

/** 로그인 뒤 돌아갈 경로: 서비스 안의 절대 경로만(열린 리다이렉트 금지). 아니면 처음 화면. */
export function safeReturnPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value) || value.includes('://')) {
    return '/';
  }
  return value;
}

export function createFakeDoro({ internalToken = INTERNAL_TOKEN } = {}) {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: KID, use: 'sig', alg: 'RS256' };
  const sessions = new Map(); // sid → userId
  const deleted = []; // {userId, deletedAt}
  let outage = false;
  let aiLast = null; // {keyOk, body}

  function token(userId, { expiresInSec = 900, clientId = CLIENT_ID } = {}) {
    const now = Math.floor(Date.now() / 1000);
    const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: KID }));
    const payload = b64url(JSON.stringify({
      sub: userId, email: 'user@example.test', sid: randomUUID(), role: 'USER', cid: clientId, iat: now - 10, exp: now + expiresInSec,
    }));
    const data = `${header}.${payload}`;
    return `${data}.${b64url(sign('RSA-SHA256', Buffer.from(data), privateKey))}`;
  }

  const cookies = (req) => Object.fromEntries((req.headers.cookie ?? '').split(';').map((c) => c.trim().split('=')).filter((p) => p[0]).map(([k, ...v]) => [k, v.join('=')]));
  const json = (res, status, body, headers = {}) => {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers });
    res.end(JSON.stringify(body));
  };
  const csrfError = (res) => json(res, 403, { success: false, code: 'AUTH-403-03', message: '요청을 확인할 수 없습니다.', status: 403 });
  const unsafe = (method) => !['GET', 'HEAD', 'OPTIONS'].includes(String(method).toUpperCase());

  const server = createHttpServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;

    if (path === '/health') {
      return json(res, 200, { status: 'UP' });
    }
    if (path === '/.well-known/jwks.json') {
      return json(res, 200, { keys: [jwk] });
    }
    if (path === '/dev/token') {
      const user = url.searchParams.get('user') ?? DEFAULT_USER;
      return UUID_RE.test(user) ? json(res, 200, { token: token(user) }) : json(res, 400, { success: false, code: 'BAD_USER' });
    }
    if (path === `/bff/${SERVICE}/login` && req.method === 'GET') {
      const user = cookies(req).fake_user ?? DEFAULT_USER;
      if (!UUID_RE.test(user)) {
        return json(res, 400, { success: false, code: 'BAD_USER' });
      }
      const sid = randomBytes(24).toString('base64url');
      sessions.set(sid, user);
      const back = safeReturnPath(url.searchParams.get('return'));
      res.writeHead(302, {
        'Set-Cookie': `${COOKIE}=${sid}; Path=/${SERVICE}; HttpOnly; SameSite=Lax`,
        Location: `/${SERVICE}${back === '/' ? '/' : back}`,
        'Cache-Control': 'no-store',
      });
      return res.end();
    }
    if (path === `/bff/${SERVICE}/callback`) {
      res.writeHead(302, { Location: `/${SERVICE}/` });
      return res.end();
    }
    if (path === `/bff/${SERVICE}/logout` && req.method === 'POST') {
      if (!req.headers[CSRF_HEADER]) {
        return csrfError(res);
      }
      const sid = cookies(req)[COOKIE];
      if (sid) {
        sessions.delete(sid);
      }
      return json(res, 200, { success: true, data: null }, { 'Set-Cookie': `${COOKIE}=; Path=/${SERVICE}; HttpOnly; Max-Age=0; SameSite=Lax` });
    }
    if (path === '/internal/auth') {
      if (outage) {
        return json(res, 500, { success: false, code: 'OUTAGE' });
      }
      if (req.headers['x-doro-service'] !== SERVICE) {
        return json(res, 400, { success: false, code: 'BAD_SERVICE' });
      }
      const user = sessions.get(cookies(req)[COOKIE] ?? '');
      if (!user) {
        res.writeHead(204);
        return res.end(); // 쿠키 없음·모르는 세션: 익명(토큰 없음)
      }
      if (unsafe(req.headers['x-original-method']) && !req.headers[CSRF_HEADER]) {
        return csrfError(res);
      }
      res.writeHead(204, { 'X-Doro-Access-Token': token(user) });
      return res.end();
    }
    if (path === '/internal/v1/deleted-users') {
      if (req.headers['x-doro-service-token'] !== internalToken) {
        return json(res, 401, { success: false, code: 'AUTH-401' });
      }
      const since = new Date(url.searchParams.get('since') ?? 0);
      const limit = Number(url.searchParams.get('limit') ?? 200);
      const items = deleted.filter((d) => new Date(d.deletedAt) >= since).sort((a, b) => a.deletedAt.localeCompare(b.deletedAt)).slice(0, limit);
      const nextSince = items.length ? items[items.length - 1].deletedAt : new Date().toISOString();
      return json(res, 200, { success: true, data: { items, nextSince } });
    }
    if (path === '/v1/messages' && req.method === 'POST') {
      // 가짜 AI 공급자(M6). 실제 API 와 같은 경로·헤더·본문 모양만 흉내 낸다.
      let raw = '';
      req.on('data', (c) => { raw += c; });
      req.on('end', () => {
        const keyOk = req.headers['x-api-key'] === AI_KEY && req.headers['anthropic-version'] === '2023-06-01';
        let parsed = null;
        try { parsed = JSON.parse(raw); } catch { /* 아래에서 400 */ }
        aiLast = { keyOk, body: parsed };
        if (!keyOk) {
          return json(res, 401, { type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } });
        }
        const content = parsed?.messages?.[0]?.content;
        if (typeof content !== 'string') {
          return json(res, 400, { type: 'error', error: { type: 'invalid_request_error', message: 'bad body' } });
        }
        if (content.includes('FAIL-ME')) {
          return json(res, 500, { type: 'error', error: { type: 'api_error', message: 'boom' } });
        }
        const candidate = /<candidate>\n([\s\S]*?)\n<\/candidate>/.exec(content)?.[1] ?? '';
        return json(res, 200, { id: 'msg_fake', type: 'message', role: 'assistant', model: 'fake-model', content: [{ type: 'text', text: `[가짜 AI] ${candidate.slice(0, 40)} 에 대한 의견입니다.` }], stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 } });
      });
      return undefined;
    }
    if (/^\/v1beta\/models\/[^/]+:generateContent$/.test(path) && req.method === 'POST') {
      // 가짜 Gemini(Google AI Studio) generateContent. 키는 x-goog-api-key 헤더.
      let raw = '';
      req.on('data', (c) => { raw += c; });
      req.on('end', () => {
        const keyOk = req.headers['x-goog-api-key'] === AI_KEY;
        let parsed = null;
        try { parsed = JSON.parse(raw); } catch { /* 아래에서 400 */ }
        aiLast = { keyOk, body: parsed, provider: 'gemini' };
        if (!keyOk) {
          return json(res, 403, { error: { code: 403, message: 'API key not valid', status: 'PERMISSION_DENIED' } });
        }
        const content = parsed?.contents?.[0]?.parts?.[0]?.text;
        if (typeof content !== 'string') {
          return json(res, 400, { error: { code: 400, message: 'bad body', status: 'INVALID_ARGUMENT' } });
        }
        if (content.includes('FAIL-ME')) {
          return json(res, 500, { error: { code: 500, message: 'boom', status: 'INTERNAL' } });
        }
        const candidate = /<candidate>\n([\s\S]*?)\n<\/candidate>/.exec(content)?.[1] ?? '';
        return json(res, 200, {
          candidates: [{ content: { role: 'model', parts: [{ text: `[가짜 AI] ${candidate.slice(0, 40)} 에 대한 의견입니다.` }] }, finishReason: 'STOP', index: 0 }],
          usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1, totalTokenCount: 2 }, modelVersion: 'fake-gemini',
        });
      });
      return undefined;
    }
    if (path === '/dev/ai-last') {
      return json(res, 200, aiLast ?? { keyOk: null, body: null });
    }
    if (path === '/dev/outage' && req.method === 'POST') {
      // BFF 장애 시나리오(게이트웨이가 503 을 내는지)용: 켜면 auth_request 대상(/internal/auth)이 500 을 준다. 끄면 복구된다.
      outage = url.searchParams.get('on') === '1';
      return json(res, 200, { success: true, outage });
    }
    if (path === '/dev/deleted' && req.method === 'POST') {
      const user = url.searchParams.get('user') ?? '';
      if (!UUID_RE.test(user)) {
        return json(res, 400, { success: false, code: 'BAD_USER' });
      }
      deleted.push({ userId: user, deletedAt: new Date().toISOString() });
      return json(res, 200, { success: true });
    }
    return json(res, 404, { success: false, code: 'NOT_FOUND' });
  });

  return {
    server,
    token,
    sessionCount: () => sessions.size,
    listen: (port, host = '127.0.0.1') => new Promise((resolve) => server.listen(port, host, () => resolve(server.address().port))),
    close: () => new Promise((resolve) => { server.closeAllConnections?.(); server.close(() => resolve()); }),
  };
}

// 직접 실행: node fake-doro.mjs [포트]   (환경: FAKE_DORO_HOST 기본 127.0.0.1)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.argv[2] ?? process.env.FAKE_DORO_PORT ?? 18085);
  const doro = createFakeDoro({ internalToken: process.env.FAKE_DORO_INTERNAL_TOKEN ?? INTERNAL_TOKEN });
  const host = process.env.FAKE_DORO_HOST ?? '127.0.0.1';
  const actual = await doro.listen(port, host);
  console.log(`fake-doro listening on ${host}:${actual}`);
  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, () => doro.close().then(() => process.exit(0)));
  }
}
