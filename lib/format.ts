import type { EventStatus, ParticipantStatus } from "@/lib/types/event";

export function formatEventDateTime(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(amount);
}

export const eventStatusLabel: Record<EventStatus, string> = {
  open: "진행중",
  closed: "마감",
  cancelled: "취소",
};

export const participantStatusLabel: Record<ParticipantStatus, string> = {
  attending: "참석",
  not_attending: "불참",
  pending: "미응답",
};
