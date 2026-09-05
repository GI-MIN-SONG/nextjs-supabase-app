import { Suspense } from "react";

import { AccountCopyButton } from "@/components/account-copy-button";
import { RsvpEditForm } from "@/components/rsvp-edit-form";
import { formatCurrency, formatEventDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

async function RsvpEditContent({
  params,
}: {
  params: Promise<{ eventId: string; accessToken: string }>;
}) {
  const { eventId, accessToken } = await params;

  const supabase = await createClient();
  const { data: participant, error } = await supabase
    .from("participants")
    .select("*")
    .eq("event_id", eventId)
    .eq("access_token", accessToken)
    .single();

  if (error || !participant) {
    return (
      <div className="text-muted-foreground rounded-lg border p-4 text-sm">
        유효하지 않은 링크입니다. 응답 제출 시 안내된 링크를 다시 확인해주세요.
      </div>
    );
  }

  const { data: event } = await supabase
    .from("events")
    .select("title, location, starts_at")
    .eq("id", eventId)
    .single();

  // 정산 정보 조회: settlement_shares_select_all RLS가 using(true)로 전면 개방되어 있어
  // 클라이언트가 직접 호출하면 임의의 settlement_id로 타인의 금액을 조회할 수 있다.
  // 따라서 이 조회는 access_token 검증을 이미 통과한 이 서버 컴포넌트에서만 수행하고,
  // 하위 클라이언트 컴포넌트에는 표시할 값만 props로 내려준다.
  const { data: settlement } = await supabase
    .from("settlements")
    .select("total_amount, bank_account, account_holder, memo, id")
    .eq("event_id", eventId)
    .maybeSingle();

  const { data: share } = settlement
    ? await supabase
        .from("settlement_shares")
        .select("amount_due")
        .eq("settlement_id", settlement.id)
        .eq("participant_id", participant.id)
        .maybeSingle()
    : { data: null };

  // 정산 대상 여부 판정 (lib/settlement.ts의 getSettlementTargets와 동일한 조건).
  // 이미 계산되어 저장된 amount_due를 그대로 보여주는 게 목적이므로 재계산 함수는 호출하지 않는다.
  const isSettlementTarget =
    participant.status === "attending" &&
    !participant.is_excluded_from_settlement;

  return (
    <div className="flex w-full flex-col gap-6">
      {event && (
        <div className="flex flex-col gap-2 rounded-lg border p-4">
          <h2 className="text-xl font-semibold">{event.title}</h2>
          {event.location && (
            <p className="text-muted-foreground text-sm">{event.location}</p>
          )}
          <p className="text-muted-foreground text-sm">
            {formatEventDateTime(event.starts_at)}
          </p>
        </div>
      )}

      <RsvpEditForm
        eventId={eventId}
        accessToken={accessToken}
        initialStatus={
          participant.status === "not_attending" ? "not_attending" : "attending"
        }
        initialNote={participant.note ?? ""}
      />

      {!settlement && (
        <div className="text-muted-foreground rounded-lg border p-4 text-sm">
          정산 정보는 등록되면 이곳에 표시됩니다
        </div>
      )}

      {settlement && !isSettlementTarget && (
        <div className="text-muted-foreground rounded-lg border p-4 text-sm">
          이번 정산에서 제외되었어요
        </div>
      )}

      {settlement && isSettlementTarget && !share && (
        <div className="text-muted-foreground rounded-lg border p-4 text-sm">
          정산 정보가 곧 반영될 예정이에요
        </div>
      )}

      {settlement && isSettlementTarget && share && (
        <div className="flex flex-col gap-2 rounded-lg border p-4">
          <h3 className="text-sm font-semibold">정산 정보</h3>
          <p className="text-lg font-bold">
            {formatCurrency(share.amount_due)}
          </p>
          {settlement.bank_account && (
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">
                {settlement.account_holder
                  ? `${settlement.account_holder} 계좌`
                  : "입금 계좌"}
              </p>
              <AccountCopyButton value={settlement.bank_account} />
            </div>
          )}
          {settlement.memo && (
            <p className="text-muted-foreground text-sm">{settlement.memo}</p>
          )}
        </div>
      )}
    </div>
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
