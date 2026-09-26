import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { notificationApi } from '../api';
import type { AppNotification, NotificationList } from '../api/types';
import { formatDateTime } from '../utils/format';

/** 새 알림 확인 주기. 실시간이 꼭 필요해지면 SSE/WebSocket 으로 바꿀 수 있다. */
const POLL_INTERVAL_MS = 60_000;

const TYPE_LABEL: Record<AppNotification['type'], string> = {
  TICKET_ASSIGNED: '배정',
  COMMENT_ADDED: '댓글',
  SLA_WARNING: '기한 임박',
  SLA_BREACHED: '기한 초과',
};

export default function NotificationBell() {
  const [data, setData] = useState<NotificationList>({ unreadCount: 0, items: [] });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const load = useCallback(() => {
    notificationApi
      .list()
      .then(setData)
      .catch(() => {
        /* 알림 조회 실패는 화면 사용을 막지 않도록 조용히 무시 */
      });
  }, []);

  // 처음, 화면을 이동할 때, 그리고 주기적으로 새 알림을 확인한다
  useEffect(load, [load, location.pathname]);
  useEffect(() => {
    const timer = window.setInterval(load, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  // 바깥을 클릭하면 닫기
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const onSelect = async (item: AppNotification) => {
    setOpen(false);
    if (!item.read) {
      await notificationApi.markRead(item.id).catch(() => undefined);
      load();
    }
    if (item.ticketId) navigate(`/tickets/${item.ticketId}`);
  };

  const onReadAll = async () => {
    await notificationApi.markAllRead().catch(() => undefined);
    load();
  };

  return (
    <div className="bell" ref={ref}>
      <button
        type="button"
        className="btn btn-sm bell-button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`알림 ${data.unreadCount}개`}
        aria-expanded={open}
      >
        알림
        {data.unreadCount > 0 && <span className="bell-count">{data.unreadCount > 99 ? '99+' : data.unreadCount}</span>}
      </button>
      {open && (
        <div className="bell-panel" role="menu">
          <div className="bell-header">
            <strong>알림</strong>
            {data.unreadCount > 0 && (
              <button type="button" className="link-button small" onClick={onReadAll}>
                모두 읽음
              </button>
            )}
          </div>
          {data.items.length === 0 ? (
            <p className="muted small empty">새 알림이 없습니다.</p>
          ) : (
            <ul>
              {data.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    role="menuitem"
                    className={`bell-item ${item.read ? 'read' : ''} type-${item.type}`}
                    onClick={() => onSelect(item)}
                  >
                    <span className="bell-type">{TYPE_LABEL[item.type]}</span>
                    <span className="bell-message">{item.message}</span>
                    <span className="muted small">{formatDateTime(item.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
