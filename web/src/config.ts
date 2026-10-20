export const SERVICE_NAME = '도로 면접';

/** 웹이 마운트된 하위 경로(끝 슬래시 없음). vite.config.ts 의 base 와 같아야 한다. */
export const BASE_PATH = '/interview';

/** API 는 게이트웨이가 /interview 를 떼고 백엔드로 전달하므로, 브라우저에서는 /interview/api/ 아래다. */
export function apiPath(path: string): string {
  return `${BASE_PATH}/api/${path.replace(/^\/+/, '')}`;
}
