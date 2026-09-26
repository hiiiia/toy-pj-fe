import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="card empty">
      <h2>페이지를 찾을 수 없습니다</h2>
      <Link to="/">대시보드로 이동</Link>
    </section>
  );
}
