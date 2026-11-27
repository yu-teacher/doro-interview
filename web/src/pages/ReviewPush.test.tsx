// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { a11yViolations } from '../testing/axe';
import { authed, SESSION_URL } from '../testing/fixtures';
import { mockApi } from '../testing/mockFetch';
import { renderApp } from '../testing/renderApp';

const CONFIG = '/interview/api/v1/me/push';
const SUBSCRIBE = 'PUT /interview/api/v1/me/push/subscription';
const UNSUBSCRIBE = 'PUT /interview/api/v1/me/push/unsubscribe';
const TEST = 'PUT /interview/api/v1/me/push/test';
const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/abc';
// 65바이트 공개 키(base64url)
const PUBLIC_KEY = 'B' + 'A'.repeat(86);

const restore: (() => void)[] = [];

function define(target: object, key: string, value: unknown) {
  const had = Object.prototype.hasOwnProperty.call(target, key);
  const before = Object.getOwnPropertyDescriptor(target, key);
  Object.defineProperty(target, key, { configurable: true, writable: true, value });
  restore.push(() => {
    if (had && before) {
      Object.defineProperty(target, key, before);
    } else {
      delete (target as Record<string, unknown>)[key];
    }
  });
}

/** 웹 푸시를 지원하는 브라우저처럼 꾸민다. 구독은 메모리에만 있다. */
function fakePushBrowser(permission: NotificationPermission = 'default') {
  let subscription: { endpoint: string; options: { applicationServerKey: ArrayBuffer }; toJSON: () => unknown; unsubscribe: () => Promise<boolean> } | null = null;
  const make = (key: Uint8Array) => ({
    endpoint: ENDPOINT,
    options: { applicationServerKey: key.slice().buffer },
    toJSON: () => ({ endpoint: ENDPOINT, keys: { p256dh: 'p256dh-key', auth: 'auth-key' } }),
    unsubscribe: async () => {
      subscription = null;
      return true;
    },
  });
  const notification = { permission, requestPermission: vi.fn(async () => 'granted' as NotificationPermission) };
  notification.requestPermission.mockImplementation(async () => {
    notification.permission = 'granted';
    return 'granted';
  });
  define(window, 'Notification', notification);
  define(window, 'PushManager', function PushManager() {});
  define(navigator, 'serviceWorker', {
    ready: Promise.resolve({
      pushManager: {
        getSubscription: async () => subscription,
        subscribe: async ({ applicationServerKey }: { applicationServerKey: Uint8Array }) => {
          subscription = make(applicationServerKey);
          return subscription;
        },
      },
    }),
  });
  return { notification, current: () => subscription };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  while (restore.length > 0) {
    restore.pop()?.();
  }
});

