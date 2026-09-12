"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { updateProfile } from "@/app/protected/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({
  initialFullName,
  onboardingNext,
}: {
  initialFullName: string;
  onboardingNext?: string;
}) {
  const [fullName, setFullName] = useState(initialFullName);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.set("fullName", fullName);
      const result = await updateProfile(formData);

      if (result?.error) {
        setError(result.error);
      } else if (onboardingNext !== undefined) {
        router.push(onboardingNext || "/protected/events");
      } else {
        setSuccess(true);
      }
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">이름</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          maxLength={50}
        />
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "저장 중..." : "저장"}
      </Button>
      {error && <p className="text-destructive text-sm">{error}</p>}
      {success && (
        <p className="text-muted-foreground text-sm">저장되었습니다</p>
      )}
    </form>
  );
}
