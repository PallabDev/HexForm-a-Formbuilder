"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import type React from "react";
import {
    IconCircleCheck,
    IconLock,
    IconSend,
    IconChevronRight,
    IconChevronLeft,
    IconActivity,
    IconSparkles,
    IconAlertCircle,
    IconArrowRight,
    IconCheck,
    IconStar,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import Link from "next/link";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { usePublicForm, useSubmitForm } from "~/hooks/api/forms";

type AnswerValue = string | number | boolean | string[] | null;

export function PublicFormClient({ slug }: { slug: string }) {
    const { form, isLoading, error } = usePublicForm(slug);
    const submitForm = useSubmitForm();

    // Active step navigation: -1 for welcome slide, fields length for review/submit
    const [currentStep, setCurrentStep] = useState(-1);
    const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
    const [respondentEmail, setRespondentEmail] = useState("");
    const [done, setDone] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [isPreview, setIsPreview] = useState(false);
    useEffect(() => {
        if (typeof window !== "undefined") {
            setIsPreview(new URLSearchParams(window.location.search).get("preview") === "true");
        }
    }, []);

    // Active input ref for auto-focusing and keyboard control
    const activeInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

    // Focus input automatically when step changes
    useEffect(() => {
        if (activeInputRef.current) {
            activeInputRef.current.focus();
        }
        setErrorMessage(null);
    }, [currentStep]);

    // Handle keyboard shortcut for advancing (Enter key)
    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Only intercept Enter if not typing in a textarea
        if (e.key === "Enter" && !e.shiftKey) {
            const activeElement = document.activeElement;
            if (activeElement && activeElement.tagName === "TEXTAREA") {
                return; // Let textareas have standard line breaks
            }
            e.preventDefault();
            handleNext();
        }
    };

    const validateStep = (): boolean => {
        // Welcome step: validate email if provided
        if (currentStep === -1) {
            if (respondentEmail && !/^\S+@\S+\.\S+$/.test(respondentEmail)) {
                setErrorMessage("Please input a valid email address.");
                return false;
            }
            return true;
        }

        // Question steps
        const field = form?.fields[currentStep];
        if (!field) return true;

        const val = answers[field.labelKey];
        const isEmpty =
            val === undefined ||
            val === null ||
            val === "" ||
            (Array.isArray(val) && val.length === 0);

        if (field.isRequired && isEmpty) {
            setErrorMessage(`${field.label} is a required field.`);
            return false;
        }

        // Number specific limits validation
        if (field.type === "NUMBER" && typeof val === "number") {
            const validation = field.validation as any;
            if (validation?.min !== undefined && val < validation.min) {
                setErrorMessage(`Value must be at least ${validation.min}.`);
                return false;
            }
            if (validation?.max !== undefined && val > validation.max) {
                setErrorMessage(`Value must be at most ${validation.max}.`);
                return false;
            }
        }

        // Text specific lengths validation
        if ((field.type === "TEXT" || field.type === "LONG_TEXT") && typeof val === "string") {
            const validation = field.validation as any;
            if (validation?.minLength !== undefined && val.length < validation.minLength) {
                setErrorMessage(`Input is too short (min ${validation.minLength} chars required).`);
                return false;
            }
            if (validation?.maxLength !== undefined && val.length > validation.maxLength) {
                setErrorMessage(`Input exceeds max length limit of ${validation.maxLength} chars.`);
                return false;
            }
        }

        return true;
    };

    const handleNext = () => {
        if (!form) return;
        if (!validateStep()) return;

        if (currentStep < form.fields.length - 1) {
            setCurrentStep((prev) => prev + 1);
        } else {
            // Navigate to final confirm page
            setCurrentStep(form.fields.length);
        }
    };

    const handleBack = () => {
        if (currentStep > -1) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    async function handleSubmit() {
        if (!form) return;

        // Check all fields validations again before final submission
        for (let i = 0; i < form.fields.length; i++) {
            const field = form.fields[i]!;
            const val = answers[field.labelKey];
            const isEmpty =
                val === undefined ||
                val === null ||
                val === "" ||
                (Array.isArray(val) && val.length === 0);

            if (field.isRequired && isEmpty) {
                setCurrentStep(i);
                setErrorMessage(`${field.label} is a required field.`);
                return;
            }
        }

        if (isPreview) {
            setDone(true);
            toast.success("Preview submission simulated");
            return;
        }

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
            toast.success("Response submitted successfully!");
        } catch (mutationError) {
            toast.error(
                mutationError instanceof Error ? mutationError.message : "Form response submission failed.",
            );
        }
    }

    if (isLoading) {
        return (
            <main className="min-h-dvh flex items-center justify-center p-4 bg-background">
                <div className="text-center space-y-4">
                    <div className="size-10 border-2 border-border border-t-foreground rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading form...</p>
                </div>
            </main>
        );
    }

    if (error || !form) {
        return (
            <main className="min-h-dvh flex items-center justify-center p-4 bg-background">
                <div className="bg-card border border-border w-full max-w-md p-6 text-center space-y-4 rounded-xl">
                    <IconAlertCircle className="size-12 text-destructive mx-auto" />
                    <h2 className="text-lg font-semibold">Form Not Available</h2>
                    <p className="text-sm text-muted-foreground">
                        {error?.message ?? "This form is either closed, offline, or does not exist."}
                    </p>
                    <Button asChild variant="outline" className="cursor-pointer">
                        <Link href="/explore">Return Home</Link>
                    </Button>
                </div>
            </main>
        );
    }

    if (done) {
        return (
            <main className="min-h-dvh flex items-center justify-center p-4 bg-background">
                <div className="bg-card border border-border max-w-lg w-full p-6 text-center space-y-5 rounded-xl animate-in zoom-in-95 duration-200">
                    <IconCircleCheck className="size-14 text-emerald-400 mx-auto" />
                    <div>
                        <h2 className="text-xl font-semibold">Response Submitted</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Your response has been recorded successfully.
                        </p>
                    </div>

                    <div className="border border-border p-4 bg-background text-left space-y-2 text-sm rounded-lg max-h-[300px] overflow-y-auto">
                        {form.fields.map((f, idx) => {
                            const val = answers[f.labelKey];
                            let displayVal = "Empty";
                            if (val !== undefined && val !== null && val !== "") {
                                    displayVal = Array.isArray(val) ? val.join(", ") : String(val);
                            }
                            return (
                                <div key={f.id} className="flex justify-between gap-4 py-1.5 border-b border-border/50 last:border-0">
                                    <span className="text-muted-foreground text-xs truncate max-w-[200px]">
                                        {idx + 1}. {f.label}
                                    </span>
                                    <span className="font-medium text-xs text-right max-w-[220px] break-all">{displayVal}</span>
                                </div>
                            );
                        })}
                    </div>

                    <p className="text-xs text-muted-foreground">
                        You can now close this tab.
                    </p>
                </div>
            </main>
        );
    }

    // Calculate progress percentage
    const totalSteps = form.fields.length;
    const progressPercent = Math.min(
        Math.round(((currentStep + 1) / (totalSteps + 1)) * 100),
        100,
    );

    return (
        <main className="min-h-dvh flex flex-col justify-between p-4 md:p-6 bg-background" onKeyDown={handleKeyDown}>
            {/* Preview Banner */}
            {isPreview && (
                <div className="bg-amber-500/10 text-amber-400 text-xs text-center py-2.5 max-w-4xl w-full mx-auto mb-4 rounded-lg border border-amber-500/20">
                    Preview Mode — Responses will not be saved
                </div>
            )}

            {/* Header */}
            <header className="flex items-center justify-between border-b border-border pb-3 max-w-4xl w-full mx-auto">
                <span className="text-sm font-medium truncate">{form.title || "Untitled form"}</span>
                <Badge variant="outline" className="text-[10px]">
                    <IconLock className="size-3 mr-1" />
                    Secure
                </Badge>
            </header>

            {/* Core Slides */}
            <section className="flex-1 flex items-center justify-center max-w-3xl w-full mx-auto py-8">
                <div className="w-full transition-all duration-300">

                    {/* Welcome Slide */}
                    {currentStep === -1 && (
                        <div className="bg-card border border-border p-6 md:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200 rounded-xl">
                            <div className="space-y-3">
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{form.title || "Untitled form"}</h1>
                                {form.description && (
                                    <div
                                        className="text-sm text-muted-foreground leading-relaxed prose prose-invert max-w-none border border-border p-4 rounded-lg bg-background"
                                        dangerouslySetInnerHTML={{ __html: form.description }}
                                    />
                                )}
                            </div>

                            <div className="border-t border-border pt-4 space-y-4">
                                {errorMessage && (
                                    <div className="text-destructive text-xs bg-destructive/10 p-3 border border-destructive/20 rounded-lg">
                                        {errorMessage}
                                    </div>
                                )}

                                <Button onClick={handleNext} className="py-5 px-6 cursor-pointer">
                                    Start Form
                                    <IconArrowRight className="size-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Question Steps */}
                    {form.fields.map((field, idx) => {
                        if (idx !== currentStep) return null;
                        return (
                            <div
                                key={field.id}
                                className="bg-card border border-border p-6 md:p-8 space-y-5 animate-in slide-in-from-right fade-in duration-200 rounded-xl"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">
                                            Question {idx + 1} of {totalSteps}
                                        </span>
                                        <Badge variant="secondary" className="text-[10px]">
                                            {field.isRequired ? "Required" : "Optional"}
                                        </Badge>
                                    </div>

                                    <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
                                        {field.label}
                                    </h2>

                                    {field.description && (
                                        <p className="text-sm text-muted-foreground">{field.description}</p>
                                    )}
                                </div>

                                <div className="border-t border-border pt-4 space-y-3">
                                    <FieldControl
                                        field={field}
                                        value={answers[field.labelKey] ?? null}
                                        onChange={(val) =>
                                            setAnswers((prev) => ({ ...prev, [field.labelKey]: val }))
                                        }
                                        inputRef={activeInputRef}
                                    />

                                    {errorMessage && (
                                        <div className="text-destructive text-xs bg-destructive/10 p-3 border border-destructive/20 rounded-lg">
                                            {errorMessage}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-4 text-xs text-muted-foreground border-t border-border">
                                        <span>Press Enter ↵ to continue</span>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={handleBack} className="cursor-pointer">
                                                <IconChevronLeft className="size-3 mr-1" />
                                                Back
                                            </Button>
                                            <Button size="sm" onClick={handleNext} className="cursor-pointer">
                                                Next
                                                <IconChevronRight className="size-3 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Review & Submit */}
                    {currentStep === totalSteps && (
                        <div className="bg-card border border-border p-6 md:p-8 space-y-6 animate-in slide-in-from-right fade-in duration-200 rounded-xl">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-semibold tracking-tight">Review & Submit</h2>
                                <p className="text-sm text-muted-foreground">
                                    Please review your answers before submitting.
                                </p>
                            </div>

                            <div className="border-t border-border pt-4 space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                {form.fields.map((f, i) => {
                                    const rawVal = answers[f.labelKey];
                                    let displayVal = "Empty";
                                    if (rawVal !== undefined && rawVal !== null && rawVal !== "") {
                                        displayVal = Array.isArray(rawVal) ? rawVal.join(", ") : String(rawVal);
                                    }
                                    return (
                                        <div
                                            key={f.id}
                                            className="flex justify-between items-start gap-4 p-3 bg-background border border-border rounded-lg text-sm"
                                        >
                                            <span className="text-muted-foreground text-xs truncate max-w-[200px]">
                                                {i + 1}. {f.label}
                                            </span>
                                            <span className="font-medium text-xs text-right max-w-[220px] break-all">
                                                {displayVal}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="pt-2 flex flex-col sm:flex-row gap-3">
                                <Button onClick={handleBack} variant="outline" className="py-5 cursor-pointer">
                                    <IconChevronLeft className="size-4 mr-1" />
                                    Go Back
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={submitForm.isPending}
                                    className="py-5 flex-1 cursor-pointer"
                                >
                                    <IconSend className="size-4 mr-2" />
                                    Submit Response
                                </Button>
                            </div>
                        </div>
                    )}

                </div>
            </section>

            {/* Progress Bar */}
            <footer className="max-w-4xl w-full mx-auto space-y-2 border-t border-border pt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{progressPercent}% complete</span>
                    <span>{currentStep + 1} / {totalSteps + 1}</span>
                </div>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-foreground transition-all duration-300 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </footer>
        </main>
    );
}

function FieldControl({
    field,
    value,
    onChange,
    inputRef,
}: {
    field: NonNullable<ReturnType<typeof usePublicForm>["form"]>["fields"][number];
    value: AnswerValue;
    onChange: (value: AnswerValue) => void;
    inputRef: React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>;
}) {
    if (field.type === "LONG_TEXT") {
        return (
            <Textarea
                id={field.labelKey}
                placeholder={field.placeholder ?? "Type your answer here..."}
                value={typeof value === "string" ? value : ""}
                onChange={(event) => onChange(event.target.value)}
                ref={inputRef as any}
                rows={5}
                className="text-sm"
            />
        );
    }

    if (field.type === "SELECT") {
        const isMultiple = field.selectMode === "MULTIPLE";
        const selectedList = Array.isArray(value) ? value : [];

        const toggleOption = (optVal: string) => {
            if (isMultiple) {
                if (selectedList.includes(optVal)) {
                    onChange(selectedList.filter((v) => v !== optVal));
                } else {
                    onChange([...selectedList, optVal]);
                }
            } else {
                onChange(optVal);
            }
        };

        return (
            <div className="grid gap-2 sm:grid-cols-2 mt-2">
                {field.options.map((option) => {
                    const isSelected = isMultiple
                        ? selectedList.includes(option.value)
                        : value === option.value;
                    return (
                        <button
                            key={option.id}
                            onClick={() => toggleOption(option.value)}
                            className={`flex items-center justify-between p-3 border transition text-left text-sm rounded-lg cursor-pointer ${
                                isSelected
                                    ? "border-foreground bg-foreground/10 text-foreground"
                                    : "border-border bg-background text-muted-foreground hover:border-zinc-600 hover:text-foreground"
                            }`}
                            type="button"
                        >
                            <span>{option.label}</span>
                            <div
                                className={`size-4 border flex items-center justify-center transition-all ${
                                    isMultiple
                                        ? `${isSelected ? "border-foreground bg-foreground" : "border-zinc-600"} rounded`
                                        : `${isSelected ? "border-foreground bg-foreground" : "border-zinc-600"} rounded-full`
                                }`}
                            >
                                {isSelected && (
                                    isMultiple
                                        ? <IconCheck className="size-3 text-background font-bold" />
                                        : <div className="size-1.5 bg-background rounded-full" />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        );
    }

    if (field.type === "CHECKBOX" || field.type === "YES_NO") {
        const activeVal = Boolean(value);
        return (
            <button
                onClick={() => onChange(!activeVal)}
                className={`w-full flex items-center gap-3 p-4 border transition text-left text-sm rounded-lg cursor-pointer ${
                    activeVal
                        ? "border-foreground bg-foreground/10 text-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-zinc-600 hover:text-foreground"
                }`}
                type="button"
            >
                <div
                    className={`size-5 border flex items-center justify-center transition-all ${
                        activeVal ? "border-foreground bg-foreground" : "border-zinc-600"
                    } rounded`}
                >
                    {activeVal && <IconCheck className="size-4 text-background font-bold" />}
                </div>
                <span>{field.type === "YES_NO" ? "Yes" : "Confirm"}</span>
            </button>
        );
    }

    if (field.type === "RATING") {
        const valRating = typeof value === "number" ? value : 0;
        return (
            <div className="flex gap-2 justify-center py-4">
                {[1, 2, 3, 4, 5].map((rating) => {
                    const isActive = valRating >= rating;
                    return (
                        <button
                            key={rating}
                            onClick={() => onChange(rating)}
                            className={`size-12 border flex items-center justify-center transition-all rounded-lg cursor-pointer ${
                                isActive
                                    ? "border-amber-400 bg-amber-400/10 text-amber-400"
                                    : "border-border bg-background text-muted-foreground hover:border-zinc-600 hover:text-foreground"
                            }`}
                            type="button"
                        >
                            <IconStar className={`size-6 ${isActive ? "fill-amber-400 text-amber-400" : ""}`} />
                        </button>
                    );
                })}
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
            placeholder={field.placeholder ?? "Type your answer here..."}
            value={typeof value === "string" || typeof value === "number" ? value : ""}
            onChange={(event) => {
                const nextValue = field.type === "NUMBER" ? Number(event.target.value) : event.target.value;
                onChange(nextValue);
            }}
            ref={inputRef as any}
            className="text-sm"
        />
    );
}
