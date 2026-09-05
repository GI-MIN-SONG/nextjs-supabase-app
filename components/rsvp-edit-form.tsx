"use client";

import { useState } from "react";

import { updateRsvp } from "@/app/e/[eventId]/actions";
import { RsvpStatusPicker } from "@/components/rsvp-status-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AttendStatus = "attending" | "not_attending";

export function RsvpEditForm({
  eventId,
  accessToken,
  initialStatus,
  initialNote,
}: {
  eventId: string;
  accessToken: string;
  initialStatus: AttendStatus;
  initialNote: string;
}) {
  const [status, setStatus] = useState<AttendStatus>(initialStatus);
  const [note, setNote] = useState(initialNote);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.set("status", status);
      formData.set("note", note);

      const result = await updateRsvp(eventId, accessToken, formData);
      setStatus(result.status as AttendStatus);
      setNote(result.note ?? "");
      setSuccessMessage("저장되었습니다");
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-2">
        <Label>참석 여부</Label>
        <RsvpStatusPicker value={status} onValueChange={setStatus} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="note">카풀 메모 (선택, 최대 200자)</Label>
        <Textarea
          id="note"
          maxLength={200}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <p className="text-muted-foreground text-right text-xs">
          {note.length} / 200
        </p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {successMessage && (
        <p className="text-muted-foreground text-sm">{successMessage}</p>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "저장 중..." : "저장"}
      </Button>
    </form>
  );
}
