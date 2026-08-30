# AI Agent 개발 표준 (nextjs-supabase-app)

이 문서는 AI Agent가 이 저장소에서 코드를 수정/추가할 때 반드시 따라야 하는 **프로젝트 전용** 규칙만 담는다. Next.js/React/TypeScript 일반 지식은 다루지 않는다.

## 프로젝트 개요

- **정체성**: `create-next-app --example with-supabase` 기반 스타터킷 위에 "모임 이벤트 관리 웹"(RSVP + N빵 정산) MVP를 구축 중. 상세 스펙은 `docs/PRD.md`, 진행 계획은 `docs/ROADMAP.md`가 단일 진실 공급원(source of truth)이다.
- **현재 DB 상태**: `lib/database.types.ts`에는 `profiles` 테이블만 존재한다. `events`/`participants`/`settlements`/`settlement_shares` 4개 테이블은 `docs/ROADMAP.md`의 Task 001 완료 전까지는 코드에 존재하지 않는다 — 이 테이블을 참조하는 코드를 작성하기 전에 반드시 `lib/database.types.ts`에 해당 테이블이 실제로 존재하는지 확인할 것.
- **경로 별칭**: `@/*` → 저장소 루트 하나만 존재(`tsconfig.json`, `vitest.config.mts`, `components.json` 동일). `src/` 디렉토리를 새로 만들지 말 것. 소스는 `app/`, `components/`, `lib/`에 직접 위치한다.

## Supabase 클라이언트 3분할 (절대 통합/우회 금지)

- `lib/supabase/client.ts` — 브라우저(Client Component) 전용, `createBrowserClient`.
- `lib/supabase/server.ts` — Server Component/Server Action 전용, `createServerClient` + `next/headers`의 `cookies()`. **함수 내부에서 매번 새 클라이언트를 생성**해야 하며, 모듈 스코프 전역 변수에 클라이언트 인스턴스를 캐싱하는 코드를 추가하지 말 것(Fluid compute 환경에서 세션이 섞이는 버그 원인).
- `lib/supabase/proxy.ts` — `updateSession()`이 세션 쿠키 갱신과 비로그인 리다이렉트를 담당. `supabase.auth.getClaims()` 호출 앞뒤에 다른 로직(로깅, 조건 분기 등)을 끼워 넣지 말 것 — 세션이 무작위로 끊기는 버그의 원인이 된다.
- 세 파일 모두 `import type { Database } from "@/lib/database.types"` 제네릭을 사용한다. 새 Supabase 클라이언트 생성 코드를 어딘가에 또 만들지 말고, 항상 이 3개 파일 중 하나를 통해서만 클라이언트를 얻을 것.

## `proxy.ts`는 미들웨어다 (middleware.ts 아님)

- 루트의 `proxy.ts`가 Next.js 미들웨어 역할(`export function proxy(request)`)을 한다. 인증 리다이렉트/세션/공개 경로 예외 로직을 수정할 때는 `middleware.ts`를 새로 만들지 말고 `proxy.ts` + `lib/supabase/proxy.ts`를 수정할 것.
- 비로그인 접근을 허용해야 하는 새 공개 라우트(예: `docs/ROADMAP.md`의 `/e/[eventId]` 참여자 공개 라우트)를 추가할 때는 `lib/supabase/proxy.ts`의 리다이렉트 조건문(`!request.nextUrl.pathname.startsWith("/auth")` 부분)에 해당 경로 prefix 예외를 추가해야 한다. 이 수정 없이 공개 라우트를 추가하면 비로그인 사용자가 `/auth/login`으로 강제 리다이렉트된다.
- `lib/utils.ts`의 `hasEnvVars`가 false면 proxy가 세션 체크 자체를 건너뛴다 — 인증 관련 버그를 디버깅할 때 이 조건부터 확인할 것.

## DB 스키마 변경 시 필수 절차 (다중 파일 연동)

