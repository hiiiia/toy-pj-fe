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
  requestId?: string;
  timestamp: string;
}

// ===== User =====
export interface User {
  id: number;
  name: string;
  email: string;
  department: string | null;
  role: UserRole;
  /** 관리자가 초기화한 임시 비밀번호로 로그인한 상태 → 비밀번호 변경 화면으로 안내 */
  mustChangePassword: boolean;
  /** 로그인 잠금 해제 시각 (잠기지 않았으면 null) */
  lockedUntil: string | null;
}

export interface PasswordResetResponse {
  userId: number;
  temporaryPassword: string;
}

export interface UserCreateRequest {
  name: string;
  email: string;
  password: string;
  department?: string;
  role: UserRole;
}

// ===== Auth =====
export interface TokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: User;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  department?: string;
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
  actorName: string | null;
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
  assetId?: number;
}

export interface TicketSearchParams {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  requesterId?: number;
  assigneeId?: number;
  unassigned?: boolean;
  /** 미완료(접수대기·처리중)만 */
  active?: boolean;
  /** 처리 기한이 지난 미완료 티켓만 */
  overdue?: boolean;
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

// ===== Comment / Attachment =====
export interface TicketComment {
  id: number;
  authorId: number;
  authorName: string;
  authorRole: UserRole;
  content: string;
  /** IT 관리자에게만 보이는 내부 메모 */
  internal: boolean;
  createdAt: string;
}

export interface TicketAttachment {
  id: number;
  filename: string;
  contentType: string;
  size: number;
  uploaderId: number;
  uploaderName: string;
  createdAt: string;
}

// ===== Notification =====
export type NotificationType = 'TICKET_ASSIGNED' | 'COMMENT_ADDED' | 'SLA_WARNING' | 'SLA_BREACHED';

export interface AppNotification {
  id: number;
  type: NotificationType;
  message: string;
  ticketId: number | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationList {
  unreadCount: number;
  items: AppNotification[];
}
