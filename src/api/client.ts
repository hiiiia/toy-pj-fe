import type { ErrorResponse, FieldError } from './types';

/**
 * 비워두면 같은 출처(/api)로 요청하고, 개발 중에는 Vite 프록시가 백엔드로 전달한다.
 * 프론트와 백엔드를 다른 도메인에 배포할 때만 VITE_API_BASE_URL 을 지정한다.
 */
const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * 백엔드 공통 에러 포맷(ErrorResponse)을 담는 예외.
 * 화면에서는 message 를 보여주고, 필요하면 code(T002 등)로 분기한다.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: FieldError[];

  constructor(status: number, code: string, message: string, fieldErrors: FieldError[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

type QueryValue = string | number | boolean | undefined | null;

/** undefined/null/빈 문자열은 쿼리스트링에서 제외한다. */
export function toQuery(params: object = {}): string {
  const search = new URLSearchParams();
  Object.entries(params as Record<string, QueryValue>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.append(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK', '서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인하세요.');
  }

  if (!response.ok) {
    throw await toApiError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const error = (await response.json()) as Partial<ErrorResponse>;
    const fieldErrors = error.errors ?? [];
    const detail = fieldErrors.map((e) => `${e.field}: ${e.reason}`).join(', ');
    const message = error.message ?? `요청에 실패했습니다. (${response.status})`;
    return new ApiError(response.status, error.code ?? 'UNKNOWN', detail ? `${message} (${detail})` : message, fieldErrors);
  } catch {
    return new ApiError(response.status, 'UNKNOWN', `요청에 실패했습니다. (${response.status})`);
  }
}

export const http = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: (path: string) => request<void>('DELETE', path),
};

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return '알 수 없는 오류가 발생했습니다.';
}
