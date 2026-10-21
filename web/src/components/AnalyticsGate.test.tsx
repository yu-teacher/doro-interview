// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetConsentMemoryForTest } from '../lib/analytics';
import { a11yViolations } from '../testing/axe';
import { anonymous, SESSION_URL } from '../testing/fixtures';
import { errorResponse, mockApi, respond } from '../testing/mockFetch';
import { renderApp } from '../testing/renderApp';

type W = Window & { gtag?: (...a: unknown[]) => void } & Record<string, unknown>;
const w = window as unknown as W;
const CONFIG = '/interview/api/v1/config';
const scripts = () => Array.from(document.head.querySelectorAll('script')).map((s) => s.getAttribute('src'));
const finishInit = () => (document.head.querySelector('script[src$="ga-init.js"]') as HTMLScriptElement | null)?.onload?.(new Event('load'));

beforeEach(() => {
  window.localStorage.clear();
  resetConsentMemoryForTest();
  document.head.querySelectorAll('script').forEach((s) => s.remove());
  delete w.gtag;
  for (const key of Object.keys(w)) {
    if (key.startsWith('ga-disable-')) {
      delete w[key];
    }
  }
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const open = (config: unknown, path = '/') => {
  mockApi({ [SESSION_URL]: anonymous(), [CONFIG]: config, '/interview/api/v1/categories': [], '/interview/api/v1/questions/featured': [] });
  renderApp(path);
};
const ID_SCRIPT = 'https://www.googletagmanager.com/gtag/js?id=G-ABCD1234';

describe('방문 통계(항상 켜짐)', () => {
  it('측정 ID 가 없으면 스크립트도 설정 구역도 없다', async () => {
    open({ analyticsId: null });
    await screen.findByRole('link', { name: '도로 면접' });
    expect(scripts()).toEqual([]);
  });

  it('설정을 못 불러와도 화면은 그대로이고 아무것도 불러오지 않는다', async () => {
    mockApi({ [SESSION_URL]: anonymous(), [CONFIG]: respond(() => errorResponse(500, 'X', 'x')), '/interview/api/v1/categories': [], '/interview/api/v1/questions/featured': [] });
    renderApp('/');
    await screen.findByRole('link', { name: '도로 면접' });
    expect(scripts()).toEqual([]);
  });

  it('측정 ID 가 있으면 배너 없이 바로 불러오고 첫 화면과 이동한 화면을 경로 틀로 알린다', async () => {
    open({ analyticsId: 'G-ABCD1234' });
    await waitFor(() => expect(scripts()).toContain(ID_SCRIPT));
    expect(screen.queryByRole('region', { name: '방문 통계 동의' })).toBeNull();
    const gtag = vi.fn();
    w.gtag = gtag;
    finishInit();
    expect(gtag).toHaveBeenCalledWith('event', 'page_view', expect.objectContaining({ page_path: '/' }));
    fireEvent.click(screen.getAllByRole('link', { name: /탐색/ })[0]);
    await waitFor(() => expect(gtag).toHaveBeenCalledWith('event', 'page_view', expect.objectContaining({ page_path: '/explore' })));
  });

  it('푸터에 작은 수집 안내가 있고, 측정 ID 가 없으면 없다', async () => {
    open({ analyticsId: 'G-ABCD1234' });
    expect(await screen.findByText(/구글 애널리틱스를 사용합니다/)).toBeTruthy();
    cleanup();
    open({ analyticsId: null });
    await screen.findByRole('link', { name: '도로 면접' });
    expect(screen.queryByText(/구글 애널리틱스를 사용합니다/)).toBeNull();
  });

  it('설정 화면에는 방문 통계 구역이 없다', async () => {
    open({ analyticsId: 'G-ABCD1234' }, '/me');
    await screen.findByRole('heading', { level: 1, name: '내 공부' });
    expect(screen.queryByRole('group', { name: '방문 통계' })).toBeNull();
  });

  it('axe 위반이 없다', async () => {
    open({ analyticsId: 'G-ABCD1234' }, '/me');
    await screen.findByRole('heading', { level: 1, name: '내 공부' });
    expect(await a11yViolations()).toEqual([]);
  });
});
