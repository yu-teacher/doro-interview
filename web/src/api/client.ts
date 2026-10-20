import { apiPath } from '../config';
import type { ApiEnvelope } from './types';

/** 서버 오류(표준 규격), 네트워크 실패, 게이트웨이의 비 JSON 오류를 한 모양으로 다룬다. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

/** 쓰기 요청이 CSRF 검사를 통과하려면 이 서비스의 커스텀 헤더가 있어야 한다(게이트웨이가 확인한다). */
export const CSRF_HEADER = 'X-Interview-Csrf';

/** 사용자에게 보여 줄 문구. 게이트웨이가 만든 오류(세션·CSRF)는 서버 문구 대신 하는 일을 알려 주는 말로 바꾼다. */
export function userMessage(error: ApiError): string {
  if (error.isUnauthorized) {
    return '로그인이 필요합니다. 다시 로그인해 주세요.';
  }
  if (error.code === 'AUTH-403-03') {
    return '보안 확인에 실패했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.';
  }
  if (error.code === 'AUTH-503-02') {
    return '로그인 서비스에 잠시 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.';
  }
  return error.message;
}

type Params = Record<string, string | number | undefined>;

export function buildUrl(path: string, params?: Params): string {
  const url = apiPath(path);
  if (!params) {
    return url;
  }
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      query.set(key, String(value));
    }
  }
  const qs = query.toString();
  return qs ? `${url}?${qs}` : url;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function isEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return typeof value === 'object' && value !== null && typeof (value as { success?: unknown }).success === 'boolean';
}

type Method = 'GET' | 'PUT' | 'POST';

interface Options {
  params?: Params;
  body?: unknown;
  signal?: AbortSignal;
}

async function request<T>(method: Method, path: string, { params, body, signal }: Options): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const init: RequestInit = { method, headers, signal };
  if (method !== 'GET') {
    headers[CSRF_HEADER] = '1';
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  let response: Response;
  try {
    response = await fetch(buildUrl(path, params), init);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw e;
    }
    throw new ApiError(0, 'NETWORK', '서버에 연결할 수 없습니다. 네트워크를 확인하고 다시 시도해 주세요.');
  }

  const parsed = parseJson(await response.text());
  if (!isEnvelope(parsed)) {
    if (response.status >= 500) {
      throw new ApiError(response.status, 'UPSTREAM', '서버가 응답하지 않습니다. 잠시 후 다시 시도해 주세요.');
    }
    throw new ApiError(response.status, 'BAD_RESPONSE', '서버 응답을 읽을 수 없습니다.');
  }
  if (!response.ok || !parsed.success) {
    throw new ApiError(parsed.status ?? response.status, parsed.code ?? 'UNKNOWN', parsed.message ?? '요청을 처리하지 못했습니다.');
  }
  return parsed.data as T;
}

/** GET 하고 표준 응답 봉투에서 `data` 를 꺼낸다. 취소(AbortError)는 그대로 던진다. */
export function apiGet<T>(path: string, params?: Params, signal?: AbortSignal): Promise<T> {
  return request<T>('GET', path, { params, signal });
}

/** 상태를 바꾸는 요청(PUT/POST): CSRF 헤더를 자동으로 붙이고 JSON 본문을 보낸다. */
export function apiSend<T>(method: 'PUT' | 'POST', path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  return request<T>(method, path, { body, signal });
}
