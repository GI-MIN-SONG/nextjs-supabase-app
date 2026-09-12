"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) {
    throw new Error("로그인이 필요합니다");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (profile?.role !== "admin") {
    throw new Error("관리자 권한이 없습니다");
  }

  return supabase;
}

export async function adminDeleteEvent(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();

  const eventId = formData.get("eventId") as string | null;
  if (!eventId) {
    throw new Error("이벤트 정보를 찾을 수 없습니다");
  }

  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/protected/admin/events");
}
