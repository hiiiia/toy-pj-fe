import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime } from './format';

describe('formatDateTime', () => {
  it('서버 시각을 브라우저 시간대와 관계없이 그대로 보여준다', () => {
    expect(formatDateTime('2026-09-23T17:09:15.123456')).toBe('2026.09.23 17:09');
    expect(formatDateTime('2026-01-02T03:04')).toBe('2026.01.02 03:04');
  });

  it('값이 없으면 "-", 형식이 다르면 원문을 보여준다', () => {
    expect(formatDateTime(null)).toBe('-');
    expect(formatDateTime('')).toBe('-');
    expect(formatDateTime('어제')).toBe('어제');
  });
});

describe('formatDate', () => {
  it('날짜만 점으로 구분해 보여준다', () => {
    expect(formatDate('2026-09-23')).toBe('2026.09.23');
    expect(formatDate(null)).toBe('-');
  });
});
