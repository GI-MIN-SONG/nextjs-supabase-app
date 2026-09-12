"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { eventStatusLabel } from "@/lib/format";
import type { EventStatus } from "@/lib/types/event";

export function AdminEventFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: q || null });
  };

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <Input
          placeholder="제목, 장소 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="submit" variant="outline">
          검색
        </Button>
      </form>

      <Select
        value={searchParams.get("status") ?? "all"}
        onValueChange={(value) =>
          updateParams({ status: value === "all" ? null : value })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="상태 필터" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 상태</SelectItem>
          {(Object.keys(eventStatusLabel) as EventStatus[]).map((status) => (
            <SelectItem key={status} value={status}>
              {eventStatusLabel[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
