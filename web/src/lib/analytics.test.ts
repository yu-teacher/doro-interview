// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { currentConsent, disableAnalytics, loadAnalytics, readConsent, resetConsentMemoryForTest, saveConsent, sendPageView, templatePath } from './analytics';

type W = Window & { gtag?: (...a: unknown[]) => void; dataLayer?: unknown[] } & Record<string, unknown>;
const w = window as unknown as W;

function reset() {
  window.localStorage.clear();
  resetConsentMemoryForTest();
  document.head.querySelectorAll('script').forEach((s) => s.remove());
  delete w.gtag;
  delete w.dataLayer;
  for (const key of Object.keys(w)) {
    if (key.startsWith('ga-disable-')) {
      delete w[key];
    }
  }
}
beforeEach(reset);
afterEach(() => vi.restoreAllMocks());

describe('경로 틀', () => {
  it.each([
    ['/', '/'],
    ['/q/tx-04', '/q/:slug'],
    ['/q/tx-04/', '/q/:slug'],
    ['/quiz/11111111-1111-1111-1111-111111111111', '/quiz/:id'],
    ['/t/transaction', '/t/:topic'],
    ['/mine/abc', '/mine/:id'],
    ['/search', '/search'],
    ['/explore', '/explore'],
    ['/nope/never', '/other'],
  ])('%s → %s', (path, expected) => {
    expect(templatePath(path)).toBe(expected);
  });

  it('실제 질문 id·세션 id 는 결과에 남지 않는다', () => {
    expect(templatePath('/q/my-secret-slug')).not.toContain('secret');
    expect(templatePath('/quiz/11111111-1111-1111-1111-111111111111')).not.toMatch(/\d{4}/);
  });
});

describe('동의', () => {
  it('기본은 선택 안 함이고, 저장하면 기억한다', () => {
    expect(readConsent()).toBe('unset');
    saveConsent('granted');
    expect(readConsent()).toBe('granted');
    saveConsent('denied');
    expect(readConsent()).toBe('denied');
  });

  it('알 수 없는 저장값은 선택 안 함으로 본다', () => {
    window.localStorage.setItem('interview.analytics', 'maybe');
    expect(readConsent()).toBe('unset');
  });

  it('저장소를 못 써도 이번 방문에는 선택이 유지된다', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(currentConsent()).toBe('unset');
    expect(() => saveConsent('denied')).not.toThrow();
    expect(currentConsent()).toBe('denied');
  });
});

describe('불러오기와 전송', () => {
  const scripts = () => Array.from(document.head.querySelectorAll('script')).map((s) => s.getAttribute('src'));

  it('호출하기 전에는 아무 스크립트도 없다', () => {
    expect(scripts()).toEqual([]);
  });

  it('정의 파일과 gtag.js 를 한 번만 불러오고, 측정 ID 는 주소에 인코딩해서 넣는다', () => {
    loadAnalytics('G-ABCD1234');
    loadAnalytics('G-ABCD1234');
    expect(scripts()).toEqual(['/interview/ga-init.js', 'https://www.googletagmanager.com/gtag/js?id=G-ABCD1234']);
  });

  it('정의가 올라오면 광고 신호를 끈 설정과 첫 화면을 보낸다(쿼리·제목 없이 경로 틀로)', () => {
    window.history.replaceState({}, '', '/interview/q/tx-04?q=비밀검색어');
    const calls: unknown[][] = [];
    loadAnalytics('G-ABCD1234');
    w.gtag = (...a: unknown[]) => {
      calls.push(a);
    };
    (document.head.querySelector('script[src$="ga-init.js"]') as HTMLScriptElement).onload?.(new Event('load'));
    expect(calls[0][0]).toBe('js');
    expect(calls[1]).toEqual(['config', 'G-ABCD1234', { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false }]);
    const [, name, params] = calls[2] as [string, string, Record<string, string>];
    expect(name).toBe('page_view');
    expect(params.page_path).toBe('/q/:slug');
    expect(params.page_title).toBe('/q/:slug');
    expect(JSON.stringify(calls)).not.toContain('비밀검색어');
    expect(JSON.stringify(calls)).not.toContain('tx-04');
    window.history.replaceState({}, '', '/');
  });

  it('gtag 가 없으면 화면 전송은 아무 일도 하지 않는다', () => {
    expect(() => sendPageView('/q/tx-04')).not.toThrow();
  });

  it('화면 전송은 경로 틀·제목·주소를 모두 덮어쓴다', () => {
    const gtag = vi.fn();
    w.gtag = gtag;
    sendPageView('/quiz/abc-123');
    expect(gtag).toHaveBeenCalledWith('event', 'page_view', { page_path: '/quiz/:id', page_title: '/quiz/:id', page_location: `${window.location.origin}/quiz/:id` });
  });

  it('동의를 거두면 전송을 끄고 GA 쿠키만 지운다', () => {
    document.cookie = '_ga=GA1.1.1; path=/';
    document.cookie = '_ga_ABCD1234=GS2.1; path=/';
    document.cookie = 'keep=1; path=/';
    disableAnalytics('G-ABCD1234');
    expect(w['ga-disable-G-ABCD1234']).toBe(true);
    expect(document.cookie).not.toContain('_ga');
    expect(document.cookie).toContain('keep=1');
    document.cookie = 'keep=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });
});
