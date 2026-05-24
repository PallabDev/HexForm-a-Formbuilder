"use client";

import { IconMail, IconShieldCheck, IconUserCircle, IconLoader } from "@tabler/icons-react";
import { Badge } from "~/components/ui/badge";
import { useUser } from "~/hooks/api/auth";

export function AccountConsole() {
  const { user, isLoading, error } = useUser();

  if (isLoading) {
    return (
      <main className="val-dot-grid min-h-[calc(100dvh-6rem)] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <IconLoader className="size-10 text-primary animate-spin mx-auto" />
          <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">
            Loading Account profile...
          </h2>
        </div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="val-card-red p-6 text-sm text-destructive rounded-[3px] border border-destructive/40 bg-destructive/10 max-w-md mx-auto mt-12 text-center uppercase tracking-wider font-mono">
        {error?.message ?? "You are not signed in."}
      </main>
    );
  }

  return (
    <main className="space-y-6 w-full px-6 mx-auto animate-in fade-in duration-200 py-2">
      {/* Title block */}
      <section className="bg-card border border-border p-6 rounded-[3px] space-y-2">
        <Badge className="bg-primary/10 text-primary border border-primary/40 rounded-[2px] uppercase text-[9px] tracking-widest px-2.5">
          Creator Identity
        </Badge>
        <h1 className="text-2xl font-bold uppercase tracking-wide text-white">Creator profile HUD</h1>
        <p className="max-w-2xl text-xs text-muted-foreground uppercase leading-relaxed font-mono">
          Your signed-in workspace identity for form creation, publishing telemetry, and analytics control.
        </p>
      </section>

      {/* Profile Details section */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="bg-card border border-border p-6 rounded-[3px] lg:col-span-2 space-y-6">
          <div className="flex items-center gap-4 border-b border-border pb-4">
            <div className="flex size-14 items-center justify-center rounded-[3px] border border-border bg-background">
              <IconUserCircle className="size-9 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-white uppercase tracking-wider">{user.fullName}</h2>
              <p className="truncate text-xs text-muted-foreground font-mono">{user.email}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Info label="User Identity Key" value={user.id} />
            <Info label="Profile Image Coordinate" value={user.profileImageUrl ?? "Not configured"} />
          </div>
        </div>

        {/* Access Rights side bar */}
        <div className="bg-card border border-border p-6 rounded-[3px] flex flex-col justify-between min-h-[220px]">
          <div className="space-y-4">
            <IconShieldCheck className="size-8 text-accent" />
            <h2 className="font-bold text-white uppercase tracking-wider text-sm">Protected creator access</h2>
            <p className="text-xs text-muted-foreground uppercase font-mono leading-relaxed">
              Dashboard consoles, form builders, and aggregate analytics queries run under secure, authenticated procedures.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 rounded-[3px] border border-border bg-[#121212] p-3 text-xs font-mono">
            <IconMail className="size-4 text-primary" />
            <span className="text-white truncate">{user.email}</span>
          </div>
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[3px] border border-border bg-[#121212] p-4 font-mono">
      <p className="text-[10px] uppercase text-muted-foreground font-semibold">{label}</p>
      <p className="mt-1.5 break-all text-xs font-bold text-white">{value}</p>
    </div>
  );
}
