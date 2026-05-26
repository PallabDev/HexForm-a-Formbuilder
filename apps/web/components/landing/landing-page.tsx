"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  IconTemplate,
  IconShieldCheck,
  IconInbox,
  IconShare,
  IconLayoutGrid,
  IconNumbers,
  IconWorld,
  IconLink,
  IconReceipt,
  IconChartBar,
  IconFileExport,
  IconCreditCard,
  IconBriefcase,
  IconSchool,
  IconCalendarEvent,
  IconMessage,
  IconUsers,
  IconFlask,
  IconChalkboard,
  IconUserPlus,
} from "@tabler/icons-react";

import { MainNavbar } from "~/components/main-navbar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { ProductPreview } from "~/components/landing/product-preview";
import { PricingSection } from "~/components/landing/pricing-section";
import { WorkflowSteps } from "~/components/landing/workflow-steps";
import { LandingFooter } from "~/components/landing/landing-footer";
import { SectionReveal } from "~/components/landing/section-reveal";
import { useUser } from "~/hooks/api/auth";
import { getSignInHref } from "~/lib/landing-plans";
import { cn } from "~/lib/utils";

const HERO_BENEFITS = [
  "Forms & surveys",
  "Blank-slate builder",
  "Validation rules",
  "Response analytics",
];

const PAIN_POINTS = [
  {
    icon: IconTemplate,
    title: "Templates everywhere",
    description: "Generic tools push pre-built layouts. HexForm starts blank so your form matches the job.",
  },
  {
    icon: IconShieldCheck,
    title: "Validation is unclear",
    description: "Rules get buried in settings. Here, length, digits, email, and year checks stay visible.",
  },
  {
    icon: IconInbox,
    title: "Responses scatter",
    description: "Submissions, exports, and counts live in one workspace—not three different tabs.",
  },
  {
    icon: IconShare,
    title: "Sharing vs discovery",
    description: "Public Explore listing and private unlisted links are built in, not bolted on.",
  },
];

const BENTO_ITEMS = [
  {
    title: "Blank slate creation",
    description: "No template lock-in. Build the exact fields your process needs.",
    icon: IconLayoutGrid,
    className: "md:col-span-2 md:row-span-1",
  },
  {
    title: "Field validation",
    description: "Text length, numeric digit rules, email, and year validation before submit.",
    icon: IconNumbers,
    className: "md:col-span-1",
  },
  {
    title: "Public Explore listing",
    description: "List forms in the community directory when you want discovery.",
    icon: IconWorld,
    className: "md:col-span-1",
  },
  {
    title: "Unlisted private sharing",
    description: "Share a direct link without appearing in Explore.",
    icon: IconLink,
    className: "md:col-span-1",
  },
  {
    title: "Response receipts",
    description: "Confirm submissions with clear receipt flow for respondents.",
    icon: IconReceipt,
    className: "md:col-span-1",
  },
  {
    title: "Analytics & counts",
    description: "Submission totals and charts so you see momentum at a glance.",
    icon: IconChartBar,
    className: "md:col-span-2",
  },
  {
    title: "CSV export",
    description: "Export response logs when you need spreadsheets or backups.",
    icon: IconFileExport,
    className: "md:col-span-1",
  },
  {
    title: "Billing limits that scale",
    description: "Active sheet and per-form response limits grow with your plan.",
    icon: IconCreditCard,
    className: "md:col-span-2",
  },
];

const USE_CASES = [
  {
    icon: IconBriefcase,
    title: "Hiring applications",
    description: "Screen candidates with validated emails, résumé fields, and exportable shortlists.",
  },
  {
    icon: IconSchool,
    title: "Placement drives",
    description: "Collect CGPA, year, and branch with digit rules—built for high-volume campus intake.",
  },
  {
    icon: IconCalendarEvent,
    title: "Event registration",
    description: "Cap responses, share public or unlisted links, and track headcount in analytics.",
  },
  {
    icon: IconMessage,
    title: "Customer feedback",
    description: "Run NPS and open-text surveys with length limits that keep answers usable.",
  },
  {
    icon: IconUsers,
    title: "Creator surveys",
    description: "Publish to Explore for audience discovery or keep a private link for your community.",
  },
  {
    icon: IconFlask,
    title: "Product research",
    description: "Iterate on question sets fast from a blank builder—no template rework.",
  },
  {
    icon: IconChalkboard,
    title: "Education forms",
    description: "Assignments, consent, and parent forms with clear validation for student data.",
  },
  {
    icon: IconUserPlus,
    title: "Community onboarding",
    description: "Onboard members with structured fields and review submissions in one dashboard.",
  },
];

const FAQ_ITEMS = [
  {
    q: "Can I start from a blank form?",
    a: "Yes. Every form begins as a blank slate. Add only the fields you need—no forced templates.",
  },
  {
    q: "Do respondents need an account?",
    a: "No. Anyone with your public or unlisted link can submit. Only form owners need a HexForm account.",
  },
  {
    q: "Can forms be public or unlisted?",
    a: "Yes. List on Explore for discovery, or share an unlisted link for private collection.",
  },
  {
    q: "Can I validate years, numbers, emails, and text length?",
    a: "Yes. HexForm supports email validation, text length limits, numeric digit rules, and year checks.",
  },
  {
    q: "Can I export responses?",
    a: "Yes. Export response data to CSV from your form workspace when you need offline analysis.",
  },
  {
    q: "What are the plan limits?",
    a: "Free includes 5 active survey sheets and 100 responses per form. Premium adds 250 sheets and 500 responses per form. Enterprise offers unlimited sheets and 2000 responses per form.",
  },
  {
    q: "What happens after I upgrade?",
    a: "Upgrades apply immediately from billing. Higher limits unlock for new and existing active forms per your plan.",
  },
  {
    q: "Can I use HexForm for hiring or placement drives?",
    a: "Yes. Teams use HexForm for applications, placement intake, and event registration with validation and CSV export.",
  },
];

