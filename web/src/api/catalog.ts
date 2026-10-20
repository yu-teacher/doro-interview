import { apiGet } from './client';
import type { CategoryView, ConceptDetail, ConceptView, QuestionDetail, SearchResult, TopicView } from './types';

export const fetchCategories = (signal?: AbortSignal) => apiGet<CategoryView[]>('v1/categories', undefined, signal);
export const fetchTopic = (slug: string, signal?: AbortSignal) => apiGet<TopicView>(`v1/topics/${encodeURIComponent(slug)}`, undefined, signal);
export const fetchQuestion = (slug: string, signal?: AbortSignal) =>
  apiGet<QuestionDetail>(`v1/questions/${encodeURIComponent(slug)}`, undefined, signal);
export const fetchConcepts = (signal?: AbortSignal) => apiGet<ConceptView[]>('v1/concepts', undefined, signal);
export const fetchConcept = (slug: string, signal?: AbortSignal) =>
  apiGet<ConceptDetail>(`v1/concepts/${encodeURIComponent(slug)}`, undefined, signal);
export const searchQuestions = (q: string, limit?: number, signal?: AbortSignal) =>
  apiGet<SearchResult>('v1/search', { q, limit }, signal);
