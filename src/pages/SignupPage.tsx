import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/client';
import Alert from '../components/Alert';
import { useAuth } from '../context/AuthContext';
import { PASSWORD_RULE, PASSWORD_RULE_TEXT } from '../utils/password';


export default function SignupPage() {
  const { status, signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') return <Navigate to="/" replace />;

  const passwordValid = PASSWORD_RULE.test(password);
  const confirmMatches = password === passwordConfirm;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!passwordValid || !confirmMatches) return;
    setSubmitting(true);
    try {
      await signup({ name: name.trim(), email: email.trim(), password, department: department.trim() || undefined });
      navigate('/tickets', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <form className="card form auth-card" onSubmit={onSubmit}>
        <h2>회원가입</h2>
        <p className="muted">임직원 계정으로 가입합니다. (IT 관리자 계정은 관리자가 등록)</p>
        <Alert message={error} onClose={() => setError(null)} />
        <label>
          이름
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={50} autoFocus />
        </label>
        <label>
          이메일
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={100} autoComplete="username" />
        </label>
        <label>
          부서
          <input value={department} onChange={(e) => setDepartment(e.target.value)} maxLength={50} />
        </label>
        <label>
          비밀번호
          <input aria-label="비밀번호" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
          <span className={`hint ${password && !passwordValid ? 'overdue' : ''}`}>{PASSWORD_RULE_TEXT}</span>
        </label>
        <label>
          비밀번호 확인
          <input aria-label="비밀번호 확인" type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required autoComplete="new-password" />
          {passwordConfirm && !confirmMatches && <span className="hint overdue">비밀번호가 일치하지 않습니다.</span>}
        </label>
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !passwordValid || !confirmMatches}>
          {submitting ? '가입 중...' : '가입하기'}
        </button>
        <p className="muted small center">
          이미 계정이 있나요? <Link to="/login">로그인</Link>
        </p>
      </form>
    </section>
  );
}
