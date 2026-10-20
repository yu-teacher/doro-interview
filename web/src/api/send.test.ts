import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiGet, apiSend, userMessage } from './client';
import { putLearned, putNote, putTopicLearned } from './progress';
import { errorResponse, mockApi, respond } from '../testing/mockFetch';

afterEach(() => vi.unstubAllGlobals());

describe('쓰기 요청', () => {
  it('PUT 은 CSRF 헤더와 JSON 본문을 보내고 봉투에서 data 를 꺼낸다', async () => {
    const { requests } = mockApi({ 'PUT /interview/api/v1/progress/tx-01': { slug: 'tx-01', learned: true } });
    expect(await putLearned('tx-01', true)).toEqual({ slug: 'tx-01', learned: true });
    const sent = requests[0];
    expect(sent.method).toBe('PUT');
    expect(sent.headers['X-Interview-Csrf']).toBe('1');
    expect(sent.headers['Content-Type']).toBe('application/json');
    expect(sent.body).toEqual({ learned: true });
  });

  it('GET 에는 CSRF 헤더를 붙이지 않는다', async () => {
    const { requests } = mockApi({ '/interview/api/v1/x': 1 });
    await apiGet('v1/x');
    expect(requests[0].headers['X-Interview-Csrf']).toBeUndefined();
    expect(requests[0].method).toBe('GET');
  });

  it('주제 일괄·노트의 본문 모양', async () => {
    const { requests } = mockApi({
      'PUT /interview/api/v1/progress': { topic: 't', learned: false, count: 3 },
      'PUT /interview/api/v1/notes/tx-01': { slug: 'tx-01', body: 'x', updatedAt: null },
    });
    await putTopicLearned('t', false, 3);
    await putNote('tx-01', 'x');
    expect(requests[0].body).toEqual({ topic: 't', learned: false, expectedCount: 3 });
    expect(requests[1].body).toEqual({ body: 'x' });
  });

  it('slug 는 경로에서 인코딩된다', async () => {
    const { calls } = mockApi({});
    await putLearned('a/b c', true).catch(() => undefined);
    expect(calls[0]).toBe('/interview/api/v1/progress/a%2Fb%20c');
  });

  it('오류 봉투는 ApiError 로, 401 은 isUnauthorized 로 구분한다', async () => {
    mockApi({ 'PUT /interview/api/v1/progress/x': respond(() => errorResponse(401, 'AUTH-401-01', '로그인이 필요합니다.')) });
    const e = await apiSend('PUT', 'v1/progress/x', { learned: true }).catch((err: unknown) => err);
    expect(e).toBeInstanceOf(ApiError);
    expect((e as ApiError).isUnauthorized).toBe(true);
    expect((e as ApiError).code).toBe('AUTH-401-01');
  });

  it('네트워크 실패는 NETWORK 오류다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('failed')));
    const e = (await apiSend('PUT', 'v1/x', {}).catch((err: unknown) => err)) as ApiError;
    expect(e.status).toBe(0);
    expect(e.code).toBe('NETWORK');
  });

  it('게이트웨이가 만든 비 JSON 502 는 서버 문구로 바뀐다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>Bad Gateway</html>', { status: 502 })));
    const e = (await apiSend('PUT', 'v1/x', {}).catch((err: unknown) => err)) as ApiError;
    expect(e.code).toBe('UPSTREAM');
  });
});

describe('userMessage', () => {
  it('세션·CSRF 오류는 하는 일을 알려 주는 말로 바꾼다', () => {
    expect(userMessage(new ApiError(401, 'AUTH-401-01', 'x'))).toContain('로그인');
    expect(userMessage(new ApiError(403, 'AUTH-403-03', 'x'))).toContain('새로고침');
    expect(userMessage(new ApiError(503, 'AUTH-503-02', 'x'))).toContain('로그인 서비스');
  });

  it('그 밖에는 서버 문구를 그대로 쓴다', () => {
    expect(userMessage(new ApiError(409, 'PROGRESS-409-01', '질문 수가 바뀌었습니다. 다시 확인해 주세요.'))).toBe('질문 수가 바뀌었습니다. 다시 확인해 주세요.');
  });
});
