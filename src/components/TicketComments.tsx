import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { commentApi } from '../api';
import { errorMessage } from '../api/client';
import type { TicketComment } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/format';
import Alert from './Alert';
import Badge from './Badge';

interface Props {
  ticketId: number;
  /** 종료·취소된 티켓이면 작성 불가 */
  readOnly: boolean;
}

export default function TicketComments({ ticketId, readOnly }: Props) {
  const { user, isAdmin } = useAuth();
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [content, setContent] = useState('');
  const [internal, setInternal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    commentApi
      .list(ticketId)
      .then(setComments)
      .catch((e) => setError(errorMessage(e)));
  }, [ticketId]);

  useEffect(load, [load]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await commentApi.create(ticketId, content.trim(), internal);
      setContent('');
      setInternal(false);
      setError(null);
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (comment: TicketComment) => {
    if (!window.confirm('댓글을 삭제할까요?')) return;
    try {
      await commentApi.remove(ticketId, comment.id);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="card">
      <h3>댓글 <span className="muted small">{comments.length}</span></h3>
      <Alert message={error} onClose={() => setError(null)} />
      {comments.length === 0 && <p className="muted small">아직 댓글이 없습니다.</p>}
      <ul className="comment-list">
        {comments.map((c) => (
          <li key={c.id} className={c.internal ? 'comment internal' : 'comment'}>
            <div className="comment-meta">
              <strong>{c.authorName}</strong>
              <Badge group="userRole" code={c.authorRole} />
              {c.internal && <span className="badge badge-internal">내부 메모</span>}
              <span className="muted small">{formatDateTime(c.createdAt)}</span>
              {c.authorId === user?.id && (
                <button type="button" className="link-button danger small" onClick={() => onDelete(c)}>
                  삭제
                </button>
              )}
            </div>
            <p className="comment-body">{c.content}</p>
          </li>
        ))}
      </ul>

      {readOnly ? (
        <p className="muted small">종료된 티켓에는 댓글을 남길 수 없습니다.</p>
      ) : (
        <form onSubmit={onSubmit} className="comment-form">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder={isAdmin ? '요청자에게 안내하거나, 내부 메모를 남기세요.' : '추가 정보나 문의 내용을 남기세요.'}
            aria-label="댓글 내용"
          />
          <div className="form-actions">
            {isAdmin && (
              <label className="checkbox">
                <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
                내부 메모 (요청자에게 보이지 않음)
              </label>
            )}
            <button type="submit" className="btn btn-primary" disabled={submitting || !content.trim()}>
              {submitting ? '등록 중...' : '댓글 등록'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