1. Supabase MCP(`.mcp.json`에 등록된 `supabase` 서버, `project_ref=hpxxhqbtkswhgpjgalqk`)로 마이그레이션을 적용한다. 마이그레이션 SQL 파일을 저장소에 수동으로 만들지 말 것 — 이 프로젝트에는 `supabase/migrations/` 같은 로컬 마이그레이션 디렉토리가 없다.
2. 스키마 변경 직후 반드시 Supabase MCP로 `lib/database.types.ts`를 재생성한다. 이 파일을 손으로 편집하지 말 것(전체가 자동 생성 파일이다).
3. `lib/database.types.ts` 갱신 후 `lib/supabase/client.ts`, `server.ts`, `proxy.ts` 3개 파일이 새 `Database` 제네릭으로 여전히 타입 에러 없이 컴파일되는지 `npm run typecheck`로 확인한다.
4. 새 테이블에 대응하는 도메인 리터럴 유니온 타입(예: 상태값)이 필요하면 `lib/` 아래 별도 타입 파일에 정의한다(기존 `lib/database.types.ts`에는 추가하지 않는다).

## 폼 구현 표준 (react-hook-form/zod 도입 금지)

- 이 저장소는 폼에 react-hook-form이나 zod를 쓰지 않는다. `components/login-form.tsx`, `components/sign-up-form.tsx`가 표준 패턴이다: `"use client"` + `useState`로 필드/에러/로딩 상태 관리, `try { ... } catch (error: unknown) { setError(...) } finally { setIsLoading(false) }` 구조, 제출 중 버튼 `disabled`.
- 새 폼을 추가할 때 이 패턴에서 벗어나 다른 폼 라이브러리를 `package.json`에 추가하지 말 것. 자세한 예시는 `docs/coding-style.md` 참고.
- 비회원(계정 없는 사용자)이 쓰기 작업(참여자 RSVP 제출/수정, 정산 저장 등)을 수행하는 폼은 반드시 Server Action에서 처리하고, 서버 측에서 `access_token` 일치 여부를 검증한 뒤에만 DB를 변경한다. 클라이언트가 보낸 `event_id`/`participant_id`를 그대로 신뢰해 권한 검증 없이 UPDATE하지 말 것.

## 컨텍스트 문서 구조

- `CLAUDE.md`가 `@docs/next-js.md`, `@docs/supabase.md`, `@docs/coding-style.md` 세 파일을 import한다. 이 세 파일은 이 저장소의 실제 구조(루트 `app/`, `components/`, `lib/`)를 기준으로 작성된 프로젝트 전용 문서다 — 예전 `docs/guides/*.md`(일반화된 템플릿, `src/app` 구조 전제)는 삭제되었다. Next.js/Supabase/스타일 관련 세부 규칙을 찾을 때는 이 세 파일을 먼저 확인할 것.

## `docs/ROADMAP.md`의 향후 라우트 구조를 신규 기능 배치 기준으로 사용

- 모임 관리 기능을 구현할 때는 `docs/ROADMAP.md`에 정의된 라우트 구조를 따른다: 주최자(인증 필요) 기능은 `app/protected/events/` 하위, 참여자(비인증 공개) 기능은 `app/e/[eventId]/` 하위. 이 두 트리 바깥에 유사 기능을 새로 만들지 말 것.
- `app/protected/` 하위에 새 페이지를 추가할 때 접근 제어를 페이지 안에서 직접 구현하지 말 것 — 접근 제어는 `proxy.ts`의 리다이렉트 규칙이 담당한다(`CLAUDE.md` 참조). 단, 특정 리소스의 소유권 검증(예: `host_id !== auth.uid()`)은 페이지/Server Action 레벨에서 별도로 처리해야 한다(proxy는 로그인 여부만 검사하고 리소스 소유권은 검사하지 않는다).

## shadcn/ui 컴포넌트 추가

- 새 UI 프리미티브가 필요하면 `npx shadcn@latest add <name>`으로 설치한다. `components/ui/` 아래 파일을 직접 손으로 새로 작성하지 말 것.
- `components.json`의 설정(`style: new-york`, `baseColor: neutral`, `cssVariables: true`, alias 매핑)을 변경하지 말 것 — 기존 설치된 컴포넌트(`badge`, `button`, `card`, `checkbox`, `dropdown-menu`, `input`, `label`)와 스타일이 어긋난다.
- `components/tutorial/`은 스타터킷 기본 튜토리얼 UI로 실제 기능과 무관하다. 새 기능이 이 디렉토리의 컴포넌트를 참조하거나 확장하지 말 것. 정리가 필요하면 삭제 대상으로만 취급한다.

## 커밋/품질 게이트 (husky·commitlint·lint-staged·CI)

