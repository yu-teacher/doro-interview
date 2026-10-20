import { describe, expect, it } from 'vitest';
import { conceptPath, conceptsPath, questionPath, searchPath, topicPath } from './routes';

describe('routes', () => {
  it('경로를 만든다', () => {
    expect(topicPath('transaction')).toBe('/t/transaction');
    expect(questionPath('tx-04')).toBe('/q/tx-04');
    expect(conceptPath('proxy')).toBe('/c/proxy');
    expect(conceptsPath()).toBe('/concepts');
  });

  it('slug 와 검색어를 인코딩한다', () => {
    expect(questionPath('a/b?c')).toBe('/q/a%2Fb%3Fc');
    expect(searchPath('전파 속성&x')).toBe('/search?q=%EC%A0%84%ED%8C%8C%20%EC%86%8D%EC%84%B1%26x');
  });
});
