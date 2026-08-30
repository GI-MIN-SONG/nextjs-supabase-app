# Supabase 사용 가이드

이 프로젝트에서 Supabase를 다루는 방법. 아키텍처적 사실과 이 저장소만의 제약을 담는다.

## 프로젝트 정보

- project_ref: `hpxxhqbtkswhgpjgalqk` (`.mcp.json`에 등록된 `supabase` MCP 서버가 이 프로젝트에 고정되어 있음)
- 환경 변수는 `.env.local`에 두 개만 존재한다: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. **service-role 키는 이 프로젝트에 없다** — 즉 어떤 클라이언트도 RLS를 우회할 수 없다. RLS 정책을 설계할 때 이 전제를 반드시 반영한다(예: Server Action이 RLS를 우회해서 처리해줄 거라고 가정하지 않는다).

## Supabase 클라이언트 3분할 (절대 통합/우회 금지)

- `lib/supabase/client.ts` — 브라우저(Client Component) 전용. `createBrowserClient`.
- `lib/supabase/server.ts` — Server Component/Server Action 전용. `createServerClient` + `next/headers`의 `cookies()`. **Fluid compute 환경 때문에 함수 내부에서 매번 새 클라이언트를 생성**해야 한다 — 모듈 스코프 전역 변수에 인스턴스를 캐싱하지 않는다.
- `lib/supabase/proxy.ts` — `updateSession()`이 세션 쿠키 갱신과 비로그인 리다이렉트를 담당.

세 파일 모두 `import type { Database } from "@/lib/database.types"` 제네릭을 사용한다. 새 Supabase 클라이언트 생성 코드를 다른 곳에 만들지 않고, 항상 이 3개 파일 중 하나를 통해서만 클라이언트를 얻는다.

## `proxy.ts`는 미들웨어다 (`middleware.ts` 아님)

루트의 `proxy.ts`가 Next.js 미들웨어 역할(`export function proxy(request)`)을 한다. 새 Next.js 버전에서 미들웨어가 "proxy"로 이름이 바뀐 것을 반영한 것이다. 인증 리다이렉트/세션/공개 경로 예외 로직을 수정할 때는 `middleware.ts`를 새로 만들지 말고 `proxy.ts` + `lib/supabase/proxy.ts`를 수정한다.

`lib/supabase/proxy.ts`에서 `supabase.auth.getClaims()` 호출 전후에 다른 로직(로깅, 조건 분기 등)을 끼워 넣지 않는다 — 세션이 무작위로 끊기는 버그의 원인이 된다.

`lib/utils.ts`의 `hasEnvVars`가 false면 proxy가 세션 체크 자체를 건너뛴다 — 인증 관련 버그를 디버깅할 때 이 조건부터 확인한다.

### 공개 라우트 추가 시

비로그인 접근을 허용해야 하는 새 공개 라우트(예: 모임 참여자 공개 라우트 `/e/[eventId]`)를 추가할 때는 `lib/supabase/proxy.ts`의 리다이렉트 조건문(`!request.nextUrl.pathname.startsWith("/auth")` 부분)에 해당 경로 prefix 예외를 추가해야 한다. 이 수정 없이 공개 라우트를 추가하면 비로그인 사용자가 `/auth/login`으로 강제 리다이렉트된다.

## 인증 흐름

`app/auth/`에 로그인/회원가입/비밀번호 재설정 페이지가 있고, 실제 폼 로직은 `components/*-form.tsx`(`login-form.tsx`, `sign-up-form.tsx`, `forgot-password-form.tsx`, `update-password-form.tsx`)에 있다. `app/auth/confirm/route.ts`가 이메일 확인 콜백을 처리한다. `app/protected/`는 인증이 필요한 영역이며, 실제 접근 제어는 페이지 레벨이 아니라 `proxy.ts`의 리다이렉트 규칙으로 이뤄진다.

## DB 스키마 변경 시 필수 절차

1. Supabase MCP(`.mcp.json`의 `supabase` 서버, project_ref 고정)로 마이그레이션을 적용한다. 마이그레이션 SQL 파일을 저장소에 수동으로 만들지 않는다 — `supabase/migrations/` 같은 로컬 디렉토리가 없다.
2. 스키마 변경 직후 반드시 Supabase MCP로 `lib/database.types.ts`를 재생성한다. 이 파일은 전량 자동 생성 파일이므로 손으로 편집하지 않는다.
3. 재생성 후 `lib/supabase/client.ts`, `server.ts`, `proxy.ts` 3개 파일이 새 `Database` 제네릭으로 여전히 타입 에러 없이 컴파일되는지 `npm run typecheck`로 확인한다.
4. 새 테이블에 대응하는 도메인 리터럴 유니온 타입(상태값 등)이 필요하면 `lib/types/` 아래 별도 파일에 정의한다(`lib/database.types.ts`에는 추가하지 않는다).
5. 원격 프로덕션 DB에 대한 되돌리기 어려운 변경이므로, 실제 `apply_migration` 호출 전 DDL 전문을 사용자에게 제시하고 승인받는다.

## RLS 설계 원칙 (service-role 키 부재 전제)

이 프로젝트는 service-role 키가 없으므로, "RLS로 클라이언트 직접 접근을 막고 Server Action은 우회한다"는 패턴을 쓸 수 없다 — Server Action도 publishable key로 동작하는 이상 RLS를 그대로 적용받는다.

따라서 "본인만 수정 가능"해야 하지만 인증되지 않은 사용자(참여자 등)가 수행해야 하는 쓰기 작업은:

- RLS에서는 해당 테이블에 필요한 최소한의 개방(`using (true)` 등)만 허용하고,
- 실제 신원 검증(예: `access_token` 일치)은 Server Action의 쿼리 조건(`WHERE id = ? AND access_token = ?`)에서 강제한다.
- 이는 SELECT가 이미 공개되어 있는 리소스에 한해 적용 가능한 신뢰 경계다 — SELECT 자체가 비공개인 테이블에 이 패턴을 적용하지 않는다.

소유권이 명확한 리소스(로그인한 host_id 기준)는 RLS에서 직접 `auth.uid() = host_id` 또는 조인 서브쿼리로 강제한다 — defense-in-depth 원칙에 따라 Server Action에서도 별도로 소유권을 재검증한다.

## 비회원 쓰기는 전부 Server Action

참여자 RSVP 제출/수정, 정산 저장 등 계정 없는 사용자가 수행하는 쓰기 작업은 반드시 Server Action에서 처리하고, 클라이언트가 보낸 `event_id`/`participant_id`를 그대로 신뢰해 권한 검증 없이 UPDATE하지 않는다.

## MCP 사용 규칙

- Supabase 스키마/타입 작업은 반드시 `.mcp.json`에 등록된 `supabase` MCP를 통해 수행하고, 다른 project_ref를 대상으로 조작하지 않는다.
- 스키마를 바꾸기 전에는 `list_tables`로 현재 구조를 먼저 확인한다.
- 문제를 디버깅할 때는 `get_advisors`, 로그 조회 도구부터 확인하고 나서 변경한다.
