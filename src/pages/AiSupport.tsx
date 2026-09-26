import { useState, type FormEvent } from 'react';
import { API_BASE_URL } from '../config';

export default function AiSupport() {
  const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setResponse('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/gemini/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error('서버 통신에 실패했습니다.');
      }

      const data = await res.text();
      setResponse(data);
    } catch (err) {
      console.error('AI 연동 에러:', err);
      setResponse('AI 응답을 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h2>🤖 AI IT 지원 센터 (Gemini 연동)</h2>
      <p>시스템 장애 문의 및 IT 가이드를 AI가 실시간으로 지원합니다.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="IT 장애 내용이나 문의사항을 입력하세요..."
          style={{ flex: 1, padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '10px 20px', background: '#0066cc', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? 'AI 분석 중...' : '문의하기'}
        </button>
      </form>

      <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '6px', border: '1px solid #ddd', minHeight: '100px', color: '#333' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#111' }}>💡 AI 답변 결과:</h3>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'inherit', fontSize: '14px', margin: 0 }}>
          {response || '질문을 입력하고 AI의 답변을 확인해 보세요.'}
        </pre>
      </div>
    </div>
  );
}