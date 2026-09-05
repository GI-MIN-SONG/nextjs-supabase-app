import { Suspense } from "react";

async function EventSettlementContent({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  // TODO(Task 012): eventId 기준 N빵 계산 및 입금 관리 구현
  return <p className="text-sm text-muted-foreground">{eventId}</p>;
}

export default function EventSettlementPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  return (
    <div className="flex w-full flex-1 flex-col gap-6">
      <h1 className="text-2xl font-bold">정산 계산기</h1>
      <Suspense>
        <EventSettlementContent params={params} />
      </Suspense>
    </div>
  );
}
