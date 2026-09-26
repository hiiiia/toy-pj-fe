/** 백엔드 PasswordPolicy 와 같은 규칙. 최종 검증은 서버가 하고, 화면에서는 입력 중에 미리 알려준다. */
export const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)[\x21-\x7E]{8,64}$/;

export const PASSWORD_RULE_TEXT = '영문과 숫자를 포함해 8~64자 (공백·한글 불가)';
