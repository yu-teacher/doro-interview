// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetServicesCache } from '../lib/servicesManifest';
import ServiceLauncher from './ServiceLauncher';

const manifest = {
  version: 1,
  services: [
    { id: 'blog', name: 'DORO.log', href: '/dev/blog/', audience: 'developer' },
    { id: 'party', name: '도로 파티', href: '/party/', audience: 'general' },
    { id: 'interview', name: '도로 면접', href: '/dev/interview/' },
  ],
};

function stubFetch(ok: boolean) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(manifest) } as Response));
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
});
