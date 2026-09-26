import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { aiApi, assetApi, ticketApi } from '../api';
import { errorMessage } from '../api/client';
import type {
  Asset,
  PageResponse,
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketSearchParams,
  TicketStatus,
  TriageResult,
} from '../api/types';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import CodeSelect from '../components/CodeSelect';
import Pagination from '../components/Pagination';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/format';

/** AI 지원 화면에서 "티켓으로 접수"를 누르면 넘어오는 초기값 */
export interface TicketDraft {
  title: string;
  description: string;
}

/** 검색 조건을 URL 쿼리에 저장 → 대시보드 링크, 새로고침, 뒤로가기에서도 조건이 유지된다. */
function readParams(sp: URLSearchParams): TicketSearchParams {
  return {
    status: (sp.get('status') as TicketStatus) || undefined,
    priority: (sp.get('priority') as TicketPriority) || undefined,
    category: (sp.get('category') as TicketCategory) || undefined,
    requesterId: sp.get('requesterId') ? Number(sp.get('requesterId')) : undefined,
    assigneeId: sp.get('assigneeId') ? Number(sp.get('assigneeId')) : undefined,
    unassigned: sp.get('unassigned') === 'true' || undefined,
    active: sp.get('active') === 'true' || undefined,
    overdue: sp.get('overdue') === 'true' || undefined,
    keyword: sp.get('keyword') || undefined,
    page: sp.get('page') ? Number(sp.get('page')) : 0,
    size: 10,
  };
}

