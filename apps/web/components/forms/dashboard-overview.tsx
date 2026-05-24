"use client";

import Link from "next/link";
import {
  IconChartBar,
  IconExternalLink,
  IconForms,
  IconShieldCheck,
  IconSparkles,
} from "@tabler/icons-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useMyForms } from "~/hooks/api/forms";

export function DashboardOverview() {
  const { forms, isLoading, error } = useMyForms({ limit: 6 });
  const published = forms.filter((form) => form.status === "PUBLISHED").length;
  const totalResponses = forms.reduce((count, form) => count + form.submissionCount, 0);
  const responseCapacity = forms.reduce((count, form) => count + (form.submissionLimit ?? 0), 0);

  return (
    <main className="space-y-5">
      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="relative overflow-hidden rounded-lg border bg-card p-5">
          <div className="absolute inset-y-0 right-0 w-1/3 bg-primary/10 [clip-path:polygon(32%_0,100%_0,100%_100%,0_100%)]" />
          <div className="relative max-w-2xl space-y-4">
            <Badge className="bg-primary/15 text-primary" variant="outline">
              Tactical form ops
            </Badge>
            <div>
              <h1 className="text-3xl font-semibold tracking-normal">
                Launch forms like missions.
              </h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Build dynamic forms, publish public or unlisted links, then watch responses flow
                into one focused command surface.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/dashboard/forms">
                  <IconForms />
                  Build form
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/explore">
                  <IconExternalLink />
                  Public explore
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-muted-foreground">System Health</p>
              <h2 className="text-xl font-semibold">Ready for judges</h2>
            </div>
            <IconShieldCheck className="size-8 text-accent" />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <Metric label="Forms" value={isLoading ? "..." : forms.length.toString()} />
            <Metric label="Live" value={isLoading ? "..." : published.toString()} />
            <Metric label="Responses" value={isLoading ? "..." : totalResponses.toString()} />
          </div>
          {error ? <p className="mt-4 text-sm text-destructive">{error.message}</p> : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <IconSparkles className="mb-3 size-5 text-primary" />
          <h3 className="font-semibold">Dynamic schema</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Text, email, number, select, checkbox, rating, date, file URL, and required rules.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <IconExternalLink className="mb-3 size-5 text-accent" />
          <h3 className="font-semibold">Visibility control</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Public forms can be discovered. Unlisted forms stay hidden unless someone has the link.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <IconChartBar className="mb-3 size-5 text-chart-3" />
          <h3 className="font-semibold">Response intel</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Track submissions, remaining capacity, and daily response patterns per form.
          </p>
        </div>
      </section>

      <section className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="font-semibold">Recent forms</h2>
            <p className="text-sm text-muted-foreground">
              {responseCapacity > 0
                ? `${totalResponses}/${responseCapacity} response slots used`
                : "No response limits configured yet"}
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/forms">Manage</Link>
          </Button>
        </div>
        <div className="divide-y">
          {forms.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              Create your first form to populate the mission board.
            </div>
          ) : (
            forms.map((form) => (
              <div key={form.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{form.title}</p>
                  <p className="text-xs text-muted-foreground">/{form.slug}</p>
                </div>
                <Badge variant={form.status === "PUBLISHED" ? "default" : "outline"}>
                  {form.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background/40 p-3">
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
