import { Suspense } from "react";

import { ProfileForm } from "@/components/profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function OnboardingForm({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <ProfileForm initialFullName="" onboardingNext={next ?? ""} />;
}

export default function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return (
    <div className="flex w-full flex-1 flex-col gap-6">
      <h1 className="text-2xl font-bold">프로필 설정</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            서비스를 이용하기 전에 이름을 입력해주세요
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense>
            <OnboardingForm searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
