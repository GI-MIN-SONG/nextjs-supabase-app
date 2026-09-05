import Link from "next/link";
import { Suspense } from "react";

import { EventList } from "@/components/event-list";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

async function EventListContent() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;

  const { data: events } = await supabase
    .from("events")
    .select("id, title, location, starts_at, status, participants(count)")
    .eq("host_id", userId ?? "")
    .order("starts_at", { ascending: true });

  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed p-10 text-center text-muted-foreground">
        <p>아직 만든 모임이 없어요.</p>
        <Button asChild>
          <Link href="/protected/events/new">새 모임 만들기</Link>
        </Button>
      </div>
    );
  }

  return <EventList events={events} />;
}

export default function EventListPage() {
  return (
    <div className="flex w-full flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">내 모임 목록</h1>
        <Button asChild>
          <Link href="/protected/events/new">새 모임 만들기</Link>
        </Button>
      </div>
      <Suspense>
        <EventListContent />
      </Suspense>
    </div>
  );
}
