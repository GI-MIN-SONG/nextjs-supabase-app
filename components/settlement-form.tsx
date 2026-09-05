"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  saveSettlement,
  togglePaid,
} from "@/app/protected/events/[eventId]/settlement/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  calculateSettlementShares,
  getSettlementTargets,
} from "@/lib/settlement";
import type { SettlementParticipant } from "@/lib/settlement";
import { formatCurrency, participantStatusLabel } from "@/lib/format";
import type { ParticipantStatus } from "@/lib/types/event";

type Participant = {
  id: string;
  name: string;
  status: string;
  is_excluded_from_settlement: boolean;
};

type Settlement = {
  id: string;
  total_amount: number;
  bank_account: string | null;
  account_holder: string | null;
  memo: string | null;
} | null;

type Share = {
  id: string;
  participant_id: string;
  amount_due: number;
  is_paid: boolean;
};

export function SettlementForm({
  eventId,
  participants,
  settlement,
  shares,
}: {
  eventId: string;
  participants: Participant[];
  settlement: Settlement;
  shares: Share[];
}) {
  const router = useRouter();
  const [totalAmount, setTotalAmount] = useState(
    settlement ? String(settlement.total_amount) : "",
  );
  const [bankAccount, setBankAccount] = useState(
    settlement?.bank_account ?? "",
  );
  const [accountHolder, setAccountHolder] = useState(
    settlement?.account_holder ?? "",
  );
  const [memo, setMemo] = useState(settlement?.memo ?? "");
  const [excludedIds, setExcludedIds] = useState<Set<string>>(
    () =>
      new Set(
        participants
          .filter((p) => p.is_excluded_from_settlement)
          .map((p) => p.id),
      ),
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingShareId, setPendingShareId] = useState<string | null>(null);

  // 총금액/참여자 목록/제외 체크 상태가 바뀔 때마다 실시간으로 1인당 분담액을 미리 계산한다.
  const previewShares = useMemo(() => {
    const mapped: SettlementParticipant[] = participants.map((p) => ({
      id: p.id,
      status: p.status as ParticipantStatus,
      isExcludedFromSettlement: excludedIds.has(p.id),
    }));
    return calculateSettlementShares(Number(totalAmount), mapped);
  }, [participants, excludedIds, totalAmount]);

  const previewAmountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const share of previewShares) {
      map.set(share.participantId, share.amountDue);
    }
    return map;
  }, [previewShares]);

  const targetIds = useMemo(() => {
    const mapped: SettlementParticipant[] = participants.map((p) => ({
      id: p.id,
      status: p.status as ParticipantStatus,
      isExcludedFromSettlement: excludedIds.has(p.id),
    }));
    return new Set(getSettlementTargets(mapped).map((p) => p.id));
  }, [participants, excludedIds]);

  const participantNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of participants) {
      map.set(p.id, p.name);
    }
    return map;
  }, [participants]);

  const handleToggleExcluded = (participantId: string, checked: boolean) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(participantId);
      } else {
        next.delete(participantId);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = Number(totalAmount);
    if (Number.isNaN(amount) || amount < 0) {
      setError("총 금액을 올바르게 입력해주세요");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.set("eventId", eventId);
      formData.set("totalAmount", totalAmount);
      formData.set("bankAccount", bankAccount);
      formData.set("accountHolder", accountHolder);
      formData.set("memo", memo);
      for (const id of excludedIds) {
        formData.append("excludedParticipantId", id);
      }

      await saveSettlement(formData);
      // 저장 성공 후 서버에서 다시 읽어온 최신 값(정산/참여자 상태)으로
      // 화면을 동기화한다 - revalidatePath만으로는 이미 마운트된 클라이언트
      // state가 갱신되지 않기 때문에 router.refresh()로 서버 컴포넌트를 재요청한다.
      router.refresh();
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePaid = async (shareId: string, nextIsPaid: boolean) => {
    setPendingShareId(shareId);
    try {
      const formData = new FormData();
      formData.set("shareId", shareId);
      formData.set("isPaid", String(nextIsPaid));
      await togglePaid(formData);
      router.refresh();
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다",
      );
    } finally {
      setPendingShareId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">참여자별 정산 대상</CardTitle>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
              아직 응답한 참여자가 없어요
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>참석 여부</TableHead>
                  <TableHead>정산 제외</TableHead>
                  <TableHead>미리보기 금액</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>
                      {participantStatusLabel[p.status as ParticipantStatus]}
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={excludedIds.has(p.id)}
                        onCheckedChange={(checked) =>
                          handleToggleExcluded(p.id, checked === true)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {targetIds.has(p.id)
                        ? formatCurrency(previewAmountMap.get(p.id) ?? 0)
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">정산 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="totalAmount">총 금액</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  min="0"
                  required
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bankAccount">계좌번호</Label>
                <Input
                  id="bankAccount"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="accountHolder">예금주</Label>
                <Input
                  id="accountHolder"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="memo">메모</Label>
                <Input
                  id="memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "저장 중..." : "정산 저장"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {settlement && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">입금 여부</CardTitle>
          </CardHeader>
          <CardContent>
            {shares.length === 0 ? (
              <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
                정산 대상 참여자가 없어요
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>입금 완료</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shares.map((share) => (
                    <TableRow key={share.id}>
                      <TableCell>
                        {participantNameMap.get(share.participant_id) ?? "-"}
                      </TableCell>
                      <TableCell>{formatCurrency(share.amount_due)}</TableCell>
                      <TableCell>
                        <Checkbox
                          checked={share.is_paid}
                          disabled={pendingShareId === share.id}
                          onCheckedChange={(checked) =>
                            handleTogglePaid(share.id, checked === true)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
