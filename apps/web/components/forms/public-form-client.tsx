"use client";

import { FormEvent, useState } from "react";
import type React from "react";
import { IconCircleCheck, IconLock, IconSend } from "@tabler/icons-react";
import { toast } from "sonner";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { usePublicForm, useSubmitForm } from "~/hooks/api/forms";

type AnswerValue = string | number | boolean | string[] | null;

export function PublicFormClient({ slug }: { slug: string }) {
  const { form, isLoading, error } = usePublicForm(slug);
  const submitForm = useSubmitForm();
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [respondentEmail, setRespondentEmail] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;

    try {
      await submitForm.mutateAsync({
        slug: form.slug,
        respondentEmail: respondentEmail || null,
        answers: form.fields.map((field) => ({
          fieldKey: field.labelKey,
          value: answers[field.labelKey] ?? null,
        })),
      });
      setDone(true);
      toast.success("Response submitted");
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error ? mutationError.message : "Could not submit response",
      );
    }
  }

  if (isLoading) {
    return <PublicShell title="Syncing form..." description="Preparing the respondent flow." />;
  }

  if (error || !form) {
    return (
      <PublicShell
        title="Form unavailable"
        description={
          error?.message ?? "This form link is invalid or no longer accepting responses."
        }
      />
    );
  }

  if (done) {
    return (
      <PublicShell title="Transmission received" description="Your response has been recorded.">
        <div className="mx-auto mt-6 max-w-md rounded-lg border bg-card p-6 text-center">
          <IconCircleCheck className="mx-auto size-10 text-accent" />
          <h2 className="mt-4 text-xl font-semibold">Thank you</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The creator can now review your submission in their analytics console.
          </p>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell
      title={form.title}
      description={form.description ?? "Complete this form to continue."}
    >
      <form className="mx-auto mt-6 max-w-2xl space-y-4" onSubmit={handleSubmit}>
        <div className="rounded-lg border bg-card p-4">
          <label className="text-sm font-medium" htmlFor="respondent-email">
            Email for receipt
          </label>
          <Input
            id="respondent-email"
            className="mt-2"
            type="email"
            placeholder="agent@example.com"
            value={respondentEmail}
            onChange={(event) => setRespondentEmail(event.target.value)}
          />
        </div>

        {form.fields.map((field, index) => (
          <div key={field.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Question {index + 1}</p>
                <label className="font-medium" htmlFor={field.labelKey}>
                  {field.label}
                </label>
                {field.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{field.description}</p>
                ) : null}
              </div>
              {field.isRequired ? <Badge variant="outline">Required</Badge> : null}
            </div>
            <div className="mt-4">
              <FieldControl
                field={field}
                value={answers[field.labelKey] ?? null}
                onChange={(value) =>
                  setAnswers((current) => ({ ...current, [field.labelKey]: value }))
                }
              />
            </div>
          </div>
        ))}

        <Button className="w-full" size="lg" type="submit" disabled={submitForm.isPending}>
          <IconSend />
          Submit response
        </Button>
      </form>
    </PublicShell>
  );
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: NonNullable<ReturnType<typeof usePublicForm>["form"]>["fields"][number];
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
}) {
  if (field.type === "LONG_TEXT") {
    return (
      <Textarea
        id={field.labelKey}
        placeholder={field.placeholder ?? "Type your answer"}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
      />
    );
  }

  if (field.type === "SELECT") {
    return (
      <Select value={typeof value === "string" ? value : ""} onValueChange={onChange}>
        <SelectTrigger id={field.labelKey} className="w-full">
          <SelectValue placeholder="Choose an option" />
        </SelectTrigger>
        <SelectContent>
          {field.options.map((option) => (
            <SelectItem key={option.id} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (field.type === "CHECKBOX" || field.type === "YES_NO") {
    return (
      <label className="flex items-center gap-3 rounded-md border bg-background/40 p-3 text-sm">
        <Input
          id={field.labelKey}
          checked={Boolean(value)}
          className="size-5"
          type="checkbox"
          onChange={(event) => onChange(event.target.checked)}
        />
        Confirm
      </label>
    );
  }

  if (field.type === "RATING") {
    return (
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            className={`size-10 rounded-md border text-sm font-semibold ${
              value === rating
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background/40"
            }`}
            type="button"
            onClick={() => onChange(rating)}
          >
            {rating}
          </button>
        ))}
      </div>
    );
  }

  return (
    <Input
      id={field.labelKey}
      type={
        field.type === "EMAIL"
          ? "email"
          : field.type === "NUMBER"
            ? "number"
            : field.type === "DATE"
              ? "date"
              : "text"
      }
      placeholder={field.placeholder ?? "Type your answer"}
      value={typeof value === "string" || typeof value === "number" ? value : ""}
      onChange={(event) => {
        const nextValue = field.type === "NUMBER" ? Number(event.target.value) : event.target.value;
        onChange(nextValue);
      }}
    />
  );
}

function PublicShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border bg-card p-6">
          <Badge className="bg-primary/15 text-primary" variant="outline">
            <IconLock />
            Secure form link
          </Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-normal">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
    </main>
  );
}
