import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const CHANGE_PASSWORD_PATH = '/account/password';

/**
 * 로그인하지 않았으면 로그인 화면으로 보내고, 로그인 후 원래 가려던 화면으로 돌아온다.
 * 관리자가 초기화한 임시 비밀번호로 로그인했다면 비밀번호를 바꾸기 전까지 변경 화면으로 보낸다.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <p className="muted empty">로그인 상태를 확인하는 중...</p>;
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location }} />;
  if (user?.mustChangePassword && location.pathname !== CHANGE_PASSWORD_PATH) {
    return <Navigate to={CHANGE_PASSWORD_PATH} replace />;
  }
  return <>{children}</>;
}

/** 관리자 전용 화면. 일반 사용자는 티켓 화면으로 보낸다. (실제 권한 검사는 백엔드가 한다) */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/tickets" replace />;
  return <>{children}</>;
}
