"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims.sub;

  if (!uid) {
    return { error: "로그인이 필요합니다" };
  }

  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!fullName) {
    return { error: "이름을 입력해주세요" };
  }

  if (fullName.length > 50) {
    return { error: "이름은 50자 이하로 입력해주세요" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", uid);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/protected/profile");
  return { success: true };
}
