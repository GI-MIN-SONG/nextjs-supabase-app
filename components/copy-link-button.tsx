"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-2">
      <Input readOnly value={url} className="flex-1" />
      <Button type="button" variant="outline" onClick={handleCopy}>
        {copied ? "복사됨" : "복사"}
      </Button>
    </div>
  );
}
