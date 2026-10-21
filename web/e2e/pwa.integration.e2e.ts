import { execFileSync } from 'node:child_process';
import { cpSync, readdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type APIRequestContext, type Browser, type BrowserContext, type Page } from '@playwright/test';

/**
 * 서비스 워커(docs/M2-PLAN.md §6)를 실제 Chromium·실제 게이트웨이(CSP 강제)·실제 웹 nginx 로 확인한다. scripts/e2e-test.sh 가 E2E_PWA=1 로 돌린다.
 * 서로 다른 두 빌드(v1·v2: 화면에 빌드 표식)를 웹 컨테이너가 마운트한 디렉터리에 바꿔치며 "새 배포"를 흉내 낸다(옛 해시 파일은 지운다: 실제 이미지 교체와 같다).
 * 데스크톱 Chromium 만 확인한다. iOS 홈 화면 앱의 서비스 워커 수명주기는 이 환경에서 시험하지 못한다(정직한 한계).
 */
test.skip(process.env.E2E_PWA !== '1', 'E2E_PWA=1 (scripts/e2e-test.sh) 에서만 돌린다');
test.beforeEach(({ browserName: _b }, info) => {
  test.skip(info.project.name !== 'desktop', '데스크톱 프로젝트에서만 돌린다');
});
test.describe.configure({ mode: 'serial' });

const env = (name: string) => {
  const v = process.env[name];
  if (!v) {
    throw new Error(`${name} 가 없다(scripts/e2e-test.sh 로 실행한다)`);
  }
  return v;
};
const BASE = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:18490';

/** 웹 컨테이너가 마운트한 디렉터리의 **내용**을 한 빌드로 바꾼다(디렉터리 자체를 지우면 바인드 마운트가 끊긴다). */
/**
 * 배포마다 파일의 수정 시각을 서로 다르게 정한다. nginx 의 ETag·Last-Modified 는 수정 시각(초)과 크기로 만들어지는데, 두 빌드는 해시 길이가 같아 sw.js 의 크기가 같다.
 * 같은 초에 연달아 바꿔치면 내용은 다른데 검증값이 같아져 브라우저가 304 로 옛 sw.js 를 계속 쓴다(시험 도구의 문제다. 실제 배포는 분 단위로 떨어져 있다).
 */
let deployClock = Math.floor(Date.now() / 1000);

async function deploy(version: 'v1' | 'v2') {
  const live = env('E2E_DIST_LIVE');
  const source = env(version === 'v1' ? 'E2E_DIST_V1' : 'E2E_DIST_V2');
  for (const entry of readdirSync(live)) {
    rmSync(join(live, entry), { recursive: true, force: true });
  }
  cpSync(source, live, { recursive: true });
  deployClock += 10;
  const stamp = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        stamp(join(dir, e.name));
      } else {
        utimesSync(join(dir, e.name), deployClock, deployClock);
      }
    }
  };
  stamp(live);
  // 바인드 마운트된 디렉터리의 변경이 컨테이너에 보이기까지 잠깐 걸릴 수 있다(Docker Desktop). 새 서비스 워커의 설치는 미리 캐시 목록 **전부**를 받아야
  // 성공하므로(하나라도 못 받으면 설치가 실패한다), sw.js 만이 아니라 모든 파일이 게이트웨이 경유로 **같은 내용**으로 보일 때까지 기다린다.
  const files: { path: string; content: Buffer }[] = [];
  const walk = (dir: string, prefix: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        walk(join(dir, e.name), `${prefix}${e.name}/`);
      } else {
        files.push({ path: `${prefix}${e.name}`, content: readFileSync(join(dir, e.name)) });
      }
    }
  };
  walk(source, '');
  for (let i = 0; i < 100; i += 1) {
    const results = await Promise.all(files.map(async (f) => {
      const res = await fetch(`${BASE}/interview/${f.path}`, { cache: 'no-store' }).catch(() => null);
      // 크기만 비교하면 안 된다: 두 빌드는 해시 길이가 같아 sw.js·index.html 의 크기가 같다(옛 내용이 남아 있어도 통과해 버린다)
      return res?.ok === true && Buffer.from(await res.arrayBuffer()).equals(f.content);
    }));
    if (results.every(Boolean)) {
      return;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`${version} 배포가 게이트웨이에 반영되지 않았다`);
}

