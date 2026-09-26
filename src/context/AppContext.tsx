import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { codeApi, userApi } from '../api';
import { errorMessage } from '../api/client';
import type { CodeGroup, Codes, User } from '../api/types';
import { useAuth } from './AuthContext';

/**
 * 앱 전역 데이터
 * - codes: 백엔드 enum 코드 → 한글 라벨 (GET /api/codes, 로그인 불필요)
 * - users / admins: 담당자 지정·자산 배정에 쓰는 사용자 목록 (관리자만 조회 가능)
 */
interface AppContextValue {
  codes: Codes | null;
  label: (group: CodeGroup, code: string | null | undefined) => string;
  users: User[];
  admins: User[];
  reloadUsers: () => Promise<void>;
  bootError: string | null;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  const [codes, setCodes] = useState<Codes | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    codeApi
      .getAll()
      .then((data) => {
        setCodes(data);
        setBootError(null);
      })
      .catch((e) => setBootError(errorMessage(e)));
  }, []);

  const reloadUsers = useCallback(async () => {
    setUsers(await userApi.list());
  }, []);

  // 사용자 목록은 관리자 전용 API → 관리자로 로그인했을 때만 불러온다
  useEffect(() => {
    if (isAdmin) {
      reloadUsers().catch((e) => setBootError(errorMessage(e)));
    } else {
      setUsers([]);
    }
  }, [isAdmin, reloadUsers]);

  const value = useMemo<AppContextValue>(() => {
    const labelMap = new Map<string, string>();
    if (codes) {
      (Object.keys(codes) as CodeGroup[]).forEach((group) =>
        codes[group].forEach((item) => labelMap.set(`${group}.${item.code}`, item.label)),
      );
    }
    return {
      codes,
      label: (group, code) => (code ? labelMap.get(`${group}.${code}`) ?? code : '-'),
      users,
      admins: users.filter((u) => u.role === 'ADMIN'),
      reloadUsers,
      bootError,
    };
  }, [codes, users, reloadUsers, bootError]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp 은 AppProvider 안에서만 사용할 수 있습니다.');
  return context;
}
