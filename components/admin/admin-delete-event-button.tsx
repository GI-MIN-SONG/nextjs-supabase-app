"use client";

import { useState } from "react";

import { adminDeleteEvent } from "@/app/protected/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AdminDeleteEventButton({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.set("eventId", eventId);
      await adminDeleteEvent(formData);
      setOpen(false);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="destructive">
          삭제
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>이 이벤트를 삭제할까요?</DialogTitle>
          <DialogDescription>
            다른 사용자가 만든 이벤트일 수 있습니다. 참여자 응답과 정산 정보가
            모두 함께 삭제되며, 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "삭제 중..." : "삭제"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
