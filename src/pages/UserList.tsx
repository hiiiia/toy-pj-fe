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
  const [role, setRole] = useState<string>('USER');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await userApi.create({ name: name.trim(), email: email.trim(), department: department.trim() || undefined, role: role as UserRole });
      await reloadUsers();
      setName('');
      setEmail('');
      setDepartment('');
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
          <p className="muted">티켓 요청자와 IT 관리자(담당자)를 관리합니다.</p>
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
