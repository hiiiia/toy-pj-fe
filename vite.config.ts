/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // prefix '' → .env 파일과 셸 환경변수(BACKEND_URL=... npm run dev)를 모두 읽는다
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      // 개발 서버에서 /api 요청을 백엔드로 전달 → 브라우저 입장에서는 같은 출처라 CORS 설정 없이도 동작
      proxy: {
        '/api': {
          target: env.BACKEND_URL || 'http://localhost:8080',
          // Host 헤더를 브라우저 주소 그대로 전달 → 백엔드가 Origin 과 같은 출처로 인식해 CORS 검사 대상이 되지 않음
          changeOrigin: false,
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: false,
    },
  };
});
