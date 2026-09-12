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
  cover_image_url: string | null;
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
    <div className="flex flex-col gap-6">
      {events.map((event) => {
        const status = event.status as EventStatus;
        const participantCount = event.participants[0]?.count ?? 0;
        const startsAt = new Date(event.starts_at);

        return (
          <Link
            key={event.id}
            href={`/protected/events/${event.id}`}
            className={cn(
              "bg-card hover:border-primary flex items-center gap-4 rounded-xl border p-4 transition-colors",
              status === "cancelled" && "opacity-60",
            )}
          >
            {event.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={event.cover_image_url}
                alt=""
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="bg-muted flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg leading-tight">
                <span className="text-muted-foreground text-[0.65rem] font-bold tracking-wide uppercase">
                  {new Intl.DateTimeFormat("ko-KR", { month: "short" }).format(
                    startsAt,
                  )}
                </span>
                <span className="text-lg font-semibold tabular-nums">
                  {startsAt.getDate()}
                </span>
              </div>
            )}

            <div className="flex flex-1 flex-col gap-1">
              <h3 className="leading-tight font-semibold">{event.title}</h3>
              <div className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 text-sm">
                {event.location && <span>{event.location}</span>}
                <span>{formatEventDateTime(event.starts_at)}</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge variant={statusBadgeVariant[status]}>
                {eventStatusLabel[status]}
              </Badge>
              <span className="text-muted-foreground text-sm tabular-nums">
                참여자 {participantCount}명
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
