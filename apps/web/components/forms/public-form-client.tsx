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
import { toast } from "sonner";
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
            toast.success("PREVIEW SUBMISSION SIMULATED (DATABASE BYPASSED)");
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
            toast.success("FORM RESPONSE SUBMITTED");
        } catch (mutationError) {
            toast.error(
                mutationError instanceof Error ? mutationError.message : "Form response submission failed.",
            );
        }
    }

    if (isLoading) {
        return (
            <main className="val-dot-grid min-h-dvh flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <div className="size-12 border-4 border-destructive/20 border-t-[#ff4655] rounded-full animate-spin mx-auto" />
                    <h2 className="val-font-heading text-sm text-white tracking-widest">
                        LOADING FORM...
                    </h2>
                    <p className="text-[10px] uppercase text-muted-foreground font-mono">
                        Connecting to secure server
                    </p>
                </div>
            </main>
        );
    }

    if (error || !form) {
        return (
            <main className="val-dot-grid min-h-dvh flex items-center justify-center p-4">
                <div className="val-card-red w-full p-6 text-center space-y-4">
                    <IconAlertCircle className="size-12 text-[#ff4655] mx-auto animate-pulse" />
                    <h2 className="val-font-heading text-lg text-white">FORM NOT ACCESSIBLE</h2>
                    <p className="text-xs text-muted-foreground uppercase font-mono leading-relaxed">
                        {error?.message ?? "This form is either closed, offline, or does not exist."}
                    </p>
                    <Button asChild className="val-btn-cyan py-4 text-xs font-bold w-full mt-4">
                        <Link href="/explore">RETURN HOME</Link>
                    </Button>
                </div>
            </main>
        );
    }

    if (done) {
        return (
            <main className="val-dot-grid min-h-dvh flex items-center justify-center p-4">
                <div className="val-card-cyan max-w-lg w-full p-6 text-center space-y-5">
                    <IconCircleCheck className="size-14 text-[#00f0ff] mx-auto animate-pulse" />
                    <div>
                        <h2 className="val-font-heading text-xl text-white tracking-widest">
                            RESPONSE SUBMITTED
                        </h2>
                        <p className="text-[10px] uppercase text-muted-foreground font-mono mt-1">
                            FORM SUBMISSION SECURED
                        </p>
                    </div>

                    <div className="border border-border/20 p-4 bg-black/40 text-left space-y-3 text-xs font-mono">
                        <div className="border-b border-white/5 pb-2 text-[#00f0ff] font-bold">
                            SUBMITTED ANSWERS:
                        </div>
                        {form.fields.map((f, idx) => {
                            const val = answers[f.labelKey];
                            let displayVal = "Empty / Optional";
                            if (val !== undefined && val !== null && val !== "") {
                                displayVal = Array.isArray(val) ? val.join(", ") : String(val);
                            }
                            return (
                                <div key={f.id} className="flex justify-between gap-4">
                                    <span className="text-muted-foreground uppercase">
                                        {idx + 1}. {f.label}:
                                    </span>
                                    <span className="text-white font-bold max-w-[200px] truncate">{displayVal}</span>
                                </div>
                            );
                        })}
                    </div>

                    <p className="text-xs text-muted-foreground uppercase font-mono leading-normal">
                        Your response has been recorded. You can now close this tab.
                    </p>
                </div>
            </main>
        );
    }

    // Calculate mission progress percentage
    const totalSteps = form.fields.length;
    const progressPercent = Math.min(
        Math.round(((currentStep + 1) / (totalSteps + 1)) * 100),
        100,
    );

    return (
        <main className="val-dot-grid min-h-dvh flex flex-col justify-between p-4 md:p-6" onKeyDown={handleKeyDown}>
            {/* PREVIEW BANNER */}
            {isPreview && (
                <div className="bg-[#334155]/20 border border-[#475569]/40 text-[#f8fafc] text-[10px] font-mono tracking-widest text-center py-2.5 uppercase max-w-4xl w-full mx-auto mb-4 animate-pulse">
                    Preview Mode // Responses will not affect live database records
                </div>
            )}

            {/* HEADER PANEL */}
            <header className="flex items-center justify-between border-b border-border/20 pb-3 max-w-4xl w-full mx-auto font-mono">
                <div className="flex items-center gap-2">
                    <div className="size-2 bg-[#ff4655] animate-ping" />
                    <span className="val-font-heading text-xs text-white tracking-widest">
                        {form.title}
                    </span>
                </div>
                <Badge
                    className="rounded-none bg-[#ff4655]/10 text-[#ff4655] border-[#ff4655]/40 text-[9px] uppercase px-2 font-mono"
                    variant="outline"
                >
                    <IconLock className="size-3 mr-1" />
                    SECURE DATA ENTRY
                </Badge>
            </header>

            {/* CORE WORKSPACE SLIDES */}
            <section className="flex-1 flex items-center justify-center max-w-3xl w-full mx-auto py-8">
                <div className="w-full transition-all duration-300">

                    {/* Slide -1: Welcome and Email Ingestion */}
                    {currentStep === -1 && (
                        <div className="val-card-red p-6 md:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                            <div className="space-y-3">
                                <Badge className="bg-[#ff4655]/15 text-[#ff4655] border-[#ff4655]/40 rounded-none uppercase text-[10px] tracking-widest px-2.5 py-0.5">
                                    FORM SHEETS
                                </Badge>
                                <h1 className="text-3xl font-extrabold uppercase text-white tracking-wide leading-tight">
                                    {form.title}
                                </h1>
                                {form.description && (
                                    <p className="text-sm text-muted-foreground uppercase leading-relaxed font-mono">
                                        {form.description}
                                    </p>
                                )}
                            </div>

                            <div className="border-t border-destructive/20 pt-4 space-y-4">
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="receipt-email"
                                        className="text-[10px] uppercase font-mono tracking-widest text-[#ff4655] block"
                                    >
                                        Your Email Address (Optional)
                                    </label>
                                    <Input
                                        id="receipt-email"
                                        type="email"
                                        placeholder="email@example.com"
                                        value={respondentEmail}
                                        onChange={(e) => setRespondentEmail(e.target.value)}
                                        ref={activeInputRef as any}
                                        className="bg-[#0f1218] border-border/40 text-white rounded-none text-xs focus-visible:ring-[#ff4655]"
                                    />
                                    <span className="text-[9px] uppercase font-mono text-muted-foreground">
                                        Used to send a copy of your submission.
                                    </span>
                                </div>

                                {errorMessage && (
                                    <div className="text-[#ff4655] text-xs font-mono uppercase bg-[#ff4655]/10 p-3 border border-[#ff4655]/30">
                                        {errorMessage}
                                    </div>
                                )}

                                <Button
                                    onClick={handleNext}
                                    className="val-btn-red py-6 text-xs font-bold w-full sm:w-auto px-8 gap-2 justify-center"
                                >
                                    START FORM
                                    <IconArrowRight className="size-4 animate-bounce" style={{ animationDirection: 'normal', animationDuration: '1.5s' }} />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Slide index: Question Steps */}
                    {form.fields.map((field, idx) => {
                        if (idx !== currentStep) return null;
                        return (
                            <div
                                key={field.id}
                                className="val-card-cyan p-6 md:p-8 space-y-5 animate-in slide-in-from-right fade-in duration-200"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-[10px] text-[#00f0ff] font-bold">
                                            QUESTION {String(idx + 1).padStart(2, "0")} OF {String(totalSteps).padStart(2, "0")}
                                        </span>
                                        <Badge className="bg-white/5 text-muted-foreground rounded-none uppercase text-[9px] px-2 font-mono border-none">
                                            {field.isRequired ? "MANDATORY" : "OPTIONAL"}
                                        </Badge>
                                    </div>

                                    <h2 className="text-xl md:text-2xl font-bold uppercase tracking-wide text-white">
                                        {field.label}
                                    </h2>

                                    {field.description && (
                                        <p className="text-xs text-muted-foreground font-mono uppercase leading-relaxed">
                                            {field.description}
                                        </p>
                                    )}
                                </div>

                                <div className="border-t border-[#00f0ff]/20 pt-4 space-y-3">
                                    <FieldControl
                                        field={field}
                                        value={answers[field.labelKey] ?? null}
                                        onChange={(val) =>
                                            setAnswers((prev) => ({ ...prev, [field.labelKey]: val }))
                                        }
                                        inputRef={activeInputRef}
                                    />

                                    {errorMessage && (
                                        <div className="text-[#ff4655] text-xs font-mono uppercase bg-[#ff4655]/10 p-3 border border-[#ff4655]/30">
                                            {errorMessage}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-4 text-[10px] font-mono text-muted-foreground border-t border-white/5">
                                        <span>Press ENTER ↵ to proceed</span>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={handleBack}
                                                className="bg-transparent border border-border text-white hover:bg-white/5 rounded-none text-[9px] uppercase px-3 py-1"
                                            >
                                                <IconChevronLeft className="size-3 mr-1" />
                                                Back
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={handleNext}
                                                className="val-btn-cyan text-[9px] uppercase px-4 py-1"
                                            >
                                                Next
                                                <IconChevronRight className="size-3 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Slide Final: Review & Submit */}
                    {currentStep === totalSteps && (
                        <div className="val-card-red p-6 md:p-8 space-y-6 animate-in slide-in-from-right fade-in duration-200">
                            <div className="space-y-3">
                                <Badge className="bg-[#ff4655]/15 text-[#ff4655] border-[#ff4655]/40 rounded-none uppercase text-[10px] tracking-widest px-2.5 py-0.5">
                                    SUBMISSION SUMMARY
                                </Badge>
                                <h2 className="text-2xl font-extrabold uppercase text-white tracking-wide">
                                    REVIEW AND SUBMIT
                                </h2>
                                <p className="text-xs text-muted-foreground uppercase leading-relaxed font-mono">
                                    Please review your answers before submitting.
                                </p>
                            </div>

                            <div className="border-t border-destructive/20 pt-4 space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                {form.fields.map((f, i) => {
                                    const rawVal = answers[f.labelKey];
                                    let displayVal = "[EMPTY / OPTIONAL]";
                                    if (rawVal !== undefined && rawVal !== null && rawVal !== "") {
                                        displayVal = Array.isArray(rawVal) ? rawVal.join(", ") : String(rawVal);
                                    }
                                    return (
                                        <div
                                            key={f.id}
                                            className="flex justify-between items-start gap-4 p-2 bg-black/20 border border-white/5 text-xs font-mono"
                                        >
                                            <span className="text-muted-foreground uppercase truncate max-w-[200px]">
                                                {i + 1}. {f.label}
                                            </span>
                                            <span className="text-[#00f0ff] font-bold text-right max-w-[220px] break-all">
                                                {displayVal}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="pt-2 flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={handleBack}
                                    className="bg-transparent hover:bg-white/5 border border-border text-white rounded-none py-6 text-xs uppercase w-full sm:w-auto px-6 font-bold"
                                >
                                    <IconChevronLeft className="size-4" />
                                    GO BACK
                                </Button>

                                <Button
                                    onClick={handleSubmit}
                                    disabled={submitForm.isPending}
                                    className="val-btn-red py-6 text-xs font-bold flex-1 gap-2 justify-center"
                                >
                                    <IconSend className="size-4" />
                                    SUBMIT RESPONSE
                                </Button>
                            </div>
                        </div>
                    )}

                </div>
            </section>

            {/* PROGRESS BAR */}
            <footer className="max-w-4xl w-full mx-auto space-y-2 border-t border-border/20 pt-4">
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                    <span>PROGRESS: {progressPercent}%</span>
                    <span>ONLINE</span>
                </div>
                <div className="w-full h-1 bg-white/5 border border-white/10 relative">
                    <div
                        className="h-full bg-gradient-to-r from-[#ff4655] to-[#00f0ff] transition-all duration-300 shadow-[0_0_8px_rgba(0,240,255,0.4)]"
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
                className="bg-[#0f1218] border-border/40 text-white rounded-none text-sm focus-visible:ring-[#00f0ff] uppercase"
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
                            className={`group flex items-center justify-between p-3 border transition text-left select-none rounded-none text-xs font-mono uppercase ${isSelected
                                ? "border-[#00f0ff] bg-[#00f0ff]/10 text-white"
                                : "border-border/30 bg-black/20 text-muted-foreground hover:bg-white/5 hover:text-white"
                                }`}
                            type="button"
                        >
                            <span>{option.label}</span>
                            <div
                                className={`size-4 border flex items-center justify-center ${isSelected ? "border-[#00f0ff] bg-[#00f0ff]" : "border-border/40"
                                    }`}
                            >
                                {isSelected && <IconCheck className="size-3 text-black font-bold" />}
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
                className={`w-full flex items-center gap-3 p-4 border transition text-left rounded-none text-xs font-mono uppercase ${activeVal
                    ? "border-[#00f0ff] bg-[#00f0ff]/10 text-white"
                    : "border-border/30 bg-black/20 text-muted-foreground hover:bg-white/5 hover:text-white"
                    }`}
                type="button"
            >
                <div
                    className={`size-5 border flex items-center justify-center ${activeVal ? "border-[#00f0ff] bg-[#00f0ff]" : "border-border/40"
                        }`}
                >
                    {activeVal && <IconCheck className="size-4 text-black font-bold" />}
                </div>
                <span>{field.type === "YES_NO" ? "YES" : "CONFIRM SELECTION"}</span>
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
                            className={`size-12 border flex items-center justify-center transition-all ${isActive
                                ? "border-[#00f0ff] bg-[#00f0ff]/15 text-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.2)]"
                                : "border-border/30 bg-black/20 text-muted-foreground hover:border-[#00f0ff]/50 hover:text-white"
                                }`}
                            type="button"
                        >
                            <IconStar className={`size-6 ${isActive ? "fill-[#00f0ff]" : ""}`} />
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
            className="bg-[#0f1218] border-border/40 text-white rounded-none text-sm focus-visible:ring-[#00f0ff] uppercase"
        />
    );
}
