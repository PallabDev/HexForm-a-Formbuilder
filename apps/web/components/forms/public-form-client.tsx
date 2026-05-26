"use client";

import { useState, useEffect, useRef } from "react";
import type React from "react";
import {
    IconCircleCheck,
    IconLock,
    IconSend,
    IconChevronRight,
    IconChevronLeft,
    IconSparkles,
    IconAlertCircle,
    IconArrowRight,
    IconCheck,
    IconStar,
    IconVolume,
    IconVolumeOff,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import Link from "next/link";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { usePublicForm, useSubmitForm } from "~/hooks/api/forms";

type AnswerValue = string | number | boolean | string[] | null;

function getNumberDigitCount(value: number) {
    return String(value).replace(/\D/g, "").length;
}

// Synthesized warm acoustic tones (Web Audio API)
const playSound = (type: "click" | "tock" | "success") => {
    if (typeof window === "undefined") return;
    const isMuted = localStorage.getItem("hexform_audio_muted") === "true";
    if (isMuted) return;

    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === "click") {
            osc.type = "sine";
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.06, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.1);
            osc.start();
            osc.stop(ctx.currentTime + 0.12);
        } else if (type === "tock") {
            osc.type = "triangle";
            osc.frequency.setValueAtTime(240, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.12);
            osc.start();
            osc.stop(ctx.currentTime + 0.14);
        } else if (type === "success") {
            const now = ctx.currentTime;
            
            osc.type = "sine";
            osc.frequency.setValueAtTime(261.63, now);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.005, now + 0.5);
            osc.start();
            osc.stop(now + 0.5);

            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.type = "sine";
            osc2.frequency.setValueAtTime(329.63, now + 0.08);
            gain2.gain.setValueAtTime(0.05, now + 0.08);
            gain2.gain.exponentialRampToValueAtTime(0.005, now + 0.58);
            osc2.start();
            osc2.stop(now + 0.58);

            const osc3 = ctx.createOscillator();
            const gain3 = ctx.createGain();
            osc3.connect(gain3);
            gain3.connect(ctx.destination);
            osc3.type = "sine";
            osc3.frequency.setValueAtTime(392.00, now + 0.16);
            gain3.gain.setValueAtTime(0.05, now + 0.16);
            gain3.gain.exponentialRampToValueAtTime(0.005, now + 0.66);
            osc3.start();
            osc3.stop(now + 0.66);

            const osc4 = ctx.createOscillator();
            const gain4 = ctx.createGain();
            osc4.connect(gain4);
            gain4.connect(ctx.destination);
            osc4.type = "sine";
            osc4.frequency.setValueAtTime(523.25, now + 0.24);
            gain4.gain.setValueAtTime(0.07, now + 0.24);
            gain4.gain.exponentialRampToValueAtTime(0.005, now + 0.74);
            osc4.start();
            osc4.stop(now + 0.74);
        }
    } catch (e) {
        console.warn("AudioContext synthesis failed", e);
    }
};

// Canvas confetti particle class
class ConfettiParticle {
    x: number;
    y: number;
    size: number;
    color: string;
    speedX: number;
    speedY: number;
    rotation: number;
    rotationSpeed: number;

    constructor(canvasWidth: number, canvasHeight: number) {
        this.x = canvasWidth / 2;
        this.y = canvasHeight + 20;
        this.size = Math.random() * 7 + 5;
        const colors = ["#f97316", "#fb923c", "#34d399", "#10b981", "#fbbf24", "#f59e0b"];
        this.color = colors[Math.floor(Math.random() * colors.length)]!;
        this.speedX = (Math.random() - 0.5) * 14;
        this.speedY = -(Math.random() * 14 + 10);
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 8;
    }

