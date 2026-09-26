import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiApi } from '../api';
import { ApiError } from '../api/client';
import type { TicketDraft } from './TicketList';

interface Message {
  role: 'user' | 'ai' | 'error';
  text: string;
}

export default function AiSupport() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const message = input.trim();
    if (!message || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text: message }]);
    setInput('');
    setLoading(true);
    try {
      // 요청: { message } → 응답: { answer }
      const { answer } = await aiApi.chat(message);
      setMessages((prev) => [...prev, { role: 'ai', text: answer }]);
    } catch (err) {
      const text =
        err instanceof ApiError && err.code === 'AI001'
          ? 'AI 서비스를 사용할 수 없습니다. (서버에 GEMINI_API_KEY 설정 필요) 아래 버튼으로 바로 티켓을 접수할 수 있어요.'
          : err instanceof Error
            ? err.message
            : 'AI 응답을 가져오지 못했습니다.';
      setMessages((prev) => [...prev, { role: 'error', text }]);
    } finally {
      setLoading(false);
    }
  };

  /** 마지막 질문을 티켓 초안으로 넘겨 접수 폼을 채워준다 */
  const toTicket = () => {
    const lastQuestion = [...messages].reverse().find((m) => m.role === 'user')?.text ?? '';
    const draft: TicketDraft = {
      title: lastQuestion.slice(0, 50),
      // 오류 메시지는 제외하고 문의/AI 답변 내용만 티켓 본문으로 옮긴다
      description: messages
        .filter((m) => m.role !== 'error')
        .map((m) => `[${m.role === 'user' ? '문의' : 'AI 답변'}] ${m.text}`)
        .join('\n\n')
        .slice(0, 2000),
    };
    navigate('/tickets', { state: { draft } });
  };

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>AI IT 지원</h2>
          <p className="muted">간단한 IT 문제는 AI에게 먼저 물어보고, 해결되지 않으면 티켓으로 접수하세요.</p>
        </div>
      </div>

      <div className="card chat">
        <div className="chat-log">
          {messages.length === 0 && <p className="muted empty">예: "VPN이 자꾸 끊겨요", "프린터 드라이버 설치 방법 알려줘"</p>}
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble chat-${m.role}`}>
              {m.text}
            </div>
          ))}
          {loading && <div className="chat-bubble chat-ai muted">답변을 작성하고 있어요...</div>}
        </div>
        <form onSubmit={onSubmit} className="chat-input">
          <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={1000} placeholder="IT 문의사항을 입력하세요" />
          <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
            보내기
          </button>
        </form>
        {messages.some((m) => m.role === 'user') && (
          <div className="form-actions">
            <button type="button" className="btn" onClick={toTicket}>
              해결되지 않았나요? 이 내용으로 티켓 접수 →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