/** 게이트웨이 설정을 CSP 강제 또는 Report-Only 로 바꾸고 reload 한다(같은 inode 로 덮어쓴다). 컨테이너가 새 파일 내용을 볼 때까지 기다린 뒤 reload 한다. */
async function gateway(variant: 'enforced' | 'report') {
  const wanted = readFileSync(env(variant === 'enforced' ? 'E2E_GW_CONF_ENFORCED' : 'E2E_GW_CONF_REPORT'));
  writeFileSync(env('E2E_GW_CONF'), wanted);
  const container = env('E2E_GW_CONTAINER');
  for (let i = 0; i < 100; i += 1) {
    const seen = execFileSync('docker', ['exec', container, 'cat', '/etc/nginx/nginx.conf'], { stdio: 'pipe' });
    if (seen.equals(wanted)) {
      break;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  execFileSync('docker', ['exec', container, 'nginx', '-s', 'reload'], { stdio: 'pipe' });
  await new Promise((r) => setTimeout(r, 500)); // 새 워커가 요청을 받기 시작할 때까지
}

test.afterEach(async () => {
  await deploy('v1');
  await gateway('enforced');
});

const uuid = () => crypto.randomUUID();

async function pickQuestion(request: APIRequestContext): Promise<{ topic: string; slug: string }> {
  const categories = ((await (await request.get('/interview/api/v1/categories')).json()) as { data: { topics: { slug: string }[] }[] }).data;
  const topic = categories[0].topics[0].slug;
  const view = ((await (await request.get(`/interview/api/v1/topics/${topic}`)).json()) as { data: { questions: { slug: string }[] } }).data;
  return { topic, slug: view.questions[0].slug };
}

async function newPage(browser: Browser, opts: { serviceWorkers?: 'allow' | 'block'; user?: string } = {}): Promise<{ ctx: BrowserContext; page: Page; csp: () => Promise<string[]> }> {
  const ctx = await browser.newContext({ serviceWorkers: opts.serviceWorkers ?? 'allow', baseURL: BASE });
  if (opts.user) {
    await ctx.addCookies([{ name: 'fake_user', value: opts.user, url: BASE }]);
  }
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    (window as unknown as { __csp: string[] }).__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => (window as unknown as { __csp: string[] }).__csp.push(e.violatedDirective));
  });
  return { ctx, page, csp: () => page.evaluate(() => (window as unknown as { __csp: string[] }).__csp) };
}

const mark = (page: Page) => page.locator('[data-build-mark]');
async function controlled(page: Page) {
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
}
async function login(page: Page) {
  await page.getByRole('link', { name: '로그인' }).first().click();
  await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();
}
/** 탭이 숨었다 돌아온 것을 흉내 낸다(보이는 상태 값과 이벤트를 바꾼다). */
async function hideAndShow(page: Page) {
  await page.evaluate(() => {
    const set = (v: string) => Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => v });
    set('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    set('visible');
    document.dispatchEvent(new Event('visibilitychange'));
  });
}
/** 새 서비스 워커가 설치만 하고 대기 중이 될 때까지 기다린다. 실패하면 등록 상태와 서비스 워커 콘솔을 함께 알려 준다. */
async function expectWaiting(page: Page, updateResult: string) {
  const logs: string[] = [];
  page.on('console', (m) => logs.push(m.text()));
  try {
    await expect.poll(() => waitingWorker(page), { timeout: 15_000 }).toBe(true);
  } catch (e) {
    throw new Error(`대기 중인 서비스 워커가 없다: update=${updateResult} states=${await swStates(page)} console=${logs.slice(-5).join(' | ')}\n${String(e)}`);
  }
}
const waitingWorker = (page: Page) => page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())?.waiting);
const updateCheck = (page: Page) =>
  page.evaluate(async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const log: string[] = [];
      (window as unknown as { __swlog: string[] }).__swlog = log;
      reg?.addEventListener('updatefound', () => {
        const w = reg.installing;
        log.push(`updatefound:${w?.state}`);
        w?.addEventListener('statechange', () => log.push(`state:${w.state}`));
      });
      await reg?.update();
      await new Promise((r) => setTimeout(r, 1500));
      return `ok log=${log.join(',')}`;
    } catch (e) {
      return `update 실패: ${String(e)}`;
    }
  });
