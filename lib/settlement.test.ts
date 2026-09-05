import { describe, it, expect } from "vitest";
import {
  getSettlementTargets,
  calculateSettlementShares,
  type SettlementParticipant,
} from "./settlement";

describe("getSettlementTargets", () => {
  it("참석 && 정산 비제외 참여자만 반환한다", () => {
    const participants: SettlementParticipant[] = [
      { id: "1", status: "attending", isExcludedFromSettlement: false },
      { id: "2", status: "not_attending", isExcludedFromSettlement: false },
      { id: "3", status: "pending", isExcludedFromSettlement: false },
      { id: "4", status: "attending", isExcludedFromSettlement: true },
    ];

    const targets = getSettlementTargets(participants);

    expect(targets).toHaveLength(1);
    expect(targets[0].id).toBe("1");
  });

  it("불참/미응답/정산 제외 참여자는 결과에서 빠진다", () => {
    const participants: SettlementParticipant[] = [
      { id: "1", status: "not_attending", isExcludedFromSettlement: false },
      { id: "2", status: "pending", isExcludedFromSettlement: false },
      { id: "3", status: "attending", isExcludedFromSettlement: true },
    ];

    expect(getSettlementTargets(participants)).toEqual([]);
  });
});

describe("calculateSettlementShares", () => {
  it("나누어떨어지는 경우 모두 동일하게 분담한다 (30000원 / 3명)", () => {
    const participants: SettlementParticipant[] = [
      { id: "1", status: "attending", isExcludedFromSettlement: false },
      { id: "2", status: "attending", isExcludedFromSettlement: false },
      { id: "3", status: "attending", isExcludedFromSettlement: false },
    ];

    const shares = calculateSettlementShares(30000, participants);

    expect(shares).toEqual([
      { participantId: "1", amountDue: 10000 },
      { participantId: "2", amountDue: 10000 },
      { participantId: "3", amountDue: 10000 },
    ]);
  });

  it("나누어떨어지지 않는 경우 앞에서부터 나머지를 배정한다 (10000원 / 3명)", () => {
    const participants: SettlementParticipant[] = [
      { id: "1", status: "attending", isExcludedFromSettlement: false },
      { id: "2", status: "attending", isExcludedFromSettlement: false },
      { id: "3", status: "attending", isExcludedFromSettlement: false },
    ];

    const shares = calculateSettlementShares(10000, participants);

    expect(shares).toEqual([
      { participantId: "1", amountDue: 3334 },
      { participantId: "2", amountDue: 3333 },
      { participantId: "3", amountDue: 3333 },
    ]);

    const sum = shares.reduce((acc, s) => acc + s.amountDue, 0);
    expect(sum).toBe(10000);
  });

  it("정산 대상이 0명이면 빈 배열을 반환하고 예외를 던지지 않는다", () => {
    const participants: SettlementParticipant[] = [
      { id: "1", status: "not_attending", isExcludedFromSettlement: false },
      { id: "2", status: "attending", isExcludedFromSettlement: true },
    ];

    expect(() => calculateSettlementShares(10000, participants)).not.toThrow();
    expect(calculateSettlementShares(10000, participants)).toEqual([]);
  });

  it("totalAmount가 0이면 전원 amountDue가 0이다", () => {
    const participants: SettlementParticipant[] = [
      { id: "1", status: "attending", isExcludedFromSettlement: false },
      { id: "2", status: "attending", isExcludedFromSettlement: false },
    ];

    const shares = calculateSettlementShares(0, participants);

    expect(shares).toEqual([
      { participantId: "1", amountDue: 0 },
      { participantId: "2", amountDue: 0 },
    ]);
  });

  it("필터링된(참석 아님/제외) 참여자는 결과 배열에 나타나지 않는다", () => {
    const participants: SettlementParticipant[] = [
      { id: "1", status: "attending", isExcludedFromSettlement: false },
      { id: "2", status: "not_attending", isExcludedFromSettlement: false },
      { id: "3", status: "pending", isExcludedFromSettlement: false },
      { id: "4", status: "attending", isExcludedFromSettlement: true },
    ];

    const shares = calculateSettlementShares(10000, participants);
    const ids = shares.map((s) => s.participantId);

    expect(ids).toEqual(["1"]);
    expect(ids).not.toContain("2");
    expect(ids).not.toContain("3");
    expect(ids).not.toContain("4");
  });
});
