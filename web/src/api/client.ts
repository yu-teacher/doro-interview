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

/** GET 하고 표준 응답 봉투에서 `data` 를 꺼낸다. 취소(AbortError)는 그대로 던진다. */
export async function apiGet<T>(path: string, params?: Params, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(buildUrl(path, params), { headers: { Accept: 'application/json' }, signal });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw e;
    }
    throw new ApiError(0, 'NETWORK', '서버에 연결할 수 없습니다. 네트워크를 확인하고 다시 시도해 주세요.');
  }

  const body = parseJson(await response.text());
  if (!isEnvelope(body)) {
    if (response.status >= 500) {
      throw new ApiError(response.status, 'UPSTREAM', '서버가 응답하지 않습니다. 잠시 후 다시 시도해 주세요.');
    }
    throw new ApiError(response.status, 'BAD_RESPONSE', '서버 응답을 읽을 수 없습니다.');
  }
  if (!response.ok || !body.success) {
    throw new ApiError(body.status ?? response.status, body.code ?? 'UNKNOWN', body.message ?? '요청을 처리하지 못했습니다.');
  }
  return body.data as T;
}
