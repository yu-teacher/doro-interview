import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiGet, ApiError, buildUrl } from './client';

afterEach(() => vi.unstubAllGlobals());

function respond(body: string, status = 200): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'application/json' } });
}

describe('buildUrl', () => {
  it('하위 경로 아래의 API 주소를 만든다', () => {
    expect(buildUrl('v1/categories')).toBe('/interview/api/v1/categories');
  });

  it('쿼리를 인코딩하고 undefined 는 뺀다', () => {
    expect(buildUrl('v1/search', { q: '전파 속성&x=1', limit: undefined })).toBe(
      '/interview/api/v1/search?q=%EC%A0%84%ED%8C%8C+%EC%86%8D%EC%84%B1%26x%3D1',
    );
    expect(buildUrl('v1/search', { q: 'a', limit: 5 })).toBe('/interview/api/v1/search?q=a&limit=5');
  });
});

describe('apiGet', () => {
  it('표준 응답 봉투에서 data 를 꺼낸다', async () => {
    const fetchMock = vi.fn(async () => respond(JSON.stringify({ success: true, data: { a: 1 } })));
    vi.stubGlobal('fetch', fetchMock);
    await expect(apiGet<{ a: number }>('v1/x')).resolves.toEqual({ a: 1 });
    expect(fetchMock).toHaveBeenCalledWith('/interview/api/v1/x', expect.objectContaining({ headers: { Accept: 'application/json' } }));
  });

  it('서버 오류 봉투를 ApiError 로 바꾼다(상태·코드·메시지)', async () => {
    vi.stubGlobal('fetch', async () => respond(JSON.stringify({ success: false, code: 'COMMON-404-01', message: '없다', status: 404 }), 404));
    const error = await apiGet('v1/x').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, code: 'COMMON-404-01', message: '없다' });
    expect((error as ApiError).isNotFound).toBe(true);
  });

  it('검색어 오류(400)의 코드와 메시지를 보존한다', async () => {
    vi.stubGlobal('fetch', async () => respond(JSON.stringify({ success: false, code: 'SEARCH-400-01', message: '검색어를 입력해 주세요.', status: 400 }), 400));
    await expect(apiGet('v1/search')).rejects.toMatchObject({ status: 400, code: 'SEARCH-400-01', message: '검색어를 입력해 주세요.' });
  });

  it('네트워크 실패는 NETWORK 오류다', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('Failed to fetch');
    });
    await expect(apiGet('v1/x')).rejects.toMatchObject({ status: 0, code: 'NETWORK' });
  });

  it('게이트웨이의 HTML 5xx 는 UPSTREAM 오류다(본문을 믿지 않는다)', async () => {
    vi.stubGlobal('fetch', async () => new Response('<html>502 Bad Gateway</html>', { status: 502 }));
    await expect(apiGet('v1/x')).rejects.toMatchObject({ status: 502, code: 'UPSTREAM' });
  });

  it('JSON 이 아닌 4xx/2xx 응답은 BAD_RESPONSE 다', async () => {
    vi.stubGlobal('fetch', async () => new Response('<html>nope</html>', { status: 404 }));
    await expect(apiGet('v1/x')).rejects.toMatchObject({ status: 404, code: 'BAD_RESPONSE' });
    vi.stubGlobal('fetch', async () => new Response('hello', { status: 200 }));
    await expect(apiGet('v1/x')).rejects.toMatchObject({ code: 'BAD_RESPONSE' });
  });

  it('봉투가 아닌 JSON 도 BAD_RESPONSE 다', async () => {
    vi.stubGlobal('fetch', async () => respond(JSON.stringify({ hello: 'world' })));
    await expect(apiGet('v1/x')).rejects.toMatchObject({ code: 'BAD_RESPONSE' });
  });

  it('상태가 성공이어도 success=false 면 오류다', async () => {
    vi.stubGlobal('fetch', async () => respond(JSON.stringify({ success: false, code: 'X', message: '실패' }), 200));
    await expect(apiGet('v1/x')).rejects.toMatchObject({ code: 'X', message: '실패' });
  });

  it('취소(AbortError)는 ApiError 로 바꾸지 않고 그대로 던진다', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new DOMException('aborted', 'AbortError');
    });
    const error = await apiGet('v1/x').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DOMException);
    expect((error as DOMException).name).toBe('AbortError');
  });

  it('signal 을 fetch 에 넘긴다', async () => {
    const fetchMock = vi.fn(async () => respond(JSON.stringify({ success: true, data: 1 })));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    await apiGet('v1/x', undefined, controller.signal);
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ signal: controller.signal }));
  });
});