const swStates = (page: Page) =>
  page.evaluate(async () => {
    const r = await navigator.serviceWorker.getRegistration();
    return JSON.stringify({ installing: r?.installing?.state, waiting: r?.waiting?.state, active: r?.active?.state });
  });

test('설치: 서비스 워커가 활성화되고 미리 캐시된 주소가 전부 게이트웨이 경유 200 이며 CSP 위반이 없다', async ({ browser }) => {
  const { ctx, page, csp } = await newPage(browser);
  await page.goto('/interview/');
  await controlled(page);
  const cached = await page.evaluate(async () => {
    const name = (await caches.keys()).find((k) => k.startsWith('workbox-precache'));
    return name ? (await (await caches.open(name)).keys()).map((r) => new URL(r.url).pathname) : [];
  });
  expect(cached.length).toBeGreaterThanOrEqual(10);
  expect(cached).toContain('/interview/index.html');
  expect(cached.some((p) => /\/interview\/assets\/Markdown-.*\.js$/.test(p))).toBe(true); // 지연 조각도 미리 받아 둔다
  // 점검 스크립트: 배포 후 단계(전부 200, 이동 0, 정적 파일이 HTML 로 오는 것 0)를 게이트웨이 경유로 확인한다
  const out = execFileSync('bash', [env('E2E_PRECACHE_CHECK'), env('E2E_DIST_LIVE'), '/interview/', 'post'], { env: { ...process.env, GATEWAY_URL: BASE }, encoding: 'utf-8' });
  expect(out).toContain('미리 캐시 주소 전부 정상(post)');
  expect(out).not.toContain('FAIL');
  expect(await csp()).toEqual([]);
  await ctx.close();
});

test('업데이트 감지: 새 배포를 알아채도 보던 화면은 바로 바뀌지 않는다', async ({ browser }) => {
  const { ctx, page } = await newPage(browser);
  await page.goto('/interview/');
  await controlled(page);
  await expect(mark(page)).toHaveAttribute('data-build-mark', 'v1');
  await deploy('v2');
  const result = await updateCheck(page);
  await expectWaiting(page, result); // 새 서비스 워커는 설치만 하고 대기한다
  await expect(mark(page)).toHaveAttribute('data-build-mark', 'v1');
  await ctx.close();
});

