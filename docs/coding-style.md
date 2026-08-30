# 코딩 스타일 가이드

이 저장소의 실제 컨벤션만 담는다. 일반 템플릿이 아니라 기존 코드(`components/login-form.tsx` 등)에서 실제로 관찰되는 패턴을 기준으로 한다.

## 네이밍

- 변수/함수: camelCase (사용자 전역 규칙)
- 컴포넌트: PascalCase (`LoginForm`, `EventCard`)
- 파일명: kebab-case (`login-form.tsx`, `sign-up-form.tsx`) — 이 저장소의 기존 파일이 전부 이 규칙을 따른다.
- DB 컬럼/테이블명: snake_case (Postgres/Supabase 표준, `lib/database.types.ts` 참고). 이는 TS 변수명 규칙과 별개다 — DB 레이어와 애플리케이션 레이어의 네이밍 컨벤션이 다르다는 점에 유의한다.
- 들여쓰기: 2칸

## 폼 구현 표준 (react-hook-form/zod 도입 금지)

이 저장소는 폼에 react-hook-form이나 zod를 쓰지 않는다. `components/login-form.tsx`, `components/sign-up-form.tsx`가 표준 패턴이다:

```tsx
"use client";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // ...
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
      <Button disabled={isLoading}>{isLoading ? "처리 중..." : "제출"}</Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
```

새 폼을 추가할 때 이 패턴에서 벗어나 다른 폼 라이브러리를 `package.json`에 추가하지 않는다.

## 스타일링: Tailwind CSS + shadcn/ui

- 인라인 스타일(`style={{}}`) 대신 Tailwind 유틸리티 클래스를 사용한다.
- 클래스 조합은 `lib/utils.ts`의 `cn()`(clsx + tailwind-merge)으로 처리한다.

```tsx
import { cn } from "@/lib/utils";

<div
  className={cn("flex items-center gap-2", isActive && "bg-primary", className)}
/>;
```

- 색상은 하드코딩(`bg-white`, `text-black`)하지 않고 시맨틱 변수(`bg-background`, `text-foreground`, `text-muted-foreground` 등, `app/globals.css`에 정의)를 사용한다 — 다크모드 대응이 자동으로 된다.
- 새 UI 프리미티브가 필요하면 `npx shadcn@latest add <name>`으로 설치한다. `components/ui/` 아래 파일을 직접 손으로 새로 작성하지 않는다.
- `components.json` 설정(`style: new-york`, `baseColor: neutral`, `cssVariables: true`)을 변경하지 않는다 — 기존 설치된 컴포넌트(`badge`, `button`, `card`, `checkbox`, `dropdown-menu`, `input`, `label`)와 스타일이 어긋난다.

## Import 순서

```tsx
// 1. 외부 라이브러리
import { useState } from "react";

// 2. 내부 모듈 (@/ 경로 별칭)
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 3. 상대 경로 (같은 디렉토리 등, 최소화)
```

## 컴포넌트 설계 원칙

- Server Component를 기본으로 하고 `'use client'`는 상호작용이 실제로 필요한 최소 범위에만 붙인다.
- 하나의 파일은 하나의 책임만 담당한다 — 여러 책임이 섞인 거대 컴포넌트를 피한다.
- Props가 과도하게 많아지면(대략 6~7개 이상) 객체로 묶거나 컴포넌트를 분리하는 것을 고려한다. 다만 이 저장소는 아직 규모가 작으므로 미리 추상화하지 않는다 — 실제로 재사용이 필요해질 때 리팩터링한다.

## 커밋 메시지

`commitlint.config.js`의 커스텀 `headerPattern`으로 검사된다: 이모지(선택) + 공백 + `feat|fix|docs|style|refactor|perf|test|chore` 중 하나 + `: ` + 본문.

```
✨ feat: 모임 생성 폼 추가
🐛 fix: RSVP 마감일 검증 오류 수정
```

이 타입 목록에 없는 타입(`build`, `ci` 등)을 쓰지 않는다. `git commit --no-verify`로 husky/lint-staged/commitlint 훅을 우회하지 않는다.

## 테스트

`lib/` 아래 순수 함수(예: `lib/settlement.ts`)를 추가할 때는 대응하는 `*.test.ts`를 vitest(jsdom, `globals: true`)로 작성한다. `lib/utils.test.ts`가 기존 예시다.

```bash
npm run test        # vitest run
npm run test:watch  # vitest (watch mode)
```
