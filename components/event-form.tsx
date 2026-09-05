"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createEvent, updateEvent } from "@/app/protected/events/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/lib/database.types";
import { eventStatusLabel } from "@/lib/format";
import type { EventStatus } from "@/lib/types/event";

type EventFormProps =
  | { mode: "create" }
  | {
      mode: "edit";
      event: Pick<
        Database["public"]["Tables"]["events"]["Row"],
        | "id"
        | "title"
        | "description"
        | "location"
        | "starts_at"
        | "rsvp_deadline"
        | "status"
      >;
    };

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm(props: EventFormProps) {
  const [title, setTitle] = useState(
    props.mode === "edit" ? props.event.title : "",
  );
  const [description, setDescription] = useState(
    props.mode === "edit" ? (props.event.description ?? "") : "",
  );
  const [location, setLocation] = useState(
    props.mode === "edit" ? (props.event.location ?? "") : "",
  );
  const [startsAt, setStartsAt] = useState(
    props.mode === "edit" ? toDatetimeLocalValue(props.event.starts_at) : "",
  );
  const [rsvpDeadline, setRsvpDeadline] = useState(
    props.mode === "edit" && props.event.rsvp_deadline
      ? toDatetimeLocalValue(props.event.rsvp_deadline)
      : "",
  );
  const [status, setStatus] = useState<EventStatus>(
    props.mode === "edit" ? (props.event.status as EventStatus) : "open",
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !startsAt) {
      setError("제목과 일시는 필수입니다");
      return;
    }

    if (rsvpDeadline && new Date(rsvpDeadline) >= new Date(startsAt)) {
      setError("RSVP 마감일은 모임 시작 이전이어야 합니다");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("description", description);
      formData.set("location", location);
      formData.set("startsAt", new Date(startsAt).toISOString());
      if (rsvpDeadline) {
        formData.set("rsvpDeadline", new Date(rsvpDeadline).toISOString());
      }

      if (props.mode === "edit") {
        formData.set("eventId", props.event.id);
        formData.set("status", status);
        const { id } = await updateEvent(formData);
        router.push(`/protected/events/${id}`);
      } else {
        const { id } = await createEvent(formData);
        router.push(`/protected/events/${id}`);
      }
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">모임 정보</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">장소</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="startsAt">일시</Label>
              <Input
                id="startsAt"
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rsvpDeadline">RSVP 마감일 (선택)</Label>
              <Input
                id="rsvpDeadline"
                type="datetime-local"
                value={rsvpDeadline}
                onChange={(e) => setRsvpDeadline(e.target.value)}
              />
            </div>
            {props.mode === "edit" && (
              <div className="grid gap-2">
                <Label>상태</Label>
                <RadioGroup
                  value={status}
                  onValueChange={(v) => setStatus(v as EventStatus)}
                  className="flex gap-4"
                >
                  {(["open", "closed", "cancelled"] as const).map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <RadioGroupItem value={s} id={`status-${s}`} />
                      <Label htmlFor={`status-${s}`}>
                        {eventStatusLabel[s]}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "저장 중..."
                : props.mode === "create"
                  ? "모임 만들기"
                  : "저장"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
