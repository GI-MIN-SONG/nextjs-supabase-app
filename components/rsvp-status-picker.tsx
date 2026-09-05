"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { ParticipantStatus } from "@/lib/types/event";

type AttendStatus = Extract<ParticipantStatus, "attending" | "not_attending">;

export function RsvpStatusPicker({
  value,
  onValueChange,
}: {
  value: AttendStatus;
  onValueChange: (value: AttendStatus) => void;
}) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onValueChange(v as AttendStatus)}
      className="grid grid-cols-2 gap-3"
    >
      <label
        htmlFor="status-attending"
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors",
          value === "attending" && "border-primary bg-accent",
        )}
      >
        <RadioGroupItem
          value="attending"
          id="status-attending"
          className="sr-only"
        />
        <span className="text-sm font-semibold">참석할게요</span>
      </label>
      <label
        htmlFor="status-not_attending"
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors",
          value === "not_attending" && "border-destructive bg-destructive/10",
        )}
      >
        <RadioGroupItem
          value="not_attending"
          id="status-not_attending"
          className="sr-only"
        />
        <span className="text-sm font-semibold">참석 못해요</span>
      </label>
    </RadioGroup>
  );
}
