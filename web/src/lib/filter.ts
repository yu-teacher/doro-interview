import type { QuestionSummary, Tier } from '../api/types';

/** 주제 화면의 필터. URL 쿼리와 오가므로 값은 문자열로 직렬화된다(공유·뒤로 가기가 동작한다). */
export type ImportanceFilter = 'all' | '3' | 'ge2' | 'none';

export interface Filters {
  tier: Tier | 'ALL';
  extraOnly: boolean;
  importance: ImportanceFilter;
  /** 개념 slug, 없으면 빈 문자열 */
  concept: string;
  text: string;
}

export const EMPTY_FILTERS: Filters = { tier: 'ALL', extraOnly: false, importance: 'all', concept: '', text: '' };

const TIER_VALUES = new Set<string>(['BASIC', 'DEEP', 'TRICKY']);
const IMPORTANCE_VALUES = new Set<string>(['all', '3', 'ge2', 'none']);

/** URL 쿼리에서 필터를 읽는다. 알 수 없는 값은 무시하고 기본값을 쓴다. */
export function parseFilters(params: URLSearchParams): Filters {
  const tier = params.get('tier') ?? '';
  const importance = params.get('imp') ?? '';
  return {
    tier: TIER_VALUES.has(tier) ? (tier as Tier) : 'ALL',
    extraOnly: params.get('extra') === '1',
    importance: IMPORTANCE_VALUES.has(importance) ? (importance as ImportanceFilter) : 'all',
    concept: params.get('concept') ?? '',
    text: (params.get('q') ?? '').slice(0, 100),
  };
}

/** 기본값과 같은 필터는 쿼리에 싣지 않는다(주소를 짧게 유지). */
export function toSearchParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.tier !== 'ALL') {
    params.set('tier', filters.tier);
  }
  if (filters.extraOnly) {
    params.set('extra', '1');
  }
  if (filters.importance !== 'all') {
    params.set('imp', filters.importance);
  }
  if (filters.concept) {
    params.set('concept', filters.concept);
  }
  if (filters.text.trim()) {
    params.set('q', filters.text.trim());
  }
  return params;
}

export function isFiltered(filters: Filters): boolean {
  return toSearchParams(filters).size > 0;
}

function matchesImportance(importance: number | null, filter: ImportanceFilter): boolean {
  switch (filter) {
    case '3':
      return importance === 3;
    case 'ge2':
      return importance !== null && importance >= 2;
    case 'none':
      return importance === null;
    default:
      return true;
  }
}

/** 질문 목록에 필터를 적용한다(서버가 준 순서를 유지한다). 글 검색은 제목과 키워드에서 대소문자 없이 부분 일치, 단어는 모두 있어야 한다. */
export function filterQuestions(questions: QuestionSummary[], filters: Filters): QuestionSummary[] {
  const words = filters.text.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return questions.filter((q) => {
    if (filters.tier !== 'ALL' && q.tier !== filters.tier) {
      return false;
    }
    if (filters.extraOnly && !q.hasExtra) {
      return false;
    }
    if (!matchesImportance(q.importance, filters.importance)) {
      return false;
    }
    if (filters.concept && !q.concepts.includes(filters.concept)) {
      return false;
    }
    if (words.length > 0) {
      const haystack = (q.title + ' ' + q.keywords.join(' ')).toLowerCase();
      return words.every((w) => haystack.includes(w));
    }
    return true;
  });
}

/** tier 탭에 보여 줄 개수: tier 를 뺀 나머지 필터를 적용한 결과의 tier 별 개수. */
export function tierCounts(questions: QuestionSummary[], filters: Filters): Record<Tier | 'ALL', number> {
  const rest = filterQuestions(questions, { ...filters, tier: 'ALL' });
  return {
    ALL: rest.length,
    BASIC: rest.filter((q) => q.tier === 'BASIC').length,
    DEEP: rest.filter((q) => q.tier === 'DEEP').length,
    TRICKY: rest.filter((q) => q.tier === 'TRICKY').length,
  };
}

/** 주제 안 질문들이 가진 개념 slug 를 등장 순서로 모은다(중복 없이). */
export function conceptsIn(questions: QuestionSummary[]): string[] {
  const seen = new Set<string>();
  for (const q of questions) {
    for (const c of q.concepts) {
      seen.add(c);
    }
  }
  return [...seen];
}
