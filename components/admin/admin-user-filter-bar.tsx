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

export function AdminUserFilterBar() {
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
          placeholder="이메일, 이름, 아이디 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="submit" variant="outline">
          검색
        </Button>
      </form>

      <Select
        value={searchParams.get("role") ?? "all"}
        onValueChange={(value) =>
          updateParams({ role: value === "all" ? null : value })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="권한 필터" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 권한</SelectItem>
          <SelectItem value="user">일반 사용자</SelectItem>
          <SelectItem value="admin">관리자</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
