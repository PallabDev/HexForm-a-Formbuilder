"use client";

import { useMemo, useState, useEffect } from "react";
import {
    IconChartBar,
    IconDatabase,
    IconArrowLeft,
    IconDownload,
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
        <main className="space-y-6 p-6 max-w-7xl mx-auto animate-in fade-in duration-300">
            {/* Header */}
            <section className="bg-card border border-border rounded-xl p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm" className="cursor-pointer">
                            <Link href="/dashboard/forms">
                                <IconArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Monitor submissions, visibility, and respondent statistics
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Select value={activeFormId} onValueChange={setSelectedId}>
                            <SelectTrigger className="w-full lg:w-72 text-sm cursor-pointer">
                                <SelectValue placeholder="Choose form" />
                            </SelectTrigger>
                            <SelectContent>
                                {forms.map((f) => (
                                    <SelectItem key={f.id} value={f.id} className="text-sm cursor-pointer">
                                        {f.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            onClick={handleCsvExport}
                            disabled={responses.length === 0}
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                        >
                            <IconDownload className="size-4 mr-1.5" />
                            Export CSV
                        </Button>
                    </div>
                </div>
            </section>

            {(error || analyticsError || responsesError) && (
                <div className="border border-border bg-card text-destructive p-3 text-sm rounded-xl">
                    {error?.message ?? analyticsError?.message ?? responsesError?.message}
                </div>
            )}

            {isLoading ? (
                <div className="grid gap-4 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((item) => (
                        <div key={item} className="h-24 animate-pulse border border-border bg-card rounded-xl" />
                    ))}
                </div>
            ) : !activeForm ? (
                <div className="bg-card border border-border rounded-xl p-10 text-center space-y-3">
                    <h2 className="text-base font-semibold">No Forms Yet</h2>
                    <p className="text-sm text-muted-foreground">
                        Create your first form or seed survey data to see analytics.
                    </p>
                    <Button asChild className="cursor-pointer">
                        <Link href="/dashboard/forms">Create a New Form</Link>
                    </Button>
                </div>
            ) : (
                <>
                    {/* Metrics */}
                    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <MetricCard label="Total Submissions" value={(analytics?.totalSubmissions ?? 0).toString()} />
                        <MetricCard label="Response Limit" value={analytics?.responseLimit?.toString() ?? "∞"} />
                        <MetricCard label="Remaining" value={analytics?.remainingResponses?.toString() ?? "∞"} />
                        <MetricCard label="Completion Rate" value={`${Math.round((analytics?.completionRate ?? 0) * 100)}%`} />
                    </section>

                    {/* Activity Chart & Submissions */}
                    <section className="grid gap-4 xl:grid-cols-[1fr_400px]">
                        {/* Bar Chart */}
                        <div className="bg-card border border-border rounded-xl p-5">
                            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
                                <div>
                                    <h2 className="text-sm font-medium flex items-center gap-2">
                                        <IconChartBar className="size-4 text-muted-foreground" />
                                        Submissions Over Time
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">{activeForm.title}</p>
                                </div>
                            </div>

                            <div className="flex items-end gap-2 min-h-[240px] p-2">
                                {(analytics?.responsesByDay.length
                                    ? analytics.responsesByDay
                                    : [{ date: "No data", count: 0 }]
                                ).map((item) => {
                                    const max = Math.max(
                                        ...(analytics?.responsesByDay.map((day) => day.count) ?? [1]),
                                        1,
                                    );
                                    const barHeight = Math.max((item.count / max) * 200, item.count ? 16 : 4);
                                    return (
                                        <div key={item.date} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                                            <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                                {item.count}
                                            </div>
                                            <div
                                                className="w-full bg-zinc-700 rounded-t-sm group-hover:bg-zinc-500 transition-colors"
                                                style={{ height: `${barHeight}px` }}
                                            />
                                            <span className="max-w-[70px] truncate text-[10px] text-muted-foreground text-center">
                                                {item.date.slice(5)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recent Submissions */}
                        <div className="bg-card border border-border rounded-xl p-5">
                            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
                                <div>
                                    <h2 className="text-sm font-medium flex items-center gap-2">
                                        <IconDatabase className="size-4 text-muted-foreground" />
                                        Submissions Log
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">{responses.length} responses</p>
                                </div>
                            </div>

                            <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
                                {responses.length === 0 ? (
                                    <div className="text-center py-12 text-sm text-muted-foreground">
                                        No responses received yet.
                                    </div>
                                ) : (
                                    responses.map((response, index) => (
                                        <div key={response.id} className="border border-border bg-background rounded-lg p-3 space-y-1.5">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="truncate text-sm font-medium">
                                                    {response.respondentEmail ?? `Anonymous #${responses.length - index}`}
                                                </span>
                                                <Badge variant="secondary" className="text-[10px] shrink-0">
                                                    {response.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {response.submittedAt ? new Date(response.submittedAt).toLocaleString() : "N/A"}
                                            </p>
                                            {response.answers.length > 0 && (
                                                <div className="border-t border-border pt-1.5 space-y-0.5">
                                                    {response.answers.slice(0, 3).map((answer) => (
                                                        <p key={answer.fieldId} className="truncate text-xs text-muted-foreground">
                                                            <span className="font-medium text-foreground">{answer.fieldKey}:</span>{" "}
                                                            {Array.isArray(answer.value) ? answer.value.join(", ") : String(answer.value)}
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

function MetricCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
        </div>
    );
}
