import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

interface DashboardStats {
  totalAssets: number;
  inUseAssets: number;
  totalTickets: number;
  pendingTickets: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAssets: 0,
    inUseAssets: 0,
    totalTickets: 0,
    pendingTickets: 0,
  });

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/dashboard/stats`)
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error('대시보드 통계 조회 에러:', err));
  }, []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#ffffff', color: '#333333', borderRadius: '8px' }}>
      <h2>📊 IT 통합 운영 대시보드</h2>
      <p style={{ color: '#555555' }}>사내 IT 자산 현황 및 미처리 장애 티켓 실시간 가시성을 제공합니다.</p>

      {/* 통계 요약 카드 영역 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginTop: '20px' }}>

        <div style={{ background: '#f0f5ff', border: '1px solid #adc6ff', padding: '15px', borderRadius: '8px' }}>
          <span style={{ fontSize: '13px', color: '#2f54eb', fontWeight: 'bold' }}>💻 총 IT 자산</span>
          <h1 style={{ margin: '10px 0 0 0', color: '#1d39c4' }}>{stats.totalAssets}개</h1>
        </div>

        <div style={{ background: '#e6f7ff', border: '1px solid #91d5ff', padding: '15px', borderRadius: '8px' }}>
          <span style={{ fontSize: '13px', color: '#1890ff', fontWeight: 'bold' }}>🟢 사용 중인 자산</span>
          <h1 style={{ margin: '10px 0 0 0', color: '#096dd9' }}>{stats.inUseAssets}개</h1>
        </div>

        <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', padding: '15px', borderRadius: '8px' }}>
          <span style={{ fontSize: '13px', color: '#52c41a', fontWeight: 'bold' }}>🎫 전체 누적 티켓</span>
          <h1 style={{ margin: '10px 0 0 0', color: '#389e0d' }}>{stats.totalTickets}건</h1>
        </div>

        <div style={{ background: '#fff2e8', border: '1px solid #ffbb96', padding: '15px', borderRadius: '8px' }}>
          <span style={{ fontSize: '13px', color: '#fa541c', fontWeight: 'bold' }}>🚨 미처리 접수대기</span>
          <h1 style={{ margin: '10px 0 0 0', color: '#d4380d' }}>{stats.pendingTickets}건</h1>
        </div>

      </div>

      {/* 안내 박스 */}
      <div style={{ marginTop: '30px', padding: '15px', background: '#f9f9f9', borderRadius: '6px', border: '1px solid #eee' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>💡 시스템 요약</h4>
        <p style={{ margin: 0, fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
          자산 등록/상태 변경 및 지원 티켓 추가 시 대시보드 데이터가 실시간으로 연동되어 업데이트됩니다.
        </p>
      </div>
    </div>
  );
}