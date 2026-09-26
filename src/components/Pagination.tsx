import type { PageResponse } from '../api/types';

interface Props {
  page: PageResponse<unknown>;
  onChange: (page: number) => void;
}

export default function Pagination({ page, onChange }: Props) {
  if (page.totalPages <= 1) {
    return <div className="pagination muted">총 {page.totalElements}건</div>;
  }
  return (
    <div className="pagination">
      <button type="button" className="btn btn-sm" disabled={page.page === 0} onClick={() => onChange(page.page - 1)}>
        이전
      </button>
      <span>
        {page.page + 1} / {page.totalPages} 페이지 (총 {page.totalElements}건)
      </span>
      <button type="button" className="btn btn-sm" disabled={!page.hasNext} onClick={() => onChange(page.page + 1)}>
        다음
      </button>
    </div>
  );
}
