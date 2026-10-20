import { apiGet, apiSend } from './client';
import type { MineDraft, MineQuestion } from './types';

export const fetchMine = (signal?: AbortSignal) => apiGet<MineQuestion[]>('v1/mine', undefined, signal);

export const fetchMineQuestion = (id: string, signal?: AbortSignal) => apiGet<MineQuestion>(`v1/mine/${encodeURIComponent(id)}`, undefined, signal);

/** 만들기와 수정은 같은 요청이다(통째로 교체). id 는 클라이언트가 만든 UUID 라 같은 요청을 다시 보내도 한 개다. */
export const putMine = (id: string, draft: MineDraft) => apiSend<MineQuestion>('PUT', `v1/mine/${encodeURIComponent(id)}`, draft);

/** 한 번에 최대 50개. 전부 저장되거나 아무것도 저장되지 않는다. */
export const putMineBatch = (items: (MineDraft & { id: string })[]) => apiSend<MineQuestion[]>('PUT', 'v1/mine', { items });

/** 삭제도 PUT 이다(게이트웨이가 DELETE 를 막는다). */
export const deleteMine = (id: string) => apiSend<{ id: string; deleted: boolean }>('PUT', `v1/mine/${encodeURIComponent(id)}/deleted`, { deleted: true });
