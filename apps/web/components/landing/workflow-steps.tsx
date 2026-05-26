"use client";

import { motion } from "motion/react";

import { LandingSectionHeader } from "~/components/landing/landing-section-header";
import { SectionReveal } from "~/components/landing/section-reveal";

const STEPS = [
  {
    title: "Create a blank form",
    description: "Start from zero—no template lock-in. Name your form and open the builder.",
  },
  {
    title: "Add fields and validation",
    description: "Text length, numeric digits, email, and year rules enforced before submit.",
  },
  {
    title: "Publish, list, or share",
    description: "Public Explore listing or unlisted link—your choice per form.",
  },
  {
    title: "Review responses and export",
    description: "Submission counts, analytics, and CSV export from one workspace.",
  },
];

function WorkflowGlowTrack() {
  return (
    <div
      className="pointer-events-none absolute left-6 right-[calc(25%-42px)] top-6 hidden md:block"
      aria-hidden
    >
      {/* Base track */}
      <div className="absolute inset-x-0 top-0 h-px bg-zinc-800" />

      {/* Moving glow — travels step 1 → step 4 */}
      <motion.div
        className="absolute top-0 h-0.5 w-[18%] -translate-y-1/2 rounded-full bg-gradient-to-r from-rose-500/20 via-rose-400 to-amber-400 shadow-[0_0_20px_rgba(251,113,133,0.55)]"
        initial={{ left: "0%" }}
        animate={{ left: "82%" }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          repeatDelay: 1.5,
          ease: [0.45, 0, 0.55, 1],
        }}
      />
    </div>
  );
}

function StepIcon({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="relative z-10 flex size-12 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
    >
      <motion.svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        className="text-rose-500"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="rgba(244,63,94,0.12)" />
        <path
          d="M8 12.5l2.5 2.5L16 9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.svg>
    </motion.div>
  );
}

export function WorkflowSteps() {
  return (
    <section id="workflow" className="landing-section mx-auto max-w-6xl px-4 py-20 md:py-28">
      <SectionReveal>
        <LandingSectionHeader
          label="Workflow"
          title="From blank page to response insight"
          labelClassName="text-rose-500"
        />
      </SectionReveal>

      <div className="relative mt-14 md:mt-16">
        <WorkflowGlowTrack />

        <ol className="grid gap-10 md:grid-cols-4 md:gap-6">
          {STEPS.map((step, i) => (
            <SectionReveal key={step.title} delay={i * 0.08}>
              <li className="relative flex flex-col items-center text-center md:items-start md:text-left">
                <StepIcon delay={0.08 + i * 0.1} />
                <span className="mb-1.5 mt-4 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                  Step {i + 1}
                </span>
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400 md:text-[0.9375rem]">
                  {step.description}
                </p>
              </li>
            </SectionReveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
