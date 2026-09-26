import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api';
import { onSessionChange, refreshSession } from '../api/client';
import type { SignupRequest, User } from '../api/types';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (body: SignupRequest) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * 로그인 상태 관리.
 * - 앱 시작 시: refresh token 쿠키로 재발급을 시도해 새로고침 후에도 로그인을 유지한다.
 * - API 호출 중 재발급에 실패하면(로그인 만료) 로그아웃 상태로 바꾸고 로그인 화면으로 보낸다.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    onSessionChange((session) => {
      setUser(session?.user ?? null);
      setStatus(session ? 'authenticated' : 'anonymous');
    });
    refreshSession().then((session) => {
      setUser(session?.user ?? null);
      setStatus(session ? 'authenticated' : 'anonymous');
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const session = await authApi.login(email, password);
    setUser(session.user);
    setStatus('authenticated');
    return session.user;
  }, []);

  const signup = useCallback(
    async (body: SignupRequest) => {
      await authApi.signup(body);
      return login(body.email, body.password); // 가입 후 바로 로그인
    },
    [login],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, isAdmin: user?.role === 'ADMIN', login, signup, logout }),
    [status, user, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth 는 AuthProvider 안에서만 사용할 수 있습니다.');
  return context;
}
