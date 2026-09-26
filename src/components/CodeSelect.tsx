import type { CodeGroup } from '../api/types';
import { useApp } from '../context/AppContext';

interface Props {
  group: CodeGroup;
  value: string;
  onChange: (value: string) => void;
  /** 지정하면 맨 위에 "빈 값" 옵션을 추가한다 (예: "전체", "AI 자동 분류") */
  emptyLabel?: string;
  id?: string;
  required?: boolean;
}

/** 공통 코드(/api/codes) 기반 드롭다운. 코드가 추가되어도 프론트 수정이 필요 없다. */
export default function CodeSelect({ group, value, onChange, emptyLabel, id, required }: Props) {
  const { codes } = useApp();
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} required={required}>
      {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
      {codes?.[group].map((item) => (
        <option key={item.code} value={item.code}>
          {item.label}
        </option>
      ))}
    </select>
  );
}
