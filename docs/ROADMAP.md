# 모임 이벤트 관리 웹 MVP 개발 로드맵

모임 주최자가 공지·참여자 관리(RSVP)·정산(N빵)을 하나의 웹 도구에서 끝내도록 돕는 MVP 개발 계획입니다.

## 개요

모임 이벤트 관리 웹은 수영·헬스·친구 모임 등을 정기적으로 운영하는 **개인 모임 주최자**를 위한 도구로, 다음 기능을 제공합니다:

- **모임 공지 관리**: 모임 생성/조회/수정과 참여자 공개 링크 공유 (F001~F005)
- **참여자 RSVP 관리**: 참여자가 회원가입 없이 공개 링크로 참석 여부를 응답하고, `access_token`으로 본인 응답만 수정 (F006~F008, F021)
- **정산(N빵)**: 총금액을 참여자 수로 나눠 1인당 분담액을 계산하고, 계좌 공유·입금 체크까지 처리 (F009~F012)

### 현재 상태 (기준선)

- Next.js 15 App Router + Supabase Auth 스타터킷 상태이며, 이메일/비밀번호 + 구글 OAuth 로그인이 이미 동작한다 (F020 충족).
- DB에는 `profiles` 테이블 하나뿐이며, 이번 로드맵의 4개 신규 테이블은 아직 존재하지 않는다.
- `app/protected/`는 인증 보호 영역으로 이미 구성되어 있고, 접근 제어는 `proxy.ts` + `lib/supabase/proxy.ts`에서 이뤄진다.
- 설치된 shadcn/ui 프리미티브: `badge`, `button`, `card`, `checkbox`, `dropdown-menu`, `input`, `label`.
- 품질 도구는 구성 완료 상태: `npm run lint`, `npm run typecheck`, `npm run test`(vitest), prettier, husky + commitlint.

### 개발 원칙 (프로젝트 제약)

- **폼 패턴**: react-hook-form / zod를 도입하지 않는다. 기존 `components/login-form.tsx` 컨벤션대로 순수 `useState` + `try/catch` 패턴을 유지한다.
- **Supabase 클라이언트 3분할 유지**: `lib/supabase/client.ts`(브라우저), `lib/supabase/server.ts`(Server Component/Action), `lib/supabase/proxy.ts`(세션 갱신/리다이렉트). `server.ts`의 클라이언트는 전역 변수에 저장하지 않고 함수마다 새로 생성한다.
- **비회원 쓰기는 전부 Server Action**: RSVP 제출/수정, 정산 저장은 Server Action에서 `access_token`·소유권을 검증한다.
- **경로 별칭**: `@/*` → 프로젝트 루트. `src/` 디렉토리는 없다.
- **범위 고정**: PRD의 "MVP 이후 기능(제외)" 항목(카풀 매칭 로직, 결제 연동, 참여자 계정, 알림, 반복 모임, 다중 정산 등)은 이번 로드맵에서 다루지 않는다.

## 개발 워크플로우

1. **작업 계획**
   - 기존 코드베이스를 학습하고 현재 상태를 파악
   - 새로운 작업을 포함하도록 `ROADMAP.md` 업데이트
   - 우선순위 작업은 마지막 완료된 작업 다음에 삽입

2. **작업 생성**
   - 기존 코드베이스를 학습하고 현재 상태를 파악
   - 고수준 명세서, 관련 파일, 수락 기준, 구현 단계 포함
   - API/비즈니스 로직 작업 시 "## 테스트 체크리스트" 섹션 필수 포함 (Playwright MCP 테스트 시나리오 작성)
   - 새 작업 문서는 빈 체크박스 상태로 시작하며 변경 사항 요약을 포함하지 않는다

