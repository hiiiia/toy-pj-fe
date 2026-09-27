/**
 * SNS 로그인 보조 함수.
 * SNS 로그인은 페이지가 제공자 사이트로 완전히 넘어갔다 돌아오므로, 화면 상태(가려던 주소)를 sessionStorage 에 잠시 맡겨 둔다.
 */

const RETURN_PATH_KEY = 'socialLoginReturnPath';

/** 백엔드가 /login?error=코드 로 돌려보낼 때의 코드 → 화면 문구 */
const SOCIAL_ERROR_MESSAGES: Record<string, string> = {
  AUTH009: 'SNS 계정의 이메일 제공에 동의해야 가입할 수 있습니다. 다시 로그인하면서 이메일 제공에 동의해 주세요.',
  AUTH010: '이미 이메일로 가입된 계정입니다. 이메일과 비밀번호로 로그인해 주세요.',
  AUTH011: 'SNS 로그인에 실패했습니다. 다시 시도해 주세요.',
};

/** 알 수 없는 코드도 "실패"로 안내한다. 코드가 없으면 null. */
export function socialLoginErrorMessage(code: string | null): string | null {
  if (!code) return null;
  return SOCIAL_ERROR_MESSAGES[code] ?? SOCIAL_ERROR_MESSAGES.AUTH011;
}

/**
 * 우리 사이트 안의 경로만 허용한다.
 * "//evil.com" 이나 "https://..." 를 그대로 이동시키면 로그인 직후 외부 사이트로 보내는 통로(open redirect)가 된다.
 */
export function isSafeReturnPath(path: string | null | undefined): path is string {
  return !!path && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\');
}

export function saveSocialReturnPath(path: string): void {
  try {
    if (isSafeReturnPath(path)) sessionStorage.setItem(RETURN_PATH_KEY, path);
  } catch {
    // 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)이면 로그인 후 홈으로 간다
  }
}

/** 저장해 둔 주소를 읽는다 (없거나 안전하지 않으면 홈). 여러 번 읽어도 같은 값이 나오도록 지우지 않는다. */
export function peekSocialReturnPath(): string {
  try {
    const path = sessionStorage.getItem(RETURN_PATH_KEY);
    return isSafeReturnPath(path) ? path : '/';
  } catch {
    return '/';
  }
}

export function clearSocialReturnPath(): void {
  try {
    sessionStorage.removeItem(RETURN_PATH_KEY);
  } catch {
    // 무시
  }
}