    update(gravity: number) {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += gravity;
        this.rotation += this.rotationSpeed;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

const getThemeColors = (step: number, totalSteps: number) => {
    if (step === -1) {
        return {
            bg: "from-amber-955/10 via-[#0b0c0f] to-[#08090b]",
            btnBg: "from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:via-orange-500 hover:to-amber-600",
            btnShadow: "shadow-[0_4px_25px_rgba(245,158,11,0.15)]",
            stroke: "#f59e0b",
        };
    }
    if (step === totalSteps) {
        return {
            bg: "from-orange-955/10 via-[#0b0c0f] to-[#08090b]",
            btnBg: "from-orange-600 via-amber-600 to-yellow-600 hover:from-orange-500 hover:via-amber-500 hover:to-yellow-500",
            btnShadow: "shadow-[0_4px_25px_rgba(249,115,22,0.15)]",
            stroke: "#f97316",
        };
    }

    const stepThemes = [
        {
            bg: "from-emerald-955/10 via-[#0b0c0f] to-[#08090b]",
            btnBg: "from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500",
            btnShadow: "shadow-[0_4px_20px_rgba(16,185,129,0.1)]",
            stroke: "#10b981",
        },
        {
            bg: "from-orange-955/10 via-[#0b0c0f] to-[#08090b]",
            btnBg: "from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500",
            btnShadow: "shadow-[0_4px_20px_rgba(249,115,22,0.1)]",
            stroke: "#f97316",
        },
        {
            bg: "from-yellow-955/10 via-[#0b0c0f] to-[#08090b]",
            btnBg: "from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500",
            btnShadow: "shadow-[0_4px_20px_rgba(234,179,8,0.1)]",
            stroke: "#eab308",
        },
        {
            bg: "from-teal-955/10 via-[#0b0c0f] to-[#08090b]",
            btnBg: "from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500",
            btnShadow: "shadow-[0_4px_20px_rgba(20,184,166,0.1)]",
            stroke: "#14b8a6",
        }
    ];

    return stepThemes[step % stepThemes.length]!;
};

export function PublicFormClient({ slug }: { slug: string }) {
    const { form, isLoading, error } = usePublicForm(slug);
    const submitForm = useSubmitForm();

    const [currentStep, setCurrentStep] = useState(-1);
    const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
    const [respondentEmail, setRespondentEmail] = useState("");
    const [done, setDone] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [isPreview, setIsPreview] = useState(false);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [audioMuted, setAudioMuted] = useState(false);

    const activeInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
    const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setIsPreview(new URLSearchParams(window.location.search).get("preview") === "true");
        }
    }, []);

    // Initial check for double submission and draft on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const muted = localStorage.getItem("hexform_audio_muted") === "true";
            setAudioMuted(muted);

            const submitted = localStorage.getItem(`hexform_submitted_${slug}`) === "true";
            if (submitted) {
                setAlreadySubmitted(true);
                try {
                    const savedAnswers = localStorage.getItem(`hexform_answers_${slug}`);
                    if (savedAnswers) {
                        setAnswers(JSON.parse(savedAnswers));
                    }
                } catch (e) {
                    console.error("Failed to parse saved answers", e);
                }
                return;
            }

            const draftStr = localStorage.getItem(`hexform_draft_${slug}`);
            if (draftStr) {
                try {
                    const draft = JSON.parse(draftStr);
                    if (draft && (
                        (draft.answers && Object.keys(draft.answers).length > 0) ||
                        draft.respondentEmail ||
                        draft.currentStep > -1
                    )) {
                        setShowResumeModal(true);
                    }
                } catch (e) {
                    console.error("Failed to parse draft", e);
                }
            }
        }
    }, [slug]);

    // Save draft periodically on answers/step changes
    useEffect(() => {
        if (typeof window !== "undefined" && !alreadySubmitted && !done && form && !showResumeModal) {
            const draft = {
                answers,
                currentStep,
                respondentEmail,
            };
            localStorage.setItem(`hexform_draft_${slug}`, JSON.stringify(draft));
        }
    }, [answers, currentStep, respondentEmail, slug, alreadySubmitted, done, form, showResumeModal]);

    // Spark confetti fountain on done for exactly 2.5 seconds
    useEffect(() => {
        if (done && confettiCanvasRef.current) {
            const canvas = confettiCanvasRef.current;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            let animationFrameId: number;
            const startTime = Date.now();
            const duration = 2500; // 2.5 seconds
            
            const handleResize = () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            };
            window.addEventListener("resize", handleResize);
            handleResize();

            const particles: ConfettiParticle[] = [];
            const gravity = 0.45;

            for (let i = 0; i < 150; i++) {
                particles.push(new ConfettiParticle(canvas.width, canvas.height));
            }

            const renderLoop = () => {
                const elapsed = Date.now() - startTime;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Continually spawn minor sparks only during the first 1.5 seconds
                if (elapsed < 1500 && particles.length < 250 && Math.random() < 0.4) {
                    particles.push(new ConfettiParticle(canvas.width, canvas.height));
                }

                for (let i = particles.length - 1; i >= 0; i--) {
                    const p = particles[i]!;
                    p.update(gravity);
                    p.draw(ctx);

                    if (p.y > canvas.height + 40 || p.x < -40 || p.x > canvas.width + 40) {
                        particles.splice(i, 1);
                    }
                }

                // Stop loop completely after 2.5 seconds and clear canvas
                if (elapsed < duration || particles.length > 0) {
                    animationFrameId = requestAnimationFrame(renderLoop);
                } else {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            };

            renderLoop();

            return () => {
                cancelAnimationFrame(animationFrameId);
                window.removeEventListener("resize", handleResize);
            };
        }
    }, [done]);

    const handleResumeDraft = () => {
        playSound("click");
        if (typeof window !== "undefined") {
            const draftStr = localStorage.getItem(`hexform_draft_${slug}`);
            if (draftStr) {
                try {
                    const draft = JSON.parse(draftStr);
                    if (draft) {
                        if (draft.answers) setAnswers(draft.answers);
                        if (draft.currentStep !== undefined) setCurrentStep(draft.currentStep);
                        if (draft.respondentEmail !== undefined) setRespondentEmail(draft.respondentEmail);
                        toast.success("Progress restored!");
                    }
                } catch (e) {
                    console.error("Failed to resume draft", e);
                }
            }
        }
        setShowResumeModal(false);
    };

    const handleDiscardDraft = () => {
        playSound("tock");
        if (typeof window !== "undefined") {
            localStorage.removeItem(`hexform_draft_${slug}`);
        }
        setShowResumeModal(false);
        setAnswers({});
        setCurrentStep(-1);
        setRespondentEmail("");
        toast.success("Started fresh!");
    };

    const toggleAudioMuted = () => {
        const nextMute = !audioMuted;
        setAudioMuted(nextMute);
        if (typeof window !== "undefined") {
            localStorage.setItem("hexform_audio_muted", String(nextMute));
        }
        if (!nextMute) {
            playSound("click");
        }
    };

    // Focus input automatically when step changes
    useEffect(() => {
        if (activeInputRef.current) {
            activeInputRef.current.focus();
        }
        setErrorMessage(null);
    }, [currentStep]);

    const toggleOption = (field: any, optVal: string) => {
        playSound("click");
        const isMultiple = field.selectMode === "MULTIPLE";
        const currentVal = answers[field.labelKey];
        const selectedList = Array.isArray(currentVal) ? currentVal : [];

        if (isMultiple) {
            if (selectedList.includes(optVal)) {
                setAnswers((prev) => ({
                    ...prev,
                    [field.labelKey]: selectedList.filter((v) => v !== optVal),
                }));
            } else {
                setAnswers((prev) => ({
                    ...prev,
                    [field.labelKey]: [...selectedList, optVal],
                }));
            }
        } else {
            setAnswers((prev) => ({
                ...prev,
                [field.labelKey]: optVal,
            }));
        }
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
        if (!form) return;

        const activeElement = document.activeElement;

        // Enter: Advance to next step (only if not typing in textarea)
        if (e.key === "Enter" && !e.shiftKey) {
            if (activeElement && activeElement.tagName === "TEXTAREA") {
                return;
            }
            e.preventDefault();
            handleNext();
            return;
        }
    };

    // Connect standard keyboard advance listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            handleGlobalKeyDown(e);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [currentStep, form, answers, respondentEmail, alreadySubmitted, done]);

    const validateStep = (): boolean => {
        if (currentStep === -1) {
            if (respondentEmail && !/^\S+@\S+\.\S+$/.test(respondentEmail)) {
                setErrorMessage("Please input a valid email address.");
                return false;
            }
            return true;
        }

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

        if ((field.type === "NUMBER" || field.type === "RATING") && typeof val === "number") {
            const validation = field.validation as any;
            if (field.type === "NUMBER") {
                const digitCount = getNumberDigitCount(val);
                if (validation?.minLength !== undefined && digitCount < validation.minLength) {
                    setErrorMessage(`Input is too short (min ${validation.minLength} digits required).`);
                    return false;
                }
                if (validation?.maxLength !== undefined && digitCount > validation.maxLength) {
                    setErrorMessage(`Input exceeds max length limit of ${validation.maxLength} digits.`);
                    return false;
                }
            }
            if (validation?.min !== undefined && val < validation.min) {
                setErrorMessage(`Value must be at least ${validation.min}.`);
                return false;
            }
            if (validation?.max !== undefined && val > validation.max) {
                setErrorMessage(`Value must be at most ${validation.max}.`);
                return false;
            }
        }

        if ((field.type === "TEXT" || field.type === "LONG_TEXT") && typeof val === "string") {
            const validation = field.validation as any;
            const minLength = validation?.minLength ?? validation?.min;
            const maxLength = validation?.maxLength ?? validation?.max;
            if (typeof minLength === "number" && val.length < minLength) {
                setErrorMessage(`Input is too short (min ${minLength} chars required).`);
                return false;
            }
            if (typeof maxLength === "number" && val.length > maxLength) {
                setErrorMessage(`Input exceeds max length limit of ${maxLength} chars.`);
                return false;
            }
        }

        return true;
    };

    const handleNext = () => {
        if (!form) return;
        if (!validateStep()) return;

        playSound("tock");
        if (currentStep < form.fields.length - 1) {
            setCurrentStep((prev) => prev + 1);
        } else {
            setCurrentStep(form.fields.length);
        }
    };

    const handleBack = () => {
        playSound("tock");
        if (currentStep > -1) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    async function handleSubmit() {
        if (!form) return;

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

            if ((field.type === "TEXT" || field.type === "LONG_TEXT") && typeof val === "string") {
                const validation = field.validation as any;
                const minLength = validation?.minLength ?? validation?.min;
                const maxLength = validation?.maxLength ?? validation?.max;
                if (typeof minLength === "number" && val.length < minLength) {
                    setCurrentStep(i);
                    setErrorMessage(`Input is too short (min ${minLength} chars required).`);
                    return;
                }
                if (typeof maxLength === "number" && val.length > maxLength) {
                    setCurrentStep(i);
                    setErrorMessage(`Input exceeds max length limit of ${maxLength} chars.`);
                    return;
                }
            }

            if ((field.type === "NUMBER" || field.type === "RATING") && typeof val === "number") {
                const validation = field.validation as any;
                if (field.type === "NUMBER") {
                    const digitCount = getNumberDigitCount(val);
                    if (validation?.minLength !== undefined && digitCount < validation.minLength) {
                        setCurrentStep(i);
                        setErrorMessage(`Input is too short (min ${validation.minLength} digits required).`);
                        return;
                    }
                    if (validation?.maxLength !== undefined && digitCount > validation.maxLength) {
                        setCurrentStep(i);
                        setErrorMessage(`Input exceeds max length limit of ${validation.maxLength} digits.`);
                        return;
                    }
                }
                if (validation?.min !== undefined && val < validation.min) {
                    setCurrentStep(i);
                    setErrorMessage(`Value must be at least ${validation.min}.`);
                    return;
                }
                if (validation?.max !== undefined && val > validation.max) {
                    setCurrentStep(i);
                    setErrorMessage(`Value must be at most ${validation.max}.`);
                    return;
                }
            }
        }

        if (isPreview) {
            setDone(true);
            playSound("success");
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

            if (typeof window !== "undefined") {
                localStorage.setItem(`hexform_submitted_${slug}`, "true");
                localStorage.setItem(`hexform_answers_${slug}`, JSON.stringify(answers));
                localStorage.removeItem(`hexform_draft_${slug}`);
            }

            setDone(true);
            playSound("success");
            toast.success("Response submitted successfully!");
        } catch (mutationError) {
            toast.error(
                mutationError instanceof Error ? mutationError.message : "Form response submission failed.",
            );
        }
    }

    if (isLoading) {
        return (
            <main className="min-h-dvh flex items-center justify-center p-4 bg-[#0a0b0d]">
                <div className="text-center space-y-4 animate-pulse">
                    <div className="size-10 border-2 border-zinc-800 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-zinc-500 font-semibold tracking-widest uppercase">Connecting...</p>
                </div>
            </main>
        );
    }

    if (error || !form) {
        return (
            <main className="min-h-dvh flex items-center justify-center p-4 bg-[#0a0b0d] text-zinc-100">
                <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-850 w-full max-w-md p-8 text-center space-y-6 rounded-3xl shadow-2xl">
                    <div className="size-12 bg-orange-950/20 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto">
                        <IconAlertCircle className="size-6 text-orange-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white tracking-tight">Form Closed</h2>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                        {error?.message ?? "This form link is invalid, has expired, or is currently unavailable."}
                    </p>
                    <Button asChild variant="outline" className="w-full py-3 border-zinc-800 hover:bg-zinc-850 hover:text-white rounded-xl text-xs font-semibold cursor-pointer">
                        <Link href="/explore">Return to Explore</Link>
                    </Button>
                </div>
            </main>
        );
    }

    // Already Submitted View
    if (alreadySubmitted) {
        return (
            <main className="min-h-dvh flex items-center justify-center p-4 md:p-6 text-zinc-100 bg-[#0a0b0d] relative overflow-hidden">
                <div className="relative max-w-lg w-full bg-zinc-900/40 backdrop-blur-xl border border-zinc-850 p-6 md:p-8 text-center space-y-6 rounded-3xl shadow-2xl z-10">
                    <div className="size-16 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                        <IconCircleCheck className="size-8 text-emerald-400" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight text-white">Response Already Recorded</h2>
                        <p className="text-sm text-zinc-400">
                            You have successfully completed <span className="text-zinc-200 font-semibold">{form.title}</span>. 
                            Multiple submissions are disabled.
                        </p>
                    </div>

                    <div className="border border-zinc-800 bg-zinc-950/40 rounded-2xl overflow-hidden shadow-inner">
                        <div className="bg-zinc-900/60 px-4 py-2.5 border-b border-zinc-800 text-[10px] text-zinc-400 font-semibold tracking-wider uppercase text-left">
                            Submitted Data Receipt
                        </div>
                        <div className="p-4 text-left space-y-3 max-h-[220px] overflow-y-auto pr-2 text-xs">
                            {form.fields.map((f, idx) => {
                                const val = answers[f.labelKey];
                                let displayVal = "Empty";
                                if (val !== undefined && val !== null && val !== "") {
                                    displayVal = Array.isArray(val) ? val.join(", ") : String(val);
                                }
                                return (
                                    <div key={f.id} className="flex justify-between gap-4 py-2 border-b border-zinc-850/50 last:border-0 last:pb-0">
                                        <span className="text-zinc-400 font-medium truncate max-w-[200px]">
                                            {idx + 1}. {f.label}
                                        </span>
                                        <span className="font-semibold text-zinc-200 text-right max-w-[220px] break-all">
                                            {displayVal}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-2 grid gap-3 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
                        <button
                            onClick={() => {
                                playSound("click");
                                if (typeof window !== "undefined") {
                                    navigator.clipboard.writeText(JSON.stringify(answers, null, 2));
                                    toast.success("Answers copied!");
                                }
                            }}
                            className="min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-center text-sm font-semibold text-zinc-200 transition-all hover:bg-zinc-700 cursor-pointer flex items-center justify-center"
                        >
                            Copy Answers
                        </button>
                        <Button asChild className="min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-300 transition-all hover:bg-zinc-900 cursor-pointer">
                            <Link href="/explore">Explore Other Forms</Link>
                        </Button>
                    </div>
                </div>
            </main>
        );
    }

    if (done) {
        return (
            <main className="min-h-dvh flex items-center justify-center p-4 md:p-6 text-zinc-100 bg-[#0a0b0d] relative overflow-hidden">
                {/* 2.5s Short-lived Confetti canvas */}
                <canvas ref={confettiCanvasRef} className="pointer-events-none absolute inset-0 z-50 w-full h-full" />

                <div className="relative max-w-lg w-full bg-zinc-900/40 backdrop-blur-xl border border-zinc-850 p-6 md:p-8 text-center space-y-6 rounded-3xl shadow-2xl z-10 animate-in zoom-in-95 duration-300">
                    <div className="size-16 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
                        <IconCircleCheck className="size-8 text-emerald-400 animate-pulse" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight text-white animate-pulse">Form Submitted!</h2>
                        <p className="text-sm text-zinc-400">
                            Thank you! Your response has been recorded successfully.
                        </p>
                    </div>

                    <div className="border border-zinc-800 bg-zinc-950/40 rounded-2xl overflow-hidden shadow-inner">
                        <div className="bg-zinc-900/60 px-4 py-2.5 border-b border-zinc-800 text-[10px] text-zinc-400 font-semibold tracking-wider uppercase text-left">
                            Submitted Data Receipt
                        </div>
                        <div className="p-4 text-left space-y-3 max-h-[200px] overflow-y-auto pr-2 text-xs">
                            {form.fields.map((f, idx) => {
                                const val = answers[f.labelKey];
                                let displayVal = "Empty";
                                if (val !== undefined && val !== null && val !== "") {
                                    displayVal = Array.isArray(val) ? val.join(", ") : String(val);
                                }
                                return (
                                    <div key={f.id} className="flex justify-between gap-4 py-2 border-b border-zinc-850/50 last:border-0 last:pb-0">
                                        <span className="text-zinc-400 font-medium truncate max-w-[200px]">
                                            {idx + 1}. {f.label}
                                        </span>
                                        <span className="font-semibold text-zinc-200 text-right max-w-[220px] break-all">{displayVal}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-2 grid gap-3 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
                        <button
                            onClick={() => {
                                playSound("click");
                                if (typeof window !== "undefined") {
                                    navigator.clipboard.writeText(JSON.stringify(answers, null, 2));
                                    toast.success("Answers copied!");
                                }
                            }}
                            className="min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-center text-sm font-semibold text-zinc-200 transition-all hover:bg-zinc-700 cursor-pointer flex items-center justify-center"
                        >
                            Copy Answers
                        </button>
                        <Button asChild className="min-h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-300 transition-all hover:bg-zinc-900 cursor-pointer">
                            <Link href="/explore">Explore Other Forms</Link>
                        </Button>
                    </div>

                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block">
                        You can safely close this window
                    </p>
                </div>
            </main>
        );
    }

    const totalSteps = form.fields.length;
    const progressPercent = Math.min(
        Math.round(((currentStep + 1) / (totalSteps + 1)) * 100),
        100,
    );

    const theme = getThemeColors(currentStep, totalSteps);

    return (
        <div className="min-h-dvh flex flex-col justify-between p-4 sm:p-6 md:p-8 bg-[#0b0c0f] relative overflow-hidden select-none text-zinc-100 transition-colors duration-1000">
            {/* Dynamic themed background aura glow */}
            <div className="absolute inset-0 z-0 pointer-events-none transition-all duration-1000 ease-in-out">
                <div className={`absolute top-0 left-0 size-full bg-gradient-to-tr ${theme.bg} transition-all duration-1000`} />
            </div>

            {/* Resume Draft Greeting Card Modal */}
            {showResumeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="relative max-w-sm w-full bg-zinc-900 border border-zinc-850 p-6 rounded-3xl shadow-2xl text-center space-y-6">
                        <div className="size-12 bg-amber-950/20 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto">
                            <IconSparkles className="size-6 text-amber-400 animate-bounce" />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-zinc-100 tracking-tight">Welcome back!</h3>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                We saved your progress for <span className="text-zinc-200 font-semibold">{form.title}</span>. 
                                Would you like to resume or start fresh?
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <button
                                onClick={handleDiscardDraft}
                                className="w-full py-2.5 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                            >
                                Start Fresh
                            </button>
                            <button
                                onClick={handleResumeDraft}
                                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-zinc-950 text-xs font-bold rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                            >
                                Resume
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="flex items-center justify-between border-b border-white/5 pb-4 max-w-2xl w-full mx-auto backdrop-blur-md bg-zinc-950/10 px-2 rounded-xl z-10">
                <span className="text-xs sm:text-sm font-semibold tracking-wide text-zinc-200 truncate max-w-[200px] sm:max-w-md">
                    {form.title || "Untitled form"}
                </span>
                
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleAudioMuted}
                        className="p-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-450 hover:text-white transition-all cursor-pointer size-8 flex items-center justify-center"
                        title={audioMuted ? "Unmute sound clicks" : "Mute sound clicks"}
                    >
                        {audioMuted ? <IconVolumeOff className="size-4" /> : <IconVolume className="size-4 animate-pulse" />}
                    </button>

                    <Badge variant="outline" className="text-[9px] bg-zinc-950/30 border-zinc-800 text-zinc-400 font-semibold px-2 py-0.5 tracking-wider uppercase flex items-center gap-1 shadow-sm">
                        <IconLock className="size-3" />
                        Autosave Draft
                    </Badge>
                </div>
            </header>

            {/* Core Card Slides Container */}
            <section className="flex-1 flex items-center justify-center max-w-2xl w-full mx-auto py-8 z-10 min-h-0">
                <div className="w-full transition-all duration-300">

                    {/* Welcome Slide */}
                    {currentStep === -1 && (
                        <div className="relative overflow-hidden bg-zinc-900/35 backdrop-blur-xl border border-zinc-800 p-6 sm:p-10 space-y-6 rounded-3xl shadow-xl">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-1.5 bg-zinc-950/40 border border-zinc-850 text-zinc-300 text-[9px] tracking-widest uppercase font-extrabold px-2.5 py-1 rounded-md shadow-sm">
                                    <IconSparkles className="size-3 text-amber-400 animate-spin duration-[4000ms]" />
                                    Form Workspace
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                                    {form.title || "Untitled form"}
                                </h1>
                                {form.description && (
                                    <div
                                        className="text-zinc-400 text-xs sm:text-sm leading-relaxed border border-zinc-850 p-4 rounded-xl bg-zinc-950/20 prose prose-invert font-normal"
                                        dangerouslySetInnerHTML={{ __html: form.description }}
                                    />
                                )}
                            </div>

                            <div className="pt-4 space-y-4 border-t border-zinc-850">
                                {errorMessage && (
                                    <div className="text-rose-450 text-xs bg-rose-500/10 p-3.5 border border-rose-500/20 rounded-xl">
                                        {errorMessage}
                                    </div>
                                )}

                                <button
                                    onClick={handleNext}
                                    className={`py-3.5 px-6 bg-gradient-to-r ${theme.btnBg} ${theme.btnShadow} text-white font-extrabold text-sm rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group w-full sm:w-auto`}
                                >
                                    Start Form
                                    <IconArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Question Steps */}
                    {form.fields.map((field, idx) => {
                        if (idx !== currentStep) return null;
                        return (
                            <div
                                key={field.id}
                                className="relative overflow-hidden bg-zinc-900/35 backdrop-blur-xl border border-zinc-800 p-6 sm:p-10 space-y-6 rounded-3xl shadow-xl animate-in slide-in-from-right fade-in duration-300"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-extrabold text-zinc-450 tracking-widest uppercase bg-zinc-950/40 px-2.5 py-1 rounded border border-zinc-850 shadow-sm">
                                            Question {idx + 1} of {totalSteps}
                                        </span>
                                        <Badge variant="secondary" className="text-[9px] font-semibold bg-zinc-800 text-zinc-300 border-zinc-700/50 uppercase px-2 py-0.5 tracking-wider">
                                            {field.isRequired ? "Required" : "Optional"}
                                        </Badge>
                                    </div>

                                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
                                        {field.label}
                                    </h2>

                                    {field.description && (
                                        <p className="text-zinc-400 text-xs sm:text-sm font-normal leading-relaxed">
                                            {field.description}
                                        </p>
                                    )}
                                </div>

                                <div className="pt-4 space-y-4 border-t border-zinc-850">
                                    <FieldControl
                                        field={field}
                                        value={answers[field.labelKey] ?? null}
                                        onChange={(val) => {
                                            playSound("click");
                                            setAnswers((prev) => ({ ...prev, [field.labelKey]: val }));
                                        }}
                                        inputRef={activeInputRef as any}
                                        toggleOption={(optVal) => toggleOption(field, optVal)}
                                    />

                                    {errorMessage && (
                                        <div className="text-rose-455 text-xs bg-rose-500/10 p-3.5 border border-rose-500/20 rounded-xl">
                                            {errorMessage}
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-6 border-t border-zinc-850 gap-2">
                                        <button
                                            onClick={handleBack}
                                            className="px-4 py-2 border border-zinc-800 bg-zinc-950/10 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <IconChevronLeft className="size-3.5" />
                                            Back
                                        </button>
                                        <button
                                            onClick={handleNext}
                                            className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            Next
                                            <IconChevronRight className="size-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Review & Submit */}
                    {currentStep === totalSteps && (
                        <div className="relative overflow-hidden bg-zinc-900/35 backdrop-blur-xl border border-zinc-800 p-6 sm:p-10 space-y-6 rounded-3xl shadow-xl animate-in slide-in-from-right fade-in duration-300">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-1.5 bg-zinc-950/40 border border-zinc-850 text-zinc-300 text-[9px] tracking-widest uppercase font-extrabold px-2.5 py-1 rounded-md shadow-sm">
                                    <IconSparkles className="size-3 text-orange-400" />
                                    Final Check
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">Review Answers</h2>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Please take a moment to verify your responses before submitting.
                                </p>
                            </div>

                            <div className="border-t border-zinc-855 pt-4 space-y-3.5 max-h-[220px] overflow-y-auto pr-2 shadow-inner">
                                {form.fields.map((f, i) => {
                                    const rawVal = answers[f.labelKey];
                                    let displayVal = "Empty";
                                    if (rawVal !== undefined && rawVal !== null && rawVal !== "") {
                                        displayVal = Array.isArray(rawVal) ? rawVal.join(", ") : String(rawVal);
                                    }
                                    return (
                                        <div
                                            key={f.id}
                                            onClick={() => {
                                                playSound("tock");
                                                setCurrentStep(i);
                                            }}
                                            className="group flex justify-between items-start gap-4 p-3.5 bg-zinc-950/20 border border-zinc-850 hover:border-zinc-700 rounded-2xl text-xs transition-all cursor-pointer hover:scale-[1.01]"
                                        >
                                            <span className="text-zinc-400 font-medium text-xs truncate max-w-[200px] group-hover:text-white transition-colors">
                                                {i + 1}. {f.label}
                                            </span>
                                            <span className="font-semibold text-zinc-200 text-xs text-right max-w-[220px] break-all group-hover:text-white transition-colors">
                                                {displayVal}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="pt-4 border-t border-zinc-850 flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={handleBack}
                                    className="w-full py-3.5 border border-zinc-800 bg-zinc-950/20 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <IconChevronLeft className="size-4" />
                                    Go Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitForm.isPending}
                                    className={`w-full py-3.5 bg-gradient-to-r ${theme.btnBg} ${theme.btnShadow} text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] group`}
                                >
                                    {submitForm.isPending ? (
                                        <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <IconSend className="size-3.5" />
                                            Submit Response
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </section>

            {/* Simple Horizontal Progress Bar */}
            <footer className="max-w-2xl w-full mx-auto space-y-2 border-t border-white/5 pt-4 z-10">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    <span>{progressPercent}% Complete</span>
                    <span>{currentStep + 1} / {totalSteps + 1} Step</span>
                </div>
                <div className="w-full h-1 bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden">
                    <div
                        className="h-full transition-all duration-700 ease-out rounded-full shadow-sm"
                        style={{ width: `${progressPercent}%`, backgroundColor: theme.stroke }}
                    />
                </div>
            </footer>
        </div>
    );
}

function FieldControl({
    field,
    value,
    onChange,
    inputRef,
    toggleOption,
}: {
    field: NonNullable<ReturnType<typeof usePublicForm>["form"]>["fields"][number];
    value: AnswerValue;
    onChange: (value: AnswerValue) => void;
    inputRef: React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>;
    toggleOption: (optVal: string) => void;
}) {
    const [hoverRating, setHoverRating] = useState<number | null>(null);

    if (field.type === "LONG_TEXT") {
        return (
            <Textarea
                id={field.labelKey}
                placeholder={field.placeholder ?? "Type your answer here..."}
                value={typeof value === "string" ? value : ""}
                onChange={(event) => onChange(event.target.value)}
                ref={inputRef as any}
                rows={4}
                className="text-xs sm:text-sm border-zinc-800 bg-zinc-950/40 text-zinc-100 focus-visible:ring-emerald-500/50 focus:border-emerald-500/50 transition-all rounded-2xl p-4 placeholder-zinc-650 leading-relaxed outline-none w-full"
            />
        );
    }

    if (field.type === "SELECT") {
        const isMultiple = field.selectMode === "MULTIPLE";
        const selectedList = Array.isArray(value) ? value : [];

        return (
            <div className="grid gap-3 sm:grid-cols-2 mt-1">
                {field.options.map((option) => {
                    const isSelected = isMultiple
                        ? selectedList.includes(option.value)
                        : value === option.value;
                    return (
                        <button
                            key={option.id}
                            onClick={() => toggleOption(option.value)}
                            className={`group flex items-center justify-between p-3.5 border transition-all text-left rounded-2xl cursor-pointer hover:scale-[1.01] active:scale-[0.99] duration-200 relative ${
                                isSelected
                                    ? "border-emerald-500/60 bg-emerald-500/5 text-white shadow-[0_0_15px_rgba(16,185,129,0.06)]"
                                    : "border-zinc-850 bg-zinc-950/20 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-850 hover:text-zinc-200"
                            }`}
                            type="button"
                        >
                            <span className="font-semibold text-xs truncate max-w-[170px] sm:max-w-[220px]">{option.label}</span>
                            <div
                                className={`size-4.5 border flex items-center justify-center transition-all shrink-0 ${
                                    isMultiple
                                        ? `${isSelected ? "border-emerald-500 bg-emerald-500" : "border-zinc-700 group-hover:border-zinc-600"} rounded-md`
                                        : `${isSelected ? "border-emerald-500 bg-emerald-500" : "border-zinc-700 group-hover:border-zinc-600"} rounded-full`
                                }`}
                            >
                                {isSelected && (
                                    isMultiple
                                        ? <IconCheck className="size-3 text-white font-bold" />
                                        : <div className="size-1.5 bg-white rounded-full" />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        );
    }

    if (field.type === "YES_NO") {
        const activeVal = value === true;
        const inactiveVal = value === false;
        return (
            <div className="grid grid-cols-2 gap-3 mt-1">
                <button
                    onClick={() => onChange(true)}
                    className={`group flex items-center justify-between p-3.5 border transition-all text-left rounded-2xl cursor-pointer hover:scale-[1.01] active:scale-[0.99] duration-200 ${
                        activeVal
                            ? "border-emerald-500/60 bg-emerald-500/5 text-white shadow-[0_0_15px_rgba(16,185,129,0.06)]"
                            : "border-zinc-855 bg-zinc-950/20 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                    type="button"
                >
                    <span className="font-semibold text-xs">Yes</span>
                    <div className={`size-4.5 border flex items-center justify-center transition-all rounded-full shrink-0 ${
                        activeVal ? "border-emerald-500 bg-emerald-500" : "border-zinc-700"
                    }`}>
                        {activeVal && <div className="size-1.5 bg-white rounded-full" />}
                    </div>
                </button>

                <button
                    onClick={() => onChange(false)}
                    className={`group flex items-center justify-between p-3.5 border transition-all text-left rounded-2xl cursor-pointer hover:scale-[1.01] active:scale-[0.99] duration-200 ${
                        inactiveVal
                            ? "border-emerald-500/60 bg-emerald-500/5 text-white shadow-[0_0_15px_rgba(16,185,129,0.06)]"
                            : "border-zinc-855 bg-zinc-950/20 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                    type="button"
                >
                    <span className="font-semibold text-xs">No</span>
                    <div className={`size-4.5 border flex items-center justify-center transition-all rounded-full shrink-0 ${
                        inactiveVal ? "border-emerald-500 bg-emerald-500" : "border-zinc-700"
                    }`}>
                        {inactiveVal && <div className="size-1.5 bg-white rounded-full" />}
                    </div>
                </button>
            </div>
        );
    }

    if (field.type === "CHECKBOX") {
        const activeVal = Boolean(value);
        return (
            <button
                onClick={() => onChange(!activeVal)}
                className={`group flex items-center gap-3 p-3.5 border transition-all text-left rounded-2xl cursor-pointer hover:scale-[1.01] active:scale-[0.99] duration-200 ${
                    activeVal
                        ? "border-emerald-500/60 bg-emerald-500/5 text-white shadow-[0_0_15px_rgba(16,185,129,0.06)]"
                        : "border-zinc-850 bg-zinc-950/20 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
                type="button"
            >
                <div
                    className={`size-4.5 border flex items-center justify-center transition-all shrink-0 ${
                        activeVal ? "border-emerald-500 bg-emerald-500" : "border-zinc-700 group-hover:border-zinc-550"
                    } rounded-md`}
                >
                    {activeVal && <IconCheck className="size-3 text-white font-bold" />}
                </div>
                <span className="font-semibold text-xs">Confirm choice</span>
            </button>
        );
    }

    if (field.type === "RATING") {
        const valRating = typeof value === "number" ? value : 0;
        return (
            <div className="flex justify-center py-4 gap-2.5">
                {[1, 2, 3, 4, 5].map((rating) => {
                    const isActive = (hoverRating !== null ? hoverRating : valRating) >= rating;
                    return (
                        <button
                            key={rating}
                            onMouseEnter={() => setHoverRating(rating)}
                            onMouseLeave={() => setHoverRating(null)}
                            onClick={() => onChange(rating)}
                            className={`size-12 border flex items-center justify-center transition-all rounded-xl cursor-pointer hover:scale-110 active:scale-95 duration-200 ${
                                isActive
                                    ? "border-orange-400/60 bg-orange-400/10 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.1)]"
                                    : "border-zinc-800 bg-zinc-950/20 text-zinc-550 hover:border-zinc-700 hover:text-zinc-300"
                            }`}
                            type="button"
                        >
                            <IconStar className={`size-6 transition-transform ${isActive ? "fill-orange-400 text-orange-400 scale-105" : "text-zinc-650"}`} />
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
                const nextValue = field.type === "NUMBER" ? (event.target.value === "" ? null : Number(event.target.value)) : event.target.value;
                onChange(nextValue);
            }}
            ref={inputRef as any}
            className="text-xs sm:text-sm border-zinc-800 bg-zinc-950/40 text-zinc-100 focus-visible:ring-emerald-500/50 focus:border-emerald-500/50 transition-all rounded-2xl px-4 py-3.5 h-auto placeholder-zinc-650 outline-none w-full"
        />
    );
}
