import { afterEach, describe, expect, it } from 'vitest';
import {
  clearSocialReturnPath,
  isSafeReturnPath,
  peekSocialReturnPath,
  saveSocialReturnPath,
  socialLoginErrorMessage,
} from './socialLogin';

describe('socialLoginErrorMessage', () => {
  it('백엔드 에러 코드를 화면 문구로 바꾼다', () => {
    expect(socialLoginErrorMessage('AUTH010')).toContain('이미 이메일로 가입된 계정');
    expect(socialLoginErrorMessage('AUTH009')).toContain('이메일 제공에 동의');
  });

  it('모르는 코드는 일반 실패 문구, 코드가 없으면 null', () => {
    expect(socialLoginErrorMessage('WHATEVER')).toBe(socialLoginErrorMessage('AUTH011'));
    expect(socialLoginErrorMessage(null)).toBeNull();
  });
});

describe('로그인 후 돌아갈 주소', () => {
  afterEach(() => clearSocialReturnPath());

  it('사이트 안의 경로만 허용한다 (외부 주소로 보내는 open redirect 방지)', () => {
    expect(isSafeReturnPath('/tickets?overdue=true')).toBe(true);
    expect(isSafeReturnPath('//evil.example')).toBe(false);
    expect(isSafeReturnPath('/\\evil.example')).toBe(false);
    expect(isSafeReturnPath('https://evil.example')).toBe(false);
    expect(isSafeReturnPath('')).toBe(false);
  });

  it('저장한 주소를 읽고, 지우면 홈으로 돌아간다', () => {
    saveSocialReturnPath('/tickets/3');
    expect(peekSocialReturnPath()).toBe('/tickets/3');
    expect(peekSocialReturnPath()).toBe('/tickets/3'); // 여러 번 읽어도 같은 값

    clearSocialReturnPath();
    expect(peekSocialReturnPath()).toBe('/');
  });

  it('안전하지 않은 주소는 저장하지 않는다', () => {
    saveSocialReturnPath('//evil.example');
    expect(peekSocialReturnPath()).toBe('/');
  });
});
