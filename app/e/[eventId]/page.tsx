import { Suspense } from "react";

async function RsvpLandingContent({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  // TODO(Task 008): eventId 모임 정보 표시 및 RSVP 제출 폼 구현
  // TODO(Task 008): lib/supabase/proxy.ts에 /e/ 경로 인증 예외 추가 필요
  return <p className="text-sm text-muted-foreground">{eventId}</p>;
}

export default function RsvpLandingPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  return (
    <div className="flex w-full flex-1 flex-col gap-6">
      <h1 className="text-2xl font-bold">모임 참석 응답</h1>
      <Suspense>
        <RsvpLandingContent params={params} />
      </Suspense>
    </div>
  );
}
