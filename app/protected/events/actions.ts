"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

function validateEventInput({
  title,
  startsAt,
  rsvpDeadline,
}: {
  title: string;
  startsAt: string;
  rsvpDeadline: string;
}): void {
  if (!title) {
    throw new Error("제목을 입력해주세요");
  }
  if (!startsAt || Number.isNaN(new Date(startsAt).getTime())) {
    throw new Error("일시를 입력해주세요");
  }
  if (rsvpDeadline && new Date(rsvpDeadline) >= new Date(startsAt)) {
    throw new Error("RSVP 마감일은 모임 시작 이전이어야 합니다");
  }
}

export async function createEvent(formData: FormData): Promise<{ id: string }> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const hostId = claims?.claims.sub;

  if (!hostId) {
    throw new Error("로그인이 필요합니다");
  }

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const description = (formData.get("description") as string | null) ?? "";
  const location = (formData.get("location") as string | null) ?? "";
  const startsAt = (formData.get("startsAt") as string | null) ?? "";
  const rsvpDeadline = (formData.get("rsvpDeadline") as string | null) ?? "";

  validateEventInput({ title, startsAt, rsvpDeadline });

  const { data, error } = await supabase
    .from("events")
    .insert({
      host_id: hostId,
      title,
      description: description || null,
      location: location || null,
      starts_at: startsAt,
      rsvp_deadline: rsvpDeadline || null,
      status: "open",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { id: data.id };
}

export async function updateEvent(formData: FormData): Promise<{ id: string }> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) throw new Error("로그인이 필요합니다");

  const eventId = formData.get("eventId") as string | null;
  if (!eventId) throw new Error("모임 정보를 찾을 수 없습니다");

  const { data: existing } = await supabase
    .from("events")
    .select("host_id")
    .eq("id", eventId)
    .single();
  if (!existing || existing.host_id !== userId) {
    throw new Error("수정 권한이 없습니다");
  }

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const description = (formData.get("description") as string | null) ?? "";
  const location = (formData.get("location") as string | null) ?? "";
  const startsAt = (formData.get("startsAt") as string | null) ?? "";
  const rsvpDeadline = (formData.get("rsvpDeadline") as string | null) ?? "";
  const status = (formData.get("status") as string | null) ?? "";

  validateEventInput({ title, startsAt, rsvpDeadline });

  if (!["open", "closed", "cancelled"].includes(status)) {
    throw new Error("올바르지 않은 상태값입니다");
  }

  const { error } = await supabase
    .from("events")
    .update({
      title,
      description: description || null,
      location: location || null,
      starts_at: startsAt,
      rsvp_deadline: rsvpDeadline || null,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);

  if (error) throw new Error(error.message);

  revalidatePath(`/protected/events/${eventId}`);
  return { id: eventId };
}
