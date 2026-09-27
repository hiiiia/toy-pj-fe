import { BrowserRouter, Link, Navigate, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import Alert from './components/Alert';
import NotificationBell from './components/NotificationBell';
import { CHANGE_PASSWORD_PATH, RequireAdmin, RequireAuth } from './components/RouteGuards';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import AiSupport from './pages/AiSupport';
import AssetList from './pages/AssetList';
import ChangePasswordPage from './pages/ChangePasswordPage';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import NotFound from './pages/NotFound';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import SignupPage from './pages/SignupPage';
import TicketDetail from './pages/TicketDetail';
import TicketList from './pages/TicketList';
import UserList from './pages/UserList';
import './App.css';

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
            <Route
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route index element={<Home />} />
              <Route path="/tickets" element={<TicketList />} />
              <Route path="/tickets/:id" element={<TicketDetail />} />
              <Route path="/assets" element={<AssetList />} />
              <Route path="/ai-support" element={<AiSupport />} />
              <Route path="/users" element={<RequireAdmin><UserList /></RequireAdmin>} />
              <Route path={CHANGE_PASSWORD_PATH} element={<ChangePasswordPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}

/** 첫 화면: 관리자는 대시보드, 일반 사용자는 내 티켓 */
function Home() {
  const { isAdmin } = useAuth();
  return isAdmin ? <Dashboard /> : <Navigate to="/tickets" replace />;
}

function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const { bootError, label } = useApp();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand">다온 플레이스 IT 헬프데스크</span>
          <nav className="nav">
            {isAdmin ? (
              <>
                <NavLink to="/" end>대시보드</NavLink>
                <NavLink to="/tickets">티켓</NavLink>
                <NavLink to="/assets">자산</NavLink>
                <NavLink to="/ai-support">AI 지원</NavLink>
                <NavLink to="/users">사용자</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/tickets">내 티켓</NavLink>
                <NavLink to="/assets">내 자산</NavLink>
                <NavLink to="/ai-support">AI 지원</NavLink>
              </>
            )}
          </nav>
          <div className="current-user">
            {/* 임시 비밀번호 상태에서는 서버가 알림 API 를 막으므로(403) 비밀번호를 바꾼 뒤에만 표시 */}
            {!user?.mustChangePassword && <NotificationBell />}
            <Link to={CHANGE_PASSWORD_PATH} className="user-link" title="비밀번호 변경">
              {user?.name} <span className="muted small">({label('userRole', user?.role)})</span>
            </Link>
            <button type="button" className="btn btn-sm" onClick={onLogout}>
              로그아웃
            </button>
          </div>
        </div>
      </header>
      <main className="container">
        <Alert message={bootError && `초기 데이터를 불러오지 못했습니다: ${bootError}`} />
        <Outlet />
      </main>
    </div>
  );
}
