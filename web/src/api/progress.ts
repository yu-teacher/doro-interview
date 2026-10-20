import { apiGet, apiSend } from './client';
import type { LearnedResult, NoteInfo, ProgressSummary, SessionInfo, TopicLearnedResult } from './types';

export const fetchSession = (signal?: AbortSignal) => apiGet<SessionInfo>('v1/bff/session', undefined, signal);

/** 로그아웃은 서버(BFF)가 세션 쿠키를 지운다. */
export const postLogout = () => apiSend<unknown>('POST', 'v1/bff/logout');

export const putLearned = (slug: string, learned: boolean) =>
  apiSend<LearnedResult>('PUT', `v1/progress/${encodeURIComponent(slug)}`, { learned });

/** `expectedCount` 는 사용자가 확인창에서 본 개수다. 서버의 실제 개수와 다르면 409 로 거절된다. */
export const putTopicLearned = (topic: string, learned: boolean, expectedCount: number) =>
  apiSend<TopicLearnedResult>('PUT', 'v1/progress', { topic, learned, expectedCount });

export const fetchProgressSummary = (signal?: AbortSignal) => apiGet<ProgressSummary>('v1/progress/summary', undefined, signal);

export const fetchNote = (slug: string, signal?: AbortSignal) => apiGet<NoteInfo>(`v1/notes/${encodeURIComponent(slug)}`, undefined, signal);

export const putNote = (slug: string, body: string) => apiSend<NoteInfo>('PUT', `v1/notes/${encodeURIComponent(slug)}`, { body });
