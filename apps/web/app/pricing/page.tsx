"use client";

import { useState } from "react";
import {
  IconCheck,
  IconLoader,
  IconArrowLeft,
  IconSparkles,
} from "@tabler/icons-react";
import Link from "next/link";

import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";

export default function PricingLandingPage() {
  const plans = [
    {
      code: "free",
      name: "Free Survey Tier",
      description: "Ideal for personal projects, simple survey drafts, and quick testing.",
      price: "₹0",
      formLimit: "5 forms max limit",
      submissionLimit: "100 submissions per form",
      features: [
        "Create up to 5 dynamic forms",
        "Collect up to 100 responses per form",
        "Standard field validation rules",
        "Clean responsive forms filling",
      ],
    },
    {
      code: "premium_399",
      name: "Professional Plan",
      description: "Perfect for active content creators, surveyors, and growing agencies.",
      price: "₹399",
      period: "/ month",
      formLimit: "250 forms max limit",
      submissionLimit: "500 submissions per form",
      features: [
        "Create up to 250 forms workspace",
        "Collect up to 500 responses per form",
        "Advanced field validation rules",
        "Clean, premium zinc responsive templates",
        "Full CSV responses log export",
      ],
    },
    {
      code: "enterprise_799",
      name: "Enterprise Unlimited",
      description: "Built for scaling high-frequency surveys requiring maximum data logs.",
      price: "₹799",
      period: "/ month",
      formLimit: "Unlimited active forms",
      submissionLimit: "2000 submissions per form",
      features: [
        "Unlimited active forms creation",
        "Collect up to 2,000 responses per form",
        "Priority analytics & daily telemetry chart",
        "Full CSV response log export",
        "Priority live customer support",
      ],
    },
  ];

  return (
    <main className="val-dot-grid min-h-screen bg-zinc-950 text-white flex flex-col justify-between p-6 md:p-12 font-sans animate-in fade-in duration-200">
      
      {/* Navbar Stub */}
      <nav className="max-w-6xl w-full mx-auto flex items-center justify-between border-b border-zinc-900 pb-5 mb-8">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition">
          <IconArrowLeft className="size-4 text-zinc-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Back to Console</span>
        </Link>
        <span className="text-sm font-bold uppercase tracking-widest text-zinc-100">HexForm Plans</span>
      </nav>

      {/* Hero Headline */}
      <section className="max-w-4xl w-full mx-auto text-center space-y-4 my-8">
        <Badge className="bg-zinc-900 text-zinc-400 border border-zinc-800 rounded-md uppercase text-[9px] tracking-widest px-3 py-1 font-semibold">
          Flexible Pricing Tiers
        </Badge>
        
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white uppercase mt-4">
          CHOOSE THE PERFECT SURVEY TIER
        </h1>
        <p className="text-xs md:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed mt-2">
          From simple survey sheets to high-frequency feedback portals, find the tier matching your workspace requirements.
        </p>
      </section>

      {/* Pricing Cards deck */}
      <section className="max-w-6xl w-full mx-auto grid gap-6 md:grid-cols-3 my-12">
        {plans.map((plan) => {
          const isFree = plan.code === "free";
          return (
            <article
              key={plan.code}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col justify-between min-h-[380px] hover:border-zinc-700 transition duration-200"
            >
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">{plan.name}</h3>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{plan.description}</p>
                </div>

                <div>
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  {plan.period && <span className="text-zinc-500 text-xs font-semibold font-sans">{plan.period}</span>}
                </div>

                <ul className="space-y-3 pt-4 border-t border-zinc-850/60 text-xs text-zinc-300 font-sans">
                  <li className="flex items-center gap-2">
                    <IconCheck className="size-4 text-zinc-500 shrink-0" />
                    <span className="font-semibold text-zinc-200">{plan.formLimit}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCheck className="size-4 text-zinc-500 shrink-0" />
                    <span className="font-semibold text-zinc-200">{plan.submissionLimit}</span>
                  </li>
                  {plan.features.slice(2).map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2 text-zinc-400">
                      <IconCheck className="size-4 text-zinc-500 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <Button asChild className="w-full val-btn-red py-6 text-xs font-bold uppercase tracking-wider transition">
                  <Link href="/dashboard/billing">
                    Get Started Now
                  </Link>
                </Button>
              </div>
            </article>
          );
        })}
      </section>

      {/* Quote Banner */}
      <footer className="max-w-lg w-full mx-auto bg-zinc-900/60 border border-zinc-850 p-4 rounded-xl flex items-start gap-3 text-center my-6">
        <IconSparkles className="size-5 text-zinc-400 shrink-0 mt-0.5" />
        <p className="text-[10px] text-zinc-500 leading-relaxed uppercase tracking-wider font-sans">
          All survey plans can be upgraded or instantly cancelled under your dashboard billing profile at any time.
        </p>
      </footer>
    </main>
  );
}
