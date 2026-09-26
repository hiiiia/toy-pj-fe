// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * API 클라이언트의 토큰 처리 로직 테스트.
 * client.ts 는 모듈 안에 access token·재발급 상태를 들고 있으므로, 테스트마다 모듈을 새로 불러와 상태를 초기화한다.
 */
type Client = typeof import('./client');

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

const session = (token: string) => ({
  accessToken: token,
  tokenType: 'Bearer',
  expiresIn: 1800,
  user: { id: 1, name: '홍길동', email: 'hong@daon.example', department: null, role: 'USER', mustChangePassword: false, lockedUntil: null },
});

function authHeader(call: unknown[]): string | undefined {
  const init = call[1] as RequestInit;
  return (init.headers as Record<string, string>).Authorization;
}

let fetchMock: ReturnType<typeof vi.fn>;
let client: Client;

beforeEach(async () => {
  vi.resetModules();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  client = await import('./client');
});

describe('401 응답 시 토큰 자동 재발급', () => {
  it('만료된 토큰으로 401 을 받으면 재발급 후 새 토큰으로 원래 요청을 한 번 재시도한다', async () => {
    client.setAccessToken('expired');
    fetchMock
      .mockResolvedValueOnce(json(401, { code: 'AUTH001', message: '로그인이 필요합니다.' }))
      .mockResolvedValueOnce(json(200, session('fresh')))
      .mockResolvedValueOnce(json(200, { ok: true }));

    const result = await client.http.get<{ ok: boolean }>('/api/tickets');

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe('/api/auth/refresh');
    expect(authHeader(fetchMock.mock.calls[0])).toBe('Bearer expired');
    expect(authHeader(fetchMock.mock.calls[2])).toBe('Bearer fresh');
  });

  it('여러 요청이 동시에 401 을 받아도 재발급 요청은 한 번만 보낸다 (refresh token rotation 보호)', async () => {
    client.setAccessToken('expired');
    let refreshCalls = 0;
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      if (url === '/api/auth/refresh') {
        refreshCalls++;
        await new Promise((r) => setTimeout(r, 10)); // 재발급이 끝나기 전에 다른 요청들도 401 을 받는 상황
        return json(200, session('fresh'));
      }
      const auth = (init.headers as Record<string, string>).Authorization;
      return auth === 'Bearer fresh' ? json(200, { url }) : json(401, { code: 'AUTH001', message: '만료' });
    });

    const results = await Promise.all([
      client.http.get('/api/tickets'),
      client.http.get('/api/assets'),
      client.http.get('/api/dashboard/summary'),
    ]);

    expect(results).toHaveLength(3);
    expect(refreshCalls).toBe(1);
  });

  it('재발급도 실패하면 로그아웃 상태를 알리고 401 에러를 던진다', async () => {
    const listener = vi.fn();
    client.onSessionChange(listener);
    fetchMock
      .mockResolvedValueOnce(json(401, { code: 'AUTH001', message: '로그인이 필요합니다.' }))
      .mockResolvedValueOnce(json(401, { code: 'AUTH003', message: '로그인이 만료되었습니다.' }));

    await expect(client.http.get('/api/tickets')).rejects.toMatchObject({ status: 401, code: 'AUTH001' });
    expect(listener).toHaveBeenCalledWith(null);
    expect(fetchMock).toHaveBeenCalledTimes(2); // 재시도 없음
  });

  it('로그인·재발급 같은 /api/auth 요청은 401 이어도 재발급을 시도하지 않는다 (무한 반복 방지)', async () => {
    fetchMock.mockResolvedValueOnce(json(401, { code: 'AUTH002', message: '이메일 또는 비밀번호가 올바르지 않습니다.' }));

    await expect(client.http.post('/api/auth/login', {})).rejects.toMatchObject({ code: 'AUTH002' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('에러 응답 처리', () => {
  it('필드 검증 오류는 메시지에 필드별 사유를 붙인다', async () => {
    fetchMock.mockResolvedValueOnce(
      json(400, {
        code: 'C001',
        message: '입력값이 올바르지 않습니다.',
        errors: [{ field: 'title', rejectedValue: '', reason: '공백일 수 없습니다' }],
      }),
    );

    const error = (await client.http.post('/api/tickets', {}).catch((e) => e)) as InstanceType<Client['ApiError']>;

    expect(error).toBeInstanceOf(client.ApiError);
    expect(error.message).toBe('입력값이 올바르지 않습니다. (title: 공백일 수 없습니다)');
    expect(error.fieldErrors).toHaveLength(1);
  });

  it('서버 오류(5xx)는 문의용 요청 ID 를 함께 보여준다', async () => {
    fetchMock.mockResolvedValueOnce(
      json(500, { code: 'C999', message: '서버 내부 오류가 발생했습니다.', requestId: 'abc123' }),
    );

    const error = await client.http.get('/api/tickets').catch((e) => e);

    expect(client.errorMessage(error)).toBe('서버 내부 오류가 발생했습니다. (요청 ID: abc123)');
  });

  it('서버에 연결할 수 없으면 NETWORK 에러로 안내한다', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(client.http.get('/api/tickets')).rejects.toMatchObject({ code: 'NETWORK' });
  });
});

describe('요청 형식', () => {
  it('파일 업로드(FormData)는 Content-Type 을 직접 지정하지 않는다 (브라우저가 boundary 포함해 설정)', async () => {
    fetchMock.mockResolvedValueOnce(json(201, { id: 1 }));
    const form = new FormData();
    form.append('file', new Blob(['hello']), 'a.txt');

    await client.http.upload('/api/tickets/1/attachments', form);

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)['Content-Type']).toBeUndefined();
    expect(init.body).toBe(form);
  });

  it('toQuery 는 비어 있는 값을 제외한다', () => {
    expect(client.toQuery({ status: 'OPEN', keyword: '', page: 0, assigneeId: undefined, unassigned: null })).toBe(
      '?status=OPEN&page=0',
    );
    expect(client.toQuery({})).toBe('');
  });
});
