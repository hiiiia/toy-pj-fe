import type { ErrorResponse, FieldError, TokenResponse } from './types';

/**
 * 비워두면 같은 출처(/api)로 요청하고, 개발 중에는 Vite 프록시가 백엔드로 전달한다.
 * 프론트와 백엔드를 다른 도메인에 배포할 때만 VITE_API_BASE_URL 을 지정한다.
 */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '';

/**
 * 백엔드 공통 에러 포맷(ErrorResponse)을 담는 예외.
 * 화면에서는 message 를 보여주고, 필요하면 code(T002 등)로 분기한다.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: FieldError[];
  /** 서버 로그 추적용 ID. 문의할 때 알려주면 해당 요청의 로그를 바로 찾을 수 있다. */
  readonly requestId?: string;

  constructor(status: number, code: string, message: string, fieldErrors: FieldError[] = [], requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.requestId = requestId;
  }
}

// ===== 인증 토큰 관리 =====
// access token 은 XSS 로 탈취되기 쉬운 localStorage 대신 메모리(변수)에만 둔다.
// 새로고침하면 사라지지만, HttpOnly 쿠키의 refresh token 으로 다시 발급받는다.
let accessToken: string | null = null;

/** 서버가 응답하지 않을 때 화면이 무한히 기다리지 않도록 요청마다 제한 시간을 둔다. (AI 응답 대기를 고려해 30초) */
const REQUEST_TIMEOUT_MS = 30_000;
const REFRESH_TIMEOUT_MS = 10_000;
let refreshing: Promise<TokenResponse | null> | null = null;
let sessionListener: ((session: TokenResponse | null) => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

/** 로그인 상태가 바뀌면(재발급 성공/만료) 알려줄 함수를 등록한다. AuthContext 가 사용한다. */
export function onSessionChange(listener: (session: TokenResponse | null) => void) {
  sessionListener = listener;
}

/**
 * refresh token 쿠키로 access token 을 재발급한다.
 * 여러 요청이 동시에 401 을 받아도 재발급 요청은 한 번만 보내도록 진행 중인 Promise 를 공유한다.
 */
export function refreshSession(): Promise<TokenResponse | null> {
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          signal: AbortSignal.timeout(REFRESH_TIMEOUT_MS),
        });
        if (!res.ok) return null;
        const session = (await res.json()) as TokenResponse;
        accessToken = session.accessToken;
        return session;
      } catch {
        return null;
      }
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
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

async function send(method: string, path: string, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = {};
  // FormData(파일 업로드)는 브라우저가 boundary 를 포함한 Content-Type 을 직접 만들도록 비워 둔다
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      credentials: 'include', // refresh token 쿠키 전송
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'TimeoutError') {
      throw new ApiError(0, 'TIMEOUT', '서버 응답이 너무 늦습니다. 잠시 후 다시 시도하세요.');
    }
    throw new ApiError(0, 'NETWORK', '서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인하세요.');
  }
}

/** 401 이면 토큰을 재발급받아 한 번 재시도하고, 실패 응답은 ApiError 로 바꾼다. */
async function fetchWithAuth(method: string, path: string, body?: unknown): Promise<Response> {
  let response = await send(method, path, body);

  // access token 만료(401) → refresh token 으로 재발급 후 한 번만 재시도
  if (response.status === 401 && !path.startsWith('/api/auth/')) {
    const session = await refreshSession();
    sessionListener?.(session);
    if (session) {
      response = await send(method, path, body);
    }
  }

  if (!response.ok) {
    throw await toApiError(response);
  }
  return response;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetchWithAuth(method, path, body);
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
    const requestId = error.requestId ?? response.headers.get('X-Request-Id') ?? undefined;
    return new ApiError(response.status, error.code ?? 'UNKNOWN', detail ? `${message} (${detail})` : message, fieldErrors, requestId);
  } catch {
    const requestId = response.headers.get('X-Request-Id') ?? undefined;
    return new ApiError(response.status, 'UNKNOWN', `요청에 실패했습니다. (${response.status})`, [], requestId);
  }
}

export const http = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: (path: string) => request<void>('DELETE', path),
  /** multipart/form-data 업로드 */
  upload: <T>(path: string, form: FormData) => request<T>('POST', path, form),
  /** 파일 다운로드: 인증 헤더가 필요해 <a href> 대신 fetch 로 받아 Blob 으로 돌려준다 */
  blob: async (path: string): Promise<Blob> => (await fetchWithAuth('GET', path)).blob(),
};

/**
 * 화면에 보여줄 에러 문구. 서버 오류(5xx)는 문의할 때 쓸 수 있도록 요청 ID 를 덧붙인다.
 */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.status >= 500 && error.requestId ? `${error.message} (요청 ID: ${error.requestId})` : error.message;
  }
  if (error instanceof Error) return error.message;
  return '알 수 없는 오류가 발생했습니다.';
}
