import { Suspense } from "react";

async function RsvpEditContent({
  params,
}: {
  params: Promise<{ eventId: string; accessToken: string }>;
}) {
  const { eventId, accessToken } = await params;

  // TODO(Task 009): eventId, accessToken 검증 후 응답 수정/분담액 표시 구현
  return (
    <p className="text-sm text-muted-foreground">
      {eventId} / {accessToken}
    </p>
  );
}

export default function RsvpEditPage({
  params,
}: {
  params: Promise<{ eventId: string; accessToken: string }>;
}) {
  return (
    <div className="flex w-full flex-1 flex-col gap-6">
      <h1 className="text-2xl font-bold">내 응답 수정</h1>
      <Suspense>
        <RsvpEditContent params={params} />
      </Suspense>
    </div>
  );
}
