import { Suspense } from "react";
import { notFound } from "next/navigation";

import { EventForm } from "@/components/event-form";
import { createClient } from "@/lib/supabase/server";

async function EditEventContent({
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
    .select("*")
    .eq("id", eventId)
    .single();

  if (!event || event.host_id !== userId) notFound();

  return <EventForm mode="edit" event={event} />;
}

export default function EditEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  return (
    <div className="flex w-full flex-1 flex-col gap-6">
      <h1 className="text-2xl font-bold">모임 수정</h1>
      <Suspense>
        <EditEventContent params={params} />
      </Suspense>
    </div>
  );
}
