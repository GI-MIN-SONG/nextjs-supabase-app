import Link from "next/link";
import { Suspense } from "react";

import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

async function HomeHeaderActions() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  return user ? (
    <LogoutButton />
  ) : (
    <Button asChild size="sm" variant="outline">
      <Link href="/auth/login">로그인</Link>
    </Button>
  );
}

async function HomeContent() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (user) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-muted-foreground text-sm">
          {user.email}님, 환영합니다.
        </p>
        <Button asChild size="lg">
          <Link href="/protected/events">내 모임 목록 보기</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-center">
      <h1 className="text-2xl !leading-tight font-bold">
        모임 공지부터
        <br />
        정산까지 한 번에
      </h1>
      <p className="text-muted-foreground text-sm">
        참여자 회원가입 없이 링크만 공유해서 참석 여부를 받고, N빵 정산까지
        끝내보세요.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <Button asChild size="lg">
          <Link href="/auth/sign-up">시작하기</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/auth/login">로그인</Link>
        </Button>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col">
      <header className="flex items-center justify-between border-b p-4">
        <span className="text-lg font-semibold">모임 관리</span>
        <Suspense>
          <HomeHeaderActions />
        </Suspense>
      </header>

      <div className="flex flex-1 flex-col gap-8 p-5">
        <Suspense>
          <HomeContent />
        </Suspense>
      </div>
    </main>
  );
}
