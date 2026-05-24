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
        <section className="p-6 relative overflow-hidden bg-[#323949] border border-[#3d3e51] rounded-[3px] shadow-[0_0_20px_rgba(76,82,101,0.05)]">
          <div className="absolute top-0 right-0 w-[60px] h-[60px] opacity-10 flex items-center justify-center translate-x-3 -translate-y-3 rotate-45 bg-[#4c5265]/10 select-none">
            <IconWorld className="size-8 text-[#FFFFFF]" />
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-[#3d3e51] text-[#FFFFFF] rounded-none uppercase text-[10px] tracking-widest px-2 py-0.5 font-mono">
                  PUBLIC FORMS DIRECTORY
                </Badge>
                <Button asChild size="sm" variant="ghost" className="h-6 text-[9px] uppercase tracking-wider text-[#FFFFFF]/70 border border-[#3d3e51] hover:bg-[#40445a] hover:text-[#FFFFFF] rounded-none font-mono px-2 py-0 cursor-pointer">
                  <Link href="/dashboard">
                    <IconArrowLeft className="size-3 mr-1" />
                    DASHBOARD
                  </Link>
                </Button>
              </div>
              <h1 className="mt-2 text-2xl font-bold uppercase tracking-wide text-[#FFFFFF] font-mono">
                EXPLORE LIVE FORMS
              </h1>
              <p className="text-[10px] uppercase text-[#FFFFFF]/70 font-mono leading-relaxed">
                Public forms are indexed here. Unlisted forms are not visible on the board and require direct links.
              </p>
            </div>
            
            <div className="relative w-full lg:w-80">
              <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#FFFFFF]/60" />
              <Input
                className="pl-9 bg-[#212129] border-[#3d3e51] text-[#FFFFFF] rounded-none text-xs focus-visible:ring-[#4c5265] uppercase placeholder:text-[#FFFFFF]/40"
                placeholder="Search Active Forms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </section>

        {error ? (
          <div className="border border-[#3d3e51] bg-[#323949] text-[#FFFFFF] p-3 text-xs uppercase font-mono rounded-[3px]">
            {error.message}
          </div>
        ) : null}

        {/* MISSIONS GRID */}
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            <GallerySkeleton />
          ) : filteredForms.length === 0 ? (
            <div className="col-span-full val-card-red p-10 text-center space-y-3 shadow-[0_0_20px_rgba(76,82,101,0.05)]">
              <h2 className="val-font-heading text-sm text-[#FFFFFF]">NO LIVE FORMS MATCH SEARCH</h2>
              <p className="text-xs text-[#FFFFFF]/60 uppercase font-mono leading-relaxed max-w-sm mx-auto">
                No active public forms meet your query criteria, or no users have created public forms yet.
              </p>
              <Button asChild className="val-btn-red py-4 font-bold text-xs mt-3 cursor-pointer">
                <Link href="/dashboard/forms">CREATE A NEW FORM</Link>
              </Button>
            </div>
          ) : (
            filteredForms.map((form) => (
              <article
                key={form.id}
                className="val-card-red p-5 flex flex-col justify-between min-h-[190px] relative overflow-hidden group hover:scale-[1.02] hover:border-[#4c5265] hover:shadow-[0_0_20px_rgba(76,82,101,0.1)] transition duration-200"
              >
                <div className="absolute top-0 right-0 w-[40px] h-[40px] opacity-10 flex items-center justify-center translate-x-2 -translate-y-2 rotate-45 bg-[#4c5265]/10 select-none">
                  <IconBolt className="size-4 text-[#FFFFFF]" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 border-b border-[#3d3e51] pb-2">
                    <Badge className="bg-[#4c5265] text-[#FFFFFF] border border-[#3d3e51] rounded-none uppercase text-[8px] tracking-widest px-2 py-0.5">
                      {form.visibility}
                    </Badge>
                    <span className="text-[9px] font-mono text-[#FFFFFF]/70">
                      {form.submissionCount} RESPONSES
                    </span>
                  </div>
                  
                  <h2 className="text-sm font-bold uppercase text-[#FFFFFF] tracking-wider truncate font-mono">
                    {form.title}
                  </h2>
                  <p className="text-[10px] text-[#FFFFFF]/60 uppercase font-mono leading-relaxed line-clamp-3">
                    {(form.description ?? "Active survey form ready for responses.").replace(/<[^>]*>/g, "")}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#3d3e51] flex items-center justify-between gap-3 text-[10px] font-mono">
                  <span className="text-[#FFFFFF]">/{form.slug}</span>
                  <Button asChild size="sm" className="val-btn-red h-8 text-[9px] uppercase px-4 py-0 hover:scale-[1.02] transition cursor-pointer">
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
        <div key={item} className="h-52 animate-pulse border border-[#3d3e51] bg-[#323949]/20 val-border-notch" />
      ))}
    </>
  );
}
