import { Suspense } from "react";

import { ResetPasswordForm } from "~/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-zinc-900" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
