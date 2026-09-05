import { Suspense } from "react";

import { RsvpEditForm } from "@/components/rsvp-edit-form";
import { formatEventDateTime } from "@/lib/format";
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

      <div className="text-muted-foreground rounded-lg border p-4 text-sm">
        정산 정보는 등록되면 이곳에 표시됩니다
      </div>
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