test('안전한 순간에 적용: 작성 중인 노트가 있으면 미루고, 저장한 뒤 숨었다 돌아오면 새 버전이 된다', async ({ browser, request }) => {
  const { slug } = await pickQuestion(request);
  const { ctx, page } = await newPage(browser, { user: uuid() });
  await page.goto(`/interview/q/${slug}`);
  await page.getByRole('link', { name: '로그인' }).first().click();
  await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();
  const note = page.getByRole('textbox', { name: '이 질문에 대한 내 노트' });
  await expect(note).toBeVisible();
  await controlled(page);
  await expect(mark(page)).toHaveAttribute('data-build-mark', 'v1');

  await deploy('v2');
  const result = await updateCheck(page);
  await expectWaiting(page, result);

  await page.evaluate(() => ((window as unknown as { __alive: boolean }).__alive = true)); // 새로고침되면 사라진다
  await note.fill('쓰던 중인 글');
  await hideAndShow(page);
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => (window as unknown as { __alive?: boolean }).__alive)).toBe(true); // 새로고침되지 않았다
  await expect(note).toHaveValue('쓰던 중인 글');
  await expect(mark(page)).toHaveAttribute('data-build-mark', 'v1');

  await page.getByRole('button', { name: '저장' }).click();
  await expect(page.getByText('저장했습니다.')).toBeVisible();
  await hideAndShow(page);
  await expect(mark(page)).toHaveAttribute('data-build-mark', 'v2', { timeout: 15_000 }); // 안전한 순간에 새 버전
  await expect(page.getByRole('textbox', { name: '이 질문에 대한 내 노트' })).toHaveValue('쓰던 중인 글'); // 저장한 글은 그대로
  await ctx.close();
});

test('지연 조각: 서비스 워커가 없는 방문자의 옛 화면은 빈 화면 대신 "새 버전" 안내를 보고, 새로고침하면 정상이다', async ({ browser, request }) => {
  const { topic } = await pickQuestion(request);
  const { ctx, page } = await newPage(browser, { serviceWorkers: 'block' });
  await page.goto(`/interview/t/${topic}`);
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  await expect(mark(page)).toHaveAttribute('data-build-mark', 'v1');
  await deploy('v2'); // 옛 해시 파일이 사라진다
  await page.locator('main ul li a[href*="/q/"]').first().click(); // 앱 안 이동: 마크다운 지연 조각(옛 해시)을 받으려다 404
  const alert = page.getByRole('alert');
  await expect(alert).toContainText('새 버전이 나왔습니다.');
  await alert.getByRole('button', { name: '새로고침' }).click();
  await expect(mark(page)).toHaveAttribute('data-build-mark', 'v2');
  await expect(page.getByRole('heading', { level: 2, name: '모범 답변' })).toBeVisible();
  await ctx.close();
});

