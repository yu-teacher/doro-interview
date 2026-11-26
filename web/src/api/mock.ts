import { apiGet, apiSend } from './client';
import type { MockSession, MockStartRequest, QuizResult } from './types';

const session = (id: string) => `v1/mock/${encodeURIComponent(id)}`;

/** 모의면접을 시작한다. 세션 id 는 우리가 만든 UUID 이고, 같은 id 로 다시 보내면 같은 세션이 온다(멱등). */
export const startMock = (id: string, body: MockStartRequest) => apiSend<MockSession>('PUT', session(id), body);

export const fetchMock = (id: string, signal?: AbortSignal) => apiGet<MockSession>(session(id), undefined, signal);

/** 결과를 기록한다. 응답에는 서버가 정한 다음 턴이 들어 있다(없으면 끝난 세션이다). */
export const putMockTurn = (id: string, seq: number, body: { result: QuizResult; seconds?: number; answerText?: string }) =>
  apiSend<MockSession>('PUT', `${session(id)}/turns/${seq}`, body);

export const finishMock = (id: string) => apiSend<MockSession>('PUT', `${session(id)}/finish`, {});
