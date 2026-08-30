# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Next.js (App Router) + Supabase Auth 스타터킷 위에 "모임 이벤트 관리 웹"(RSVP + N빵 정산) MVP를 구축 중이다. `create-next-app --example with-supabase` 기반이며, 쿠키 기반 세션을 `@supabase/ssr`로 Server Components/Client Components/Route Handlers/proxy 전반에서 공유한다. 상세 스펙은 `docs/PRD.md`, 진행 계획은 `docs/ROADMAP.md`가 단일 진실 공급원이다.

## 명령어

```bash
npm run dev        # 개발 서버 (localhost:3000)
npm run build      # 프로덕션 빌드
npm run start       # 프로덕션 서버 실행
npm run lint        # ESLint (next/core-web-vitals, next/typescript)
npm run typecheck   # tsc --noEmit
npm run test         # vitest run
npm run format:check
```

환경 변수는 `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 두 개만 필요하다(service-role 키 없음).

## 경로 별칭

`@/*` → 저장소 루트 하나만 정의되어 있다. `src/` 디렉토리는 존재하지 않는다 — 실제 소스는 `app/`, `components/`, `lib/`가 프로젝트 루트에 직접 있다.

## 컨텍스트 문서

세부 규칙은 아래 문서로 분리되어 있다. 작업 종류에 맞는 문서를 참고할 것.

@docs/next-js.md
@docs/supabase.md
@docs/coding-style.md

- `docs/next-js.md`: App Router 구조, Server/Client Component 경계, Server Actions, 라우트 배치 기준, 품질 체크리스트
- `docs/supabase.md`: Supabase 클라이언트 3분할, `proxy.ts` 인증 흐름, DB 스키마 변경 절차, RLS 설계 원칙, MCP 사용 규칙
- `docs/coding-style.md`: 네이밍, 폼 구현 표준(useState 패턴), Tailwind/shadcn 스타일링, 커밋 메시지, 테스트

## 프로젝트 고유 문서 우선순위

문서 간 내용이 상충하면 `docs/PRD.md`/`docs/ROADMAP.md`(이 프로젝트 고유의 최신 스펙)를 위 세 컨텍스트 문서보다 우선한다. `shrimp-rules.md`는 AI 에이전트가 이 저장소에서 작업할 때 따라야 할 프로젝트 전용 규칙(의사결정 기준 포함)을 담고 있으므로 모호한 상황에서 참고한다.
