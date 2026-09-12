import { Suspense } from "react";

import { AdminSortSelect } from "@/components/admin/admin-sort-select";
import { AdminUserFilterBar } from "@/components/admin/admin-user-filter-bar";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { formatEventDateTime } from "@/lib/format";
import {
  DEFAULT_PAGE_SIZE,
  parsePage,
  parseSort,
  sanitizeSearchTerm,
  toRange,
} from "@/lib/pagination";
import { createClient } from "@/lib/supabase/server";

const SORT_COLUMNS = ["created_at", "email", "full_name"] as const;

async function AdminUserTable({
  searchParams,
}: {
  searchParams: {
    q?: string;
    role?: string;
    page?: string;
    sort?: string;
    dir?: string;
  };
}) {
  const supabase = await createClient();

  const page = parsePage(searchParams.page);
  const [from, to] = toRange(page, DEFAULT_PAGE_SIZE);
  const sort = parseSort(searchParams.sort, SORT_COLUMNS, "created_at");
  const ascending = searchParams.dir !== "desc";

  let query = supabase
    .from("profiles")
    .select("id, email, full_name, username, role, created_at", {
      count: "exact",
    });

  const q = searchParams.q ? sanitizeSearchTerm(searchParams.q) : "";
  if (q) {
    query = query.or(
      `email.ilike.%${q}%,full_name.ilike.%${q}%,username.ilike.%${q}%`,
    );
  }
  if (searchParams.role) {
    query = query.eq("role", searchParams.role);
  }

  const { data: users, count } = await query
    .order(sort, { ascending })
    .range(from, to);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / DEFAULT_PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4">
      {!users || users.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border border-dashed p-10 text-center">
          조건에 맞는 사용자가 없어요.
        </div>
      ) : (
        users.map((user) => (
          <div
            key={user.id}
            className="bg-card flex items-center gap-3 rounded-xl border p-4"
          >
            <div className="flex flex-1 flex-col gap-1">
              <h3 className="leading-tight font-semibold">
                {user.full_name || user.username || "이름 없음"}
              </h3>
              <div className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 text-sm">
                {user.email && <span>{user.email}</span>}
                <span>가입일 {formatEventDateTime(user.created_at)}</span>
              </div>
            </div>
            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
              {user.role === "admin" ? "관리자" : "일반 사용자"}
            </Badge>
          </div>
        ))
      )}

      <PaginationControls page={page} totalPages={totalPages} />
    </div>
  );
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    role?: string;
    page?: string;
    sort?: string;
    dir?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">사용자 관리</h1>

      <AdminUserFilterBar />
      <AdminSortSelect
        options={[
          { value: "created_at", label: "가입일" },
          { value: "email", label: "이메일" },
          { value: "full_name", label: "이름" },
        ]}
      />

      <Suspense>
        <AdminUserTable searchParams={params} />
      </Suspense>
    </div>
  );
}
