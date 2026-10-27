// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetServicesCache } from '../lib/servicesManifest';
import { SessionProvider } from '../session/SessionProvider';
import ServiceLauncher from './ServiceLauncher';

const manifest = {
  version: 1,
  services: [
    { id: 'blog', name: 'DORO.log', href: '/dev/blog/', audience: 'developer' },
    { id: 'party', name: '도로 파티', href: '/party/', audience: 'general' },
    { id: 'interview', name: '도로 면접', href: '/dev/interview/' },
  ],
};

function stubFetch(ok: boolean, session: unknown = { authenticated: false }) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) =>
      Promise.resolve(
        String(url).includes('bff/session')
          ? ({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ success: true, data: session })) } as Response)
          : ({ ok, json: () => Promise.resolve(manifest) } as Response),
      ),
    ),
  );
}

afterEach(() => {
  cleanup();
  resetServicesCache();
  vi.unstubAllGlobals();
});

describe('ServiceLauncher', () => {
  it('Doro Dev 홈(/dev/)으로 링크하고 일반 서비스는 숨기며 현재 서비스를 표시한다', async () => {
    stubFetch(true);
    render(<ServiceLauncher currentId="interview" />);
    fireEvent.click(screen.getByRole('button', { name: '도로 서비스 목록' }));
    expect(screen.getByRole('link', { name: /^Doro Dev 홈/ }).getAttribute('href')).toBe('/dev/');
    await waitFor(() => expect(screen.getByRole('link', { name: /DORO\.log/ })).toBeTruthy());
    expect(screen.queryByText('도로 파티')).toBeNull();
    expect(screen.getByRole('link', { name: /도로 면접/ }).getAttribute('aria-current')).toBe('page');
  });

  it('목록을 못 읽으면 Doro Dev 홈 링크와 안내만 보인다', async () => {
    stubFetch(false);
    render(<ServiceLauncher currentId="interview" />);
    fireEvent.click(screen.getByRole('button', { name: '도로 서비스 목록' }));
    await waitFor(() => expect(screen.getByText(/불러오지 못했어요/).textContent).toContain('Doro Dev 홈'));
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  async function openWithSession(session: unknown) {
    stubFetch(true, session);
    render(
      <SessionProvider>
        <ServiceLauncher currentId="interview" />
      </SessionProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: '도로 서비스 목록' }));
    await waitFor(() => expect(screen.getByRole('link', { name: /DORO\.log/ })).toBeTruthy());
    // 세션 응답이 반영될 시간을 준다
    await new Promise((r) => setTimeout(r, 20));
  }

  it('관리자(admin=true)에게만 Doro 허브(/) 링크가 보인다', async () => {
    await openWithSession({ authenticated: true, user: { userId: 'u-1', admin: true } });
    const link = await screen.findByRole('link', { name: /^Doro 허브/ });
    expect(link.getAttribute('href')).toBe('/');
    expect(link.textContent).toContain('일반 서비스 허브');
    expect(screen.queryByText('도로 파티')).toBeNull();
  });

  it('일반 사용자와 비로그인에게는 허브 링크가 없다', async () => {
    await openWithSession({ authenticated: true, user: { userId: 'u-1', admin: false } });
    expect(screen.queryByRole('link', { name: /허브/ })).toBeNull();
    cleanup();
    resetServicesCache();
    await openWithSession({ authenticated: true, user: { userId: 'u-1' } });
    expect(screen.queryByRole('link', { name: /허브/ })).toBeNull();
    cleanup();
    resetServicesCache();
    await openWithSession({ authenticated: false });
    expect(screen.queryByRole('link', { name: /허브/ })).toBeNull();
  });
});
