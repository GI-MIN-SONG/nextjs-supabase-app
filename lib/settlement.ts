import type { ParticipantStatus } from "@/lib/types/event";

/**
 * 정산 계산에 필요한 최소한의 참여자 정보.
 * Supabase 테이블 컬럼(snake_case)을 그대로 쓰지 않고 camelCase로 매핑해 전달받는다.
 */
export type SettlementParticipant = {
  id: string;
  status: ParticipantStatus;
  isExcludedFromSettlement: boolean;
};

/** 참여자별 정산 분담액 */
export type SettlementShare = {
  participantId: string;
  amountDue: number;
};

/**
 * 정산 대상 필터 (F009 규칙).
 * 참석(status === "attending")이면서 정산 제외 처리되지 않은(!isExcludedFromSettlement) 참여자만
 * 정산 대상으로 취급한다. 불참/미응답 참여자와 호스트가 정산에서 제외 처리한 참여자는
 * 아예 분담 대상에서 빠진다.
 */
export function getSettlementTargets(
  participants: SettlementParticipant[],
): SettlementParticipant[] {
  return participants.filter(
    (p) => p.status === "attending" && !p.isExcludedFromSettlement,
  );
}

/**
 * 총 금액을 정산 대상 인원수로 나눠 1인당 분담액을 계산한다.
 *
 * 잔액 분배 규칙: totalAmount가 인원수로 나누어떨어지지 않을 경우,
 * 몫(base)에 나머지(remainder)만큼을 입력 순서(정산 대상으로 필터링된 순서) 앞에서부터
 * 1원씩 추가로 배정한다. 즉 앞쪽 remainder명은 (base + 1)원, 나머지는 base원을 낸다.
 * 이렇게 하면 반환값 합계가 항상 safeAmount(보정된 총액)와 정확히 일치한다.
 */
export function calculateSettlementShares(
  totalAmount: number,
  participants: SettlementParticipant[],
): SettlementShare[] {
  const targets = getSettlementTargets(participants);
  const n = targets.length;

  // 정산 대상이 없거나 금액이 유한하지 않으면(NaN/Infinity) 계산을 시도하지 않고 빈 배열을 반환한다.
  // 예외를 던지지 않는 이유: 화면(Task 012)에서 입력 도중의 불완전한 상태를 그대로 미리보기에 반영해야 하기 때문.
  if (n === 0 || !Number.isFinite(totalAmount)) {
    return [];
  }

  // 음수/소수 입력에 대한 방어 가드.
  // 음수 금액 자체를 막는 UI 검증은 정산 계산기 화면(Task 012)의 책임이며,
  // 이 함수는 어떤 입력이 와도 계산이 깨지지 않도록(음수 분담액/소수점 분담액 발생 방지) 보정만 한다.
  const safeAmount = Math.max(0, Math.trunc(totalAmount));

  const base = Math.floor(safeAmount / n);
  const remainder = safeAmount - base * n;

  return targets.map((p, index) => ({
    participantId: p.id,
    amountDue: index < remainder ? base + 1 : base,
  }));
}
