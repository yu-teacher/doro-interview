/** 백엔드 응답 모양(`CatalogViews`, `QuestionDetailResponse`)과 같다. 바꾸면 양쪽을 함께 고친다. */

export type Tier = 'BASIC' | 'DEEP' | 'TRICKY';
export type MatchedIn = 'title' | 'keywords' | 'concepts' | 'body';

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  code?: string;
  message?: string;
  status?: number;
}

export interface TierCounts {
  basic: number;
  deep: number;
  tricky: number;
}

export interface TopicSummary {
  slug: string;
  name: string;
  description: string;
  baseVersion: string | null;
  counts: TierCounts;
}

export interface CategoryView {
  slug: string;
  name: string;
  topics: TopicSummary[];
}

export interface QuestionSummary {
  slug: string;
  topicSlug: string;
  tier: Tier;
  difficulty: number;
  title: string;
  keywords: string[];
  hasExtra: boolean;
  /** 1~3, 판단하지 않았으면 null(미분류) */
  importance: number | null;
  /** 개념 slug(사전 순서) */
  concepts: string[];
  /** 로그인했을 때만 있다(체크했는지). 비로그인 응답에는 키가 없다. */
  learned?: boolean;
}

export interface SourceView {
  url: string;
  note: string | null;
}

export interface TopicView {
  summary: TopicSummary;
  categorySlug: string;
  categoryName: string;
  sources: SourceView[];
  questions: QuestionSummary[];
}

export interface ConceptRef {
  slug: string;
  name: string;
}

export interface QuestionRef {
  slug: string;
  title: string;
  tier: Tier;
  topicSlug: string;
}

export interface QuestionDetail {
  slug: string;
  topicSlug: string;
  topicName: string;
  categorySlug: string;
  tier: Tier;
  difficulty: number;
  title: string;
  keywords: string[];
  hasExtra: boolean;
  /** 말로 하는 모범 답변(한 문단, 일반 텍스트에 가까운 마크다운) */
  spokenAnswer: string;
  /** 근거·코드·실험 설명(마크다운) */
  detailMd: string;
  status: 'DRAFT' | 'REVIEWED';
  reviewedAt: string | null;
  needsReview: boolean;
  baseVersion: string | null;
  /** 이 질문을 검수하며 대조한 출처 */
  sources: string[];
  /** 주제(문서) 전체 출처 */
  topicSources: SourceView[];
  prevSlug: string | null;
  nextSlug: string | null;
  importance: number | null;
  concepts: ConceptRef[];
  followups: QuestionRef[];
  prerequisites: QuestionRef[];
  related: QuestionRef[];
  /** 로그인했을 때만 있다 */
  learned?: boolean;
}

export interface ConceptView {
  slug: string;
  name: string;
  description: string;
  questionCount: number;
}

export interface ConceptDetail {
  concept: ConceptView;
  questions: QuestionSummary[];
}

export interface SearchHit {
  question: QuestionSummary;
  topicName: string;
  score: number;
  matchedIn: MatchedIn[];
}

export interface SearchResult {
  words: string[];
  total: number;
  hits: SearchHit[];
}

export interface SessionInfo {
  authenticated: boolean;
  user?: { userId: string };
}

export interface TopicProgress {
  topicSlug: string;
  total: number;
  learned: number;
}

export interface ProgressSummary {
  total: number;
  learned: number;
  topics: TopicProgress[];
}

export interface LearnedResult {
  slug: string;
  learned: boolean;
}

export interface TopicLearnedResult {
  topic: string;
  learned: boolean;
  count: number;
}

export interface NoteInfo {
  slug: string;
  body: string | null;
  updatedAt: string | null;
}
