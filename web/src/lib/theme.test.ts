// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyTheme, readTheme, saveTheme } from './theme';

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});
afterEach(() => vi.restoreAllMocks());

describe('화면 색', () => {
  it('저장된 값이 없으면 시스템 설정이다', () => {
    expect(readTheme()).toBe('system');
  });

  it('밝게·어둡게를 저장하고 문서에 반영하며, 시스템으로 돌리면 둘 다 지운다', () => {
    saveTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(readTheme()).toBe('dark');
    saveTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    saveTheme('system');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(window.localStorage.getItem('interview.theme')).toBeNull();
    expect(readTheme()).toBe('system');
  });

  it('알 수 없는 저장값은 시스템으로 본다', () => {
    window.localStorage.setItem('interview.theme', 'pink');
    expect(readTheme()).toBe('system');
  });

  it('저장소를 못 써도 예외 없이 이번 방문에는 적용된다', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readTheme()).toBe('system');
    expect(() => saveTheme('dark')).not.toThrow();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('applyTheme 는 저장하지 않는다', () => {
    applyTheme('dark');
    expect(window.localStorage.getItem('interview.theme')).toBeNull();
  });
});
