import { Suspense } from "react";

import { LoginForm } from "@/components/login-form";

async function LoginFormWithNext({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <LoginForm next={next} />;
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense>
          <LoginFormWithNext searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
