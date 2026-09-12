export const DEFAULT_PAGE_SIZE = 20;

export function parsePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export function toRange(
  page: number,
  pageSize = DEFAULT_PAGE_SIZE,
): [number, number] {
  const from = (page - 1) * pageSize;
  return [from, from + pageSize - 1];
}

export function parseSort<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  return (allowed as readonly string[]).includes(value ?? "")
    ? (value as T)
    : fallback;
}

// PostgREST ilike/or 필터 문법에서 의미를 갖는 문자(%,_,(,),,)를 제거해
// 검색어에 특수문자가 섞여도 필터 구문이 깨지지 않게 한다.
export function sanitizeSearchTerm(value: string): string {
  return value.replace(/[%_(),]/g, "");
}
