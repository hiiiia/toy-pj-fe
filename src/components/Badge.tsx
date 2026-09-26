import type { CodeGroup } from '../api/types';
import { useApp } from '../context/AppContext';

/** 코드 값에 따라 색을 입힌 라벨. 색상 규칙은 CSS(.badge-<group>-<code>)에 정의 */
export default function Badge({ group, code }: { group: CodeGroup; code: string | null | undefined }) {
  const { label } = useApp();
  if (!code) return <span className="badge">-</span>;
  return <span className={`badge badge-${group}-${code}`}>{label(group, code)}</span>;
}
