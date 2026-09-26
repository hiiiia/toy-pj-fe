import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AssetList from './pages/AssetList';
import AiSupport from './pages/AiSupport';
import TicketList from './pages/TicketList';
import './App.css';

function App() {
  return (
    <Router>
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <header style={{ marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
          <h1>🏢 다온 플레이스 (Daon Place - TypeScript)</h1>
          <nav style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
            <Link to="/" style={{ textDecoration: 'none', fontWeight: 'bold', color: '#0066cc' }}>대시보드</Link>
            <Link to="/assets" style={{ textDecoration: 'none', fontWeight: 'bold', color: '#0066cc' }}>자산 관리</Link>
            <Link to="/ai-support" style={{ textDecoration: 'none', fontWeight: 'bold', color: '#0066cc' }}>AI IT 지원</Link>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assets" element={<AssetList />} />
          <Route path="/tickets" element={<TicketList />} />
          <Route path="/ai-support" element={<AiSupport />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;