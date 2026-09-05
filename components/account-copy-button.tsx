"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function AccountCopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{value}</span>
      <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
        {copied ? "복사됨" : "복사"}
      </Button>
    </div>
  );
}
