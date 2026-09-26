import { useState, useEffect, type FormEvent } from 'react';
import { API_BASE_URL } from '../config';

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
}

export default function TicketList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const fetchTickets = () => {
    fetch(`${API_BASE_URL}/api/tickets`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTickets(data);
        else setTickets([]);
      })
      .catch(err => {
        console.error('티켓 조회 에러:', err);
        setTickets([]);
      });
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, status: '접수대기' }),
      });

      if (res.ok) {
        setTitle('');
        setDescription('');
        fetchTickets();
      }
    } catch (err) {
      console.error('티켓 등록 에러:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchTickets();
    } catch (err) {
      console.error('티켓 삭제 에러:', err);
    }
  };

  const safeTickets = Array.isArray(tickets) ? tickets : [];

  return (
    <div style={{ padding: '20px', maxWidth: '800px', backgroundColor: '#ffffff', color: '#333333', borderRadius: '8px', minHeight: '400px' }}>
      <h2>🎫 IT 지원 티켓 관리 (Incident Management)</h2>
      <p style={{ color: '#555555' }}>사내 장애 및 IT 지원 요청 내역을 실시간으로 접수하고 추적합니다.</p>

      {/* 티켓 등록 폼 */}
      <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '20px 0' }}>
        <input
          type="text"
          placeholder="티켓 제목 (예: 사내 무선랜 접속 불능 장애)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', color: '#333' }}
        />
        <textarea
          placeholder="상세 내용 (예: 3층 회의실 구역에서 Wi-Fi가 잡히지 않습니다)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', color: '#333', minHeight: '60px' }}
        />
        <button
          type="submit"
          style={{ padding: '10px 20px', background: '#0066cc', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', alignSelf: 'flex-end' }}
        >
          지원 요청 등록
        </button>
      </form>

      {/* 티켓 목록 영역 */}
      <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '6px', border: '1px solid #ddd' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#111' }}>📋 지원 티켓 목록</h3>
        {safeTickets.length === 0 ? (
          <p style={{ margin: 0, color: '#666' }}>등록된 지원 티켓이 없습니다.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {safeTickets.map(ticket => (
              <li
                key={ticket.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #e1e1e1',
                  color: '#333'
                }}
              >
                <div>
                  <strong style={{ fontSize: '15px' }}>{ticket.title}</strong>
                  <span style={{ background: '#e6f7ff', color: '#1890ff', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', marginLeft: '8px', border: '1px solid #91d5ff' }}>
                    {ticket.status}
                  </span>
                  <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '13px' }}>{ticket.description}</p>
                </div>
                <button
                  onClick={() => handleDelete(ticket.id)}
                  style={{ padding: '6px 12px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}