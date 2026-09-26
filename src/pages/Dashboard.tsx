import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api';
import { errorMessage } from '../api/client';
import type { AssetStatus, DashboardSummary, TicketPriority, TicketStatus } from '../api/types';
import Alert from '../components/Alert';
import { useApp } from '../context/AppContext';

const TICKET_STATUSES: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELED'];
const PRIORITIES: TicketPriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];
const ASSET_STATUSES: AssetStatus[] = ['AVAILABLE', 'IN_USE', 'REPAIR', 'DISPOSED'];

export default function Dashboard() {
  const { label } = useApp();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardApi
      .summary()
      .then(setSummary)
      .catch((e) => setError(errorMessage(e)));
  }, []);

  if (error) return <Alert message={error} />;
  if (!summary) return <p className="muted">불러오는 중...</p>;

  const { tickets, assets } = summary;
  const active = tickets.byStatus.OPEN + tickets.byStatus.IN_PROGRESS;

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>IT 운영 대시보드</h2>
          <p className="muted">처리해야 할 티켓과 자산 현황을 한눈에 확인합니다.</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard title="처리 대기·진행중 티켓" value={active} unit="건" to="/tickets?active=true" />
        <StatCard title="담당자 미배정" value={tickets.unassigned} unit="건" to="/tickets?unassigned=true&status=OPEN" tone="warn" />
        <StatCard
          title="처리 기한(SLA) 초과"
          value={tickets.overdue}
          unit="건"
          to="/tickets?overdue=true"
          tone={tickets.overdue > 0 ? 'danger' : undefined}
        />
        <StatCard title="사용중 자산" value={assets.byStatus.IN_USE} unit={`/ ${assets.total}대`} to="/assets?status=IN_USE" />
      </div>

      <div className="grid-3">
        <div className="card">
          <h3>티켓 상태별</h3>
          <BarList
            total={tickets.total}
            rows={TICKET_STATUSES.map((s) => ({ key: s, label: label('ticketStatus', s), value: tickets.byStatus[s], to: `/tickets?status=${s}` }))}
          />
        </div>
        <div className="card">
          <h3>진행중 티켓 우선순위</h3>
          <BarList
            total={active}
            rows={PRIORITIES.map((p) => ({ key: p, label: label('ticketPriority', p), value: tickets.activeByPriority[p], to: `/tickets?priority=${p}` }))}
          />
        </div>
        <div className="card">
          <h3>자산 상태별</h3>
          <BarList
            total={assets.total}
            rows={ASSET_STATUSES.map((s) => ({ key: s, label: label('assetStatus', s), value: assets.byStatus[s], to: `/assets?status=${s}` }))}
          />
        </div>
      </div>
    </section>
  );
}

function StatCard(props: { title: string; value: number; unit: string; to?: string; tone?: 'warn' | 'danger' }) {
  const body = (
    <>
      <span className="stat-title">{props.title}</span>
      <strong className="stat-value">
        {props.value}
        <small> {props.unit}</small>
      </strong>
    </>
  );
  const className = `stat-card ${props.tone ? `stat-${props.tone}` : ''}`;
  return props.to ? (
    <Link to={props.to} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

function BarList({ rows, total }: { rows: { key: string; label: string; value: number; to: string }[]; total: number }) {
  return (
    <ul className="bar-list">
      {rows.map((row) => (
        <li key={row.key}>
          <Link to={row.to} className="bar-row">
            <span className="bar-label">{row.label}</span>
            <span className="bar-track">
              <span className="bar-fill" style={{ width: total > 0 ? `${(row.value / total) * 100}%` : 0 }} />
            </span>
            <span className="bar-value">{row.value}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