test('지연 조각: 서비스 워커가 미리 받아 둔 옛 화면은 새 배포 뒤에도 끊기지 않는다', async ({ browser, request }) => {
  const { topic } = await pickQuestion(request);
  const { ctx, page } = await newPage(browser);
  await page.goto(`/interview/t/${topic}`);
  await controlled(page);
  await deploy('v2');
  await page.locator('main ul li a[href*="/q/"]').first().click();
  await expect(page.getByRole('heading', { level: 2, name: '모범 답변' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await ctx.close();
});

test('내비게이션 허용 목록: 로그인 이동·없는 자산은 앱 셸이 아니고, 오프라인에서는 앱 경로만 셸로 열린다', async ({ browser, request }) => {
  const { topic } = await pickQuestion(request);
  const { ctx, page } = await newPage(browser, { user: uuid() });
  await page.goto('/interview/');
  await controlled(page);

  // 로그인 이동은 BFF 의 302 가 그대로 간다(앱 셸이 가로챘다면 쿠키가 없어 비로그인으로 보인다)
  await page.goto('/interview/api/v1/bff/login?return=%2F');
  await expect(page).toHaveURL(/\/interview\/$/);
  await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();

  const missing = await page.goto('/interview/assets/nope-123.js');
  expect(missing?.status()).toBe(404); // 없는 해시 파일은 404 로 남는다(셸로 대신 응답하지 않는다)

  await page.goto('/interview/');
  await controlled(page);
  await ctx.setOffline(true);
  await page.goto(`/interview/t/${topic}`); // 오프라인: 앱 경로는 미리 캐시된 셸로 열린다
  await expect(mark(page)).toHaveAttribute('data-build-mark', 'v1');
  await expect(page.goto('/interview/api/v1/bff/login?return=%2F')).rejects.toThrow(/ERR_INTERNET_DISCONNECTED|net::/); // 로그인 이동은 셸로 가려지지 않는다
  await expect(page.goto('/interview/assets/x.js')).rejects.toThrow(/ERR_INTERNET_DISCONNECTED|net::/);
  await ctx.setOffline(false);
  await ctx.close();
});

test('API 비캐시: 캐시에 /api/ 가 없고, 사용자가 바뀌면 응답도 새 사용자의 것이다', async ({ browser, request }) => {
  const { topic, slug } = await pickQuestion(request);
  const alice = uuid(); const bob = uuid();
  const { ctx, page } = await newPage(browser, { user: alice });
  await page.goto('/interview/');
  await controlled(page);
  await login(page);
  await page.goto(`/interview/t/${topic}`);
  await page.getByRole('checkbox', { name: /^학습함: / }).first().check();
  await page.goto(`/interview/q/${slug}`);
  await expect(page.getByRole('textbox', { name: '이 질문에 대한 내 노트' })).toBeVisible();

  const keys = await page.evaluate(async () => {
    const out: string[] = [];
    for (const name of await caches.keys()) {
      for (const r of await (await caches.open(name)).keys()) {
        out.push(r.url);
      }
    }
    return out;
  });
  expect(keys.length).toBeGreaterThan(5);
  expect(keys.filter((u) => u.includes('/api/'))).toEqual([]);

  const sessionUser = () => page.evaluate(async () => ((await (await fetch('/interview/api/v1/bff/session')).json()) as { data: { user?: { userId: string } } }).data.user?.userId ?? null);
  expect(await sessionUser()).toBe(alice);
  await page.getByRole('button', { name: '로그아웃' }).click();
  await expect(page.getByRole('link', { name: '로그인' }).first()).toBeVisible();
  expect(await sessionUser()).toBeNull();
  await ctx.addCookies([{ name: 'fake_user', value: bob, url: BASE }]);
  await login(page);
  expect(await sessionUser()).toBe(bob);
  // 새 사용자의 체크는 비어 있다(앞 사용자의 응답이 어디서도 나오지 않는다)
  await page.goto(`/interview/t/${topic}`);
  await expect(page.getByRole('checkbox', { name: /^학습함: / }).first()).not.toBeChecked();
  await ctx.close();
});

test('옛 CSP 고착 방지: 게이트웨이의 CSP 가 바뀌면 다시 방문할 때 새 헤더가 적용된다', async ({ browser }) => {
  await gateway('report');
  const { ctx, page } = await newPage(browser);
  const first = await page.goto('/interview/');
  expect(first?.headers()['content-security-policy-report-only']).toContain("script-src 'self'");
  expect(first?.headers()['content-security-policy']).toBeUndefined();
  await controlled(page);

  await gateway('enforced'); // Report-Only → 강제로 전환
  // 강제 헤더가 새로 붙는다(서비스 워커가 설치 때 저장한 옛 셸을 계속 주면 이 헤더가 영영 없다). 전환 직후 한 번은 서비스 워커의 갱신 확인과 겹쳐
  // 느린 환경(CI)에서 옛 응답이 나올 수 있어, 몇 번 다시 방문해서도 안 붙으면 실패로 본다(고착이면 계속 실패한다).
  // Report-Only 헤더는 따지지 않는다: 브라우저의 HTTP 캐시가 304 응답을 합칠 때 옛 응답의 헤더 중 새 응답에 없는 것을 남기므로 옛 Report-Only 가 같이 보일 수 있다(해롭지 않다. 강제 정책이 적용된다).
  await expect
    .poll(async () => (await page.reload())?.headers()['content-security-policy'] ?? '', { timeout: 20_000, intervals: [500, 1000, 2000] })
    .toContain("script-src 'self'");
  await ctx.close();
});

// 아래 시험이 쓰는 도우미가 사용되지 않아 린트가 불평하지 않도록 한다
void login;
