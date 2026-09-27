import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { useAuth } from '../context/AuthContext';
import LoginPage from './LoginPage';

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));

function CurrentUrl() {
  const location = useLocation();
  return <p>현재 주소: {location.pathname + location.search}</p>;
}

describe('LoginPage', () => {
  it('로그인 후에는 가려던 주소로 검색 조건(query)까지 그대로 돌려보낸다', () => {
    vi.mocked(useAuth).mockReturnValue({
      status: 'authenticated', user: null, isAdmin: false,
      login: vi.fn(), signup: vi.fn(), logout: vi.fn(), changePassword: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: { pathname: '/tickets', search: '?overdue=true', hash: '' } } }]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/tickets" element={<CurrentUrl />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('현재 주소: /tickets?overdue=true')).toBeInTheDocument();
  });

  it('SNS 로그인이 거부되어 돌아오면(?error=AUTH010) 이유를 보여준다', () => {
    vi.mocked(useAuth).mockReturnValue({
      status: 'anonymous', user: null, isAdmin: false,
      login: vi.fn(), signup: vi.fn(), logout: vi.fn(), changePassword: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/login?error=AUTH010']}>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/이미 이메일로 가입된 계정입니다/)).toBeInTheDocument();
  });

  it('SNS 버튼은 백엔드의 OAuth2 시작 주소로 이동하는 링크다 (fetch 가 아니라 페이지 이동)', () => {
    vi.mocked(useAuth).mockReturnValue({
      status: 'anonymous', user: null, isAdmin: false,
      login: vi.fn(), signup: vi.fn(), logout: vi.fn(), changePassword: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Google로 계속하기' })).toHaveAttribute('href', '/oauth2/authorization/google');
    expect(screen.getByRole('link', { name: '카카오로 계속하기' })).toHaveAttribute('href', '/oauth2/authorization/kakao');
    expect(screen.getByRole('link', { name: '네이버로 계속하기' })).toHaveAttribute('href', '/oauth2/authorization/naver');
  });
});
