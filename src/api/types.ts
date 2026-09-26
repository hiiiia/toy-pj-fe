/**
 * 백엔드(toy-pj) DTO 와 1:1 로 대응하는 타입 정의.
 * 백엔드 응답 형태가 바뀌면 이 파일만 고치면 컴파일 에러로 영향 범위를 바로 확인할 수 있다.
 */

// ===== 공통 코드 (백엔드 enum) =====
export type UserRole = 'USER' | 'ADMIN';
export type AssetType = 'LAPTOP' | 'DESKTOP' | 'MONITOR' | 'MOBILE' | 'SOFTWARE' | 'ETC';
export type AssetStatus = 'AVAILABLE' | 'IN_USE' | 'REPAIR' | 'DISPOSED';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketCategory = 'HARDWARE' | 'SOFTWARE' | 'NETWORK' | 'ACCOUNT' | 'ETC';
export type ClassificationSource = 'MANUAL' | 'AI' | 'RULE';

export interface CodeItem {
  code: string;
  label: string;
}

export type CodeGroup =
  | 'ticketStatus'
  | 'ticketPriority'
  | 'ticketCategory'
  | 'classificationSource'
  | 'assetStatus'
  | 'assetType'
  | 'userRole';

export type Codes = Record<CodeGroup, CodeItem[]>;

// ===== 공통 응답 =====
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface FieldError {
  field: string;
  rejectedValue: unknown;
  reason: string;
}

export interface ErrorResponse {
  code: string;
  message: string;
  status: number;
  errors?: FieldError[];
  timestamp: string;
}

// ===== User =====
export interface User {
  id: number;
  name: string;
  email: string;
  department: string | null;
  role: UserRole;
}

export interface UserCreateRequest {
  name: string;
  email: string;
  department?: string;
  role: UserRole;
}

// ===== Asset =====
export interface Asset {
  id: number;
  name: string;
  type: AssetType;
  serialNumber: string;
  status: AssetStatus;
  assignedUserId: number | null;
  assignedUserName: string | null;
  purchasedAt: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssetCreateRequest {
  name: string;
  type: AssetType;
  serialNumber: string;
  purchasedAt?: string;
  memo?: string;
}

export interface AssetSearchParams {
  status?: AssetStatus;
  type?: AssetType;
  assignedUserId?: number;
  keyword?: string;
  page?: number;
  size?: number;
}

// ===== Ticket =====
export interface Ticket {
  id: number;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  classificationSource: ClassificationSource;
  status: TicketStatus;
  requesterId: number;
  requesterName: string;
  assigneeId: number | null;
  assigneeName: string | null;
  assetId: number | null;
  assetName: string | null;
  dueAt: string;
  overdue: boolean;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketHistory {
  id: number;
  fromStatus: TicketStatus | null;
  toStatus: TicketStatus;
  note: string | null;
  createdAt: string;
}

export interface TicketDetail {
  ticket: Ticket;
  nextStatuses: TicketStatus[];
  histories: TicketHistory[];
}

export interface TicketCreateRequest {
  title: string;
  description: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  requesterId: number;
  assetId?: number;
}

export interface TicketSearchParams {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  requesterId?: number;
  assigneeId?: number;
  unassigned?: boolean;
  keyword?: string;
  page?: number;
  size?: number;
}

// ===== Dashboard =====
export interface DashboardSummary {
  tickets: {
    total: number;
    byStatus: Record<TicketStatus, number>;
    activeByPriority: Record<TicketPriority, number>;
    unassigned: number;
    overdue: number;
  };
  assets: {
    total: number;
    byStatus: Record<AssetStatus, number>;
  };
}

// ===== AI =====
export interface TriageResult {
  category: TicketCategory;
  priority: TicketPriority;
  source: ClassificationSource;
  reason: string | null;
}

export interface ChatResponse {
  answer: string;
}
