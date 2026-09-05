"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { calculateSettlementShares } from "@/lib/settlement";
import type { SettlementParticipant } from "@/lib/settlement";
import type { ParticipantStatus } from "@/lib/types/event";

function validateSettlementInput({
  totalAmount,
}: {
  totalAmount: number;
}): void {
  if (Number.isNaN(totalAmount) || totalAmount < 0) {
    throw new Error("총 금액을 올바르게 입력해주세요");
  }
}

export async function saveSettlement(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) throw new Error("로그인이 필요합니다");

  const eventId = formData.get("eventId") as string | null;
  if (!eventId) throw new Error("모임 정보를 찾을 수 없습니다");

  // defense-in-depth: RLS(settlements_write_own 등)가 이미 auth.uid()=host_id를
  // 강제하고 있지만, 명확한 에러 메시지를 위해 애플리케이션 레벨에서도 재검증한다.
  const { data: event } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .single();
  if (!event || event.host_id !== userId) {
    throw new Error("권한이 없습니다");
  }

  const totalAmountRaw = formData.get("totalAmount") as string | null;
  const totalAmount = Number(totalAmountRaw);
  validateSettlementInput({ totalAmount });

  const bankAccount = (
    (formData.get("bankAccount") as string | null) ?? ""
  ).trim();
  const accountHolder = (
    (formData.get("accountHolder") as string | null) ?? ""
  ).trim();
  const memo = ((formData.get("memo") as string | null) ?? "").trim();

  const excludedIds = formData.getAll("excludedParticipantId") as string[];

  const { data: participants, error: participantsError } = await supabase
    .from("participants")
    .select("id, status, is_excluded_from_settlement")
    .eq("event_id", eventId);
  if (participantsError) throw new Error(participantsError.message);

  const participantList = participants ?? [];

  // 각 참여자의 정산 제외 여부를 체크박스 상태로 갱신한다.
  // 이 화면이 is_excluded_from_settlement의 유일한 갱신 지점이다.
  await Promise.all(
    participantList.map((p) =>
      supabase
        .from("participants")
        .update({ is_excluded_from_settlement: excludedIds.includes(p.id) })
        .eq("id", p.id),
    ),
  );

  const mappedParticipants: SettlementParticipant[] = participantList.map(
    (p) => ({
      id: p.id,
      status: p.status as ParticipantStatus,
      isExcludedFromSettlement: excludedIds.includes(p.id),
    }),
  );

  // 클라이언트가 보낸 미리보기 값은 신뢰하지 않고 서버에서 최종 계산한다.
  const shares = calculateSettlementShares(totalAmount, mappedParticipants);

  const now = new Date().toISOString();
  const { data: settlement, error: settlementError } = await supabase
    .from("settlements")
    .upsert(
      {
        event_id: eventId,
        total_amount: totalAmount,
        bank_account: bankAccount || null,
        account_holder: accountHolder || null,
        memo: memo || null,
        updated_at: now,
      },
      { onConflict: "event_id" },
    )
    .select("id")
    .single();
  if (settlementError) throw new Error(settlementError.message);

  const settlementId = settlement.id;

  // 기존 입금 체크 상태(is_paid/paid_at)를 참여자 기준으로 이어받기 위해 미리 조회한다.
  const { data: existingShares } = await supabase
    .from("settlement_shares")
    .select("participant_id, is_paid, paid_at")
    .eq("settlement_id", settlementId);

  const paidStatusMap = new Map<
    string,
    { isPaid: boolean; paidAt: string | null }
  >();
  for (const share of existingShares ?? []) {
    paidStatusMap.set(share.participant_id, {
      isPaid: share.is_paid,
      paidAt: share.paid_at,
    });
  }

  const { error: deleteError } = await supabase
    .from("settlement_shares")
    .delete()
    .eq("settlement_id", settlementId);
  if (deleteError) throw new Error(deleteError.message);

  if (shares.length > 0) {
    const insertPayload = shares.map((share) => {
      const existing = paidStatusMap.get(share.participantId);
      return {
        settlement_id: settlementId,
        participant_id: share.participantId,
        amount_due: share.amountDue,
        is_paid: existing?.isPaid ?? false,
        paid_at: existing?.paidAt ?? null,
      };
    });

    const { error: insertError } = await supabase
      .from("settlement_shares")
      .insert(insertPayload);
    if (insertError) throw new Error(insertError.message);
  }

  revalidatePath(`/protected/events/${eventId}/settlement`);
}

export async function togglePaid(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) throw new Error("로그인이 필요합니다");

  const shareId = formData.get("shareId") as string | null;
  if (!shareId) throw new Error("정산 항목을 찾을 수 없습니다");
  const isPaid = formData.get("isPaid") === "true";

  // settlement_shares → settlements → events 체인을 조회해 소유권을 확인한다.
  const { data: share } = await supabase
    .from("settlement_shares")
    .select("id, settlements(event_id, events(host_id))")
    .eq("id", shareId)
    .single();

  const settlement = share?.settlements as
    { event_id: string; events: { host_id: string } | null } | null | undefined;

  if (!share || !settlement || settlement.events?.host_id !== userId) {
    throw new Error("권한이 없습니다");
  }

  const { error } = await supabase
    .from("settlement_shares")
    .update({
      is_paid: isPaid,
      paid_at: isPaid ? new Date().toISOString() : null,
    })
    .eq("id", shareId);
  if (error) throw new Error(error.message);

  revalidatePath(`/protected/events/${settlement.event_id}/settlement`);
}
