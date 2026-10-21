/** 화면 색 선택(F5): 시스템 설정을 따르거나(기본) 밝게/어둡게를 직접 고른다. 선택은 이 브라우저에만 저장한다. */
export type Theme = 'system' | 'light' | 'dark';

const KEY = 'interview.theme';
export const THEMES: Theme[] = ['system', 'light', 'dark'];

export function readTheme(): Theme {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system'; // 저장소를 못 쓰는 환경에서도 화면은 시스템 설정으로 동작한다
  }
}

/** 문서에 반영한다(system 이면 data-theme 를 지운다). */
export function applyTheme(theme: Theme): void {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

export function saveTheme(theme: Theme): void {
  applyTheme(theme);
  try {
    if (theme === 'system') {
      window.localStorage.removeItem(KEY);
    } else {
      window.localStorage.setItem(KEY, theme);
    }
  } catch {
    // 저장하지 못해도 이번 방문에는 적용된다
  }
}
