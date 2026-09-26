import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { assetApi } from '../api';
import { errorMessage } from '../api/client';
import type { Asset, AssetSearchParams, AssetStatus, AssetType, PageResponse } from '../api/types';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import CodeSelect from '../components/CodeSelect';
import Pagination from '../components/Pagination';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/format';

function readParams(sp: URLSearchParams): AssetSearchParams {
  return {
    status: (sp.get('status') as AssetStatus) || undefined,
    type: (sp.get('type') as AssetType) || undefined,
    keyword: sp.get('keyword') || undefined,
    page: sp.get('page') ? Number(sp.get('page')) : 0,
    size: 10,
  };
}

export default function AssetList() {
  const { currentUser } = useApp();
  const isAdmin = currentUser?.role === 'ADMIN';
  const [searchParams, setSearchParams] = useSearchParams();
  const params = readParams(searchParams);
  const [keyword, setKeyword] = useState(params.keyword ?? '');
  const [page, setPage] = useState<PageResponse<Asset> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const queryKey = searchParams.toString();
  const load = useCallback(() => {
    assetApi
      .search(readParams(new URLSearchParams(queryKey)))
      .then(setPage)
      .catch((e) => setError(errorMessage(e)));
  }, [queryKey]);

  useEffect(load, [load]);

  const updateParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const goPage = (p: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    setSearchParams(next);
  };

  /** 행 단위 작업(배정/반납/점검/폐기/삭제) 공통 처리 */
  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
      setError(null);
      load();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>IT 자산 관리</h2>
          <p className="muted">노트북·모니터·라이선스 등 사내 IT 자산의 배정과 상태를 관리합니다.</p>
        </div>
        {isAdmin && (
          <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? '등록 닫기' : '+ 자산 등록'}
          </button>
        )}
      </div>

      {showForm && (
        <AssetCreateForm
          onCreated={() => {
            setShowForm(false);
            setSearchParams(new URLSearchParams());
            load();
          }}
        />
      )}

      <div className="card filters">
        <CodeSelect group="assetStatus" emptyLabel="전체 상태" value={params.status ?? ''} onChange={(v) => updateParam('status', v)} />
        <CodeSelect group="assetType" emptyLabel="전체 유형" value={params.type ?? ''} onChange={(v) => updateParam('type', v)} />
        <form
          className="search"
          onSubmit={(e) => {
            e.preventDefault();
            updateParam('keyword', keyword.trim() || undefined);
          }}
        >
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="자산명·시리얼 번호 검색" />
          <button type="submit" className="btn">검색</button>
        </form>
      </div>

      {!isAdmin && <p className="hint">자산 등록·배정 등 관리 작업은 IT 관리자만 할 수 있습니다.</p>}
      <Alert message={error} onClose={() => setError(null)} />

      {page && (
        <div className="card">
          {page.content.length === 0 ? (
            <p className="muted empty">조건에 맞는 자산이 없습니다.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>자산명</th>
                    <th>유형</th>
                    <th>시리얼 번호</th>
                    <th>상태</th>
                    <th>사용자</th>
                    <th>구매일</th>
                    {isAdmin && <th>관리</th>}
                  </tr>
                </thead>
                <tbody>
                  {page.content.map((asset) => (
                    <tr key={asset.id}>
                      <td>
                        {asset.name}
                        {asset.memo && <div className="muted small">{asset.memo}</div>}
                      </td>
                      <td><Badge group="assetType" code={asset.type} /></td>
                      <td className="mono">{asset.serialNumber}</td>
                      <td><Badge group="assetStatus" code={asset.status} /></td>
                      <td>{asset.assignedUserName ?? <span className="muted">-</span>}</td>
                      <td>{formatDate(asset.purchasedAt)}</td>
                      {isAdmin && (
                        <td>
                          <AssetActions asset={asset} run={run} />
                        </td>
                      )}
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

/** 자산 상태에 따라 가능한 작업만 버튼으로 노출한다 (규칙 자체는 백엔드가 최종 검증). */
function AssetActions({ asset, run }: { asset: Asset; run: (action: () => Promise<unknown>) => void }) {
  const { users } = useApp();
  const [assignTo, setAssignTo] = useState('');

  const confirmThen = (message: string, action: () => Promise<unknown>) => {
    if (window.confirm(message)) run(action);
  };

  switch (asset.status) {
    case 'AVAILABLE':
      return (
        <div className="inline wrap">
          <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)} aria-label="배정할 사용자">
            <option value="">사용자 선택</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-sm btn-primary" disabled={!assignTo} onClick={() => run(() => assetApi.assign(asset.id, Number(assignTo)))}>
            배정
          </button>
          <button type="button" className="btn btn-sm" onClick={() => run(() => assetApi.startRepair(asset.id))}>점검</button>
          <button type="button" className="btn btn-sm" onClick={() => confirmThen(`'${asset.name}'을(를) 폐기 처리할까요?`, () => assetApi.dispose(asset.id))}>폐기</button>
          <button type="button" className="btn btn-sm btn-danger" onClick={() => confirmThen(`'${asset.name}'을(를) 삭제할까요? (잘못 등록한 경우에만 사용)`, () => assetApi.remove(asset.id))}>삭제</button>
        </div>
      );
    case 'IN_USE':
      return (
        <div className="inline wrap">
          <button type="button" className="btn btn-sm" onClick={() => run(() => assetApi.returnAsset(asset.id))}>반납</button>
          <button type="button" className="btn btn-sm" onClick={() => run(() => assetApi.startRepair(asset.id))}>점검</button>
        </div>
      );
    case 'REPAIR':
      return (
        <div className="inline wrap">
          <button type="button" className="btn btn-sm btn-primary" onClick={() => run(() => assetApi.completeRepair(asset.id))}>점검 완료</button>
          <button type="button" className="btn btn-sm" onClick={() => confirmThen(`'${asset.name}'을(를) 폐기 처리할까요?`, () => assetApi.dispose(asset.id))}>폐기</button>
        </div>
      );
    default:
      return <span className="muted small">작업 없음</span>;
  }
}

function AssetCreateForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('LAPTOP');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchasedAt, setPurchasedAt] = useState('');
  const [memo, setMemo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await assetApi.create({
        name: name.trim(),
        type: type as AssetType,
        serialNumber: serialNumber.trim(),
        purchasedAt: purchasedAt || undefined,
        memo: memo.trim() || undefined,
      });
      onCreated();
    } catch (err) {
      setError(errorMessage(err)); // 예: 이미 등록된 시리얼 번호입니다 (A002)
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="card form" onSubmit={onSubmit}>
      <h3>자산 등록 <span className="muted small">등록 시 '재고' 상태가 됩니다</span></h3>
      <Alert message={error} onClose={() => setError(null)} />
      <div className="form-row">
        <label>
          자산명
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} placeholder="예: MacBook Pro 14 M3" />
        </label>
        <label>
          유형
          <CodeSelect group="assetType" value={type} onChange={setType} required />
        </label>
        <label>
          시리얼 번호
          <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} required maxLength={50} />
        </label>
        <label>
          구매일
          <input type="date" value={purchasedAt} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setPurchasedAt(e.target.value)} />
        </label>
      </div>
      <label>
        메모
        <input value={memo} onChange={(e) => setMemo(e.target.value)} maxLength={500} />
      </label>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? '등록 중...' : '등록'}
        </button>
      </div>
    </form>
  );
}
