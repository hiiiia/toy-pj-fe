import { http, toQuery } from './client';
import type {
  Asset,
  AssetCreateRequest,
  AssetSearchParams,
  ChatResponse,
  Codes,
  DashboardSummary,
  PageResponse,
  Ticket,
  TicketCategory,
  TicketCreateRequest,
  TicketDetail,
  TicketPriority,
  TicketSearchParams,
  TicketStatus,
  TriageResult,
  User,
  UserCreateRequest,
} from './types';

/** 백엔드 엔드포인트를 한 곳에 모아 페이지 컴포넌트에서 URL 문자열을 직접 다루지 않게 한다. */

export const codeApi = {
  getAll: () => http.get<Codes>('/api/codes'),
};

export const userApi = {
  list: () => http.get<User[]>('/api/users'),
  create: (body: UserCreateRequest) => http.post<User>('/api/users', body),
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