function LandingCtas({ className }: { className?: string }) {
  const { user } = useUser();
  const isLoggedIn = Boolean(user?.id);
  const startHref = isLoggedIn ? "/dashboard/forms" : getSignInHref("/dashboard/forms");
  const startLabel = isLoggedIn ? "Create Form" : "Start Now";

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-3", className)}>
      <Button asChild size="lg" className="cta-primary rounded-md font-semibold">
        <Link href={startHref}>{startLabel}</Link>
      </Button>
      <Button
        asChild
        size="lg"
        variant="outline"
        className="rounded-md border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-900"
      >
        <Link href="/explore">Explore Forms</Link>
      </Button>
    </div>
  );
}

export function LandingPage() {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, []);

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <MainNavbar />

      {/* Hero */}
      <section
        id="hero"
        className="landing-section hex-grid-bg relative overflow-hidden pt-36 pb-16 md:pt-44 md:pb-24 lg:pt-48"
      >
        <div className="mx-auto max-w-6xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center"
          >
            <Badge
              variant="outline"
              className="rounded-md border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-400"
            >
              Forms &amp; surveys
            </Badge>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-4 max-w-2xl text-xl font-semibold leading-snug tracking-tight text-white sm:text-2xl md:text-[1.625rem]"
          >
            <span className="block">Create forms and surveys</span>
            <span className="mt-1 block text-zinc-400">from a blank slate—not a template library.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.65, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-zinc-500"
          >
            HexForm helps teams publish surveys, enforce validation, and review responses in one
            place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="mt-8"
          >
            <LandingCtas />
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-500"
          >
            {HERO_BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-emerald-500" />
                {b}
              </li>
            ))}
          </motion.ul>

          <ProductPreview />
        </div>
      </section>

      {/* Product problem */}
      <section id="product" className="landing-section mx-auto max-w-6xl px-4 py-20 md:py-28">
        <SectionReveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-rose-400/90">
            The problem
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Forms should not become another workflow mess.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400 md:text-base">
            HexForm helps you move from “I need a form” to “I understand the responses” with less
            friction—without template sprawl or scattered tools.
          </p>
        </SectionReveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PAIN_POINTS.map((item, i) => (
            <SectionReveal key={item.title} delay={i * 0.06}>
              <article className="h-full rounded-md border border-zinc-800 bg-zinc-900/40 p-5 transition-colors hover:border-zinc-700">
                <item.icon className="size-6 text-emerald-400" stroke={1.5} />
                <h3 className="mt-4 text-sm font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.description}</p>
              </article>
            </SectionReveal>
          ))}
        </div>
      </section>

      {/* Bento features */}
      <section id="features" className="landing-section mx-auto max-w-6xl px-4 py-20 md:py-28">
        <SectionReveal className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Everything needed to launch forms that behave.
          </h2>
        </SectionReveal>

        <div className="mt-12 grid auto-rows-[minmax(140px,auto)] gap-4 md:grid-cols-3">
          {BENTO_ITEMS.map((item, i) => (
            <SectionReveal key={item.title} delay={i * 0.04} className={item.className}>
              <motion.article
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="flex h-full flex-col justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/20"
              >
                <item.icon className="size-6 text-rose-400/90" stroke={1.5} />
                <div className="mt-4">
                  <h3 className="text-base font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.description}</p>
                </div>
              </motion.article>
            </SectionReveal>
          ))}
        </div>
      </section>

      <WorkflowSteps />

      {/* Use cases */}
      <section id="use-cases" className="landing-section mx-auto max-w-6xl px-4 py-20 md:py-28">
        <SectionReveal className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
            Use cases
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Built for the forms teams actually ship.
          </h2>
        </SectionReveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {USE_CASES.map((item, i) => (
            <SectionReveal key={item.title} delay={i * 0.04}>
              <article className="h-full rounded-md border border-zinc-800 bg-zinc-900/40 p-5 hover:border-zinc-700">
                <item.icon className="size-5 text-zinc-300" stroke={1.5} />
                <h3 className="mt-3 text-sm font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">{item.description}</p>
              </article>
            </SectionReveal>
          ))}
        </div>
      </section>

      <PricingSection />

      {/* FAQ */}
      <section id="faq" className="landing-section mx-auto max-w-3xl px-4 py-20 md:py-28">
        <SectionReveal className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">FAQ</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Common questions</h2>
        </SectionReveal>

        <SectionReveal className="mt-10 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 md:px-6">
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item) => (
              <AccordionItem key={item.q} value={item.q} className="border-zinc-800">
                <AccordionTrigger className="text-left text-sm text-zinc-200 hover:text-white hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-zinc-400">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </SectionReveal>
      </section>

      {/* Final CTA */}
      <section id="cta" className="landing-section mx-auto max-w-6xl px-4 pb-8">
        <div className="hex-grid-bg rounded-lg border border-zinc-800 bg-zinc-900/60 px-6 py-14 text-center md:px-12 md:py-16">
          <SectionReveal>
            <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              Start with a blank form. Finish with answers you can trust.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm text-zinc-400">
              Join teams using HexForm to launch faster and review responses in one place.
            </p>
            <LandingCtas className="mt-8" />
          </SectionReveal>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
