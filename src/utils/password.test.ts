import { describe, expect, it } from 'vitest';
import { PASSWORD_RULE } from './password';

describe('비밀번호 규칙 (백엔드 PasswordPolicy 와 동일)', () => {
  it.each(['password1', 'Abcdefg1', 'a1!@#$%^&*'])('허용: %s', (value) => {
    expect(PASSWORD_RULE.test(value)).toBe(true);
  });

  it.each([
    ['12345678', '숫자만'],
    ['password', '영문만'],
    ['pass1', '8자 미만'],
    ['pass word1', '공백 포함'],
    ['비밀번호1234abc', '한글 포함'],
    ['a1'.repeat(33), '64자 초과'],
  ])('거절: %s (%s)', (value) => {
    expect(PASSWORD_RULE.test(value)).toBe(false);
  });
});
