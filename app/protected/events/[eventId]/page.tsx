import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyLinkButton } from "@/components/copy-link-button";
import { createClient } from "@/lib/supabase/server";
import { eventStatusLabel, formatEventDateTime } from "@/lib/format";
import type { EventStatus } from "@/lib/types/event";

function getSiteUrl(): string {
  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
}

async function EventDetailContent({
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

  const publicUrl = `${getSiteUrl()}/e/${eventId}`;

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">{event.title}</h2>
        <Badge>{eventStatusLabel[event.status as EventStatus]}</Badge>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          {event.description && (
            <p className="text-sm text-foreground">{event.description}</p>
          )}
          {event.location && (
            <p className="text-sm text-muted-foreground">{event.location}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {formatEventDateTime(event.starts_at)}
          </p>
          {event.rsvp_deadline && (
            <p className="text-sm text-muted-foreground">
              RSVP 마감: {formatEventDateTime(event.rsvp_deadline)}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">참여자 공유 링크</p>
        <CopyLinkButton url={publicUrl} />
      </div>

      <div className="flex gap-2">
        <Button asChild>
          <Link href={`/protected/events/${eventId}/edit`}>모임 수정</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/protected/events/${eventId}/settlement`}>
            정산 계산기로 이동
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">참여자 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            참여자 현황은 곧 이곳에 표시됩니다
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  return (
    <div className="flex w-full flex-1 flex-col gap-6">
      <h1 className="text-2xl font-bold">모임 상세</h1>
      <Suspense>
        <EventDetailContent params={params} />
      </Suspense>
    </div>
  );
}
