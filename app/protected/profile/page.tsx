import { Suspense } from "react";

import { LogoutButton } from "@/components/logout-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

async function ProfileContent() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims.email;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">계정 정보</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">{email}</p>
        <LogoutButton />
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  return (
    <div className="flex w-full flex-1 flex-col gap-6">
      <h1 className="text-2xl font-bold">프로필</h1>
      <Suspense>
        <ProfileContent />
      </Suspense>
    </div>
  );
}