describe('복습 알림(내 공부)', () => {
  it('서버에서 알림 기능이 꺼져 있으면 구역이 없다', async () => {
    mockApi({ [SESSION_URL]: authed(), [CONFIG]: { available: false, publicKey: null } });
    renderApp('/me');
    await screen.findByRole('heading', { level: 1, name: '내 공부' });
    await waitFor(() => expect(screen.queryByRole('heading', { name: '복습 알림' })).toBeNull());
  });

  it('웹 푸시를 지원하지 않는 브라우저에는 안내만 보인다', async () => {
    mockApi({ [SESSION_URL]: authed(), [CONFIG]: { available: true, publicKey: PUBLIC_KEY } });
    renderApp('/me');
    expect(await screen.findByText('이 브라우저는 알림을 지원하지 않습니다.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '이 기기에서 받기' })).toBeNull();
  });

  it('iPhone 사파리 탭에서는 홈 화면에 추가하라고 안내한다', async () => {
    define(navigator, 'userAgent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1');
    mockApi({ [SESSION_URL]: authed(), [CONFIG]: { available: true, publicKey: PUBLIC_KEY } });
    renderApp('/me');
    expect(await screen.findByText(/홈 화면에 추가/)).toBeTruthy();
  });

  it('받기를 누르면 권한을 묻고 구독을 서버에 등록한다. 그 뒤 시험 알림과 끄기를 할 수 있다', async () => {
    const browser = fakePushBrowser();
    const { requests } = mockApi({
      [SESSION_URL]: authed(),
      [CONFIG]: { available: true, publicKey: PUBLIC_KEY },
      [SUBSCRIBE]: { subscribed: true },
      [UNSUBSCRIBE]: { subscribed: false },
      [TEST]: { devices: 1, delivered: 1 },
    });
    const { container } = renderApp('/me');

    fireEvent.click(await screen.findByRole('button', { name: '이 기기에서 받기' }));
    expect(await screen.findByText('이 기기에서 복습 알림을 받습니다.')).toBeTruthy();
    expect(browser.notification.requestPermission).toHaveBeenCalledTimes(1);
    const sent = requests.filter((r) => r.method === 'PUT' && r.path.endsWith('/me/push/subscription'));
    expect(sent).toHaveLength(1);
    expect(sent[0].body).toEqual({ endpoint: ENDPOINT, keys: { p256dh: 'p256dh-key', auth: 'auth-key' } });
    expect(await a11yViolations(container)).toEqual([]);

    fireEvent.click(screen.getByRole('button', { name: '시험 알림 보내기' }));
    expect(await screen.findByText('시험 알림을 보냈습니다(기기 1대).')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '이 기기에서 끄기' }));
    expect(await screen.findByText('이 기기의 복습 알림을 껐습니다.')).toBeTruthy();
    expect(requests.filter((r) => r.path.endsWith('/me/push/unsubscribe'))[0].body).toEqual({ endpoint: ENDPOINT });
    expect(browser.current()).toBeNull();
    expect(screen.getByRole('button', { name: '이 기기에서 받기' })).toBeTruthy();
  });

  it('권한을 거부하면 안내하고 서버에 아무것도 보내지 않는다', async () => {
    const browser = fakePushBrowser();
    browser.notification.requestPermission.mockImplementation(async () => 'denied');
    const { requests } = mockApi({ [SESSION_URL]: authed(), [CONFIG]: { available: true, publicKey: PUBLIC_KEY } });
    renderApp('/me');
    fireEvent.click(await screen.findByRole('button', { name: '이 기기에서 받기' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/알림 권한이 허용되지 않았습니다/);
    expect(requests.filter((r) => r.path.endsWith('/me/push/subscription'))).toHaveLength(0);
  });

  it('이미 받는 기기면 처음부터 끄기 버튼이 보이고, 로그아웃하면 서버에서 이 기기를 떼어 낸다', async () => {
    const browser = fakePushBrowser('granted');
    const registration = await (navigator as unknown as { serviceWorker: { ready: Promise<{ pushManager: { subscribe: (o: { applicationServerKey: Uint8Array }) => Promise<unknown> } }> } }).serviceWorker.ready;
    await registration.pushManager.subscribe({ applicationServerKey: new Uint8Array(65) });
    const { requests } = mockApi({
      [SESSION_URL]: authed(),
      [CONFIG]: { available: true, publicKey: PUBLIC_KEY },
      [UNSUBSCRIBE]: { subscribed: false },
      'POST /interview/api/v1/bff/logout': {},
    });
    renderApp('/me');
    expect(await screen.findByRole('button', { name: '이 기기에서 끄기' })).toBeTruthy();

    fireEvent.click(screen.getAllByRole('button', { name: '로그아웃' }).at(-1)!);
    await waitFor(() => expect(requests.filter((r) => r.path.endsWith('/me/push/unsubscribe'))).toHaveLength(1));
    // 브라우저 구독은 남긴다(다시 로그인하면 이어서 쓴다)
    expect(browser.current()).not.toBeNull();
  });
});
