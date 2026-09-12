import { Suspense } from "react";

import { AdminDeleteEventButton } from "@/components/admin/admin-delete-event-button";
import { AdminEventFilterBar } from "@/components/admin/admin-event-filter-bar";
import { AdminSortSelect } from "@/components/admin/admin-sort-select";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { eventStatusLabel, formatEventDateTime } from "@/lib/format";
import {
  DEFAULT_PAGE_SIZE,
  parsePage,
  parseSort,
  sanitizeSearchTerm,
  toRange,
} from "@/lib/pagination";
import { createClient } from "@/lib/supabase/server";
import type { EventStatus } from "@/lib/types/event";

const SORT_COLUMNS = ["starts_at", "title", "created_at"] as const;

async function AdminEventTable({
  searchParams,
}: {
  searchParams: {
    q?: string;
    status?: string;
    page?: string;
    sort?: string;
    dir?: string;
  };
}) {
  const supabase = await createClient();

  const page = parsePage(searchParams.page);
  const [from, to] = toRange(page, DEFAULT_PAGE_SIZE);
  const sort = parseSort(searchParams.sort, SORT_COLUMNS, "starts_at");
  const ascending = searchParams.dir !== "desc";

  let query = supabase
    .from("events")
    .select("id, title, location, starts_at, status, host_id", {
      count: "exact",
    });

  const q = searchParams.q ? sanitizeSearchTerm(searchParams.q) : "";
  if (q) {
    query = query.or(`title.ilike.%${q}%,location.ilike.%${q}%`);
  }
  if (searchParams.status) {
    query = query.eq("status", searchParams.status);
  }

  const { data: events, count } = await query
    .order(sort, { ascending })
    .range(from, to);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / DEFAULT_PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4">
      {!events || events.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border border-dashed p-10 text-center">
          조건에 맞는 이벤트가 없어요.
        </div>
      ) : (
        events.map((event) => {
          const status = event.status as EventStatus;
          return (
            <div
              key={event.id}
              className="bg-card flex items-center gap-3 rounded-xl border p-4"
            >
              <div className="flex flex-1 flex-col gap-1">
                <h3 className="leading-tight font-semibold">{event.title}</h3>
                <div className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 text-sm">
                  {event.location && <span>{event.location}</span>}
                  <span>{formatEventDateTime(event.starts_at)}</span>
                </div>
              </div>
              <Badge>{eventStatusLabel[status]}</Badge>
              <AdminDeleteEventButton eventId={event.id} />
            </div>
          );
        })
      )}

      <PaginationControls page={page} totalPages={totalPages} />
    </div>
  );
}

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
    sort?: string;
    dir?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">이벤트 관리</h1>

      <AdminEventFilterBar />
      <AdminSortSelect
        options={[
          { value: "starts_at", label: "일시" },
          { value: "title", label: "제목" },
          { value: "created_at", label: "생성일" },
        ]}
      />

      <Suspense>
        <AdminEventTable searchParams={params} />
      </Suspense>
    </div>
  );
}
