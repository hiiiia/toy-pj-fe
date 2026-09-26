import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { attachmentApi } from '../api';
import { errorMessage } from '../api/client';
import type { TicketAttachment } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { formatFileSize, saveBlob } from '../utils/file';
import { formatDateTime } from '../utils/format';
import Alert from './Alert';

/** 서버 정책과 같은 값. 서버가 최종 검증하고, 화면에서는 큰 파일을 올리기 전에 미리 막는다. */
const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPT = '.png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.log';

interface Props {
  ticketId: number;
  /** 종료·취소된 티켓이면 업로드 불가 */
  readOnly: boolean;
}

export default function TicketAttachments({ ticketId, readOnly }: Props) {
  const { user, isAdmin } = useAuth();
  const [items, setItems] = useState<TicketAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    attachmentApi
      .list(ticketId)
      .then(setItems)
      .catch((e) => setError(errorMessage(e)));
  }, [ticketId]);

  useEffect(load, [load]);

  const onSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일을 다시 선택해도 onChange 가 동작하도록
    if (!file) return;
    if (file.size > MAX_SIZE) {
      setError('파일 크기는 5MB 이하여야 합니다.');
      return;
    }
    setUploading(true);
    try {
      await attachmentApi.upload(ticketId, file);
      setError(null);
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const onDownload = async (item: TicketAttachment) => {
    try {
      saveBlob(await attachmentApi.download(ticketId, item.id), item.filename);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const onDelete = async (item: TicketAttachment) => {
    if (!window.confirm(`'${item.filename}' 파일을 삭제할까요?`)) return;
    try {
      await attachmentApi.remove(ticketId, item.id);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="card">
      <div className="section-header">
        <h3>첨부파일 <span className="muted small">{items.length}/10</span></h3>
        {!readOnly && (
          <>
            <input ref={inputRef} type="file" accept={ACCEPT} onChange={onSelect} hidden aria-label="첨부파일 선택" />
            <button type="button" className="btn btn-sm" disabled={uploading || items.length >= 10} onClick={() => inputRef.current?.click()}>
              {uploading ? '업로드 중...' : '+ 파일 첨부'}
            </button>
          </>
        )}
      </div>
      <Alert message={error} onClose={() => setError(null)} />
      {items.length === 0 ? (
        <p className="muted small">첨부된 파일이 없습니다. {!readOnly && '(스크린샷·로그 파일 등, 5MB 이하)'}</p>
      ) : (
        <ul className="file-list">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" className="link-button" onClick={() => onDownload(item)} title="다운로드">
                {item.filename}
              </button>
              <span className="muted small">
                {formatFileSize(item.size)} · {item.uploaderName} · {formatDateTime(item.createdAt)}
              </span>
              {(isAdmin || item.uploaderId === user?.id) && (
                <button type="button" className="btn btn-sm btn-danger" onClick={() => onDelete(item)}>
                  삭제
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
