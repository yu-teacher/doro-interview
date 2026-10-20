import { vi } from 'vitest';

/** 보낸 요청(쓰기 시험에서 메서드·본문·헤더를 확인한다). 본문은 JSON 이면 파싱한 값이다. */
export interface SentRequest {
  method: string;
  path: string;
  body: unknown;
  headers: Record<string, string>;
}

type ResponseHandler = (url: URL, request: SentRequest) => Response | Promise<Response>;

/** 함수형 핸들러에 URL 타입을 입혀 주는 표시용 도우미: `'/x': respond((url) => new Response(...))` */
export const respond = (fn: ResponseHandler): ResponseHandler => fn;

// 데이터(어떤 값이든) 또는 respond() 로 만든 함수
type Handler = unknown;

function envelope(data: unknown, status = 200): Response {
  return new Response(JSON.stringify({ success: true, data }), { status, headers: { 'Content-Type': 'application/json' } });
}

export { envelope as okResponse };

export function errorResponse(status: number, code: string, message: string): Response {
  return new Response(JSON.stringify({ success: false, code, message, status }), { status, headers: { 'Content-Type': 'application/json' } });
}

/**
 * 전역 fetch 를 가짜로 바꾼다. 키는 `/interview/api/v1/…` 경로(쿼리 제외), 값은 응답 데이터이거나 Response 를 돌려주는 함수다.
 * 등록하지 않은 주소는 표준 404 오류를 돌려준다. 호출한 URL 은 `calls` 에 쌓인다.
 */
export function mockApi(routes: Record<string, Handler>) {
  const calls: string[] = [];
  const requests: SentRequest[] = [];
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost');
    calls.push(url.pathname + url.search);
    const method = (init?.method ?? 'GET').toUpperCase();
    let body: unknown;
    if (typeof init?.body === 'string') {
      try {
        body = JSON.parse(init.body);
      } catch {
        body = init.body;
      }
    }
    const request: SentRequest = { method, path: url.pathname, body, headers: { ...(init?.headers as Record<string, string> | undefined) } };
    requests.push(request);
    // "PUT /경로" 처럼 메서드를 붙인 키가 있으면 그것을 먼저 쓴다
    const handler = routes[`${method} ${url.pathname}`] ?? routes[url.pathname];
    if (handler === undefined) {
      return errorResponse(404, 'COMMON-404-01', '요청한 리소스를 찾을 수 없습니다.');
    }
    return typeof handler === 'function' ? (handler as ResponseHandler)(url, request) : envelope(handler);
  });
  vi.stubGlobal('fetch', fn);
  return { calls, requests, fn };
}
