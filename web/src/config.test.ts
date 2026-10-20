import { describe, expect, it } from 'vitest';
import { apiPath, BASE_PATH } from './config';

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
