# 모임 이벤트 관리 웹

모임 주최자가 공지·참여자 관리(RSVP)·정산(N빵)을 하나의 웹 도구에서 끝내도록 돕는 서비스입니다.

## 🎯 프로젝트 개요

**목적**: 모임 주최자가 공지·참여자 관리(RSVP)·정산(N빵)을 혼자 도맡는 부담을 하나의 웹 도구로 줄여줍니다.

**사용자**: 수영, 헬스, 친구 모임 등을 정기적으로 운영하는 개인 모임 주최자. 참여자는 회원가입 없이 공개 링크로만 참여합니다.

자세한 요구사항은 [docs/PRD.md](./docs/PRD.md), 개발 진행 계획은 [docs/ROADMAP.md](./docs/ROADMAP.md)를 참고하세요.

## 📱 주요 기능

- **모임 공지 관리**: 모임 생성/조회/수정과 참여자 공개 링크 공유
- **참여자 RSVP 관리**: 참여자가 회원가입 없이 공개 링크로 참석 여부를 응답하고, 개인 토큰으로 본인 응답만 수정
- **정산(N빵)**: 총금액을 참여자 수로 나눠 1인당 분담액을 계산하고, 계좌 공유·입금 체크까지 처리

## 🛠️ 기술 스택

- **Framework**: Next.js (App Router)
- **Runtime**: React 19
- **Language**: TypeScript
- **Backend/DB**: Supabase (Auth, Postgres, RLS)
- **Styling**: Tailwind CSS + shadcn/ui (new-york 스타일)
- **Testing**: Vitest
- **배포**: Vercel

## 🚀 시작하기

### 사전 준비

[Supabase 대시보드](https://database.new)에서 프로젝트를 생성합니다.

### 환경 변수

`.env.local`에 다음 두 값만 설정합니다(service-role 키는 사용하지 않습니다):

```env
NEXT_PUBLIC_SUPABASE_URL=[Supabase 프로젝트 URL]
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[Supabase publishable/anon 키]
```

두 값은 [Supabase 프로젝트의 API 설정](https://supabase.com/dashboard/project/_?showConnect=true)에서 확인할 수 있습니다.

### 로컬 실행

```bash
npm install
npm run dev
```

[localhost:3000](http://localhost:3000)에서 확인합니다.

### 품질 검사

```bash
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run test          # vitest run
npm run format:check
npm run build
```

## 📖 문서

- [PRD](./docs/PRD.md) — 상세 요구사항 및 데이터 모델
- [로드맵](./docs/ROADMAP.md) — 개발 단계별 계획
- [린 캔버스](./docs/LEANCANVAS.md) — 비즈니스 모델 개요
- [개발 가이드](./CLAUDE.md) — Claude Code용 개발 지침
