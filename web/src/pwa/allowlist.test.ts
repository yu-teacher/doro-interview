import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { APP_ROUTE_PATHS } from '../routes';
import { isAppNavigation, navigationAllowlist } from './allowlist';

const BASE = '/interview';
const allowed = (p: string) => isAppNavigation(p, BASE);

describe('내비게이션 허용 목록', () => {
  it('앱 화면 경로는 허용한다(끝 슬래시는 있어도 없어도)', () => {
    for (const p of ['/interview/', '/interview', '/interview/t/transaction', '/interview/t/transaction/', '/interview/q/tx-04', '/interview/c/proxy',
      '/interview/concepts', '/interview/concepts/', '/interview/search']) {
      // 기준 경로만 있는 `/interview` 는 게이트웨이가 `/interview/` 로 301 하므로 서비스 워커가 가로채지 않아도 된다
      expect(allowed(p), p).toBe(p !== '/interview');
    }
  });

  it('API(로그인·콜백 이동 포함)와 자산은 가로채지 않는다', () => {
    for (const p of ['/interview/api/v1/bff/login', '/interview/api/v1/bff/callback', '/interview/api/v1/bff/logout', '/interview/api/v1/categories',
      '/interview/assets/index-abc.js', '/interview/assets/nope.js', '/interview/sw.js', '/interview/manifest.webmanifest', '/interview/icon-192.png']) {
      expect(allowed(p), p).toBe(false);
    }
  });

  it('앱 밖 경로와 모양이 다른 경로도 가로채지 않는다', () => {
    for (const p of ['/', '/blog/', '/games/', '/interview/t', '/interview/t/', '/interview/t/a/b', '/interview/q/', '/interview/unknown', '/interviewx/t/a',
      '//interview/t/a', '/interview/t/a/b?x=1', '/interview/api/v1/bff/login?return=/interview/t/a']) {
      expect(allowed(p), p).toBe(false);
    }
  });

  it('필터가 쿼리로 남는 주소도 허용한다(workbox 는 경로와 쿼리를 함께 대 본다)', () => {
    expect(allowed('/interview/t/transaction?tier=DEEP&imp=ge2&q=%EC%A0%84%ED%8C%8C')).toBe(true);
    expect(allowed('/interview/search?q=%ED%94%84%EB%A1%9D%EC%8B%9C')).toBe(true);
    expect(allowed('/interview/?utm=x')).toBe(true);
    expect(allowed('/interview/q/tx-04?')).toBe(true);
  });

  it('경로 변수는 한 구간만 받고 정규식 특수문자를 이스케이프한다', () => {
    expect(allowed('/interview/t/a.b')).toBe(true);
    expect(isAppNavigation('/x.y/t/a', '/x.y')).toBe(true);
    expect(isAppNavigation('/xzy/t/a', '/x.y')).toBe(false); // base 의 '.' 가 아무 글자와 맞지 않는다
  });

  it('허용 목록은 APP_ROUTE_PATHS 와 같은 개수다(경로 하나당 규칙 하나)', () => {
    expect(navigationAllowlist(BASE)).toHaveLength(APP_ROUTE_PATHS.length);
  });
});

describe('앱 라우트 ↔ 허용 목록', () => {
  const app = readFileSync('src/App.tsx', 'utf-8');

  it('App.tsx 는 라우트 경로를 직접 적지 않고 APP_ROUTE_PATHS 로만 만든다(새 화면이 허용 목록에서 빠질 수 없다)', () => {
    const literal = [...app.matchAll(/<Route\b[^>]*\bpath=["']([^"']+)["']/g)].map((m) => m[1]);
    // 예외는 맨 마지막의 "찾을 수 없음" 폴백(*)뿐이다: 서비스 워커가 가로챌 화면이 아니다
    expect(literal.filter((p) => p !== '*')).toEqual([]);
    expect(app).toContain('APP_ROUTE_PATHS.map');
  });

  it('PAGES 의 키가 APP_ROUTE_PATHS 와 정확히 같다', () => {
    const keys = [...app.matchAll(/^\s+'(\/[^']*)':\s*</gm)].map((m) => m[1]).sort();
    expect(keys).toEqual([...APP_ROUTE_PATHS].sort());
  });

  it('routes.ts 의 경로 생성 함수들이 만든 주소는 모두 허용 목록에 들어간다', async () => {
    const routes = await import('../routes');
    for (const p of [routes.topicPath('a-1'), routes.questionPath('tx-04'), routes.conceptPath('proxy'), routes.conceptsPath(), '/', routes.searchPath('프록시').split('?')[0]]) {
      expect(allowed(`/interview${p === '/' ? '/' : p}`), p).toBe(true);
    }
  });
});
