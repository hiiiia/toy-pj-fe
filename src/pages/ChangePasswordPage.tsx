import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/client';
import Alert from '../components/Alert';
import { useAuth } from '../context/AuthContext';
import { PASSWORD_RULE, PASSWORD_RULE_TEXT } from '../utils/password';

export default function ChangePasswordPage() {
  const { user, changePassword } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const forced = user?.mustChangePassword ?? false;
  const nextValid = PASSWORD_RULE.test(next);
  const confirmMatches = next === confirm;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nextValid || !confirmMatches) return;
    setSubmitting(true);
    try {
      await changePassword(current, next);
      setDone(true);
      setError(null);
      setCurrent('');
      setNext('');
      setConfirm('');
      if (forced) navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="narrow">
      <div className="page-header">
        <div>
          <h2>비밀번호 변경</h2>
          <p className="muted">변경하면 다른 기기에서의 로그인은 모두 해제됩니다.</p>
        </div>
      </div>
      {forced && (
        <div className="notice" role="status">
          <span>
            관리자가 발급한 <strong>임시 비밀번호</strong>로 로그인했습니다. 계속하려면 새 비밀번호로 변경하세요.
          </span>
        </div>
      )}
      {done && !forced && <div className="notice success" role="status">비밀번호를 변경했습니다.</div>}

      <form className="card form" onSubmit={onSubmit}>
        <Alert message={error} onClose={() => setError(null)} />
        <label>
          현재 비밀번호
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required autoComplete="current-password" />
        </label>
        <label>
          새 비밀번호
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} required autoComplete="new-password" />
          <span className={`hint ${next && !nextValid ? 'overdue' : ''}`}>{PASSWORD_RULE_TEXT}</span>
        </label>
        <label>
          새 비밀번호 확인
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
          {confirm && !confirmMatches && <span className="hint overdue">비밀번호가 일치하지 않습니다.</span>}
        </label>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting || !nextValid || !confirmMatches}>
            {submitting ? '변경 중...' : '변경하기'}
          </button>
        </div>
      </form>
    </section>
  );
}
