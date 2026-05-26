"use client";

import { motion } from "motion/react";
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

function AnimatedCheck({ delay }: { delay: number }) {
  return (
    <motion.svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className="text-emerald-400"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay }}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="rgba(16,185,129,0.1)"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay }}
      />
      <motion.path
        d="M8 12.5l2.5 2.5L16 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35, delay: delay + 0.2 }}
      />
    </motion.svg>
  );
}

export function WorkflowSteps() {
  return (
    <section id="workflow" className="landing-section mx-auto max-w-6xl px-4 py-20 md:py-28">
      <SectionReveal className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
          Workflow
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
          From blank page to response insight
        </h2>
      </SectionReveal>

      <div className="relative mt-14">
        <div
          className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent md:block"
          aria-hidden
        />
        <ol className="grid gap-8 md:grid-cols-4">
          {STEPS.map((step, i) => (
            <SectionReveal key={step.title} delay={i * 0.1}>
              <li className="relative flex flex-col items-center text-center md:items-start md:text-left">
                <div className="relative z-10 mb-4 flex size-12 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900">
                  <AnimatedCheck delay={0.1 + i * 0.15} />
                </div>
                <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Step {i + 1}
                </span>
                <h3 className="text-base font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{step.description}</p>
              </li>
            </SectionReveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
