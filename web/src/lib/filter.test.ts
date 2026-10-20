import { describe, expect, it } from 'vitest';
import type { QuestionSummary } from '../api/types';
import { conceptsIn, EMPTY_FILTERS, filterQuestions, isFiltered, parseFilters, tierCounts, toSearchParams, type Filters } from './filter';

function q(slug: string, over: Partial<QuestionSummary> = {}): QuestionSummary {
  return {
    slug, topicSlug: 't', tier: 'BASIC', difficulty: 1, title: `질문 ${slug}`, keywords: [], hasExtra: false,
    importance: null, concepts: [], ...over,
  };
}

const list: QuestionSummary[] = [
  q('a', { tier: 'BASIC', importance: 3, concepts: ['proxy'], keywords: ['프록시', 'CGLIB'], title: '프록시란?' }),
  q('b', { tier: 'BASIC', importance: 2, hasExtra: true, concepts: ['tx', 'proxy'], title: '트랜잭션 전파' }),
  q('c', { tier: 'DEEP', importance: 1, concepts: ['tx'], title: 'REQUIRES_NEW 동작' }),
  q('d', { tier: 'DEEP', importance: null, hasExtra: true, title: '미분류 질문' }),
  q('e', { tier: 'TRICKY', importance: 3, title: '함정 질문' }),
];

const apply = (over: Partial<Filters>) => filterQuestions(list, { ...EMPTY_FILTERS, ...over }).map((x) => x.slug);

describe('filterQuestions', () => {
  it('필터가 없으면 전부, 서버가 준 순서 그대로', () => {
    expect(apply({})).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('tier', () => {
    expect(apply({ tier: 'BASIC' })).toEqual(['a', 'b']);
    expect(apply({ tier: 'DEEP' })).toEqual(['c', 'd']);
    expect(apply({ tier: 'TRICKY' })).toEqual(['e']);
  });

  it('보충이 있는 질문만', () => {
    expect(apply({ extraOnly: true })).toEqual(['b', 'd']);
  });

  it('필수도: 3만 / 2 이상 / 미분류', () => {
    expect(apply({ importance: '3' })).toEqual(['a', 'e']);
    expect(apply({ importance: 'ge2' })).toEqual(['a', 'b', 'e']);
    expect(apply({ importance: 'none' })).toEqual(['d']);
    expect(apply({ importance: 'all' })).toHaveLength(5);
  });

  it('개념', () => {
    expect(apply({ concept: 'proxy' })).toEqual(['a', 'b']);
    expect(apply({ concept: 'tx' })).toEqual(['b', 'c']);
    expect(apply({ concept: 'none-such' })).toEqual([]);
  });

  it('글 검색은 제목·키워드에서 대소문자 없이 부분 일치하고 단어는 모두 있어야 한다', () => {
    expect(apply({ text: '프록시' })).toEqual(['a']);
    expect(apply({ text: 'cglib' })).toEqual(['a']);
    expect(apply({ text: 'requires_new' })).toEqual(['c']);
    expect(apply({ text: '  트랜잭션   전파 ' })).toEqual(['b']);
    expect(apply({ text: '트랜잭션 프록시' })).toEqual([]);
    expect(apply({ text: '   ' })).toHaveLength(5);
  });

  it('필터를 겹치면 모두 만족해야 한다', () => {
    expect(apply({ tier: 'BASIC', importance: 'ge2', concept: 'proxy' })).toEqual(['a', 'b']);
    expect(apply({ tier: 'BASIC', extraOnly: true, importance: '3' })).toEqual([]);
  });

  it('입력 배열을 바꾸지 않는다', () => {
    const copy = [...list];
    apply({ tier: 'DEEP' });
    expect(list).toEqual(copy);
  });
});

describe('tierCounts', () => {
  it('tier 를 뺀 나머지 필터를 적용한 tier 별 개수다', () => {
    expect(tierCounts(list, EMPTY_FILTERS)).toEqual({ ALL: 5, BASIC: 2, DEEP: 2, TRICKY: 1 });
    expect(tierCounts(list, { ...EMPTY_FILTERS, importance: '3' })).toEqual({ ALL: 2, BASIC: 1, DEEP: 0, TRICKY: 1 });
  });

  it('선택한 tier 자체는 개수에 영향을 주지 않는다', () => {
    expect(tierCounts(list, { ...EMPTY_FILTERS, tier: 'TRICKY' })).toEqual({ ALL: 5, BASIC: 2, DEEP: 2, TRICKY: 1 });
  });
});

describe('URL 쿼리', () => {
  it('기본값은 쿼리에 싣지 않는다', () => {
    expect(toSearchParams(EMPTY_FILTERS).toString()).toBe('');
    expect(isFiltered(EMPTY_FILTERS)).toBe(false);
  });

  it('왕복해도 같다', () => {
    const f: Filters = { tier: 'DEEP', extraOnly: true, importance: 'ge2', concept: 'proxy', text: '전파 속성' };
    expect(parseFilters(toSearchParams(f))).toEqual(f);
    expect(isFiltered(f)).toBe(true);
  });

  it('알 수 없는 값은 무시한다', () => {
    const f = parseFilters(new URLSearchParams('tier=HARD&imp=9&extra=yes&q=' + 'a'.repeat(300)));
    expect(f.tier).toBe('ALL');
    expect(f.importance).toBe('all');
    expect(f.extraOnly).toBe(false);
    expect(f.text).toHaveLength(100);
  });

  it('글 검색의 앞뒤 공백은 쿼리에서 지운다', () => {
    expect(toSearchParams({ ...EMPTY_FILTERS, text: '  abc  ' }).get('q')).toBe('abc');
    expect(isFiltered({ ...EMPTY_FILTERS, text: '   ' })).toBe(false);
  });
});

describe('conceptsIn', () => {
  it('등장 순서로 중복 없이 모은다', () => {
    expect(conceptsIn(list)).toEqual(['proxy', 'tx']);
    expect(conceptsIn([])).toEqual([]);
  });
});
