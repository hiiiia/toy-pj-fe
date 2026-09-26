/** 백엔드 LocalDateTime 문자열("2026-09-23T17:09:15.55")을 "09.23 17:09" 형태로 표시 */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDate(value: string | null | undefined): string {
  return value ? value.slice(0, 10).replace(/-/g, '.') : '-';
}
