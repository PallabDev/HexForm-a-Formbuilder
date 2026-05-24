"use client";

import Link from "next/link";
import {
    IconChartBar,
    IconExternalLink,
    IconForms,
    IconPlus,
    IconFlame,
    IconLoader,
    IconChevronRight,
    IconSettings,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useMyForms, useSeedMissions } from "~/hooks/api/forms";

export function DashboardOverview() {
    const { forms, isLoading, error, refetch: refetchForms } = useMyForms({ limit: 50 });
    const seedMissions = useSeedMissions();

    const totalForms = forms.length;
    const totalResponses = forms.reduce((count, form) => count + form.submissionCount, 0);

    // Trigger Seeding from Dashboard (professional SaaS wording)
    async function handleSeedMissions() {
        const loadingToast = toast.loading("Deploying professional template surveys...");
        try {
            const res = await seedMissions.mutateAsync(undefined);
            toast.dismiss(loadingToast);
            toast.success(`${res.count} SaaS feedback templates & responses loaded successfully!`);
            await refetchForms();
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error("Failed to seed template data");
        }
    }

    return (
        <main className="val-dot-grid space-y-6 p-2 w-full px-6 mx-auto">

            {/* HEADER HERO SECTION */}
            <section className="val-card-cyan p-6 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                <div className="absolute inset-y-0 right-0 w-1/3 bg-[#ff4655]/5 [clip-path:polygon(35%_0,100%_0,100%_100%,0_100%)] select-none pointer-events-none" />

                <div className="space-y-2">
                    <Badge className="bg-[#00f0ff]/15 text-[#00f0ff] border-[#00f0ff]/40 rounded-none uppercase text-[10px] tracking-widest px-2.5 py-0.5">
                        HQ CONSOLE
                    </Badge>
                    <h1 className="text-2xl font-extrabold uppercase tracking-wide text-white">
                        FORM BUILDER CONTROL DASHBOARD
                    </h1>
                    <p className="text-[10px] text-muted-foreground uppercase leading-relaxed font-mono">
                        MANAGE DYNAMIC FORMS, DEFINE SPECIFICATIONS, AND REVIEW RESPONSE METRICS.
                    </p>
                </div>
            </section>

            {/* METRICS PANEL (TOTAL FORMS AND TOTAL RESPONSES ONLY) */}
            <section className="grid gap-6 sm:grid-cols-2">
                <MetricTile
                    label="TOTAL FORMS CREATED"
                    value={isLoading ? "..." : totalForms.toString()}
                    accent="cyan"
                />
                <MetricTile
                    label="TOTAL RESPONSES COLLECTED"
                    value={isLoading ? "..." : totalResponses.toString()}
                    accent="red"
                />
            </section>

            {/* ACTIVE FORMS REGISTER TABLE */}
            <section className="val-card-red p-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                    <div>
                        <h2 className="val-font-heading text-sm text-white">ACTIVE FORMS REGISTER</h2>
                        <p className="text-[10px] text-muted-foreground uppercase font-mono mt-0.5">
                            CURRENT SURVEY SPECIFICATIONS AND COLLECTED METRICS
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={handleSeedMissions}
                            disabled={seedMissions.isPending}
                            className="bg-[#10141c] hover:bg-[#00f0ff]/10 border border-[#00f0ff]/40 text-[#00f0ff] rounded-none text-[9px] val-font-heading px-3 h-8 gap-1.5"
                        >
                            {seedMissions.isPending ? (
                                <IconLoader className="size-3 animate-spin" />
                            ) : (
                                <IconFlame className="size-3" />
                            )}
                            LOAD SAAS SAMPLES
                        </Button>

                        <Button asChild size="sm" className="val-btn-red h-8 text-[9px] px-3 font-bold">
                            <Link href="/dashboard/forms">
                                <IconPlus className="size-3 mr-1" />
                                CREATE FORM
                            </Link>
                        </Button>
                    </div>
                </div>

                {error ? (
                    <div className="border border-[#ff4655]/40 bg-[#ff4655]/10 text-[#ff4655] p-3 text-xs uppercase font-mono">
                        {error.message}
                    </div>
                ) : null}

                <div className="divide-y divide-white/5">
                    {isLoading ? (
                        <div className="py-12 text-center text-xs text-muted-foreground uppercase font-mono">
                            Acquiring register logs...
                        </div>
                    ) : forms.length === 0 ? (
                        <div className="py-12 text-center text-xs text-muted-foreground uppercase font-mono">
                            The operation register is empty. Click the Create Form button above to launch your first survey sheet.
                        </div>
                    ) : (
                        forms.map((form) => (
                            <div key={form.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 text-xs font-mono">
                                <div className="min-w-0 space-y-1">
                                    <p className="text-sm text-white font-bold uppercase tracking-wider">{form.title}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <span className="text-[#00f0ff]">/{form.slug}</span>
                                        <span>•</span>
                                        <span>{form.visibility} PROFILE</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-white font-bold">{form.submissionCount} RESPONSES</p>
                                        <p className="text-[9px] text-muted-foreground uppercase">TOTAL RESPONSES</p>
                                    </div>

                                    <Badge className={`rounded-none text-[8px] uppercase tracking-wider px-1.5 py-0.5 border-none ${form.status === "PUBLISHED"
                                        ? "bg-[#00f0ff]/10 text-[#00f0ff]"
                                        : "bg-[#ff4655]/10 text-[#ff4655]"
                                        }`}>
                                        {form.status}
                                    </Badge>

                                    <div className="flex items-center gap-1.5 ml-2 border-l border-white/10 pl-3">
                                        <Button asChild size="sm" variant="ghost" className="h-7 text-[9px] uppercase tracking-wider text-muted-foreground border border-white/5 hover:bg-white/5 rounded-none px-2.5 py-0 font-mono">
                                            <Link href={`/dashboard/forms?formId=${form.id}`}>
                                                Modify
                                            </Link>
                                        </Button>

                                        {form.status === "PUBLISHED" && (
                                            <Button asChild size="sm" className="val-btn-cyan h-7 text-[9px] uppercase px-2.5 py-0 font-bold">
                                                <Link href={`/dashboard/analytics?formId=${form.id}`}>
                                                    Analytics
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </main>
    );
}

function MetricTile({ label, value, accent }: { label: string; value: string; accent: "red" | "cyan" }) {
    const isRed = accent === "red";
    return (
        <div
            className="border bg-[#0d1117] p-5 flex flex-col justify-between val-border-notch h-28 relative overflow-hidden group hover:scale-[1.01] transition"
            style={{
                borderLeft: isRed ? "4px solid #ff4655" : "4px solid #00f0ff",
                borderColor: isRed ? "rgba(255,70,85,0.2)" : "rgba(0,240,255,0.2)",
            }}
        >
            <p
                className="text-2xl font-bold font-mono tracking-wider"
                style={{ color: isRed ? "#ff4655" : "#00f0ff" }}
            >
                {value}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono font-bold mt-2 leading-none">
                {label}
            </p>
        </div>
    );
}
