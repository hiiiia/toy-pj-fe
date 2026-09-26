import { useState, useEffect, type FormEvent } from 'react';
import { API_BASE_URL } from '../config';

interface Asset {
  id: number;
  name: string;
  type: string;
}

export default function AssetList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<string>('');

  const fetchAssets = () => {
    fetch(`${API_BASE_URL}/api/assets`)
      .then(res => res.json())
      .then(data => {
        // 응답 데이터가 확실한 배열일 때만 상태에 반영하고, 아니면 빈 배열 처리
        if (Array.isArray(data)) {
          setAssets(data);
        } else {
          setAssets([]);
        }
      })
      .catch(err => {
        console.error('API 연동 에러:', err);
        setAssets([]);
      });
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !type.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type }),
      });

      if (res.ok) {
        setName('');
        setType('');
        fetchAssets();
      }
    } catch (err) {
      console.error('자산 등록 에러:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/assets/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchAssets();
      }
    } catch (err) {
      console.error('자산 삭제 에러:', err);
    }
  };

  // assets가 배열이 아닐 경우를 대비한 안전 장치
  const safeAssets = Array.isArray(assets) ? assets : [];

  return (
    <div style={{ padding: '20px', maxWidth: '800px', backgroundColor: '#ffffff', color: '#333333', borderRadius: '8px', minHeight: '400px' }}>
      <h2>💻 IT 자산 관리 (CRUD)</h2>
      <p style={{ color: '#555555' }}>사내 임직원 자산 및 하드웨어/소프트웨어 현황을 통합 관리합니다.</p>

      {/* 자산 등록 폼 */}
      <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
        <input
          type="text"
          placeholder="자산 이름 (예: 개발팀 맥북 프로)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ flex: 1, padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', color: '#333' }}
        />
        <input
          type="text"
          placeholder="자산 유형 (예: 노트북)"
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ flex: 1, padding: '10px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#fff', color: '#333' }}
        />
        <button
          type="submit"
          style={{ padding: '10px 20px', background: '#0066cc', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          자산 등록
        </button>
      </form>

      {/* 자산 목록 표시 영역 */}
      <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '6px', border: '1px solid #ddd' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#111' }}>📋 등록된 자산 목록</h3>
        {safeAssets.length === 0 ? (
          <p style={{ margin: 0, color: '#666' }}>등록된 자산이 없습니다.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {safeAssets.map(asset => (
              <li
                key={asset.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid #e1e1e1',
                  color: '#333'
                }}
              >
                <span><strong>{asset.name}</strong> <span style={{ color: '#666' }}>({asset.type})</span></span>
                <button
                  onClick={() => handleDelete(asset.id)}
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