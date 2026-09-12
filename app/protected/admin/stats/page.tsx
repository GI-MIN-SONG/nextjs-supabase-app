import { Suspense } from "react";

import { StatsChart } from "@/components/admin/stats-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

async function StatsContent() {
  const supabase = await createClient();

  const [{ data: weekly }, { data: monthly }] = await Promise.all([
    supabase.rpc("admin_weekly_event_stats", { weeks_back: 12 }),
    supabase.rpc("admin_monthly_event_stats", { months_back: 6 }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>주간 추이 (최근 12주)</CardTitle>
        </CardHeader>
        <CardContent>
          <StatsChart data={weekly ?? []} dateKey="week_start" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>월간 추이 (최근 6개월)</CardTitle>
        </CardHeader>
        <CardContent>
          <StatsChart data={monthly ?? []} dateKey="month_start" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminStatsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">통계</h1>
      <Suspense>
        <StatsContent />
      </Suspense>
    </div>
  );
}