3. **작업 구현**
   - 작업 파일의 명세서를 따름
   - 기능과 기능성 구현
   - Server Action 연동 및 비즈니스 로직 구현 시 Playwright MCP로 테스트 수행 필수
   - 각 단계 후 작업 파일 내 단계 진행 상황 업데이트
   - 구현 완료 후 Playwright MCP를 사용한 E2E 테스트 실행
   - 테스트 통과 확인 후 다음 단계로 진행
   - 각 단계 완료 후 중단하고 추가 지시를 기다림

4. **로드맵 업데이트**
   - 로드맵에서 완료된 작업을 ✅로 표시

## 개발 단계

### Phase 0: 데이터 스키마 구축

애플리케이션 골격의 토대. 이후 모든 Phase가 이 스키마와 생성된 타입에 의존하므로 가장 먼저 수행한다.

- **Task 001: Supabase 스키마 마이그레이션 및 RLS 정책 적용** - 우선순위
  - Supabase MCP(project_ref `hpxxhqbtkswhgpjgalqk`)로 `events` 테이블 생성 (id, host_id → auth.users.id, title, description, location, starts_at, rsvp_deadline nullable, status text open/closed/cancelled, created_at, updated_at)
  - `participants` 테이블 생성 (id, event_id → events.id, access_token UUID unique, name, status text attending/not_attending/pending, note, is_excluded_from_settlement boolean, created_at, updated_at)
  - `settlements` 테이블 생성 (id, event_id → events.id 유니크(1:1), total_amount integer ≥0 체크 제약, bank_account, account_holder, memo, created_at, updated_at)
  - `settlement_shares` 테이블 생성 (id, settlement_id → settlements.id, participant_id → participants.id, amount_due integer, is_paid boolean, paid_at timestamptz)
  - RLS 정책 적용: `events` — 누구나 SELECT, `auth.uid() = host_id`인 경우만 INSERT/UPDATE/DELETE
  - RLS 정책 적용: `participants` — 누구나 SELECT/INSERT, UPDATE/DELETE는 클라이언트에 열지 않고 Server Action에서 `access_token` 검증 후 처리
  - RLS 정책 적용: `settlements`, `settlement_shares` — 누구나 SELECT, 해당 모임 주최자만 편집
  - 조회 성능용 인덱스 추가 (`events.host_id`, `participants.event_id`, `participants.access_token`, `settlement_shares.settlement_id`)

- **Task 002: 데이터베이스 타입 재생성 및 도메인 타입 정의**
  - Supabase MCP로 `lib/database.types.ts` 재생성 (4개 신규 테이블 반영)
  - 3개 Supabase 클라이언트(`client.ts` / `server.ts` / `proxy.ts`)가 갱신된 `Database` 제네릭으로 정상 컴파일되는지 확인
  - 도메인 상수/타입 정의 파일 작성 (`lib/types/event.ts` 등): `EventStatus`(open/closed/cancelled), `ParticipantStatus`(attending/not_attending/pending) 리터럴 유니온
  - `npm run typecheck` 통과 확인

### Phase 1: 주최자 모임 CRUD (F001~F005)

주최자 라우트 골격을 세우고 모임 CRUD를 완성한다. 참여자 공개 화면 없이도 독립적으로 검증 가능한 단위다.

- **Task 003: 주최자 라우트 골격 및 공통 UI 컴포넌트 준비**
  - `app/protected/events/` 하위 라우트 골격 생성: `page.tsx`, `new/page.tsx`, `[eventId]/page.tsx`, `[eventId]/edit/page.tsx`, `[eventId]/settlement/page.tsx`
  - `app/e/[eventId]/page.tsx`, `app/e/[eventId]/r/[accessToken]/page.tsx` 공개 라우트 골격 생성
  - shadcn/ui 1순위 컴포넌트 설치: `npx shadcn@latest add textarea radio-group table dialog`
  - 공통 표시 유틸 작성: 일시 포맷(`starts_at`, `rsvp_deadline`), 상태 배지(open/closed/cancelled), 금액 포맷
  - 스타터킷 잔여 튜토리얼 UI(`components/tutorial/`)가 신규 화면과 충돌하지 않도록 정리 방향 확인

