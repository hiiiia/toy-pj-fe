const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

/**
 * 백엔드 LocalDateTime 문자열("2026-09-23T17:09:15.123456")을 "2026.09.23 17:09" 형태로 표시한다.
 *
 * new Date(문자열)로 파싱하지 않는 이유:
 *  - LocalDateTime 은 시간대 정보가 없는 "서버 기준 벽시계 시각"이다. Date 로 바꾸면 브라우저 시간대로
 *    해석되어, 서버(KST)와 다른 시간대의 PC 에서는 다른 시각이 보일 수 있다.
 *  - 소수점 이하 6자리(마이크로초)는 ECMAScript 표준 날짜 형식(최대 3자리)이 아니라 브라우저마다 해석이 다를 수 있다.
 * 그래서 문자열에서 숫자만 꺼내 그대로 보여준다.
 */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  const m = LOCAL_DATE_TIME.exec(value);
  if (!m) return value;
  const [, y, mo, d, h, mi] = m;
  return `${y}.${mo}.${d} ${h}:${mi}`;
}

export function formatDate(value: string | null | undefined): string {
  return value ? value.slice(0, 10).replace(/-/g, '.') : '-';
}
