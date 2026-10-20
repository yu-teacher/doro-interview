import type { MatchedIn, Tier } from '../api/types';

export const TIERS: Tier[] = ['BASIC', 'DEEP', 'TRICKY'];

export const TIER_LABEL: Record<Tier, string> = { BASIC: '기본', DEEP: '심화', TRICKY: '함정' };

export const MATCHED_LABEL: Record<MatchedIn, string> = { title: '제목', keywords: '키워드', concepts: '개념', body: '본문' };

/**
 * 필수도(1~3, 미분류는 null)를 쉬운 말로 쓴다(F2: 내부 용어 "필수도 3 · 필수" 를 정리). 미분류는 빈 문자열이다(목록에서는 표시를 아예 하지 않는다).
 * 화면의 설명이 아니라 "얼마나 자주 묻는가" 를 말한다.
 */
export function importanceLabel(importance: number | null): string {
  switch (importance) {
    case 3:
      return '꼭 나와요';
    case 2:
      return '자주 나와요';
    case 1:
      return '가끔 나와요';
    default:
      return '';
  }
}

/** 검수 시각(ISO)에서 날짜(YYYY-MM-DD)만. */
export function reviewedDate(reviewedAt: string | null): string | null {
  return reviewedAt ? reviewedAt.slice(0, 10) : null;
}
