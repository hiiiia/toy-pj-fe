import { useState, type FormEvent } from 'react';
import { userApi } from '../api';
import { errorMessage } from '../api/client';
import type { PasswordResetResponse, User, UserRole } from '../api/types';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import CodeSelect from '../components/CodeSelect';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/format';

export default function UserList() {
  const { users, reloadUsers } = useApp();
  const { user: me } = useAuth();
  const [reset, setReset] = useState<{ user: User; result: PasswordResetResponse } | null>(null);
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('USER');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await userApi.create({
        name: name.trim(),
        email: email.trim(),
        password,
        department: department.trim() || undefined,
        role: role as UserRole,
      });
      await reloadUsers();
      setName('');
      setEmail('');
      setDepartment('');
      setPassword('');
      setError(null);
    } catch (err) {
      setError(errorMessage(err)); // 예: 이미 등록된 이메일입니다 (U002)
    }
  };

  const onReset = async (target: User) => {
    if (!window.confirm(`${target.name}님의 비밀번호를 임시 비밀번호로 초기화할까요?\n기존 로그인은 모두 해제됩니다.`)) return;
    try {
      setReset({ user: target, result: await userApi.resetPassword(target.id) });
      setCopied(false);
      await reloadUsers();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const onUnlock = async (target: User) => {
    try {
      await userApi.unlock(target.id);
      await reloadUsers();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const copyTemporaryPassword = async () => {
    if (!reset) return;
    try {
      await navigator.clipboard.writeText(reset.result.temporaryPassword);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const isLocked = (u: User) => u.lockedUntil !== null && new Date(u.lockedUntil) > new Date();

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>사용자</h2>
          <p className="muted">임직원은 회원가입으로 가입하고, IT 관리자 계정은 여기서 등록합니다.</p>
        </div>
      </div>

      <form className="card form" onSubmit={onSubmit}>
        <h3>사용자 등록</h3>
        <Alert message={error} onClose={() => setError(null)} />
        <div className="form-row">
          <label>
            이름
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={50} />
          </label>
          <label>
            이메일
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={100} />
          </label>
          <label>
            부서
            <input value={department} onChange={(e) => setDepartment(e.target.value)} maxLength={50} />
          </label>
          <label>
            초기 비밀번호
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" placeholder="영문+숫자 8자 이상" />
          </label>
          <label>
            권한
            <CodeSelect group="userRole" value={role} onChange={setRole} required />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">등록</button>
        </div>
      </form>

      {reset && (
        <div className="notice" role="status">
          <div>
            <strong>{reset.user.name}</strong>님의 임시 비밀번호:{' '}
            <code className="temp-password">{reset.result.temporaryPassword}</code>
            <div className="muted small">이 화면을 벗어나면 다시 볼 수 없습니다. 사용자에게 전달하면 로그인 후 새 비밀번호로 바꾸게 됩니다.</div>
          </div>
          <div className="inline">
            <button type="button" className="btn btn-sm" onClick={copyTemporaryPassword}>
              {copied ? '복사됨' : '복사'}
            </button>
            <button type="button" className="btn btn-sm" onClick={() => setReset(null)}>
              닫기
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>이름</th>
                <th>이메일</th>
                <th>부서</th>
                <th>권한</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.department ?? '-'}</td>
                  <td><Badge group="userRole" code={u.role} /></td>
                  <td>
                    {isLocked(u) ? (
                      <span className="overdue">잠김 (~{formatDateTime(u.lockedUntil)})</span>
                    ) : u.mustChangePassword ? (
                      <span className="muted">임시 비밀번호</span>
                    ) : (
                      <span className="muted">정상</span>
                    )}
                  </td>
                  <td>
                    <div className="inline">
                      {isLocked(u) && (
                        <button type="button" className="btn btn-sm" onClick={() => onUnlock(u)}>
                          잠금 해제
                        </button>
                      )}
                      {u.id !== me?.id && (
                        <button type="button" className="btn btn-sm" onClick={() => onReset(u)}>
                          비밀번호 초기화
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
