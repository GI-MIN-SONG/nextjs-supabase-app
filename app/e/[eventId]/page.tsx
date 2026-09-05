import { notFound } from "next/navigation";
import { Suspense } from "react";

import { RsvpForm } from "@/components/rsvp-form";
import { formatEventDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

async function RsvpLandingContent({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (!event) notFound();

  const isDeadlinePassed =
    !!event.rsvp_deadline && new Date() > new Date(event.rsvp_deadline);
  const isOpen = event.status === "open" && !isDeadlinePassed;

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2 rounded-lg border p-4">
        <h2 className="text-xl font-semibold">{event.title}</h2>
        {event.location && (
          <p className="text-muted-foreground text-sm">{event.location}</p>
        )}
        <p className="text-muted-foreground text-sm">
          {formatEventDateTime(event.starts_at)}
        </p>
      </div>

      {isOpen ? (
        <RsvpForm eventId={eventId} />
      ) : (
        <p className="text-muted-foreground text-sm">
          {event.status === "cancelled"
            ? "취소된 모임입니다"
            : "현재 응답을 받지 않는 모임입니다"}
        </p>
      )}
    </div>
  );
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
