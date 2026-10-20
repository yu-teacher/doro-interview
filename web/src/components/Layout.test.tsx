// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { summary, topicView } from '../testing/fixtures';
import { mockApi } from '../testing/mockFetch';

const scrollTo = vi.fn();

beforeEach(() => {
  window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
  scrollTo.mockClear();
  mockApi({
    '/interview/api/v1/categories': [
      { slug: 'spring', name: '스프링', topics: [{ slug: 'transaction', name: '트랜잭션', description: '설명', baseVersion: null, counts: { basic: 1, deep: 0, tricky: 0 } }] },
    ],
    '/interview/api/v1/topics/transaction': topicView([summary('tx-01', { title: '첫 질문' })]),
  });
  render(
    <MemoryRouter initialEntries={['/']}>
      <AppRoutes />
    </MemoryRouter>,
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('레이아웃', () => {
  it('첫 화면에서는 맨 위로 올리거나 포커스를 옮기지 않는다', async () => {
    await screen.findByRole('heading', { level: 3, name: '스프링' });
    expect(scrollTo).not.toHaveBeenCalled();
    expect(document.activeElement).not.toBe(screen.getByRole('main'));
  });

  it('건너뛰기 링크가 첫 번째 포커스 대상이고 본문을 가리킨다', async () => {
    await screen.findByRole('heading', { level: 3, name: '스프링' });
    const skip = screen.getByRole('link', { name: '본문으로 건너뛰기' });
    expect(skip.getAttribute('href')).toBe('#main');
    expect(document.getElementById('main')).toBe(screen.getByRole('main'));
    const focusable = Array.from(document.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea'));
    expect(focusable[0]).toBe(skip);
  });

  it('랜드마크가 있다(banner·navigation·search·main·contentinfo)', async () => {
    await screen.findByRole('heading', { level: 3, name: '스프링' });
    for (const role of ['banner', 'navigation', 'search', 'main', 'contentinfo']) {
      expect(screen.getAllByRole(role).length, role).toBeGreaterThan(0);
    }
  });

  it('다른 화면으로 이동하면 맨 위로 올리고 본문으로 포커스를 옮긴다', async () => {
    fireEvent.click(await screen.findByRole('link', { name: /트랜잭션/ }));
    await screen.findByRole('heading', { level: 1, name: '트랜잭션' });
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    expect(document.activeElement).toBe(screen.getByRole('main'));
  });

  it('같은 화면에서 필터만 바꿀 때는 맨 위로 올리지 않는다', async () => {
    fireEvent.click(await screen.findByRole('link', { name: /트랜잭션/ }));
    await screen.findByRole('heading', { level: 1, name: '트랜잭션' });
    scrollTo.mockClear();
    fireEvent.click(screen.getByRole('button', { name: /기본 \(1\)/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: '보충이 있는 질문만' }));
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
