"use client";

import { motion } from "motion/react";
import {
  IconChartBar,
  IconCheck,
  IconForms,
  IconWorld,
  IconAlertCircle,
} from "@tabler/icons-react";

import { Badge } from "~/components/ui/badge";

const chartHeights = [42, 68, 55, 82, 61, 74, 88, 52];

export function ProductPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto mt-12 w-full max-w-5xl"
    >
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/80 shadow-2xl shadow-black/40">
        <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-950/80 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-zinc-600" />
          <span className="size-2.5 rounded-full bg-zinc-600" />
          <span className="size-2.5 rounded-full bg-zinc-600" />
          <span className="ml-3 text-xs text-zinc-500">HexForm — Placement Drive 2026</span>
        </div>

        <div className="grid gap-0 md:grid-cols-[200px_1fr_220px]">
          {/* Builder sidebar */}
          <div className="hidden border-r border-zinc-800 p-4 md:block">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Fields
            </p>
            <ul className="mt-3 space-y-2">
              {["Full name", "Email", "Year of study", "CGPA"].map((field, i) => (
                <li
                  key={field}
                  className={`rounded-md border px-2.5 py-2 text-xs ${
                    i === 0
                      ? "border-rose-500/40 bg-rose-500/10 text-white"
                      : "border-zinc-800 bg-zinc-950/50 text-zinc-400"
                  }`}
                >
                  {field}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center gap-1.5 text-[10px] text-emerald-400">
              <IconCheck className="size-3" />
              Validation rules active
            </div>
          </div>

          {/* Form canvas */}
          <div className="border-r border-zinc-800 p-4 md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">Student Application</h3>
              <Badge
                variant="outline"
                className="accent-emerald rounded-md text-[10px] font-medium uppercase"
              >
                <IconWorld className="mr-1 size-3" />
                Public on Explore
              </Badge>
            </div>
            <div className="space-y-3">
              <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3">
                <label className="text-[10px] text-zinc-500">Full name</label>
                <div className="mt-1 h-8 rounded-md border border-zinc-700 bg-zinc-900" />
              </div>
              <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3">
                <label className="text-[10px] text-zinc-500">Email</label>
                <div className="mt-1 h-8 rounded-md border border-zinc-700 bg-zinc-900" />
              </div>
              <div className="flex flex-wrap gap-2">
                <motion.span
                  animate={{ opacity: [1, 0.65, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-300"
                >
                  <IconAlertCircle className="size-3" />
                  Max 120 chars
                </motion.span>
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300">
                  <IconCheck className="size-3" />
                  4-digit year
                </span>
              </div>
            </div>
          </div>

          {/* Stats panel */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Responses
              </p>
              <IconForms className="size-4 text-zinc-600" />
            </div>
            <p className="mt-1 text-2xl font-bold text-white">248</p>
            <p className="text-[10px] text-emerald-400">+12% this week</p>

            <div className="mt-4 flex h-20 items-end gap-1">
              {chartHeights.map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-sm bg-emerald-500/70"
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.05 }}
                />
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-zinc-800 pt-3">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-zinc-500">Completion rate</span>
                <span className="font-medium text-white">91%</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-zinc-500 flex items-center gap-1">
                  <IconChartBar className="size-3" />
                  Analytics
                </span>
                <span className="text-amber-400/90">Live</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
