"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { submitRsvp } from "@/app/e/[eventId]/actions";
import { RsvpStatusPicker } from "@/components/rsvp-status-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function RsvpForm({ eventId }: { eventId: string }) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"attending" | "not_attending">(
    "attending",
  );
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [existingToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(`rsvp-token-${eventId}`);
  });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("이름을 입력해주세요");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("status", status);
      formData.set("note", note);

      const { accessToken } = await submitRsvp(eventId, formData);
      localStorage.setItem(`rsvp-token-${eventId}`, accessToken);
      router.push(`/e/${eventId}/r/${accessToken}`);
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

  if (existingToken) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border p-4 text-sm">
        <p className="text-muted-foreground">이미 응답을 제출하셨습니다.</p>
        <Button asChild variant="outline">
          <a href={`/e/${eventId}/r/${existingToken}`}>내 응답 확인/수정하기</a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-2">
        <Label htmlFor="name">이름</Label>
        <Input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

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

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "제출 중..." : "응답 제출하기"}
      </Button>
    </form>
  );
}