- **Task 004: 내 모임 목록 화면 구현 (F002)**
  - `app/protected/events/page.tsx`를 Server Component로 구현하고 `lib/supabase/server.ts`로 `host_id = 현재 사용자`인 모임 조회
  - 모임 카드/리스트에 제목·일시·상태 배지·참여자 수 요약 표시 (참여자 수는 `participants` 카운트 조인)
  - 모임 클릭 시 `/protected/events/[eventId]`로 이동
  - "새 모임 만들기" 버튼 → `/protected/events/new` 연결
  - 모임이 하나도 없을 때의 빈 상태 UI 표시
  - 로그인 성공 후 진입 동선에서 목록 화면에 도달하는지 확인

- **Task 005: 모임 생성 폼 구현 (F001)**
  - `app/protected/events/new/page.tsx` + 클라이언트 폼 컴포넌트(`components/event-form.tsx` 등) 작성
  - 입력 필드: 제목, 설명(textarea), 장소, 일시(starts_at), RSVP 마감일(선택)
  - 유효성 확인: 제목·일시 필수, 마감일이 있으면 시작 일시 이전인지 확인
  - 저장은 Server Action으로 처리하고 `host_id`를 서버에서 주입(클라이언트 값 신뢰 금지), `status`는 `open`으로 초기화
  - 순수 `useState` + `try/catch` 패턴 유지, 제출 중 버튼 비활성화 및 에러 메시지 표시
  - 저장 성공 시 생성된 모임 상세(`/protected/events/[eventId]`)로 리다이렉트
  - **테스트 체크리스트**: Playwright MCP로 로그인 → 생성 폼 입력 → 저장 → 상세 이동 플로우 검증, 필수값 누락 시 에러 노출 검증

- **Task 006: 모임 상세 화면 및 공개 링크 공유 구현 (F003, F005)**
  - `app/protected/events/[eventId]/page.tsx`에서 모임 단건 조회 후 제목/설명/장소/일시/마감일/상태 표시
  - 소유권 가드: `host_id !== auth.uid()`이거나 모임이 없으면 `notFound()` 처리
  - 참여자 공개 RSVP 링크(`/e/[eventId]` 절대 URL) 표시 및 복사 버튼 구현(클립보드 복사 + 복사 완료 피드백)
  - "모임 수정" / "정산 계산기로 이동" 버튼 연결
  - 참여자 현황 영역은 Task 010에서 채울 자리로 비워두고 안내 문구 표시
  - **테스트 체크리스트**: Playwright MCP로 타인 소유 모임 URL 접근 시 404 처리 검증, 공개 링크 복사 동작 검증

- **Task 007: 모임 수정 폼 구현 (F004)**
  - `app/protected/events/[eventId]/edit/page.tsx`에서 기존 값을 채운 폼 렌더링 (Task 005의 폼 컴포넌트 재사용)
  - 상태(status) 변경 UI 추가: 진행중(open) / 마감(closed) / 취소(cancelled)
  - Server Action에서 소유권 재검증 후 업데이트, `updated_at` 갱신
  - 저장 성공 시 모임 상세로 복귀하고 변경 내용이 즉시 반영되도록 캐시 무효화(`revalidatePath`)
  - **테스트 체크리스트**: Playwright MCP로 제목/일시/상태 수정 후 상세 화면 반영 검증, 소유자가 아닌 사용자의 수정 시도 차단 검증

### Phase 2: 참여자 공개 RSVP (F006~F008, F021)

비로그인 참여자 플로우를 완성하고, 수집된 응답을 주최자 상세 화면에 연결한다.

