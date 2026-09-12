"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  events_created: {
    label: "이벤트 생성",
    color: "var(--chart-1)",
  },
  rsvps_submitted: {
    label: "RSVP 제출",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function StatsChart({
  data,
  dateKey,
}: {
  data: {
    events_created: number;
    rsvps_submitted: number;
    [key: string]: unknown;
  }[];
  dateKey: string;
}) {
  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={dateKey}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value: string) =>
            new Date(value).toLocaleDateString("ko-KR", {
              month: "short",
              day: "numeric",
            })
          }
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey="events_created"
          fill="var(--color-events_created)"
          radius={4}
        />
        <Bar
          dataKey="rsvps_submitted"
          fill="var(--color-rsvps_submitted)"
          radius={4}
        />
      </BarChart>
    </ChartContainer>
  );
}
