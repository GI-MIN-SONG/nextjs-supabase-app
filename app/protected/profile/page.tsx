import Link from "next/link";
import { Suspense } from "react";

import { LogoutButton } from "@/components/logout-button";
import { ProfileForm } from "@/components/profile-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

async function ProfileHeaderCard() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims.email;
  const uid = data?.claims.sub;

  const { data: profile } = uid
    ? await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", uid)
        .single()
    : { data: null };

  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="h-16 w-16 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="bg-muted text-muted-foreground flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-semibold">
            {(profile?.full_name || email || "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex flex-col gap-1">
          <span className="leading-tight font-semibold">
            {profile?.full_name || "이름 미설정"}
          </span>
          <span className="text-muted-foreground text-sm">{email}</span>
        </div>
      </CardContent>
    </Card>
  );
}

async function EventCountCards() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;

  const [{ count: hostedCount }, { count: joinedCount }] = await Promise.all([
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("host_id", userId ?? ""),
    supabase
      .from("participants")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId ?? ""),
  ]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <Link href="/protected/events">
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm">
              만든 이벤트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold tabular-nums">
              {hostedCount ?? 0}
            </span>
          </CardContent>
        </Card>
      </Link>
      <Link href="/protected/events">
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm">
              참여한 이벤트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold tabular-nums">
              {joinedCount ?? 0}
            </span>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

async function AccountInfoCard() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims.sub;

  const { data: profile } = uid
    ? await supabase
        .from("profiles")
        .select("full_name, role, created_at")
        .eq("id", uid)
        .single()
    : { data: null };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">계정 정보</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">역할</span>
          <Badge variant={profile?.role === "admin" ? "default" : "secondary"}>
            {profile?.role === "admin" ? "관리자" : "일반 사용자"}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">가입일</span>
          <span>{profile ? formatDate(profile.created_at) : "-"}</span>
        </div>

        <ProfileForm initialFullName={profile?.full_name ?? ""} />
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  return (
    <div className="flex w-full flex-1 flex-col gap-6">
      <h1 className="text-2xl font-bold">프로필</h1>

      <Suspense>
        <ProfileHeaderCard />
      </Suspense>

      <Suspense>
        <EventCountCards />
      </Suspense>

      <Suspense>
        <AccountInfoCard />
      </Suspense>

      <Card>
        <CardContent className="flex justify-center pt-6">
          <LogoutButton />
        </CardContent>
      </Card>
    </div>
  );
}