- **Task 008: 공개 라우트 인증 예외 및 RSVP 랜딩 구현 (F006)**
  - `lib/supabase/proxy.ts`에 `/e/` 경로 인증 예외 추가 (`getClaims()` 호출 전후에 다른 로직을 끼워 넣지 않도록 주의)
  - `app/e/[eventId]/page.tsx`에 모임 기본 정보(제목/일시/장소) 표시 — 비로그인 상태에서 접근 가능해야 함
  - RSVP 폼 구현: 이름 입력, 참석 여부 선택(radio-group: attending/not_attending), 카풀 메모(textarea, 최대 200자, 선택)
  - 제출 Server Action에서 `access_token` 발급(UUID) 후 `participants` INSERT, 모임 상태가 `open`이 아니거나 마감일이 지난 경우 제출 거부
  - 제출 성공 시 발급된 `access_token`을 `localStorage`에 저장하고 `/e/[eventId]/r/[accessToken]`으로 리다이렉트, 개인 링크 안내 문구 노출
  - 저장된 토큰이 있는 재방문자는 랜딩에서 개인 응답 수정 페이지로 안내
  - **테스트 체크리스트**: Playwright MCP로 로그아웃 상태에서 `/e/[eventId]` 접근이 로그인으로 리다이렉트되지 않는지 검증, 제출 → 개인 링크 이동 플로우 검증, 200자 초과 메모 거부 검증

- **Task 009: 참여자 응답 수정 페이지 구현 (F007, F021)**
  - `app/e/[eventId]/r/[accessToken]/page.tsx`에서 `access_token`으로 참여자 단건 조회, 토큰이 해당 `event_id`에 속하는지 서버에서 검증
  - 토큰 불일치/미존재 시 접근 불가 에러 화면 표시 (다른 참여자 정보가 노출되지 않도록)
  - 참석 여부·카풀 메모 수정 폼 렌더링 (기존 값 프리필)
  - 수정 Server Action에서 `access_token` 일치를 강제하고, 클라이언트가 `event_id`·`id`를 임의 지정할 수 없게 처리
  - 저장 성공 시 동일 화면에 갱신 결과 표시
  - 정산 정보 표시 영역은 Task 013에서 채울 자리로 확보
  - **테스트 체크리스트**: Playwright MCP로 유효 토큰 수정 성공 검증, 위조/타 모임 토큰 접근 차단 검증, 참석→불참 변경 후 주최자 화면 반영 검증

- **Task 010: 주최자 참여자 현황 테이블 및 집계 구현 (F008)**
  - 모임 상세 화면에 참여자 테이블 추가 (이름 / 참석 여부 / 카풀 메모 / 응답 시각)
  - 집계 배지 표시: 참석·불참·미응답(pending) 인원 수
  - 참여자가 없을 때의 빈 상태 UI 표시
  - 참여자 응답이 반영되도록 상세 페이지 캐시 전략 정리(동적 렌더링 또는 `revalidatePath`)
  - **테스트 체크리스트**: Playwright MCP로 공개 링크 RSVP 제출 후 주최자 상세 화면에 참여자 행과 집계가 반영되는지 검증

### Phase 3: 정산(N빵) (F009~F012)

RSVP 데이터를 기반으로 정산을 계산하고 주최자·참여자 양쪽에 결과를 노출한다.

- **Task 011: 정산 계산 로직 분리 및 유닛 테스트**
  - `lib/settlement.ts`에 순수 함수로 계산 로직 구현 (총금액 + 정산 대상 참여자 목록 → 1인당 분담액)
  - 정산 대상 산정 규칙 확정: `status = attending` 이고 `is_excluded_from_settlement = false`인 참여자
  - 나누어떨어지지 않는 금액 처리 규칙 정의(원 단위 반올림/잔액 처리) 및 문서화
  - 대상 인원 0명, 총금액 0원 등 경계 조건 처리
  - `lib/settlement.test.ts` 작성 후 `npm run test` 통과 확인

