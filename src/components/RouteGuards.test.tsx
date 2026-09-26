import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../context/AuthContext';
import { CHANGE_PASSWORD_PATH, RequireAdmin, RequireAuth } from './RouteGuards';

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));

const mockedUseAuth = vi.mocked(useAuth);

function authState(overrides: Partial<ReturnType<typeof useAuth>>): ReturnType<typeof useAuth> {
  return {
    status: 'authenticated',
    user: { id: 1, name: '홍길동', email: 'h@d.e', department: null, role: 'USER', mustChangePassword: false, lockedUntil: null },
    isAdmin: false,
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    changePassword: vi.fn(),
    ...overrides,
  };
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>로그인 화면</p>} />
        <Route path={CHANGE_PASSWORD_PATH} element={<RequireAuth><p>비밀번호 변경 화면</p></RequireAuth>} />
        <Route path="/tickets" element={<RequireAuth><p>티켓 화면</p></RequireAuth>} />
        <Route path="/users" element={<RequireAuth><RequireAdmin><p>사용자 관리</p></RequireAdmin></RequireAuth>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireAuth / RequireAdmin', () => {
  beforeEach(() => mockedUseAuth.mockReset());

  it('로그인 상태 확인 중에는 안내 문구를 보여준다', () => {
    mockedUseAuth.mockReturnValue(authState({ status: 'loading', user: null }));
    renderAt('/tickets');
    expect(screen.getByText('로그인 상태를 확인하는 중...')).toBeInTheDocument();
  });

  it('로그인하지 않았으면 로그인 화면으로 보낸다', () => {
    mockedUseAuth.mockReturnValue(authState({ status: 'anonymous', user: null }));
    renderAt('/tickets');
    expect(screen.getByText('로그인 화면')).toBeInTheDocument();
  });

  it('로그인했으면 요청한 화면을 보여준다', () => {
    mockedUseAuth.mockReturnValue(authState({}));
    renderAt('/tickets');
    expect(screen.getByText('티켓 화면')).toBeInTheDocument();
  });

  it('임시 비밀번호로 로그인했으면 어떤 화면이든 비밀번호 변경 화면으로 보낸다', () => {
    const base = authState({});
    mockedUseAuth.mockReturnValue({ ...base, user: { ...base.user!, mustChangePassword: true } });
    renderAt('/tickets');
    expect(screen.getByText('비밀번호 변경 화면')).toBeInTheDocument();
  });

  it('일반 사용자는 관리자 화면에 들어갈 수 없다', () => {
    mockedUseAuth.mockReturnValue(authState({ isAdmin: false }));
    renderAt('/users');
    expect(screen.getByText('티켓 화면')).toBeInTheDocument();
    expect(screen.queryByText('사용자 관리')).not.toBeInTheDocument();
  });

  it('관리자는 관리자 화면에 들어갈 수 있다', () => {
    mockedUseAuth.mockReturnValue(authState({ isAdmin: true }));
    renderAt('/users');
    expect(screen.getByText('사용자 관리')).toBeInTheDocument();
  });
});
