import { apiPathUnder, basePathFromBase } from './utils/basePath';

export const SERVICE_NAME = '도로 면접';

/** 도로 허브(포털) 주소. 게이트웨이의 루트다. */
export const HUB_PATH = '/';

/** 웹이 마운트된 하위 경로(끝 슬래시 없음). Vite `base` 에서 온다: 빌드 때 VITE_BASE_PATH 로 정하고 기본은 /interview 다(vite.config.ts). */
export const BASE_PATH = basePathFromBase(import.meta.env.BASE_URL);

/** API 는 게이트웨이가 기준 경로를 떼고 백엔드로 전달하므로, 브라우저에서는 `${BASE_PATH}/api/` 아래다. */
export function apiPath(path: string): string {
  return apiPathUnder(BASE_PATH, path);
}
