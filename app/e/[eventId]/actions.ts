"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function submitRsvp(
  eventId: string,
  formData: FormData,
): Promise<{ accessToken: string }> {
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("status, rsvp_deadline")
    .eq("id", eventId)
    .single();

  if (!event) {
    throw new Error("존재하지 않는 모임입니다");
  }
  if (event.status !== "open") {
    throw new Error("현재 응답을 받지 않는 모임입니다");
  }
  if (event.rsvp_deadline && new Date() > new Date(event.rsvp_deadline)) {
    throw new Error("RSVP 마감일이 지났습니다");
  }

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const status = (formData.get("status") as string | null) ?? "";
  const note = (formData.get("note") as string | null) ?? "";

  if (!name) {
    throw new Error("이름을 입력해주세요");
  }
  if (!["attending", "not_attending"].includes(status)) {
    throw new Error("참석 여부를 선택해주세요");
  }
  if (note.length > 200) {
    throw new Error("카풀 메모는 200자를 초과할 수 없습니다");
  }

  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;

  if (!userId) {
    throw new Error("로그인이 필요합니다");
  }

  const { data, error } = await supabase
    .from("participants")
    .insert({
      event_id: eventId,
      name,
      status,
      note: note || null,
      user_id: userId,
    })
    .select("access_token")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/protected/events/${eventId}`);

  return { accessToken: data.access_token };
}

export async function updateRsvp(
  eventId: string,
  accessToken: string,
  formData: FormData,
): Promise<{ status: string; note: string | null }> {
  const supabase = await createClient();

  const status = (formData.get("status") as string | null) ?? "";
  const note = (formData.get("note") as string | null) ?? "";

  if (!["attending", "not_attending"].includes(status)) {
    throw new Error("참석 여부를 선택해주세요");
  }
  if (note.length > 200) {
    throw new Error("카풀 메모는 200자를 초과할 수 없습니다");
  }

  // 개인 응답 수정 링크는 access_token 자체가 신원 증명 역할을 하므로
  // 로그인 필수 전환 이후에도 access_token 검증만 유지한다.
  const { data, error } = await supabase
    .from("participants")
    .update({
      status,
      note: note || null,
      updated_at: new Date().toISOString(),
    })
    .eq("event_id", eventId)
    .eq("access_token", accessToken)
    .select("status, note")
    .single();

  if (error || !data) {
    throw new Error("응답 정보를 찾을 수 없습니다");
  }

  revalidatePath(`/protected/events/${eventId}`);

  return { status: data.status, note: data.note };
}
