import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyLinkButton } from "@/components/copy-link-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import {
  eventStatusLabel,
  formatEventDateTime,
  participantStatusLabel,
} from "@/lib/format";
import type { EventStatus, ParticipantStatus } from "@/lib/types/event";

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

  const { data: participants } = await supabase
    .from("participants")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  const participantList = participants ?? [];
  const attendingCount = participantList.filter(
    (p) => p.status === "attending",
  ).length;
  const notAttendingCount = participantList.filter(
    (p) => p.status === "not_attending",
  ).length;
  const pendingCount = participantList.filter(
    (p) => p.status === "pending",
  ).length;

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
            <p className="text-foreground text-sm">{event.description}</p>
          )}
          {event.location && (
            <p className="text-muted-foreground text-sm">{event.location}</p>
          )}
          <p className="text-muted-foreground text-sm">
            {formatEventDateTime(event.starts_at)}
          </p>
          {event.rsvp_deadline && (
            <p className="text-muted-foreground text-sm">
              RSVP 마감: {formatEventDateTime(event.rsvp_deadline)}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">참여자 공유 링크</p>
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">참여자 현황</CardTitle>
            <div className="flex gap-2">
              <Badge>참석 {attendingCount}</Badge>
              <Badge variant="outline">불참 {notAttendingCount}</Badge>
              <Badge variant="secondary">미응답 {pendingCount}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {participantList.length === 0 ? (
            <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
              아직 응답한 참여자가 없어요
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>참석 여부</TableHead>
                  <TableHead>카풀 메모</TableHead>
                  <TableHead>응답 시각</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participantList.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>
                      {participantStatusLabel[p.status as ParticipantStatus]}
                    </TableCell>
                    <TableCell>{p.note || "-"}</TableCell>
                    <TableCell>{formatEventDateTime(p.updated_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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
