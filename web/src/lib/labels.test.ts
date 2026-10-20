import { describe, expect, it } from 'vitest';
import { importanceLabel, reviewedDate, TIER_LABEL } from './labels';

describe('labels', () => {
  it('tier 이름', () => {
    expect(TIER_LABEL).toEqual({ BASIC: '기본', DEEP: '심화', TRICKY: '함정' });
  });

  it('필수도는 얼마나 자주 묻는지를 쉬운 말로 쓰고, 내부 용어(필수도·tier 와 같은 심화)를 쓰지 않는다', () => {
    expect(importanceLabel(3)).toBe('꼭 나와요');
    expect(importanceLabel(2)).toBe('자주 나와요');
    expect(importanceLabel(1)).toBe('가끔 나와요');
    expect(importanceLabel(null)).toBe('');
    for (const v of [1, 2, 3]) {
      expect(importanceLabel(v)).not.toContain('필수도');
      expect(importanceLabel(v)).not.toContain('심화'); // 난이도 "심화" 와 헷갈리지 않는다
    }
  });

  it('검수 날짜만 낸다', () => {
    expect(reviewedDate('2026-10-20T00:00:00Z')).toBe('2026-10-20');
    expect(reviewedDate(null)).toBeNull();
  });
});
