"use client";

import { useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AdminSortSelect({
  options,
}: {
  options: { value: string; label: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") ?? options[0]?.value;
  const dir = searchParams.get("dir") ?? "asc";
  const current = `${sort}:${dir}`;

  const handleChange = (value: string) => {
    const [nextSort, nextDir] = value.split(":");
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", nextSort);
    params.set("dir", nextDir);
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger>
        <SelectValue placeholder="정렬" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <>
            <SelectItem
              key={`${option.value}:asc`}
              value={`${option.value}:asc`}
            >
              {option.label} 오름차순
            </SelectItem>
            <SelectItem
              key={`${option.value}:desc`}
              value={`${option.value}:desc`}
            >
              {option.label} 내림차순
            </SelectItem>
          </>
        ))}
      </SelectContent>
    </Select>
  );
}
