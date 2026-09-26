import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import Alert from './components/Alert';
import { AppProvider, useApp } from './context/AppContext';
import AiSupport from './pages/AiSupport';
import AssetList from './pages/AssetList';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import TicketDetail from './pages/TicketDetail';
import TicketList from './pages/TicketList';
import UserList from './pages/UserList';
import './App.css';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AppProvider>
  );
}

function Layout() {
  const { bootError } = useApp();
  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand">다온 플레이스 IT 헬프데스크</span>
          <nav className="nav">
            <NavLink to="/" end>대시보드</NavLink>
            <NavLink to="/tickets">티켓</NavLink>
            <NavLink to="/assets">자산</NavLink>
            <NavLink to="/ai-support">AI 지원</NavLink>
            <NavLink to="/users">사용자</NavLink>
          </nav>
          <CurrentUserSelect />
        </div>
      </header>
      <main className="container">
        <Alert message={bootError && `초기 데이터를 불러오지 못했습니다: ${bootError}`} />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tickets" element={<TicketList />} />
          <Route path="/tickets/:id" element={<TicketDetail />} />
          <Route path="/assets" element={<AssetList />} />
          <Route path="/ai-support" element={<AiSupport />} />
          <Route path="/users" element={<UserList />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

/** 로그인 기능 전까지 사용하는 "현재 사용자" 전환기. 관리자를 고르면 처리 버튼이 보인다. */
function CurrentUserSelect() {
  const { users, currentUser, setCurrentUserId, label } = useApp();
  if (users.length === 0) return null;
  return (
    <label className="current-user">
      <span className="muted small">현재 사용자</span>
      <select value={currentUser?.id ?? ''} onChange={(e) => setCurrentUserId(Number(e.target.value))}>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} ({label('userRole', u.role)})
          </option>
        ))}
      </select>
    </label>
  );
}
