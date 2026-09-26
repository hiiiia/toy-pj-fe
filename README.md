# yh-fe · IT 헬프데스크 프론트엔드

[toy-pj](../toy-pj) 백엔드 API를 사용하는 React + TypeScript 화면입니다.

| 항목 | 내용 |
|---|---|
| Stack | React 18, TypeScript, Vite 5, React Router 7 |
| 화면 | 로그인·회원가입 · 대시보드 · 티켓 목록/상세 · 자산 관리 · AI 지원 · 사용자 |
| 배포 | Docker (Node 빌드 → nginx 서빙) |

## 실행

```bash
npm install
npm run dev          # http://localhost:5173
```

- 백엔드(`toy-pj`)가 `http://localhost:8080` 에서 실행 중이어야 합니다.
- 개발 서버에서는 로그인 화면에 데모 계정 버튼이 보입니다. (관리자 `admin@daon.example` / `admin1234`, 사용자 `hong@daon.example` / `user1234`)
- Docker 로 전체 실행: `toy-pj` 폴더에서 `docker compose up -d --build` → http://localhost:3000
- 다른 주소의 백엔드를 쓰려면: `BACKEND_URL=http://localhost:18080 npm run dev`
- 개발 서버는 `/api` 요청을 백엔드로 **프록시**하므로 브라우저 CORS 설정 없이 동작합니다. ([`vite.config.ts`](vite.config.ts))
  Docker 에서는 nginx 가 같은 역할을 합니다. ([`nginx.conf`](nginx.conf))

## 구조

```
src
├── api
│   ├── types.ts        # 백엔드 DTO 와 1:1 대응하는 타입 (enum 은 문자열 유니온)
│   ├── client.ts       # fetch 래퍼: 토큰 첨부, 401 시 자동 재발급·재시도, 에러 포맷 → ApiError
│   └── index.ts        # 엔드포인트 모음 (페이지에서 URL 문자열을 직접 쓰지 않음)
├── context
│   ├── AuthContext.tsx # 로그인 상태 (새로고침 시 refresh token 쿠키로 복원)
│   └── AppContext.tsx  # 공통 코드(한글 라벨), 사용자 목록(관리자)
├── components          # Badge, CodeSelect, Pagination, Alert, RouteGuards(로그인·관리자 전용 화면)
├── pages               # Login, Signup, Dashboard, TicketList, TicketDetail, AssetList, AiSupport, UserList
└── utils/format.ts     # 날짜 표시
```

## 설계 포인트

- **타입으로 백엔드 계약 고정**: `api/types.ts` 가 백엔드 DTO 를 그대로 반영합니다. 응답 형태가 바뀌면 컴파일 단계에서 영향 범위가 드러납니다.
- **에러 처리 일원화**: 모든 요청은 `api/client.ts` 를 거칩니다. 백엔드가 주는 `{code, message, errors}` 를 `ApiError` 로 바꿔 화면에 그대로 보여주고, 필요하면 `code`(예: `AI001`)로 분기합니다.
- **코드 값과 라벨 분리**: 서버와는 `OPEN`, `IN_USE` 같은 코드로 통신하고, 화면 표시는 `GET /api/codes` 의 한글 라벨을 씁니다. 드롭다운(`CodeSelect`)도 이 목록으로 그려서 코드가 추가돼도 프론트 수정이 필요 없습니다.
- **상태 전이는 서버가 결정**: 티켓 상세의 처리 버튼은 백엔드가 내려주는 `nextStatuses` 로만 그립니다. 규칙을 프론트에 중복 구현하지 않습니다.
- **검색 조건을 URL 에 저장**: `/tickets?status=OPEN&unassigned=true` 처럼 조건이 URL 에 남아 새로고침·뒤로가기·대시보드 링크에서도 유지됩니다.
- **토큰 보관 방식**: access token 은 `localStorage` 가 아닌 **메모리 변수**에만 둡니다(XSS 로 탈취 방지). refresh token 은 서버가 HttpOnly 쿠키로 관리해 JavaScript 에서 접근할 수 없습니다. 새로고침하면 쿠키로 access token 을 다시 받아 로그인이 유지됩니다.
- **자동 재발급**: API 가 401 을 주면 `/api/auth/refresh` 로 새 토큰을 받아 원래 요청을 한 번 재시도합니다. 여러 요청이 동시에 만료돼도 재발급은 한 번만 합니다. 재발급도 실패하면 로그인 화면으로 이동합니다.
- **권한별 화면**: 일반 사용자는 "내 티켓 · 내 자산 · AI 지원"만, IT 관리자는 대시보드·담당자 지정·자산 관리·사용자 관리까지 봅니다. 화면에서 숨기는 것은 편의일 뿐이고, 실제 권한 검사는 백엔드가 합니다.
- **AI → 티켓 연결**: AI 답변으로 해결되지 않으면 대화 내용을 티켓 접수 폼으로 넘깁니다. AI 키가 없거나 장애일 때도 안내 메시지와 함께 접수를 이어갈 수 있습니다.

## 백엔드 변경에 따른 수정 내역

| 기존 | 변경 |
|---|---|
| 목록 응답을 배열로 처리 | 페이지 객체(`content`, `totalElements` ...) + 페이지 이동 |
| 상태값 한글 문자열 하드코딩 (`'접수대기'`) | 코드 값 + `/api/codes` 라벨 |
| `/api/dashboard/stats` | `/api/dashboard/summary` (상태·우선순위별, 미배정, SLA 초과) |
| 티켓 삭제 버튼 | 상태 변경(취소/처리/해결/종료) + 처리 이력 |
| 자산: 이름·유형 자유 입력, 삭제만 가능 | 유형 선택·시리얼 번호, 배정/반납/점검/폐기 |
| `/api/gemini/chat` `{prompt}` → 텍스트 | `/api/ai/chat` `{message}` → `{answer}` |
| 티켓 메뉴가 네비게이션에 없음 | 메뉴 추가, 상세 화면 신설 |
| 오류 시 콘솔 로그만 | 서버 에러 메시지를 화면에 표시 |
