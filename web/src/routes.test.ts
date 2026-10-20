import { describe, expect, it } from 'vitest';
import { conceptPath, conceptsPath, mineIdOf, minePath, questionLink, questionPath, searchPath, topicPath } from './routes';

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

  it('내 질문 slug 는 내 질문 화면으로, 공용 slug 는 사전 화면으로 간다', () => {
    expect(mineIdOf('my-11111111-1111-4111-8111-111111111111')).toBe('11111111-1111-4111-8111-111111111111');
    expect(mineIdOf('tx-04')).toBeNull();
    expect(questionLink('my-abc')).toBe('/mine/abc');
    expect(questionLink('tx-04')).toBe('/q/tx-04');
    expect(minePath()).toBe('/mine');
    expect(minePath('a/b')).toBe('/mine/a%2Fb');
  });
});
