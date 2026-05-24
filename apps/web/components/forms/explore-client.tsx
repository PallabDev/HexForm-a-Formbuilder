"use client";

import Link from "next/link";
import { IconExternalLink, IconSearch, IconWorld } from "@tabler/icons-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useExploreForms } from "~/hooks/api/forms";

export function ExploreClient() {
  const { forms, isLoading, error } = useExploreForms({ limit: 24 });

  return (
    <main className="min-h-dvh px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-lg border bg-card p-6">
          <Badge variant="outline" className="border-accent/40 text-accent">
            <IconWorld />
            Public gallery
          </Badge>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-normal">
                Explore live form missions.
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Public forms are discoverable here. Unlisted forms stay hidden and only open through
                their direct link.
              </p>
            </div>
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search coming soon" />
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error.message}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            <GallerySkeleton />
          ) : forms.length === 0 ? (
            <div className="col-span-full rounded-lg border border-dashed bg-card p-10 text-center">
              <h2 className="font-semibold">No public forms yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Publish a form as public from the dashboard to feature it here.
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/forms">Open builder</Link>
              </Button>
            </div>
          ) : (
            forms.map((form) => (
              <article key={form.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge className="bg-primary/15 text-primary" variant="outline">
                      {form.visibility}
                    </Badge>
                    <h2 className="mt-3 text-lg font-semibold">{form.title}</h2>
                  </div>
                  <span className="rounded-md border bg-background/40 px-2 py-1 text-xs text-muted-foreground">
                    {form.submissionCount} responses
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {form.description ?? "A public HexForm ready for response collection."}
                </p>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <p className="truncate text-xs text-muted-foreground">/{form.slug}</p>
                  <Button asChild size="sm">
                    <Link href={`/f/${form.slug}`}>
                      <IconExternalLink />
                      Open
                    </Link>
                  </Button>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}

function GallerySkeleton() {
  return (
    <>
      {[1, 2, 3].map((item) => (
        <div key={item} className="h-52 animate-pulse rounded-lg border bg-card" />
      ))}
    </>
  );
}
