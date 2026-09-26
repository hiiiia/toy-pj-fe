import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** 로그인하지 않았으면 로그인 화면으로 보내고, 로그인 후 원래 가려던 화면으로 돌아온다. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <p className="muted empty">로그인 상태를 확인하는 중...</p>;
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
}

/** 관리자 전용 화면. 일반 사용자는 티켓 화면으로 보낸다. (실제 권한 검사는 백엔드가 한다) */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/tickets" replace />;
  return <>{children}</>;
}
