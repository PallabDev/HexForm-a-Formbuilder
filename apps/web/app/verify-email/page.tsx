import { Suspense } from "react";

import { VerifyEmailForm } from "~/components/verify-email-form";

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<div className="h-52 animate-pulse rounded-lg bg-zinc-900" />}>
          <VerifyEmailForm />
        </Suspense>
      </div>
    </div>
  );
}
