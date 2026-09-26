import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { codeApi, userApi } from '../api';
import { errorMessage } from '../api/client';
import type { CodeGroup, Codes, User } from '../api/types';

/**
 * 앱 전역 상태
 * - codes: 백엔드 enum 코드 → 한글 라벨 (GET /api/codes)
 * - users / currentUser: 로그인 기능이 아직 없으므로, 화면 상단에서 "현재 사용자"를 선택해
 *   티켓 요청자(requesterId)와 관리자 권한 버튼 노출 여부를 결정한다.
 */
interface AppContextValue {
  codes: Codes | null;
  label: (group: CodeGroup, code: string | null | undefined) => string;
  users: User[];
  admins: User[];
  currentUser: User | null;
  setCurrentUserId: (id: number) => void;
  reloadUsers: () => Promise<void>;
  bootError: string | null;
}

const AppContext = createContext<AppContextValue | null>(null);
const CURRENT_USER_KEY = 'yh-fe.currentUserId';

function readStoredUserId(): number | null {
  try {
    const value = localStorage.getItem(CURRENT_USER_KEY);
    return value ? Number(value) : null;
  } catch {
    return null;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [codes, setCodes] = useState<Codes | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserIdState] = useState<number | null>(readStoredUserId);
  const [bootError, setBootError] = useState<string | null>(null);

  const reloadUsers = useCallback(async () => {
    const list = await userApi.list();
    setUsers(list);
  }, []);

  useEffect(() => {
    Promise.all([codeApi.getAll(), userApi.list()])
      .then(([codeData, userList]) => {
        setCodes(codeData);
        setUsers(userList);
        setBootError(null);
      })
      .catch((e) => setBootError(errorMessage(e)));
  }, []);

  const setCurrentUserId = useCallback((id: number) => {
    setCurrentUserIdState(id);
    try {
      localStorage.setItem(CURRENT_USER_KEY, String(id));
    } catch {
      // 저장소를 쓸 수 없는 환경이면 새로고침 시 기본값으로 돌아간다.
    }
  }, []);

  const value = useMemo<AppContextValue>(() => {
    const labelMap = new Map<string, string>();
    if (codes) {
      (Object.keys(codes) as CodeGroup[]).forEach((group) =>
        codes[group].forEach((item) => labelMap.set(`${group}.${item.code}`, item.label)),
      );
    }
    // 저장된 사용자가 없거나 삭제되었으면 첫 번째 사용자를 기본값으로 사용
    const currentUser = users.find((u) => u.id === currentUserId) ?? users[0] ?? null;
    return {
      codes,
      label: (group, code) => (code ? labelMap.get(`${group}.${code}`) ?? code : '-'),
      users,
      admins: users.filter((u) => u.role === 'ADMIN'),
      currentUser,
      setCurrentUserId,
      reloadUsers,
      bootError,
    };
  }, [codes, users, currentUserId, setCurrentUserId, reloadUsers, bootError]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp 은 AppProvider 안에서만 사용할 수 있습니다.');
  return context;
}
