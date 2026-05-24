"use client";

import { useMemo, useState } from "react";
import { IconChartBar, IconDatabase, IconTargetArrow } from "@tabler/icons-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useFormAnalytics, useFormResponses, useMyForms } from "~/hooks/api/forms";

export function AnalyticsConsole() {
  const { forms, isLoading, error } = useMyForms({ limit: 50 });
  const [selectedId, setSelectedId] = useState("");
  const activeFormId = selectedId || forms[0]?.id || "";
  const activeForm = useMemo(
    () => forms.find((form) => form.id === activeFormId),
    [activeFormId, forms],
  );
  const { analytics, error: analyticsError } = useFormAnalytics(
    activeFormId,
    Boolean(activeFormId),
  );
  const { responses, error: responsesError } = useFormResponses(
    { formId: activeFormId, limit: 20 },
    Boolean(activeFormId),
  );

  return (
    <main className="space-y-5">
      <section className="rounded-lg border bg-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="outline" className="border-accent/40 text-accent">
              <IconChartBar />
              Analytics
            </Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal">Response intelligence.</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Monitor live submissions, response limits, and recent answers per form.
            </p>
          </div>
          <Select value={activeFormId} onValueChange={setSelectedId}>
            <SelectTrigger className="w-full lg:w-80">
              <SelectValue placeholder="Choose a form" />
            </SelectTrigger>
            <SelectContent>
              {forms.map((form) => (
                <SelectItem key={form.id} value={form.id}>
                  {form.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {error || analyticsError || responsesError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error?.message ?? analyticsError?.message ?? responsesError?.message}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-lg border bg-card" />
          ))}
        </div>
      ) : !activeForm ? (
        <div className="rounded-lg border border-dashed bg-card p-10 text-center">
          <h2 className="font-semibold">No forms to analyze</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create and publish a form to unlock response intelligence.
          </p>
        </div>
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-4">
            <Metric label="Total responses" value={(analytics?.totalSubmissions ?? 0).toString()} />
            <Metric
              label="Response limit"
              value={analytics?.responseLimit?.toString() ?? "Unlimited"}
            />
            <Metric
              label="Remaining"
              value={analytics?.remainingResponses?.toString() ?? "Unlimited"}
            />
            <Metric
              label="Completion"
              value={`${Math.round((analytics?.completionRate ?? 0) * 100)}%`}
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Daily activity</h2>
                  <p className="text-sm text-muted-foreground">{activeForm.title}</p>
                </div>
                <IconTargetArrow className="size-5 text-primary" />
              </div>
              <div className="mt-5 flex h-64 items-end gap-2 border-b border-l p-3">
                {(analytics?.responsesByDay.length
                  ? analytics.responsesByDay
                  : [{ date: "No data", count: 0 }]
                ).map((item) => {
                  const max = Math.max(
                    ...(analytics?.responsesByDay.map((day) => day.count) ?? [1]),
                    1,
                  );
                  return (
                    <div key={item.date} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t bg-primary"
                        style={{
                          height: `${Math.max((item.count / max) * 100, item.count ? 12 : 4)}%`,
                        }}
                      />
                      <span className="max-w-20 truncate text-xs text-muted-foreground">
                        {item.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border bg-card">
              <div className="flex items-center justify-between border-b p-4">
                <div>
                  <h2 className="font-semibold">Recent responses</h2>
                  <p className="text-sm text-muted-foreground">Latest 20 submissions</p>
                </div>
                <IconDatabase className="size-5 text-accent" />
              </div>
              <div className="max-h-[28rem] divide-y overflow-auto">
                {responses.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">No responses captured yet.</p>
                ) : (
                  responses.map((response) => (
                    <div key={response.id} className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium">
                          {response.respondentEmail ?? "Anonymous respondent"}
                        </p>
                        <Badge variant="outline">{response.status}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {response.submittedAt
                          ? new Date(response.submittedAt).toLocaleString()
                          : "No timestamp"}
                      </p>
                      <div className="mt-3 space-y-1">
                        {response.answers.slice(0, 3).map((answer) => (
                          <p
                            key={answer.fieldId}
                            className="truncate text-xs text-muted-foreground"
                          >
                            {answer.fieldKey}:{" "}
                            {Array.isArray(answer.value)
                              ? answer.value.join(", ")
                              : String(answer.value)}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </>
      )}

      <div className="flex justify-end">
        <Button variant="outline" disabled>
          CSV export soon
        </Button>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