- 커밋 메시지는 `commitlint.config.js`의 커스텀 `headerPattern`에 의해 검사된다: 이모지(선택) + 공백 + `feat|fix|docs|style|refactor|perf|test|chore` 중 하나 + `: ` + 본문. 예: `✨ feat: 모임 생성 폼 추가`. 이 타입 목록에 없는 타입(예: `build`, `ci`)을 쓰지 말 것.
- `.husky/pre-commit`, `.husky/commit-msg` 훅과 `lint-staged`(`*.{js,jsx,ts,tsx}` → `eslint --fix` + `prettier --write`, `*.{json,md,css}` → `prettier --write`)가 커밋 시 자동 실행된다. `git commit --no-verify`로 이 훅을 우회하지 말 것.
- 코드 변경 후 PR/커밋 전에 최소 `npm run lint`, `npm run typecheck`를 실행해 CI(`.github/workflows/ci.yml`: lint → typecheck → test → build)와 동일한 검사를 로컬에서 먼저 통과시킨다. `lib/` 순수 함수(예: 향후 `lib/settlement.ts`)를 추가할 때는 대응하는 `*.test.ts`를 `vitest`(jsdom, globals: true)로 작성한다 — `lib/utils.test.ts`가 기존 예시다.

## MCP 사용 규칙

- `.mcp.json`에 `supabase`(HTTP, project_ref 고정)와 `shrimp-task-manager`(로컬 stdio, `DATA_DIR`이 이 저장소의 `shrimp_data/`로 고정)가 등록되어 있다. Supabase 스키마/타입 작업은 반드시 이 `supabase` MCP를 통해 수행하고, 다른 project_ref를 대상으로 조작하지 말 것.
- `shrimp_data/`는 shrimp-task-manager의 작업 데이터 저장 디렉토리다. 이 안의 파일을 프로젝트 문서(PRD/ROADMAP 등)와 혼동해 직접 편집하지 말 것.

## AI 의사결정 기준 (모호한 상황 판단)

- **새 기능이 로그인이 필요한가?** → 필요하면 `app/protected/` 하위, 불필요(참여자 공개 기능)하면 `app/e/` 하위 + `lib/supabase/proxy.ts`에 경로 예외 추가.
- **폼을 새로 만드는가?** → 항상 `useState` + `try/catch` 패턴(`components/login-form.tsx` 참고)을 쓴다. react-hook-form/zod 사용 여부를 고민하지 말 것(이미 배제됨).
- **DB 관련 작업인가?** → SQL 파일을 직접 작성하지 말고 Supabase MCP로 처리 후 `lib/database.types.ts`를 재생성한다.
- **문서 간 내용이 상충하는가?** → `docs/PRD.md`/`docs/ROADMAP.md`(프로젝트 고유 최신 스펙)를 `docs/next-js.md`/`docs/supabase.md`/`docs/coding-style.md`(컨텍스트 문서)보다 우선한다. `CLAUDE.md`는 아키텍처/명령어 등 저장소 전반의 사실을 담은 최상위 근거로 취급한다.
- **비회원 사용자가 데이터를 쓰는 기능인가?** → 클라이언트 직접 DB 접근이 아니라 Server Action + `access_token` 서버 검증으로 구현한다.

## 금지 사항 요약

- `middleware.ts` 파일을 새로 만들지 말 것(이 저장소는 `proxy.ts`를 쓴다).
- `lib/supabase/server.ts`의 클라이언트를 전역 변수에 캐싱하지 말 것.
- `lib/supabase/proxy.ts`의 `getClaims()` 호출 전후에 무관한 로직을 삽입하지 말 것.
- `lib/database.types.ts`를 손으로 편집하지 말 것.
- react-hook-form, zod, 또는 다른 폼 상태 관리 라이브러리를 `package.json`에 추가하지 말 것.
- 존재하지 않는 `src/app`, `src/components` 같은 구조를 전제로 파일을 생성하지 말 것 — 실제 소스는 루트의 `app/`, `components/`, `lib/`다.
- `git commit --no-verify` 등으로 husky/lint-staged/commitlint 훅을 우회하지 말 것.
- commitlint 허용 타입(`feat|fix|docs|style|refactor|perf|test|chore`) 외의 커밋 타입을 사용하지 말 것.
- `components/ui/` 파일을 손으로 새로 작성하지 말고 `npx shadcn@latest add`를 사용할 것.
- `docs/ROADMAP.md`에 명시된 "MVP 이후 기능(제외)" 항목(카풀 매칭 로직, 실제 결제 연동, 참여자 계정, 알림 시스템, 모임 반복/템플릿, 다중 정산)을 구현하지 말 것 — 명시적 지시가 있을 때만 예외.
