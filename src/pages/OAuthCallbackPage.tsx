import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { clearSocialReturnPath, peekSocialReturnPath } from '../utils/socialLogin';

/**
 * SNS 로그인이 끝나면 백엔드가 돌려보내는 페이지 (/oauth/callback).
 *
 * 백엔드는 refresh token 을 HttpOnly 쿠키로만 심어 두고 access token 은 주지 않는다.
 * 이 페이지는 전체 새로고침으로 열리므로, 앱 시작 시의 재발급(AuthProvider → /api/auth/refresh)으로 자연스럽게 로그인 상태가 된다.
 * access token 을 URL(?token=...)로 받지 않는 이유: 주소는 방문 기록·서버 로그·Referer 헤더에 그대로 남는다.
 */
export default function OAuthCallbackPage() {
  const { status } = useAuth();
  // 렌더링 중에는 읽기만 하고(StrictMode 에서 두 번 그려져도 같은 값), 지우는 것은 이동이 결정된 뒤에 한다.
  const [returnPath] = useState(peekSocialReturnPath);

  useEffect(() => {
    if (status !== 'loading') clearSocialReturnPath();
  }, [status]);

  if (status === 'loading') return <p className="muted empty">SNS 로그인 처리 중...</p>;
  // 쿠키가 없거나 만료됨 → 로그인 실패로 안내
  if (status === 'anonymous') return <Navigate to="/login?error=AUTH011" replace />;
  return <Navigate to={returnPath} replace />;
}
