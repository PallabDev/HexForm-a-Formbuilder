"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconExternalLink,
  IconFileText,
  IconSearch,
  IconUsers,
  IconWorld,
} from "@tabler/icons-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { useExploreForms } from "~/hooks/api/forms";

export function ExploreClient() {
  const { forms, isLoading, error } = useExploreForms({ limit: 24 });
  const [searchQuery, setSearchQuery] = useState("");

  const filteredForms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return forms;

    return forms.filter(
      (f) =>
        f.title.toLowerCase().includes(query) ||
        stripHtml(f.description ?? "").toLowerCase().includes(query) ||
        f.slug.toLowerCase().includes(query),
    );
  }, [forms, searchQuery]);

  return (
    <main className="min-h-dvh bg-background px-4 py-6 md:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 animate-in fade-in duration-300">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                <IconWorld className="size-3" />
                Public directory
              </Badge>
              <Button asChild size="sm" variant="ghost" className="h-8 cursor-pointer text-xs">
                <Link href="/dashboard">
                  <IconArrowLeft className="size-3.5" />
                  Dashboard
                </Link>
              </Button>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Explore Forms</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Discover public forms from the HexForm community. Unlisted forms stay private unless shared directly.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-80">
            <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error.message}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            <GallerySkeleton />
          ) : filteredForms.length === 0 ? (
            <div className="col-span-full mx-auto w-full max-w-md rounded-xl border border-border bg-card p-12 text-center">
              <IconFileText className="mx-auto size-12 text-muted-foreground" />
              <h2 className="mt-4 text-base font-semibold">No Forms Found</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                No public forms match your search yet. Create a form and enable its public listing to show it here.
              </p>
              <Button asChild className="mt-5 cursor-pointer">
                <Link href="/dashboard/forms">Create Form</Link>
              </Button>
            </div>
          ) : (
            filteredForms.map((form) => (
              <article
                key={form.id}
                className="flex min-h-[220px] flex-col justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:border-zinc-700"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-[10px]">
                      Public
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {form.visibility}
                    </Badge>
                  </div>

                  <div>
                    <h2 className="line-clamp-1 text-base font-semibold tracking-tight">
                      {form.title || "Untitled form"}
                    </h2>
                    <p className="mt-1 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {stripHtml(form.description ?? "Active survey form ready for responses.")}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <IconUsers className="size-3.5" />
                      {form.submissionCount} responses
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
                  <span className="min-w-0 truncate text-xs text-muted-foreground">/{form.slug}</span>
                  <Button asChild size="sm" variant="outline" className="shrink-0 cursor-pointer text-xs">
                    <Link href={`/f/${form.slug}`}>
                      <IconExternalLink className="size-3.5" />
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
        <div key={item} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="mt-6 h-5 w-3/4" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-5/6" />
          <div className="mt-8 flex items-center justify-between border-t border-border pt-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
      ))}
    </>
  );
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").trim();
}
