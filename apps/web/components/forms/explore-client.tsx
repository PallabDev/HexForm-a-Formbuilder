"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { IconExternalLink, IconSearch, IconWorld, IconBolt, IconLock, IconArrowLeft } from "@tabler/icons-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useExploreForms } from "~/hooks/api/forms";

export function ExploreClient() {
  const { forms, isLoading, error } = useExploreForms({ limit: 24 });
  const [searchQuery, setSearchQuery] = useState("");

  // Search filter
  const filteredForms = useMemo(() => {
    if (!searchQuery) return forms;
    const lower = searchQuery.toLowerCase();
    return forms.filter(
      (f) =>
        f.title.toLowerCase().includes(lower) ||
        (f.description ?? "").toLowerCase().includes(lower),
    );
  }, [forms, searchQuery]);

  return (
    <main className="val-dot-grid min-h-dvh px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        
        {/* HEADER BRANDING CARD */}
        <section className="val-card-cyan p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[60px] h-[60px] opacity-10 flex items-center justify-center translate-x-3 -translate-y-3 rotate-45 bg-white/25 select-none">
            <IconWorld className="size-8 text-[#00f0ff]" />
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-[#00f0ff]/40 text-[#00f0ff] rounded-none uppercase text-[10px] tracking-widest px-2 py-0.5">
                  PUBLIC FORMS DIRECTORY
                </Badge>
                <Button asChild size="sm" variant="ghost" className="h-6 text-[9px] uppercase tracking-wider text-muted-foreground border border-white/5 hover:bg-white/5 rounded-none font-mono px-2 py-0">
                  <Link href="/dashboard">
                    <IconArrowLeft className="size-3 mr-1" />
                    DASHBOARD
                  </Link>
                </Button>
              </div>
              <h1 className="mt-2 text-2xl font-bold uppercase tracking-wide text-white">
                EXPLORE LIVE FORMS
              </h1>
              <p className="text-[10px] uppercase text-muted-foreground font-mono leading-relaxed">
                Public forms are indexed here. Unlisted forms are not visible on the board and require direct links.
              </p>
            </div>
            
            <div className="relative w-full lg:w-80">
              <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9 bg-[#0f1218] border-border/40 text-white rounded-none text-xs focus-visible:ring-[#00f0ff] uppercase placeholder:text-muted-foreground/50"
                placeholder="Search Active Forms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </section>

        {error ? (
          <div className="border border-[#ff4655]/40 bg-[#ff4655]/10 text-[#ff4655] p-3 text-xs uppercase font-mono">
            {error.message}
          </div>
        ) : null}

        {/* MISSIONS GRID */}
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            <GallerySkeleton />
          ) : filteredForms.length === 0 ? (
            <div className="col-span-full val-card-red p-10 text-center space-y-3">
              <h2 className="val-font-heading text-sm text-white">NO LIVE FORMS MATCH SEARCH</h2>
              <p className="text-xs text-muted-foreground uppercase font-mono leading-relaxed max-w-sm mx-auto">
                No active public forms meet your query criteria, or no users have created public forms yet.
              </p>
              <Button asChild className="val-btn-red py-4 font-bold text-xs mt-3">
                <Link href="/dashboard/forms">CREATE A NEW FORM</Link>
              </Button>
            </div>
          ) : (
            filteredForms.map((form) => (
              <article
                key={form.id}
                className="val-card-red p-5 flex flex-col justify-between min-h-[190px] relative overflow-hidden group hover:scale-[1.02] transition"
              >
                <div className="absolute top-0 right-0 w-[40px] h-[40px] opacity-10 flex items-center justify-center translate-x-2 -translate-y-2 rotate-45 bg-white/25 select-none">
                  <IconBolt className="size-4 text-white" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-2">
                    <Badge className="bg-[#ff4655]/15 text-[#ff4655] border-[#ff4655]/30 rounded-none uppercase text-[8px] tracking-widest px-2 py-0.5">
                      {form.visibility}
                    </Badge>
                    <span className="text-[9px] font-mono text-muted-foreground">
                      {form.submissionCount} RESPONSES
                    </span>
                  </div>
                  
                  <h2 className="text-sm font-bold uppercase text-white tracking-wider truncate">
                    {form.title}
                  </h2>
                  <p className="text-[10px] text-muted-foreground uppercase font-mono leading-relaxed line-clamp-3">
                    {form.description ?? "Active survey form ready for responses."}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-3 text-[10px] font-mono">
                  <span className="text-[#ff4655]">/{form.slug}</span>
                  <Button asChild size="sm" className="val-btn-red h-8 text-[9px] uppercase px-4 py-0 hover:scale-[1.02] transition">
                    <Link href={`/f/${form.slug}`}>
                      <IconExternalLink className="size-3.5 mr-1" />
                      OPEN FORM
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
        <div key={item} className="h-52 animate-pulse border border-border/30 bg-[#0d1117] val-border-notch" />
      ))}
    </>
  );
}
