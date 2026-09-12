import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

async function AdminMetrics() {
  const supabase = await createClient();

  const [usersCount, eventsCount, participantsCount, openEventsCount] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("participants").select("*", { count: "exact", head: true }),
      supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("status", "open"),
    ]);

  const metrics = [
    { label: "전체 사용자", value: usersCount.count ?? 0 },
    { label: "전체 이벤트", value: eventsCount.count ?? 0 },
    { label: "전체 참여자", value: participantsCount.count ?? 0 },
    { label: "진행중 이벤트", value: openEventsCount.count ?? 0 },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm">
              {metric.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold tabular-nums">
              {metric.value}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">관리자</h1>

      <AdminMetrics />

      <div className="flex flex-col gap-2">
        <Link href="/protected/admin/events" className="text-sm underline">
          이벤트 관리
        </Link>
        <Link href="/protected/admin/users" className="text-sm underline">
          사용자 관리
        </Link>
        <Link href="/protected/admin/stats" className="text-sm underline">
          통계
        </Link>
      </div>
    </div>
  );
}
