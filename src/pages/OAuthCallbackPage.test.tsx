import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../context/AuthContext';
import { clearSocialReturnPath, peekSocialReturnPath, saveSocialReturnPath } from '../utils/socialLogin';
import OAuthCallbackPage from './OAuthCallbackPage';

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));

function CurrentUrl() {
  const location = useLocation();
  return <p>현재 주소: {location.pathname + location.search}</p>;
}

function renderCallback(status: 'loading' | 'authenticated' | 'anonymous') {
  vi.mocked(useAuth).mockReturnValue({
    status, user: null, isAdmin: false,
    login: vi.fn(), signup: vi.fn(), logout: vi.fn(), changePassword: vi.fn(),
  });
  render(
    <MemoryRouter initialEntries={['/oauth/callback']}>
      <Routes>
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route path="*" element={<CurrentUrl />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('OAuthCallbackPage', () => {
  afterEach(() => clearSocialReturnPath());

  it('쿠키로 재발급을 확인하는 동안에는 처리 중 문구를 보여준다', () => {
    renderCallback('loading');
    expect(screen.getByText('SNS 로그인 처리 중...')).toBeInTheDocument();
  });

  it('로그인되면 SNS 로그인 전에 가려던 주소로 보내고, 저장해 둔 주소는 지운다', () => {
    saveSocialReturnPath('/tickets?overdue=true');
    renderCallback('authenticated');

    expect(screen.getByText('현재 주소: /tickets?overdue=true')).toBeInTheDocument();
    expect(peekSocialReturnPath()).toBe('/');
  });

  it('저장된 주소가 없으면 홈으로 간다', () => {
    renderCallback('authenticated');
    expect(screen.getByText('현재 주소: /')).toBeInTheDocument();
  });

  it('재발급에 실패하면(쿠키 없음) 로그인 화면에 실패 코드를 붙여 보낸다', () => {
    renderCallback('anonymous');
    expect(screen.getByText('현재 주소: /login?error=AUTH011')).toBeInTheDocument();
  });
});
