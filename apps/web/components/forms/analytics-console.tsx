"use client";

import { useMemo, useState, useEffect } from "react";
import {
    IconChartBar,
    IconDatabase,
    IconTargetArrow,
    IconArrowLeft,
    IconDownload,
    IconFlame,
    IconLock,
    IconWorld,
    IconBolt,
} from "@tabler/icons-react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { useForm, useFormAnalytics, useFormResponses, useMyForms } from "~/hooks/api/forms";

export function AnalyticsConsole() {
    const { forms, isLoading, error } = useMyForms({ limit: 50 });
    const [selectedId, setSelectedId] = useState("");

    // Read query params for formId navigation
    useEffect(() => {
        if (typeof window !== "undefined") {
            const formIdParam = new URLSearchParams(window.location.search).get("formId");
            if (formIdParam) {
                setSelectedId(formIdParam);
            }
        }
    }, [forms]);

    const activeFormId = selectedId || forms[0]?.id || "";

    const { form: activeFormDetail } = useForm(activeFormId, Boolean(activeFormId));

    const activeForm = useMemo(
        () => forms.find((form) => form.id === activeFormId),
        [activeFormId, forms],
    );

    const { analytics, error: analyticsError } = useFormAnalytics(
        activeFormId,
        Boolean(activeFormId),
    );

    const { responses, error: responsesError } = useFormResponses(
        { formId: activeFormId, limit: 100 },
        Boolean(activeFormId),
    );

    // CSV Export action
    function handleCsvExport() {
        if (!activeFormDetail || responses.length === 0) {
            toast.error("No responses available for export.");
            return;
        }

        const headers = ["submittedAt", "respondentEmail", ...activeFormDetail.fields.map((f) => f.labelKey)];

        const rows = responses.map((res) => {
            const answerMap = new Map(res.answers.map((a) => [a.fieldKey, a.value]));
            return [
                res.submittedAt ?? "",
                res.respondentEmail ?? "anonymous",
                ...activeFormDetail.fields.map((f) => {
                    const val = answerMap.get(f.labelKey);
                    if (val === undefined || val === null) return "";
                    return Array.isArray(val) ? `"${val.join(", ")}"` : `"${String(val).replace(/"/g, '""')}"`;
                }),
            ];
        });

        const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `form_responses_${activeFormDetail.slug}_export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <main className="val-dot-grid space-y-6 p-1">
            {/* HEADER COMMAND SECTION */}
            <section className="val-card-red p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-[#ff4655]/40 text-[#ff4655] rounded-none uppercase text-[10px] tracking-widest px-2.5">
                                <IconChartBar className="size-3 mr-1" />
                                ANALYTICS
                            </Badge>
                            <Button asChild size="sm" variant="ghost" className="h-6 text-[9px] uppercase tracking-wider text-muted-foreground border border-white/5 hover:bg-white/5 rounded-none font-mono px-2 py-0">
                                <Link href="/dashboard/forms">
                                    <IconArrowLeft className="size-3 mr-1" />
                                    DASHBOARD
                                </Link>
                            </Button>
                        </div>
                        <h1 className="mt-2 text-2xl font-bold uppercase tracking-wide text-white">RESPONSE ANALYTICS HUD</h1>
                        <p className="text-[10px] uppercase text-muted-foreground font-mono">
                            MONITOR SUBMISSIONS OVER TIME, VISIBILITY PROFILES, AND RESPONDENT STATS
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Select value={activeFormId} onValueChange={setSelectedId}>
                            <SelectTrigger className="w-full lg:w-80 bg-[#0f1218] border-border/40 text-white rounded-none font-mono text-xs uppercase focus:ring-[#ff4655]">
                                <SelectValue placeholder="Choose form" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0f1218] border-border/50 text-white rounded-none">
                                {forms.map((f) => (
                                    <SelectItem key={f.id} value={f.id} className="uppercase text-xs focus:bg-[#ff4655]/25">
                                        {f.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            onClick={handleCsvExport}
                            disabled={responses.length === 0}
                            className="val-btn-cyan h-9 font-bold px-4 hover:scale-[1.01]"
                        >
                            <IconDownload className="size-4 mr-1.5" />
                            EXPORT CSV
                        </Button>
                    </div>
                </div>
            </section>

            {error || analyticsError || responsesError ? (
                <div className="border border-[#ff4655]/40 bg-[#ff4655]/10 text-[#ff4655] p-3 text-xs uppercase font-mono">
                    {error?.message ?? analyticsError?.message ?? responsesError?.message}
                </div>
            ) : null}

            {isLoading ? (
                <div className="grid gap-4 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((item) => (
                        <div key={item} className="h-28 animate-pulse border border-border/30 bg-[#0d1117] val-border-notch" />
                    ))}
                </div>
            ) : !activeForm ? (
                <div className="val-card-cyan p-10 text-center space-y-3">
                    <h2 className="val-font-heading text-base text-white">NO FORMS ACTIVE</h2>
                    <p className="text-xs text-muted-foreground uppercase font-mono leading-relaxed w-full mx-auto">
                        Create your first form or seed survey data to see analytics.
                    </p>
                    <Button asChild className="val-btn-cyan py-4 font-bold text-xs mt-3">
                        <Link href="/dashboard/forms">CREATE A NEW FORM</Link>
                    </Button>
                </div>
            ) : (
                <>
                    {/* METRIC COMMAND TILES */}
                    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Metric
                            label="TOTAL SUBMISSIONS"
                            value={(analytics?.totalSubmissions ?? 0).toString()}
                            accent="red"
                        />
                        <Metric
                            label="RESPONSE LIMIT"
                            value={analytics?.responseLimit?.toString() ?? "UNLIMITED"}
                            accent="cyan"
                        />
                        <Metric
                            label="REMAINING RESPONSES"
                            value={analytics?.remainingResponses?.toString() ?? "UNLIMITED"}
                            accent="cyan"
                        />
                        <Metric
                            label="COMPLETION RATE"
                            value={`${Math.round((analytics?.completionRate ?? 0) * 100)}%`}
                            accent="red"
                        />
                    </section>

                    {/* RESPONSE VISUAL GRID */}
                    <section className="grid gap-6 xl:grid-cols-[1fr_440px]">

                        {/* Daily activity line statistics */}
                        <div className="val-card-cyan p-4 flex flex-col justify-between min-h-[360px]">
                            <div className="flex items-center justify-between border-b border-border/20 pb-3 mb-4">
                                <div>
                                    <h2 className="val-font-heading text-xs text-[#00f0ff]">SUBMISSIONS OVER TIME</h2>
                                    <p className="text-[10px] text-muted-foreground uppercase font-mono mt-0.5">{activeForm.title}</p>
                                </div>
                                <IconTargetArrow className="size-5 text-[#ff4655] animate-pulse" />
                            </div>

                            <div className="flex-1 flex items-end gap-3 border-b border-white/5 border-l border-white/5 p-4 min-h-[220px]">
                                {(analytics?.responsesByDay.length
                                    ? analytics.responsesByDay
                                    : [{ date: "NO DATA", count: 0 }]
                                ).map((item) => {
                                    const max = Math.max(
                                        ...(analytics?.responsesByDay.map((day) => day.count) ?? [1]),
                                        1,
                                    );
                                    const barHeight = Math.max((item.count / max) * 100, item.count ? 12 : 4);
                                    return (
                                        <div key={item.date} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                                            <div className="text-[9px] font-mono text-[#00f0ff] opacity-0 group-hover:opacity-100 transition-opacity">
                                                {item.count} SUB
                                            </div>
                                            <div
                                                className="w-full bg-gradient-to-t from-[#ff4655]/20 to-[#ff4655] border-t border-[#ff4655] group-hover:scale-y-[1.05] transition-all origin-bottom"
                                                style={{
                                                    height: `${barHeight}px`,
                                                }}
                                            />
                                            <span className="max-w-[70px] truncate text-[9px] uppercase font-mono text-muted-foreground text-center">
                                                {item.date.slice(5)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="pt-3 text-[9px] text-muted-foreground font-mono uppercase flex justify-between">
                                <span>* Group hover bars to reveal specific subcount</span>
                                <span>LIVE DATA</span>
                            </div>
                        </div>

                        {/* Recent submissions list */}
                        <div className="val-card-red p-4 flex flex-col justify-between min-h-[360px]">
                            <div className="flex items-center justify-between border-b border-border/20 pb-3 mb-4">
                                <div>
                                    <h2 className="val-font-heading text-xs text-[#ff4655]">SUBMISSIONS LOG</h2>
                                    <p className="text-[10px] text-muted-foreground uppercase font-mono mt-0.5">LATEST RESPONSES RECEIVED</p>
                                </div>
                                <IconDatabase className="size-5 text-[#00f0ff] animate-pulse" />
                            </div>

                            <div className="flex-1 max-h-[320px] overflow-y-auto space-y-2 pr-1">
                                {responses.length === 0 ? (
                                    <div className="text-center py-12 uppercase text-[10px] font-mono text-muted-foreground">
                                        No responses received yet.
                                    </div>
                                ) : (
                                    responses.map((response, index) => (
                                        <div key={response.id} className="border border-white/5 bg-black/30 p-3 space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="truncate text-xs font-mono font-bold text-white uppercase">
                                                    {response.respondentEmail ?? `ANONYMOUS RESPONDENT #${responses.length - index}`}
                                                </span>
                                                <Badge className="bg-[#00f0ff]/10 text-[#00f0ff] border-none text-[8px] uppercase tracking-widest rounded-none">
                                                    {response.status}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between items-center text-[9px] text-muted-foreground font-mono">
                                                <span>SUBMITTED AT: {response.submittedAt ? new Date(response.submittedAt).toLocaleString() : "N/A"}</span>
                                            </div>
                                            {response.answers.length > 0 && (
                                                <div className="border-t border-white/5 pt-2 space-y-1">
                                                    {response.answers.slice(0, 3).map((answer) => (
                                                        <p
                                                            key={answer.fieldId}
                                                            className="truncate text-[9px] font-mono text-muted-foreground"
                                                        >
                                                            <span className="text-[#ff4655] uppercase">{answer.fieldKey}:</span>{" "}
                                                            <span className="text-white">
                                                                {Array.isArray(answer.value)
                                                                    ? answer.value.join(", ")
                                                                    : String(answer.value)}
                                                            </span>
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </section>
                </>
            )}
        </main>
    );
}

function Metric({ label, value, accent }: { label: string; value: string; accent: "red" | "cyan" }) {
    const isRed = accent === "red";
    return (
        <div
            className={`border bg-[#0d1117] p-4 flex flex-col justify-between val-border-notch h-28 relative overflow-hidden group hover:scale-[1.02] transition`}
            style={{
                borderLeft: isRed ? "4px solid #ff4655" : "4px solid #00f0ff",
                borderColor: isRed ? "rgba(255,70,85,0.2)" : "rgba(0,240,255,0.2)",
            }}
        >
            <div className="absolute top-0 right-0 w-[40px] h-[40px] opacity-10 flex items-center justify-center translate-x-2 -translate-y-2 rotate-45 bg-white/20 select-none">
                <IconBolt className="size-6 text-white" />
            </div>
            <p
                className="text-2xl font-bold font-mono tracking-wider"
                style={{ color: isRed ? "#ff4655" : "#00f0ff" }}
            >
                {value}
            </p>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-mono font-bold mt-2 leading-none">
                {label}
            </p>
        </div>
    );
}
