# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Next.js (App Router) + Supabase Auth 스타터킷. `create-next-app --example with-supabase` 기반이며, 쿠키 기반 세션을 `@supabase/ssr`로 Server Components/Client Components/Route Handlers/proxy 전반에서 공유한다.

## 명령어

```bash
npm run dev      # 개발 서버 (localhost:3000)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 실행
npm run lint     # ESLint (next/core-web-vitals, next/typescript)
```

- 테스트 프레임워크는 구성되어 있지 않다 (테스트 스크립트 없음).
- 타입 체크는 별도 스크립트 없이 `npm run build`(또는 `npx tsc --noEmit`)로 확인한다.
- 환경 변수는 `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 두 개만 필요하다 (`.env.example`은 없음).

## 아키텍처

### Supabase 클라이언트는 3곳에서 각각 다르게 생성된다

- `lib/supabase/client.ts` — 브라우저(Client Component)용. `createBrowserClient`.
- `lib/supabase/server.ts` — Server Component/Server Action용. `createServerClient` + `next/headers`의 `cookies()`. Fluid compute 환경 때문에 **전역 변수에 클라이언트를 저장하지 말고 함수마다 새로 생성**해야 한다.
- `lib/supabase/proxy.ts` — `updateSession()`이 proxy(미들웨어)에서 세션 쿠키를 갱신하고, 비로그인 사용자를 `/auth/login`으로 리다이렉트한다. `supabase.auth.getClaims()` 호출 전후로 다른 코드를 끼워 넣지 말 것 — 세션이 무작위로 끊기는 버그의 원인이 된다.

세 클라이언트 모두 `lib/database.types.ts`의 `Database` 타입으로 제네릭을 건다. 스키마가 바뀌면 Supabase MCP(`.mcp.json`에 등록된 `supabase` 서버, project_ref `hpxxhqbtkswhgpjgalqk`)로 이 타입 파일을 재생성해야 한다.

### `middleware.ts`가 아니라 `proxy.ts`

루트의 `proxy.ts`가 Next.js의 미들웨어 역할을 한다 (`export function proxy(request)`, `updateSession()` 위임). 새 Next.js 버전에서 미들웨어가 "proxy"로 이름이 바뀐 것을 반영한 것이므로, 인증 리다이렉트/세션 로직을 만질 때는 `middleware.ts`가 아니라 `proxy.ts` + `lib/supabase/proxy.ts`를 확인해야 한다. `hasEnvVars`(`lib/utils.ts`)가 false면 proxy가 세션 체크를 건너뛴다.

### 인증 흐름

`app/auth/`에 로그인/회원가입/비밀번호 재설정 페이지가 있고, 실제 폼 로직은 `components/*-form.tsx`(`login-form.tsx`, `sign-up-form.tsx`, `forgot-password-form.tsx`, `update-password-form.tsx`)에 있다. `app/auth/confirm/route.ts`가 이메일 확인 콜백을 처리한다. `app/protected/`는 인증이 필요한 영역이며, 실제 접근 제어는 페이지 레벨이 아니라 `proxy.ts`의 리다이렉트 규칙으로 이뤄진다.

### 경로 별칭

`tsconfig.json`과 `components.json`에 `@/*` → 루트 하나만 정의되어 있다. 즉 `@/components`, `@/lib`, `@/lib/supabase/server` 형태로 임포트한다. `src/` 디렉토리는 존재하지 않는다 — 실제 소스는 `app/`, `components/`, `lib/`가 프로젝트 루트에 직접 있다.

### UI 컴포넌트

- `components/ui/`: shadcn/ui (`new-york` 스타일, `neutral` base color) 프리미티브. `npx shadcn@latest add <name>`으로 추가.
- `components/`: 페이지 전반에서 쓰는 인증/레이아웃 관련 컴포넌트.
- `components/tutorial/`: 스타터킷 기본 튜토리얼 UI (실제 기능과 무관, 필요 없으면 삭제 대상).
- 스타일은 Tailwind CSS + `lib/utils.ts`의 `cn()`(clsx + tailwind-merge)로 클래스를 합성한다.

## `docs/guides/` 문서 주의사항

`docs/guides/`에 있는 4개 문서(`project-structure.md`, `nextjs-15.md`, `component-patterns.md`, `forms-react-hook-form.md`, `styling-guide.md`)는 **일반화된 템플릿 가이드**로, `src/app`, `src/components` 같은 구조를 전제로 작성되어 있다. 이 저장소의 실제 구조(루트에 `app/`, `components/`, `lib/`)와 다르므로 경로 예시는 그대로 믿지 말고 실제 파일 위치를 기준으로 판단할 것. 코딩 스타일/패턴 가이드(Server Components 우선, `'use client'` 최소화, Zod+RHF+Server Actions 조합, shadcn 시맨틱 컬러 사용 등) 자체는 유효하다.
