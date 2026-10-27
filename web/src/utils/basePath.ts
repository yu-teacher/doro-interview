/**
 * 웹이 마운트된 공개 하위 경로(Vite `base`)를 다루는 순수 함수. 설정(vite.config.ts)·앱(config.ts)·서비스 워커(sw/sw.ts)가 같은 규칙을 쓰도록 한곳에 둔다.
 * 빌드 때 VITE_BASE_PATH 로 정하고, 비우면 운영 기본값(/interview)이다.
 */

/** 운영 기본 공개 경로(끝 슬래시 없음). 컨테이너 안의 파일 위치(/usr/share/nginx/html/interview)도 항상 이 값이다. */
export const DEFAULT_BASE_PATH = '/interview';

/** 입력(예: 'dev/interview', '/dev/interview/', '', undefined)을 앞 슬래시만 있는 경로로 맞춘다. 비어 있으면 기본값. */
export function normalizeBasePath(raw: string | undefined | null): string {
  const trimmed = (raw ?? '').trim().replace(/^\/+|\/+$/g, '');
  return trimmed === '' ? DEFAULT_BASE_PATH : `/${trimmed}`;
}

/** Vite `base`: 기준 경로 뒤에 슬래시를 붙인 값('/interview' -> '/interview/'). */
export function viteBase(basePath: string): string {
  return `${basePath}/`;
}

/** Vite `base`('/interview/')에서 끝 슬래시를 뗀 기준 경로('/interview'). 라우터 basename 과 API 경로의 기준이다. */
export function basePathFromBase(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

/** API 주소: 게이트웨이가 기준 경로를 떼고 백엔드로 전달하므로, 브라우저에서는 `${기준 경로}/api/` 아래다. */
export function apiPathUnder(basePath: string, path: string): string {
  return `${basePath}/api/${path.replace(/^\/+/, '')}`;
}
