// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { a11yViolations } from '../testing/axe';
import { UpdateNotice } from './UpdateNotice';

afterEach(cleanup);

function preloadError() {
  const event = new Event('vite:preloadError', { cancelable: true });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
}

describe('UpdateNotice', () => {
  it('평소에는 아무것도 그리지 않는다', () => {
    render(<UpdateNotice />);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('지연 조각을 받지 못하면(vite:preloadError) 새 버전 안내를 알리고 기본 오류 동작을 막는다', () => {
    render(<UpdateNotice />);
    const event = preloadError();
    expect(event.defaultPrevented).toBe(true);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('새 버전이 나왔습니다.');
    expect(screen.getByRole('button', { name: '새로고침' })).toBeTruthy();
  });

  it('새로고침은 사용자가 누를 때만 일어난다', () => {
    render(<UpdateNotice />);
    preloadError();
    expect(screen.getByRole('button', { name: '새로고침' })).toBeTruthy(); // 자동으로 이동하지 않고 기다린다
  });

  it('접근성 구조 위반이 없다', async () => {
    render(<UpdateNotice />);
    preloadError();
    expect(await a11yViolations()).toEqual([]);
  });

  it('언마운트하면 리스너를 거둔다', () => {
    const { unmount } = render(<UpdateNotice />);
    unmount();
    const event = preloadError();
    expect(event.defaultPrevented).toBe(false);
  });
});
