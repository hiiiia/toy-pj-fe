import { API_BASE_URL, http, setAccessToken, toQuery } from './client';
import type {
  Asset,
  AssetCreateRequest,
  AssetSearchParams,
  ChatResponse,
  Codes,
  DashboardSummary,
  NotificationList,
  PasswordResetResponse,
  PageResponse,
  SignupRequest,
  Ticket,
  TicketAttachment,
  TicketCategory,
  TicketComment,
  TicketCreateRequest,
  TicketDetail,
  TicketPriority,
  TicketSearchParams,
  TicketStatus,
  TokenResponse,
  TriageResult,
  User,
  UserCreateRequest,
} from './types';

/** 백엔드 엔드포인트를 한 곳에 모아 페이지 컴포넌트에서 URL 문자열을 직접 다루지 않게 한다. */

export type SocialProvider = 'google' | 'kakao' | 'naver';

export const authApi = {
  /**
   * SNS 로그인 시작 주소. fetch 가 아니라 페이지 이동(<a href>)으로 열어야 제공자 로그인 화면으로 넘어간다.
   * 로그인이 끝나면 백엔드가 refresh 쿠키를 심고 /oauth/callback 으로 돌려보낸다.
   */
  socialLoginUrl: (provider: SocialProvider) => `${API_BASE_URL}/oauth2/authorization/${provider}`,
  login: async (email: string, password: string) => {
    const session = await http.post<TokenResponse>('/api/auth/login', { email, password });
    setAccessToken(session.accessToken);
    return session;
  },
  signup: (body: SignupRequest) => http.post<User>('/api/auth/signup', body),
  /** 비밀번호 변경: 다른 기기 로그인은 해제되고, 이 기기에는 새 토큰이 발급된다 */
  changePassword: async (currentPassword: string, newPassword: string) => {
    const session = await http.patch<TokenResponse>('/api/auth/password', { currentPassword, newPassword });
    setAccessToken(session.accessToken);
    return session;
  },
  logout: async () => {
    try {
      await http.post<void>('/api/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },
};

export const codeApi = {
  getAll: () => http.get<Codes>('/api/codes'),
};

export const userApi = {
  list: () => http.get<User[]>('/api/users'),
  create: (body: UserCreateRequest) => http.post<User>('/api/users', body),
  resetPassword: (id: number) => http.post<PasswordResetResponse>(`/api/users/${id}/password-reset`),
  unlock: (id: number) => http.post<User>(`/api/users/${id}/unlock`),
};

export const commentApi = {
  list: (ticketId: number) => http.get<TicketComment[]>(`/api/tickets/${ticketId}/comments`),
  create: (ticketId: number, content: string, internal: boolean) =>
    http.post<TicketComment>(`/api/tickets/${ticketId}/comments`, { content, internal }),
  remove: (ticketId: number, commentId: number) => http.delete(`/api/tickets/${ticketId}/comments/${commentId}`),
};

export const attachmentApi = {
  list: (ticketId: number) => http.get<TicketAttachment[]>(`/api/tickets/${ticketId}/attachments`),
  upload: (ticketId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return http.upload<TicketAttachment>(`/api/tickets/${ticketId}/attachments`, form);
  },
  download: (ticketId: number, attachmentId: number) =>
    http.blob(`/api/tickets/${ticketId}/attachments/${attachmentId}`),
  remove: (ticketId: number, attachmentId: number) => http.delete(`/api/tickets/${ticketId}/attachments/${attachmentId}`),
};

export const notificationApi = {
  list: () => http.get<NotificationList>('/api/notifications'),
  markRead: (id: number) => http.post<void>(`/api/notifications/${id}/read`),
  markAllRead: () => http.post<void>('/api/notifications/read-all'),
};

export const assetApi = {
  search: (params: AssetSearchParams) => http.get<PageResponse<Asset>>(`/api/assets${toQuery(params)}`),
  create: (body: AssetCreateRequest) => http.post<Asset>('/api/assets', body),
  assign: (id: number, userId: number) => http.post<Asset>(`/api/assets/${id}/assign`, { userId }),
  returnAsset: (id: number) => http.post<Asset>(`/api/assets/${id}/return`),
  startRepair: (id: number) => http.post<Asset>(`/api/assets/${id}/repair`),
  completeRepair: (id: number) => http.post<Asset>(`/api/assets/${id}/repair/complete`),
  dispose: (id: number) => http.post<Asset>(`/api/assets/${id}/dispose`),
  remove: (id: number) => http.delete(`/api/assets/${id}`),
};

export const ticketApi = {
  search: (params: TicketSearchParams) => http.get<PageResponse<Ticket>>(`/api/tickets${toQuery(params)}`),
  get: (id: number) => http.get<TicketDetail>(`/api/tickets/${id}`),
  create: (body: TicketCreateRequest) => http.post<Ticket>('/api/tickets', body),
  assign: (id: number, assigneeId: number) => http.post<TicketDetail>(`/api/tickets/${id}/assign`, { assigneeId }),
  changeStatus: (id: number, status: TicketStatus, note?: string) =>
    http.patch<TicketDetail>(`/api/tickets/${id}/status`, { status, note }),
  reclassify: (id: number, category: TicketCategory, priority: TicketPriority) =>
    http.patch<TicketDetail>(`/api/tickets/${id}/classification`, { category, priority }),
};

export const dashboardApi = {
  summary: () => http.get<DashboardSummary>('/api/dashboard/summary'),
};

export const aiApi = {
  chat: (message: string) => http.post<ChatResponse>('/api/ai/chat', { message }),
  triage: (title: string, description: string) => http.post<TriageResult>('/api/ai/triage', { title, description }),
};
