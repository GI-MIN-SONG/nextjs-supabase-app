import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { eventStatusLabel, formatEventDateTime } from "@/lib/format";
import type { EventStatus } from "@/lib/types/event";
import { cn } from "@/lib/utils";

type EventListItem = {
  id: string;
  title: string;
  location: string | null;
  starts_at: string;
  status: string;
  participants: { count: number }[];
};

const statusBadgeVariant: Record<
  EventStatus,
  "default" | "secondary" | "outline"
> = {
  open: "default",
  closed: "secondary",
  cancelled: "outline",
};

export function EventList({ events }: { events: EventListItem[] }) {
  return (
    <div className="flex flex-col gap-3">
      {events.map((event) => {
        const status = event.status as EventStatus;
        const participantCount = event.participants[0]?.count ?? 0;
        const startsAt = new Date(event.starts_at);

        return (
          <Link
            key={event.id}
            href={`/protected/events/${event.id}`}
            className="grid grid-cols-[52px_1fr_auto] items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary"
          >
            <div className="flex flex-col items-center justify-center rounded-lg bg-muted px-1 py-2 leading-tight">
              <span className="text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground">
                {new Intl.DateTimeFormat("ko-KR", { month: "short" }).format(
                  startsAt,
                )}
              </span>
              <span className="text-xl font-semibold tabular-nums">
                {startsAt.getDate()}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="font-semibold leading-tight">{event.title}</h3>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                {event.location && <span>{event.location}</span>}
                <span>{formatEventDateTime(event.starts_at)}</span>
              </div>
            </div>

            <div
              className={cn(
                "flex flex-col items-end gap-2",
                status === "cancelled" && "opacity-60",
              )}
            >
              <Badge variant={statusBadgeVariant[status]}>
                {eventStatusLabel[status]}
              </Badge>
              <span className="text-sm tabular-nums text-muted-foreground">
                참여자 {participantCount}명
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
