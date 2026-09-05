import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SettlementForm } from "@/components/settlement-form";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

async function EventSettlementContent({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;

  const { data: event } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .single();

  if (!event || event.host_id !== userId) notFound();

  const { data: participants } = await supabase
    .from("participants")
    .select("id, name, status, is_excluded_from_settlement")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  const { data: settlement } = await supabase
    .from("settlements")
    .select("id, total_amount, bank_account, account_holder, memo, updated_at")
    .eq("event_id", eventId)
    .maybeSingle();

  const { data: shares } = settlement
    ? await supabase
        .from("settlement_shares")
        .select("id, participant_id, amount_due, is_paid")
        .eq("settlement_id", settlement.id)
    : { data: null };

  return (
    <div className="flex w-full flex-col gap-6">
      <SettlementForm
        key={`${settlement?.updated_at ?? "new"}-${shares?.length ?? 0}`}
        eventId={eventId}
        participants={participants ?? []}
        settlement={settlement ?? null}
        shares={shares ?? []}
      />
      <Button asChild variant="outline">
        <Link href={`/protected/events/${eventId}`}>모임 상세로 돌아가기</Link>
      </Button>
    </div>
  );
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
