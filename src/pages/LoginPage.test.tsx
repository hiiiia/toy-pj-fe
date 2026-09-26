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
});