export default function TicketList() {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const draft = (location.state as { draft?: TicketDraft } | null)?.draft;

  const [searchParams, setSearchParams] = useSearchParams();
  const params = readParams(searchParams);
  const [keyword, setKeyword] = useState(params.keyword ?? '');
  const [page, setPage] = useState<PageResponse<Ticket> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(Boolean(draft));

  const queryKey = searchParams.toString();
  const load = useCallback(() => {
    ticketApi
      .search(readParams(new URLSearchParams(queryKey)))
      .then((data) => {
        setPage(data);
        setError(null);
      })
      .catch((e) => setError(errorMessage(e)));
  }, [queryKey]);

  useEffect(load, [load]);

  const updateParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page'); // 조건이 바뀌면 첫 페이지로
    setSearchParams(next);
  };

  const goPage = (p: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    setSearchParams(next);
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    updateParam('keyword', keyword.trim() || undefined);
  };

  const assignedToMe = user != null && params.assigneeId === user.id;

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>{isAdmin ? 'IT 지원 티켓' : '내 티켓'}</h2>
          <p className="muted">
            {isAdmin ? '접수된 장애·요청을 배정하고 처리합니다.' : '장애 신고와 IT 요청을 접수하고 처리 현황을 확인합니다.'}
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? '접수 닫기' : '+ 티켓 접수'}
        </button>
      </div>

      {showForm && (
        <TicketCreateForm
          key={draft?.title ?? 'new'}
          draft={draft}
          onCreated={() => setShowForm(false)}
        />
      )}

      <div className="card filters">
        <CodeSelect group="ticketStatus" emptyLabel="전체 상태" value={params.status ?? ''} onChange={(v) => updateParam('status', v)} />
        <CodeSelect group="ticketPriority" emptyLabel="전체 우선순위" value={params.priority ?? ''} onChange={(v) => updateParam('priority', v)} />
        <CodeSelect group="ticketCategory" emptyLabel="전체 분류" value={params.category ?? ''} onChange={(v) => updateParam('category', v)} />
        {/* 일반 사용자는 서버가 본인 티켓만 돌려주므로 담당자 관련 필터는 관리자에게만 보여준다 */}
        {isAdmin && (
          <>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={assignedToMe}
                onChange={(e) => updateParam('assigneeId', e.target.checked && user ? String(user.id) : undefined)}
              />
              내 담당
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={Boolean(params.unassigned)} onChange={(e) => updateParam('unassigned', e.target.checked ? 'true' : undefined)} />
              미배정만
            </label>
          </>
        )}
        <label className="checkbox">
          <input type="checkbox" checked={Boolean(params.active)} onChange={(e) => updateParam('active', e.target.checked ? 'true' : undefined)} />
          미완료만
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={Boolean(params.overdue)} onChange={(e) => updateParam('overdue', e.target.checked ? 'true' : undefined)} />
          기한 초과만
        </label>
        <form onSubmit={onSearch} className="search">
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="제목·내용 검색" />
          <button type="submit" className="btn">검색</button>
        </form>
      </div>

      <Alert message={error} />

      {page && (
        <div className="card">
          {page.content.length === 0 ? (
            <p className="muted empty">조건에 맞는 티켓이 없습니다.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>제목</th>
                    <th>상태</th>
                    <th>우선순위</th>
                    <th>분류</th>
                    <th>요청자</th>
                    <th>담당자</th>
                    <th>처리 기한</th>
                  </tr>
                </thead>
                <tbody>
                  {page.content.map((t) => (
                    <tr key={t.id}>
                      <td className="muted">{t.id}</td>
                      <td>
                        <Link to={`/tickets/${t.id}`} className="title-link">
                          {t.title}
                        </Link>
                      </td>
                      <td><Badge group="ticketStatus" code={t.status} /></td>
                      <td><Badge group="ticketPriority" code={t.priority} /></td>
                      <td><Badge group="ticketCategory" code={t.category} /></td>
                      <td>{t.requesterName}</td>
                      <td>{t.assigneeName ?? <span className="muted">미배정</span>}</td>
                      <td className={t.overdue ? 'overdue' : ''}>
                        {formatDateTime(t.dueAt)}
                        {t.overdue && ' (초과)'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} onChange={goPage} />
        </div>
      )}
    </section>
  );
}

function TicketCreateForm({ draft, onCreated }: { draft?: TicketDraft; onCreated: () => void }) {
  const { label } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState(draft?.title ?? '');
  const [description, setDescription] = useState(draft?.description ?? '');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [assetId, setAssetId] = useState('');
  const [myAssets, setMyAssets] = useState<Asset[]>([]);
  const [preview, setPreview] = useState<TriageResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 현재 사용자가 사용중인 자산만 선택지로 제공
  useEffect(() => {
    if (!user) return;
    assetApi
      .search({ assignedUserId: user.id, size: 50 })
      .then((p) => setMyAssets(p.content))
      .catch(() => setMyAssets([]));
  }, [user]);

  const runPreview = async () => {
    if (!title.trim() || !description.trim()) {
      setError('제목과 내용을 입력하면 자동 분류 결과를 미리 볼 수 있습니다.');
      return;
    }
    try {
      setPreview(await aiApi.triage(title, description));
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await ticketApi.create({
        title: title.trim(),
        description: description.trim(),
        category: (category || undefined) as TicketCategory | undefined,
        priority: (priority || undefined) as TicketPriority | undefined,
        assetId: assetId ? Number(assetId) : undefined,
      });
      onCreated();
      navigate(`/tickets/${created.id}`); // 접수 직후 상세 화면에서 자동 분류 결과와 처리 기한을 확인
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="card form" onSubmit={onSubmit}>
      <h3>티켓 접수 <span className="muted small">요청자: {user?.name ?? '-'}</span></h3>
      <Alert message={error} onClose={() => setError(null)} />
      <label>
        제목
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} required placeholder="예: 3층 회의실 와이파이 접속 불가" />
      </label>
      <label>
        상세 내용
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} required rows={4} placeholder="언제부터, 어떤 증상인지 적어주세요." />
      </label>
      <div className="form-row">
        <label>
          분류
          <CodeSelect group="ticketCategory" emptyLabel="자동 분류" value={category} onChange={setCategory} />
        </label>
        <label>
          우선순위
          <CodeSelect group="ticketPriority" emptyLabel="자동 분류" value={priority} onChange={setPriority} />
        </label>
        <label>
          관련 자산
          <select value={assetId} onChange={(e) => setAssetId(e.target.value)}>
            <option value="">없음</option>
            {myAssets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.serialNumber})
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="hint">분류·우선순위를 비워두면 AI가 자동으로 판단합니다. (AI를 사용할 수 없으면 키워드 규칙으로 분류)</p>
      {preview && (
        <p className="preview">
          자동 분류 미리보기: <Badge group="ticketCategory" code={preview.category} /> <Badge group="ticketPriority" code={preview.priority} />
          <span className="muted small"> · {label('classificationSource', preview.source)}{preview.reason ? ` · ${preview.reason}` : ''}</span>
        </p>
      )}
      <div className="form-actions">
        <button type="button" className="btn" onClick={runPreview}>
          자동 분류 미리보기
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? '접수 중...' : '접수하기'}
        </button>
      </div>
    </form>
  );
}
