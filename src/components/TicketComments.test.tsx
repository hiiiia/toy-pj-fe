import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { commentApi } from '../api';
import type { TicketComment } from '../api/types';
import { useAuth } from '../context/AuthContext';
import TicketComments from './TicketComments';

vi.mock('../api', () => ({ commentApi: { list: vi.fn(), create: vi.fn(), remove: vi.fn() } }));
vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../context/AppContext', () => ({ useApp: () => ({ label: (_: string, code: string) => code }) }));

const comments: TicketComment[] = [
  { id: 1, authorId: 1, authorName: '홍길동', authorRole: 'USER', content: '오전부터 안 돼요', internal: false, createdAt: '2026-09-23T10:00:00' },
  { id: 2, authorId: 9, authorName: '김관리', authorRole: 'ADMIN', content: '케이블 교체 예정', internal: true, createdAt: '2026-09-23T10:05:00' },
];

function loginAs(isAdmin: boolean, userId: number) {
  vi.mocked(useAuth).mockReturnValue({
    status: 'authenticated',
    user: { id: userId, name: 'x', email: 'x', department: null, role: isAdmin ? 'ADMIN' : 'USER', mustChangePassword: false, lockedUntil: null },
    isAdmin,
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    changePassword: vi.fn(),
  });
}

describe('티켓 댓글', () => {
  beforeEach(() => {
    vi.mocked(commentApi.list).mockResolvedValue(comments);
    vi.mocked(commentApi.create).mockResolvedValue(comments[0]);
  });

  it('댓글 목록과 내부 메모 표시, 본인 댓글에만 삭제 버튼이 보인다', async () => {
    loginAs(false, 1);
    render(<TicketComments ticketId={3} readOnly={false} />);

    expect(await screen.findByText('오전부터 안 돼요')).toBeInTheDocument();
    expect(screen.getByText('내부 메모')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '삭제' })).toHaveLength(1);
  });

  it('일반 사용자에게는 내부 메모 옵션이 없다', async () => {
    loginAs(false, 1);
    render(<TicketComments ticketId={3} readOnly={false} />);
    await screen.findByText('오전부터 안 돼요');

    expect(screen.queryByLabelText(/내부 메모/)).not.toBeInTheDocument();
  });

  it('관리자는 내부 메모로 작성할 수 있다', async () => {
    loginAs(true, 9);
    render(<TicketComments ticketId={3} readOnly={false} />);
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('댓글 내용'), '  확인 중  ');
    await user.click(screen.getByLabelText(/내부 메모/));
    await user.click(screen.getByRole('button', { name: '댓글 등록' }));

    await waitFor(() => expect(commentApi.create).toHaveBeenCalledWith(3, '확인 중', true));
  });

  it('종료된 티켓에서는 작성 폼 대신 안내 문구를 보여준다', async () => {
    loginAs(true, 9);
    render(<TicketComments ticketId={3} readOnly />);
    await screen.findByText('오전부터 안 돼요');

    expect(screen.queryByLabelText('댓글 내용')).not.toBeInTheDocument();
    expect(screen.getByText('종료된 티켓에는 댓글을 남길 수 없습니다.')).toBeInTheDocument();
  });
});
