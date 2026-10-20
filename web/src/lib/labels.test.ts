import { describe, expect, it } from 'vitest';
import { importanceLabel, reviewedDate, TIER_LABEL } from './labels';

describe('labels', () => {
  it('tier 이름', () => {
    expect(TIER_LABEL).toEqual({ BASIC: '기본', DEEP: '심화', TRICKY: '함정' });
  });

  it('필수도는 항상 "필수도" 를 앞에 붙여 tier 의 심화와 구분한다', () => {
    expect(importanceLabel(3)).toBe('필수도 3 · 필수');
    expect(importanceLabel(2)).toBe('필수도 2 · 자주');
    expect(importanceLabel(1)).toBe('필수도 1 · 심화');
    expect(importanceLabel(null)).toBe('필수도 미분류');
    for (const v of [1, 2, 3, null]) {
      expect(importanceLabel(v)).toContain('필수도');
    }
  });

  it('검수 날짜만 낸다', () => {
    expect(reviewedDate('2026-10-20T00:00:00Z')).toBe('2026-10-20');
    expect(reviewedDate(null)).toBeNull();
  });
});