- **Task 012: 정산 계산기 화면 구현 (F009, F010, F011)**
  - `app/protected/events/[eventId]/settlement/page.tsx`에서 소유권 가드 후 기존 `settlements`/`settlement_shares` 로드
  - 총금액(total_amount) 입력, 참여자별 정산 포함/제외 체크박스(is_excluded_from_settlement) 제공
  - `lib/settlement.ts`로 1인당 금액(amount_due)을 계산해 저장 전 미리보기 표시
  - 계좌번호/예금주/정산 메모 입력 필드 제공
  - 저장 Server Action: `settlements`를 event당 1건으로 upsert하고 `settlement_shares`를 대상 참여자 기준으로 재생성(계산 시점 금액 스냅샷 저장)
  - 참여자별 입금 완료 여부(is_paid) 수동 체크 및 `paid_at` 기록
  - "모임 상세로 돌아가기" 링크 제공
  - **테스트 체크리스트**: Playwright MCP로 총금액 입력 → 제외 체크 → 저장 → 재진입 시 값 유지 검증, 입금 체크 토글 검증, 음수/비숫자 총금액 거부 검증

- **Task 013: 참여자 분담액·계좌 정보 노출 (F012)**
  - 참여자 응답 수정 페이지에 본인 `amount_due` 표시 (정산 미등록 시 안내 문구)
  - 계좌번호/예금주/정산 메모를 안내용으로 표시하고 계좌번호 복사 버튼 제공
  - 정산에서 제외된 참여자에게는 분담액 대신 제외 안내 표시
  - 본인 `settlement_shares` 레코드만 조회되도록 `access_token` 기준 서버 조회 유지
  - **테스트 체크리스트**: Playwright MCP로 주최자 정산 저장 → 참여자 개인 링크에서 분담액·계좌 확인 플로우 검증, 정산 제외 참여자 화면 검증

- **Task 013-1: 전체 사용자 플로우 통합 테스트**
  - Playwright MCP로 주최자 플로우 E2E 검증: 로그인 → 모임 생성 → 링크 복사 → 참여자 확인 → 수정 → 정산 → 입금 체크
  - Playwright MCP로 참여자 플로우 E2E 검증: 공개 링크 진입 → RSVP 제출 → 개인 링크 재방문 → 응답 수정 → 분담액 확인
  - 권한 엣지 케이스 검증: 타인 모임 접근, 위조 `access_token`, 로그아웃 상태의 주최자 라우트 접근
  - 입력 엣지 케이스 검증: 필수값 누락, 200자 초과 메모, 잘못된 금액, 마감일 지난 모임 RSVP

### Phase 4: 다듬기 및 문서화

- **Task 014: 빈 상태 및 마감/취소 모임 처리**
  - 모임 목록·참여자 테이블·정산 화면의 빈 상태 UI 정리
  - RSVP 마감일이 지났거나 `status`가 `closed`/`cancelled`인 모임의 공개 페이지 처리 (제출 폼 비활성화 + 안내 문구)
  - 취소된 모임을 주최자 목록·상세에서 명확히 구분 표시
  - 에러 화면 문구 통일 (없는 모임, 접근 불가 토큰, 저장 실패)
  - 모바일 반응형 확인 (참여자 테이블 가로 스크롤 포함)

- **Task 015: 품질 게이트 및 문서 갱신**
  - `npm run lint`, `npm run typecheck`, `npm run test` 전부 통과 확인
  - `npm run format:check` 통과 확인 및 husky/commitlint 훅 정상 동작 확인
  - `CLAUDE.md`에 신규 내용 반영: `app/protected/events/*` 및 `app/e/*` 라우트, 4개 신규 테이블, `proxy.ts`의 `/e/` 인증 예외 규칙, `lib/settlement.ts` 역할
  - 신규 환경 변수가 필요한 경우 README에 기재 (없다면 불필요함을 확인)
  - Vercel 배포 시 공개 링크 절대 URL 생성 기준(사이트 URL 확보 방식) 점검
