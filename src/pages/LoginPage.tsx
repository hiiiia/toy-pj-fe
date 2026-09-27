import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams, type Location } from 'react-router-dom';
import { authApi, type SocialProvider } from '../api';
import { errorMessage } from '../api/client';
import Alert from '../components/Alert';
import { useAuth } from '../context/AuthContext';
import { saveSocialReturnPath, socialLoginErrorMessage } from '../utils/socialLogin';

/** 개발 서버에서만 보이는 데모 계정 (백엔드 local 프로필의 샘플 데이터) */
const DEMO_ACCOUNTS = [
  { label: 'IT 관리자', email: 'admin@daon.example', password: 'admin1234' },
  { label: '일반 사용자', email: 'hong@daon.example', password: 'user1234' },
];

const SOCIAL_PROVIDERS: { id: SocialProvider; label: string }[] = [
  { id: 'google', label: 'Google' },
  { id: 'kakao', label: '카카오' },
  { id: 'naver', label: '네이버' },
];

export default function LoginPage() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // 로그인 전에 가려던 주소로 돌려보낸다. 경로만 쓰면 /tickets?overdue=true 의 검색 조건이 사라지므로 query·hash 도 붙인다.
  const fromLocation = (location.state as { from?: Location } | null)?.from;
  const from = fromLocation ? `${fromLocation.pathname}${fromLocation.search}${fromLocation.hash}` : '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // SNS 로그인이 거부·실패하면 백엔드가 /login?error=AUTH0xx 로 돌려보낸다
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(() => socialLoginErrorMessage(searchParams.get('error')));
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') return <Navigate to={from} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <form className="card form auth-card" onSubmit={onSubmit}>
        <h2>로그인</h2>
        <p className="muted">다온 플레이스 IT 헬프데스크</p>
        <Alert message={error} onClose={() => setError(null)} />
        <label>
          이메일
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" autoFocus />
        </label>
        <label>
          비밀번호
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </label>
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? '로그인 중...' : '로그인'}
        </button>
        <p className="muted small center">
          계정이 없나요? <Link to="/signup">회원가입</Link>
        </p>

        {/* SNS 로그인은 fetch 가 아니라 페이지 이동: 제공자 로그인 화면을 거쳐 /oauth/callback 으로 돌아온다 */}
        <div className="social-login">
          <span className="muted small center">또는 SNS 계정으로 계속하기</span>
          {SOCIAL_PROVIDERS.map((p) => (
            <a
              key={p.id}
              className={`btn btn-block btn-social ${p.id}`}
              href={authApi.socialLoginUrl(p.id)}
              onClick={() => saveSocialReturnPath(from)}
            >
              {p.label}로 계속하기
            </a>
          ))}
        </div>

        {import.meta.env.DEV && (
          <div className="demo-accounts">
            <span className="muted small">데모 계정 (개발 환경에서만 표시)</span>
            <div className="inline wrap">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    setEmail(a.email);
                    setPassword(a.password);
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </section>
  );
}
