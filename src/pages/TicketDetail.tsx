import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ticketApi } from '../api';
import { errorMessage } from '../api/client';
import type { TicketCategory, TicketDetail as TicketDetailData, TicketPriority, TicketStatus } from '../api/types';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import CodeSelect from '../components/CodeSelect';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/format';

/** 상태 변경 버튼 문구 (백엔드가 내려주는 nextStatuses 기준으로 버튼을 그린다) */
function actionLabel(current: TicketStatus, next: TicketStatus): string {
  switch (next) {
    case 'OPEN':
      return '접수대기로 되돌리기';
    case 'IN_PROGRESS':
      return current === 'RESOLVED' ? '재오픈' : '처리 시작';
    case 'RESOLVED':
      return '해결 완료';
    case 'CLOSED':
      return '종료';
    case 'CANCELED':
      return '접수 취소';
  }
}

export default function TicketDetail() {
  const { id } = useParams();
  const ticketId = Number(id);
  const { admins, label } = useApp();
  const { user, isAdmin } = useAuth();
  const [detail, setDetail] = useState<TicketDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [busy, setBusy] = useState(false);

  const apply = useCallback((data: TicketDetailData) => {
    setDetail(data);
    setAssigneeId(data.ticket.assigneeId ? String(data.ticket.assigneeId) : '');
    setCategory(data.ticket.category);
    setPriority(data.ticket.priority);
  }, []);

  useEffect(() => {
    ticketApi
      .get(ticketId)
      .then(apply)
      .catch((e) => setError(errorMessage(e)));
  }, [ticketId, apply]);

  /** 모든 변경 요청 공통 처리: 성공하면 응답으로 화면 갱신, 실패하면 백엔드 메시지(예: T002) 표시 */
  const run = async (action: () => Promise<TicketDetailData>) => {
    setBusy(true);
    try {
      apply(await action());
      setNote('');
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (!detail) {
    return error ? <Alert message={error} /> : <p className="muted">불러오는 중...</p>;
  }

  const { ticket, nextStatuses, histories } = detail;
  const finished = ticket.status === 'CLOSED' || ticket.status === 'CANCELED';
  const isRequester = user?.id === ticket.requesterId;

  return (
    <section>
      <Link to="/tickets" className="back-link">← 티켓 목록</Link>
      <div className="page-header">
        <div>
          <h2>
            #{ticket.id} {ticket.title}
          </h2>
          <div className="badges">
            <Badge group="ticketStatus" code={ticket.status} />
            <Badge group="ticketPriority" code={ticket.priority} />
            <Badge group="ticketCategory" code={ticket.category} />
            <span className="muted small">분류: {label('classificationSource', ticket.classificationSource)}</span>
          </div>
        </div>
      </div>

      <Alert message={error} onClose={() => setError(null)} />

      <div className="detail-layout">
        <div className="card">
          <h3>요청 내용</h3>
          <p className="description">{ticket.description}</p>
          <dl className="meta">
            <dt>요청자</dt>
            <dd>{ticket.requesterName}</dd>
            <dt>담당자</dt>
            <dd>{ticket.assigneeName ?? '미배정'}</dd>
            <dt>관련 자산</dt>
            <dd>{ticket.assetName ?? '-'}</dd>
            <dt>접수 시각</dt>
            <dd>{formatDateTime(ticket.createdAt)}</dd>
            <dt>처리 기한</dt>
            <dd className={ticket.overdue ? 'overdue' : ''}>
              {formatDateTime(ticket.dueAt)} {ticket.overdue && '(SLA 초과)'}
            </dd>
            <dt>해결 시각</dt>
            <dd>{formatDateTime(ticket.resolvedAt)}</dd>
          </dl>
        </div>

        <div className="card">
          <h3>처리</h3>
          {finished ? (
            <p className="muted">종료된 티켓입니다.</p>
          ) : isAdmin ? (
            <div className="actions">
              <label>
                담당자
                <div className="inline">
                  <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                    <option value="">선택</option>
                    {admins.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn"
                    disabled={busy || !assigneeId || Number(assigneeId) === ticket.assigneeId}
                    onClick={() => run(() => ticketApi.assign(ticket.id, Number(assigneeId)))}
                  >
                    지정
                  </button>
                </div>
              </label>

              <label>
                처리 메모 (선택)
                <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="예: 원격 점검 진행, 인증서 재발급" />
              </label>
              <div className="inline wrap">
                {nextStatuses.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`btn ${status === 'CANCELED' ? 'btn-danger' : status === 'OPEN' || (ticket.status === 'RESOLVED' && status === 'IN_PROGRESS') ? '' : 'btn-primary'}`}
                    disabled={busy}
                    onClick={() => run(() => ticketApi.changeStatus(ticket.id, status, note.trim() || undefined))}
                  >
                    {actionLabel(ticket.status, status)}
                  </button>
                ))}
              </div>
              {ticket.status === 'OPEN' && !ticket.assigneeId && <p className="hint">담당자를 지정해야 처리를 시작할 수 있습니다.</p>}

              <label>
                재분류 (처리 기한이 다시 계산됩니다)
                <div className="inline">
                  <CodeSelect group="ticketCategory" value={category} onChange={setCategory} />
                  <CodeSelect group="ticketPriority" value={priority} onChange={setPriority} />
                  <button
                    type="button"
                    className="btn"
                    disabled={busy || (category === ticket.category && priority === ticket.priority)}
                    onClick={() => run(() => ticketApi.reclassify(ticket.id, category as TicketCategory, priority as TicketPriority))}
                  >
                    변경
                  </button>
                </div>
              </label>
            </div>
          ) : isRequester && ticket.status === 'OPEN' ? (
            <div className="actions">
              <p className="muted">접수대기 상태에서는 요청을 취소할 수 있습니다.</p>
              <button type="button" className="btn btn-danger" disabled={busy} onClick={() => run(() => ticketApi.changeStatus(ticket.id, 'CANCELED', '요청자 취소'))}>
                접수 취소
              </button>
            </div>
          ) : (
            <p className="muted">IT 관리자가 확인 후 처리합니다. 진행 상황은 아래 처리 이력에서 볼 수 있어요.</p>
          )}
        </div>
      </div>

      <div className="card">
        <h3>처리 이력</h3>
        <ol className="timeline">
          {histories.map((h) => (
            <li key={h.id}>
              <span className="timeline-time">{formatDateTime(h.createdAt)}</span>
              <span>
                {h.fromStatus && h.fromStatus !== h.toStatus ? (
                  <>
                    <Badge group="ticketStatus" code={h.fromStatus} /> → <Badge group="ticketStatus" code={h.toStatus} />
                  </>
                ) : (
                  <Badge group="ticketStatus" code={h.toStatus} />
                )}
              </span>
              <span className="timeline-note">
                {h.note ?? ''}
                {h.actorName && <span className="muted small"> · {h.actorName}</span>}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
