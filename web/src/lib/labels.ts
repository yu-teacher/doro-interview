import type { MatchedIn, Tier } from '../api/types';

export const TIERS: Tier[] = ['BASIC', 'DEEP', 'TRICKY'];

export const TIER_LABEL: Record<Tier, string> = { BASIC: '기본', DEEP: '심화', TRICKY: '함정' };

export const MATCHED_LABEL: Record<MatchedIn, string> = { title: '제목', keywords: '키워드', concepts: '개념', body: '본문' };

/** 필수도(1~3, 미분류는 null)를 글로 쓴다. tier 의 "심화" 와 헷갈리지 않게 항상 "필수도" 를 앞에 붙인다. */
export function importanceLabel(importance: number | null): string {
  switch (importance) {
    case 3:
      return '필수도 3 · 필수';
    case 2:
      return '필수도 2 · 자주';
    case 1:
      return '필수도 1 · 심화';
    default:
      return '필수도 미분류';
  }
}

/** 검수 시각(ISO)에서 날짜(YYYY-MM-DD)만. */
export function reviewedDate(reviewedAt: string | null): string | null {
  return reviewedAt ? reviewedAt.slice(0, 10) : null;
}
