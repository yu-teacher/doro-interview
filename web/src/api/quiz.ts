import { apiGet, apiSend } from './client';
import type { Prefs, QuizResult, QuizSession, QuizStartRequest, QuizStats, ReviewCandidate, AiFeedback, AiStatus } from './types';

const session = (id: string) => `v1/quiz/${encodeURIComponent(id)}`;

/** 시험을 시작한다. 세션 id 는 우리가 만든 UUID 이고, 같은 id 로 다시 보내면 같은 세션이 온다(멱등). */
export const startQuiz = (id: string, body: QuizStartRequest) => apiSend<QuizSession>('PUT', session(id), body);

export const fetchQuiz = (id: string, signal?: AbortSignal) => apiGet<QuizSession>(session(id), undefined, signal);

export const putQuizItem = (id: string, seq: number, body: { result: QuizResult; seconds?: number; answerText?: string }) =>
  apiSend<QuizSession>('PUT', `${session(id)}/items/${seq}`, body);

export const finishQuiz = (id: string) => apiSend<QuizSession>('PUT', `${session(id)}/finish`, {});

export const fetchAiStatus = (signal?: AbortSignal) => apiGet<AiStatus>('v1/me/ai', undefined, signal);
/** 같은 문항에 다시 보내면 저장된 피드백이 돌아온다(공급자를 다시 부르지 않는다). */
export const putFeedback = (id: string, seq: number, answerText: string) => apiSend<AiFeedback>('PUT', `${session(id)}/items/${seq}/feedback`, { answerText });

export const fetchPrefs = (signal?: AbortSignal) => apiGet<Prefs>('v1/me/prefs', undefined, signal);
export const putPrefs = (body: Prefs) => apiSend<Prefs>('PUT', 'v1/me/prefs', body);
export const fetchStats = (signal?: AbortSignal) => apiGet<QuizStats>('v1/me/stats', undefined, signal);
export const fetchReviewCandidates = (signal?: AbortSignal) => apiGet<ReviewCandidate[]>('v1/review-candidates', undefined, signal);
