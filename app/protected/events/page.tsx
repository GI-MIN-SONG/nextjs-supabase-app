import Link from "next/link";
import { Suspense } from "react";

import { EventList } from "@/components/event-list";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

const eventSummaryColumns =
  "id, title, location, starts_at, status, cover_image_url, participants(count)";

async function HostedEventListContent() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;

  const { data: events } = await supabase
    .from("events")
    .select(eventSummaryColumns)
    .eq("host_id", userId ?? "")
    .order("starts_at", { ascending: true });

  if (!events || events.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-4 rounded-xl border border-dashed p-10 text-center">
        <p>아직 만든 모임이 없어요.</p>
        <Button asChild>
          <Link href="/protected/events/new">새 모임 만들기</Link>
        </Button>
      </div>
    );
  }

  return <EventList events={events} />;
}

async function JoinedEventListContent() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;

  const { data: participantRows } = await supabase
    .from("participants")
    .select(`event_id, events!inner(${eventSummaryColumns})`)
    .eq("user_id", userId ?? "")
    .order("starts_at", { referencedTable: "events", ascending: true });

  const events = participantRows?.map((row) => row.events) ?? [];

  if (events.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-4 rounded-xl border border-dashed p-10 text-center">
        <p>참여한 모임이 없어요.</p>
      </div>
    );
  }

  return <EventList events={events} />;
}

export default function EventListPage() {
  return (
    <div className="flex w-full flex-1 flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">내 모임 목록</h1>
        <Button asChild>
          <Link href="/protected/events/new">새 모임 만들기</Link>
        </Button>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">내가 만든 이벤트</h2>
        <Suspense>
          <HostedEventListContent />
        </Suspense>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">내가 참여한 이벤트</h2>
        <Suspense>
          <JoinedEventListContent />
        </Suspense>
      </section>
    </div>
  );
}
