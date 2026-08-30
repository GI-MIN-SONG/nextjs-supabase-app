# Next.js 개발 가이드

이 저장소(Next.js 15, App Router)에서 페이지/라우트/컴포넌트를 작성할 때 따르는 규칙이다. 일반적인 Next.js 지식이 아니라 **이 프로젝트에서 실제로 유효한 것만** 담는다.

## App Router 구조 (이 저장소 기준)

소스는 `src/`가 아니라 루트에 직접 있다: `app/`, `components/`, `lib/`.

```
app/
├── layout.tsx           # 루트 레이아웃
├── page.tsx             # 홈페이지 (/)
├── globals.css          # 전역 스타일 (Tailwind 진입점)
├── auth/                 # 로그인/회원가입/비밀번호 재설정 등 인증 페이지
│   ├── login/page.tsx
│   ├── sign-up/page.tsx
│   ├── forgot-password/page.tsx
│   ├── update-password/page.tsx
│   ├── confirm/route.ts  # 이메일 확인 콜백 Route Handler
│   └── error/page.tsx
└── protected/            # 인증 필요 영역 (접근 제어는 proxy.ts가 담당)
```

`middleware.ts`는 존재하지 않는다 — 이 저장소는 `proxy.ts`(루트)를 미들웨어로 사용한다. 자세한 내용은 `docs/supabase.md` 참고.

## Server Components 우선

기본적으로 모든 컴포넌트는 Server Component로 작성하고, 상태·이벤트 핸들러가 필요한 부분만 `'use client'`로 분리한다.

```tsx
// ✅ Server Component (데이터 패칭)
export default async function EventListPage() {
  const events = await getEvents();
  return <EventList events={events} />;
}

// ✅ 상호작용이 필요한 부분만 클라이언트로 분리
("use client");
export function EventFilter({ onChange }: { onChange: (v: string) => void }) {
  const [value, setValue] = useState("");
  // ...
}
```

상태나 이벤트 핸들러가 없는 컴포넌트에 습관적으로 `'use client'`를 붙이지 않는다.

## async request APIs (Next.js 15)

`params`, `searchParams`, `cookies()`, `headers()`는 모두 Promise다 — 반드시 `await`한다.

```tsx
export default async function EventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  // ...
}
```

`lib/supabase/server.ts`의 `cookies()` 사용도 동일한 규칙을 따른다(이미 구현되어 있음, 새 코드 작성 시 참고).

## Server Actions

비회원 쓰기(RSVP 제출/수정, 정산 저장)는 전부 Server Action에서 처리한다. 자세한 인증/검증 규칙은 `docs/supabase.md` 참고.

```tsx
"use server";

export async function createEvent(formData: FormData) {
  const supabase = await createClient(); // lib/supabase/server.ts
  // host_id는 클라이언트 값을 신뢰하지 않고 서버에서 auth.uid()로 주입
}
```

## 경로 별칭

`@/*` → 저장소 루트 하나만 존재한다 (`tsconfig.json`, `components.json` 동일).

```tsx
// ✅
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

// ❌ 상대 경로 금지
import { Button } from "../../../components/ui/button";
```

`src/` 디렉토리를 새로 만들지 않는다.

## 새 라우트 추가 기준

- 로그인이 필요한 기능 → `app/protected/` 하위
- 로그인 없이 접근 가능한 공개 기능 → `app/e/` 하위 (모임 참여자 공개 라우트, `docs/supabase.md` 참고) + `lib/supabase/proxy.ts`에 경로 예외 추가 필수
- `app/protected/` 안에서 접근 제어를 페이지 코드로 직접 구현하지 않는다 — 로그인 여부 검사는 `proxy.ts`가 담당한다. 단 리소스 소유권 검증(`host_id !== auth.uid()`)은 페이지/Server Action에서 별도로 처리해야 한다.

## 코드 품질 체크리스트

작업 완료 후 실행:

```bash
npm run lint        # ESLint (next/core-web-vitals, next/typescript)
npm run typecheck   # tsc --noEmit
npm run test         # vitest run (lib/ 순수 함수 대상)
npm run format:check
```

`npm run check-all`, `npm run build`는 CI에서 순서대로 실행되는 게이트다(`lint → typecheck → test → build`) — 로컬에서도 커밋 전 최소 `lint`, `typecheck`는 통과시킨다.
