import { describe, expect, it } from 'vitest';
import { apiPath, BASE_PATH } from './config';
import { apiPathUnder, basePathFromBase, normalizeBasePath, viteBase } from './utils/basePath';

describe('apiPath', () => {
  it('하위 경로 아래의 API 주소를 만든다', () => {
    expect(apiPath('v1/topics')).toBe('/interview/api/v1/topics');
  });

  it('앞쪽 슬래시를 중복해서 붙이지 않는다', () => {
    expect(apiPath('/v1/topics')).toBe('/interview/api/v1/topics');
  });

  it('기준 경로는 끝 슬래시가 없다', () => {
    expect(BASE_PATH.endsWith('/')).toBe(false);
  });
});

describe('기준 경로는 빌드 설정에서 온다', () => {
  it('기본 빌드(VITE_BASE_PATH 없음)는 /interview 다', () => {
    expect(BASE_PATH).toBe('/interview');
  });

  it('VITE_BASE_PATH=/dev/interview 로 빌드하면 base·기준 경로·API 주소가 모두 따라간다', () => {
    const base = viteBase(normalizeBasePath('/dev/interview'));
    expect(base).toBe('/dev/interview/');
    expect(basePathFromBase(base)).toBe('/dev/interview');
    expect(apiPathUnder(basePathFromBase(base), 'v1/topics')).toBe('/dev/interview/api/v1/topics');
  });
});
