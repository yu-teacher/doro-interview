import { describe, expect, it } from 'vitest';
import { apiPathUnder, basePathFromBase, DEFAULT_BASE_PATH, normalizeBasePath, viteBase } from './basePath';

describe('normalizeBasePath', () => {
  it('비우면 운영 기본값 /interview 다', () => {
    for (const raw of [undefined, null, '', '  ', '/', '//']) {
      expect(normalizeBasePath(raw)).toBe(DEFAULT_BASE_PATH);
    }
    expect(DEFAULT_BASE_PATH).toBe('/interview');
  });

  it('앞 슬래시는 하나, 끝 슬래시는 없게 맞춘다', () => {
    for (const raw of ['dev/interview', '/dev/interview', '/dev/interview/', ' /dev/interview/ ']) {
      expect(normalizeBasePath(raw)).toBe('/dev/interview');
    }
    expect(normalizeBasePath('interview/')).toBe('/interview');
  });
});

describe('기준 경로 파생', () => {
  it('Vite base 는 끝에 슬래시가 붙고, 되돌리면 같은 기준 경로가 된다', () => {
    expect(viteBase('/interview')).toBe('/interview/');
    expect(viteBase('/dev/interview')).toBe('/dev/interview/');
    expect(basePathFromBase('/dev/interview/')).toBe('/dev/interview');
    expect(basePathFromBase(viteBase('/interview'))).toBe('/interview');
  });

  it('API 주소는 기준 경로 아래다(앞쪽 슬래시를 중복하지 않는다)', () => {
    expect(apiPathUnder('/interview', 'v1/topics')).toBe('/interview/api/v1/topics');
    expect(apiPathUnder('/dev/interview', '/v1/topics')).toBe('/dev/interview/api/v1/topics');
  });
});
