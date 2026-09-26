import { useState, type FormEvent } from 'react';
import { userApi } from '../api';
import { errorMessage } from '../api/client';
import type { UserRole } from '../api/types';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import CodeSelect from '../components/CodeSelect';
import { useApp } from '../context/AppContext';

export default function UserList() {
  const { users, reloadUsers } = useApp();
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

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>이름</th>
                <th>이메일</th>
                <th>부서</th>
                <th>권한</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.department ?? '-'}</td>
                  <td><Badge group="userRole" code={u.role} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
