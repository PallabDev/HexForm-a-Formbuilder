"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import type { RouterInputs, RouterOutputs } from "@repo/trpc/client";
import {
    IconPlus,
    IconEye,
    IconCopy,
    IconTrash,
    IconArrowUp,
    IconArrowDown,
    IconArrowLeft,
    IconSettings,
    IconChartBar,
    IconCheck,
    IconLoader,
    IconAlertCircle,
    IconDownload,
    IconX,
    IconClick,
    IconSend,
    IconFileText,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { Switch } from "~/components/ui/switch";
import {
    useCreateField,
    useCreateForm,
    useForm,
    useMyForms,
    usePublishForm,
    useUnpublishForm,
    useUpdateForm,
    useUpdateField,
    useDeleteField,
    useReorderFields,
    useFormAnalytics,
    useFormResponses,
    useArchiveForm,
} from "~/hooks/api/forms";

type FieldType = RouterInputs["form"]["createField"]["type"];
type SelectMode = RouterInputs["form"]["createField"]["selectMode"];

const fieldTypes: Array<{ value: FieldType; label: string }> = [
    { value: "TEXT", label: "Short Text" },
    { value: "LONG_TEXT", label: "Long Text" },
    { value: "EMAIL", label: "Email Address" },
    { value: "NUMBER", label: "Number Input" },
    { value: "SELECT", label: "Multiple Choice Options" },
    { value: "CHECKBOX", label: "Checkbox Field" },
    { value: "RATING", label: "Rating Scale (1-5)" },
    { value: "DATE", label: "Date Picker" },
    { value: "FILE_URL", label: "Secure File Upload Link" },
    { value: "YES_NO", label: "Yes / No Toggle" },
];

export function FormBuilderConsole() {
    const { forms, isLoading, error, refetch: refetchForms } = useMyForms({ limit: 50 });
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

    const activeForms = useMemo(() => forms.filter((f) => f.status !== "ARCHIVED"), [forms]);

    const activeFormId = selectedId;

    const {
        form,
        error: formError,
        isLoading: isFormLoading,
        refetch: refetchActiveForm,
    } = useForm(activeFormId, Boolean(activeFormId));

    const createForm = useCreateForm();
    const updateForm = useUpdateForm();
    const publishForm = usePublishForm();
    const unpublishForm = useUnpublishForm();
    const createField = useCreateField();
    const updateField = useUpdateField();
    const deleteField = useDeleteField();
    const reorderFields = useReorderFields();
    const archiveForm = useArchiveForm();

    // Integrated Analytics / Submissions
    const { analytics } = useFormAnalytics(activeFormId, Boolean(activeFormId));
    const { responses } = useFormResponses({ formId: activeFormId, limit: 100 }, Boolean(activeFormId));

    // Workspace View State
    const [activeTab, setActiveTab] = useState<"builder" | "analytics">("builder");
    const [draftTitle, setDraftTitle] = useState("");
    const [draftDescription, setDraftDescription] = useState("");
    const [draftVisibility, setDraftVisibility] = useState<"PUBLIC" | "UNLISTED">("UNLISTED");
    const [syncStatus, setSyncStatus] = useState<"SYNCED" | "SYNCING" | "ERROR">("SYNCED");

    // Popup Modal States for Field Editor
    const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
    const [editingFieldId, setEditingFieldId] = useState<string | null>(null); // null = Creating a new field

    // Field values inside Modal
    const [fieldLabel, setFieldLabel] = useState("");
    const [fieldType, setFieldType] = useState<FieldType>("TEXT");
    const [fieldPlaceholder, setFieldPlaceholder] = useState("");
    const [fieldIsRequired, setFieldIsRequired] = useState(false);
    const [fieldSelectMode, setFieldSelectMode] = useState<SelectMode>("SINGLE");
    const [fieldOptions, setFieldOptions] = useState<Array<{ id: string; label: string; value: string; order: number; isDefault: boolean }>>([]);

    // Validations
    const [validationMin, setValidationMin] = useState<number | undefined>(undefined);
    const [validationMax, setValidationMax] = useState<number | undefined>(undefined);
    const [validationMinLength, setValidationMinLength] = useState<number | undefined>(undefined);
    const [validationMaxLength, setValidationMaxLength] = useState<number | undefined>(undefined);

    // Sync inputs with loaded active form
    useEffect(() => {
        if (form) {
            setDraftTitle(form.title);
            setDraftDescription(form.description ?? "");
            setDraftVisibility(form.visibility);
        }
    }, [form]);

    // Default back to builder tab when form changes
    useEffect(() => {
        setActiveTab("builder");
        setIsFieldModalOpen(false);
        setEditingFieldId(null);
    }, [activeFormId]);

    // Debounced Auto-Save for Title & Description
    const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);

    const handleMetadataChange = (updatedFields: {
        title?: string;
        description?: string;
        visibility?: "PUBLIC" | "UNLISTED";
    }) => {
        setSyncStatus("SYNCING");
        if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);

        autoSaveTimeout.current = setTimeout(async () => {
            if (!activeFormId) return;
            try {
                await updateForm.mutateAsync({
                    id: activeFormId,
                    title: updatedFields.title ?? draftTitle,
                    description: updatedFields.description ?? draftDescription,
                    visibility: updatedFields.visibility ?? draftVisibility,
                });
                setSyncStatus("SYNCED");
            } catch (err) {
                setSyncStatus("ERROR");
                toast.error("Failed to auto-save settings");
            }
        }, 800);
    };

    const handleVisibilityChange = async (value: "PUBLIC" | "UNLISTED") => {
        setDraftVisibility(value);
        setSyncStatus("SYNCING");
        try {
            await updateForm.mutateAsync({
                id: activeFormId,
                visibility: value,
            });
            setSyncStatus("SYNCED");
            toast.success(`Visibility updated to ${value}`);
        } catch (err) {
            setSyncStatus("ERROR");
            toast.error("Failed to auto-save visibility");
        }
    };

    // Open Modal to Add a Field
    const openAddFieldModal = () => {
        setEditingFieldId(null);
        setFieldLabel("New Question Prompt");
        setFieldType("TEXT");
        setFieldPlaceholder("Enter response here...");
        setFieldIsRequired(true);
        setFieldSelectMode("SINGLE");
        setFieldOptions([]);
        setValidationMin(undefined);
        setValidationMax(undefined);
        setValidationMinLength(undefined);
        setValidationMaxLength(undefined);
        setIsFieldModalOpen(true);
    };

    // Open Modal to Edit an Existing Field
    const openEditFieldModal = (field: any) => {
        setEditingFieldId(field.id);
        setFieldLabel(field.label);
        setFieldType(field.type);
        setFieldPlaceholder(field.placeholder ?? "");
        setFieldIsRequired(field.isRequired);
        setFieldSelectMode(field.selectMode ?? "SINGLE");
        setFieldOptions(field.options ?? []);

        const val = field.validation as any;
        setValidationMin(val?.min);
        setValidationMax(val?.max);
        setValidationMinLength(val?.minLength);
        setValidationMaxLength(val?.maxLength);

        setIsFieldModalOpen(true);
    };

    // Save changes inside Modal (Done clicked)
    const handleSaveFieldFromModal = async () => {
        if (!form) return;
        if (!fieldLabel.trim()) {
            toast.error("Question label is required");
            return;
        }

        const validation: Record<string, any> = {};
        if (validationMin !== undefined) validation.min = validationMin;
        if (validationMax !== undefined) validation.max = validationMax;
        if (validationMinLength !== undefined) validation.minLength = validationMinLength;
        if (validationMaxLength !== undefined) validation.maxLength = validationMaxLength;

        setSyncStatus("SYNCING");
        try {
            if (editingFieldId) {
                // Edit existing field
                await updateField.mutateAsync({
                    id: editingFieldId,
                    formId: form.id,
                    label: fieldLabel,
                    type: fieldType,
                    placeholder: fieldPlaceholder,
                    isRequired: fieldIsRequired,
                    selectMode: fieldType === "SELECT" ? fieldSelectMode : null,
                    options: fieldType === "SELECT" ? fieldOptions : [],
                    validation,
                });
                toast.success("Question updated successfully");
            } else {
                // Add new field
                await createField.mutateAsync({
                    formId: form.id,
                    label: fieldLabel,
                    type: fieldType,
                    placeholder: fieldPlaceholder,
                    isRequired: fieldIsRequired,
                    selectMode: fieldType === "SELECT" ? fieldSelectMode : null,
                    options: fieldType === "SELECT" ? fieldOptions : [],
                    validation,
                    order: form.fields.length,
                });
                toast.success("New question added to workspace");
            }
            setSyncStatus("SYNCED");
            setIsFieldModalOpen(false);
        } catch (err) {
            setSyncStatus("ERROR");
            toast.error(err instanceof Error ? err.message : "Failed to save question");
        }
    };

    // Delete question
    const handleDeleteField = async (fieldId: string) => {
        if (!form) return;
        if (!confirm("Are you sure you want to delete this question?")) return;

        setSyncStatus("SYNCING");
        try {
            await deleteField.mutateAsync({
                id: fieldId,
                formId: form.id,
            });
            setSyncStatus("SYNCED");
            toast.success("Question deleted");
        } catch (err) {
            setSyncStatus("ERROR");
            toast.error(err instanceof Error ? err.message : "Failed to delete question");
        }
    };

    // Reordering questions
    const handleReorderUp = async (index: number) => {
        if (!form || index <= 0) return;
        setSyncStatus("SYNCING");

        const newFields = [...form.fields];
        const temp = newFields[index];
        newFields[index] = newFields[index - 1]!;
        newFields[index - 1] = temp!;

        try {
            await reorderFields.mutateAsync({
                formId: form.id,
                fieldIds: newFields.map((f) => f.id),
            });
            setSyncStatus("SYNCED");
        } catch (err) {
            setSyncStatus("ERROR");
            toast.error("Failed to reorder questions");
        }
    };

    const handleReorderDown = async (index: number) => {
        if (!form || index >= form.fields.length - 1) return;
        setSyncStatus("SYNCING");

        const newFields = [...form.fields];
        const temp = newFields[index];
        newFields[index] = newFields[index + 1]!;
        newFields[index + 1] = temp!;

        try {
            await reorderFields.mutateAsync({
                formId: form.id,
                fieldIds: newFields.map((f) => f.id),
            });
            setSyncStatus("SYNCED");
        } catch (err) {
            setSyncStatus("ERROR");
            toast.error("Failed to reorder questions");
        }
    };

    // Registry form actions
    const handleCreateForm = async () => {
        try {
            const created = await createForm.mutateAsync({
                title: "Untitled Survey Sheet",
                description: "Configure your minimal forms workspace details here.",
                visibility: "UNLISTED",
                submissionLimit: 100,
                fields: [
                    {
                        label: "Your Full Name",
                        type: "TEXT",
                        order: 0,
                        isRequired: true,
                    },
                ],
            });
            setSelectedId(created.id);
            setActiveTab("builder");
            toast.success("New survey workspace launched");
            await refetchForms();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to create form");
        }
    };

    const handleArchiveForm = async (id: string) => {
        if (!confirm("Are you sure you want to delete this form?")) return;
        try {
            await archiveForm.mutateAsync({ id });
            toast.success("Form deleted successfully");
            if (selectedId === id) {
                setSelectedId("");
            }
            await refetchForms();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to delete form");
        }
    };

    const handlePublish = async () => {
        if (!form) return;
        try {
            await publishForm.mutateAsync({ id: form.id, visibility: draftVisibility });
            toast.success("Form live link generated successfully!");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to publish");
        }
    };

    const handleUnpublish = async () => {
        if (!form) return;
        try {
            await unpublishForm.mutateAsync({ id: form.id });
            toast.success("Form offline draft status updated");
            setActiveTab("builder");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to unpublish");
        }
    };

    const copyShareLink = () => {
        if (!form) return;
        const link = `${window.location.origin}/f/${form.slug}`;
        void navigator.clipboard.writeText(link);
        toast.success("Link copied to clipboard!");
    };

    const handleCsvExport = () => {
        if (!form || responses.length === 0) return;

        const headers = ["submittedAt", "respondentEmail", ...form.fields.map((f) => f.labelKey)];
        const rows = responses.map((res) => {
            const answerMap = new Map(res.answers.map((a) => [a.fieldKey, a.value]));
            return [
                res.submittedAt ?? "",
                res.respondentEmail ?? "anonymous",
                ...form.fields.map((f) => {
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
        link.setAttribute("download", `responses_${form.slug}_export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Detailed CSV data exported successfully!");
    };

    if (isLoading) {
        return (
            <main className="val-dot-grid min-h-[calc(100dvh-6rem)] flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <IconLoader className="size-10 text-zinc-400 animate-spin mx-auto" />
                    <h2 className="text-sm font-medium text-zinc-300 uppercase tracking-widest">
                        Syncing Workspace...
                    </h2>
                </div>
            </main>
        );
    }

    // LEVEL 1: Registry of all active surveys
    if (selectedId === "") {
        return (
            <main className="val-dot-grid min-h-[calc(100dvh-6rem)] p-6 space-y-8 w-full px-6 mx-auto animate-in fade-in duration-200">

                {/* Banner Section */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight text-white font-sans mt-2">
                            My Forms
                        </h1>
                        <p className="text-xs text-zinc-400 font-sans">
                            Manage your active forms, configure details, and inspect respondents submissions
                        </p>
                    </div>

                    <Button
                        onClick={handleCreateForm}
                        disabled={createForm.isPending}
                        className="val-btn-red py-4 px-6 text-xs font-semibold uppercase tracking-wider hover:scale-[1.01] transition duration-200"
                    >
                        <IconPlus className="size-4 mr-2" />
                        Create New Form
                    </Button>
                </header>

                {/* Surveys deck */}
                {activeForms.length === 0 ? (
                    <section className="bg-gray-900 border border-zinc-850 rounded-xl p-16 text-center max-w-md mx-auto space-y-4">
                        <IconFileText className="size-12 text-zinc-500 mx-auto" />
                        <h3 className="text-base font-medium text-white uppercase tracking-wider">No Active Surveys</h3>
                        <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                            Launch your first survey sheets and questions to start gathering responses.
                        </p>
                        <Button
                            onClick={handleCreateForm}
                            className="val-btn-red py-5 px-6 text-xs uppercase tracking-wider w-full"
                        >
                            Create New Form
                        </Button>
                    </section>
                ) : (
                    <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {activeForms.map((item) => (
                            <article
                                key={item.id}
                                className="val-card-red p-6 flex flex-col justify-between min-h-55 relative overflow-hidden group transition-all duration-200 border border-zinc-800 bg-zinc-900 rounded-xl"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-zinc-800/40 pb-3">
                                        <Badge
                                            className={`rounded-md text-[8px] uppercase tracking-wider px-2 py-0.5 border-none ${item.status === "PUBLISHED"
                                                ? "bg-emerald-500/10 text-emerald-400"
                                                : "bg-zinc-800 text-zinc-400"
                                                }`}
                                        >
                                            {item.status}
                                        </Badge>
                                        <span className="text-[10px] text-zinc-400 font-medium">
                                            {item.submissionCount} responses
                                        </span>
                                    </div>

                                    <h2 className="text-base font-bold tracking-tight text-white truncate font-sans">
                                        {item.title}
                                    </h2>
                                    <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed font-sans">
                                        {item.description ?? "No description briefing configured."}
                                    </p>
                                </div>

                                <div className="mt-6 pt-4 border-t border-zinc-800/40 flex items-center justify-between gap-3 font-sans text-xs">
                                    <span className="text-[10px] text-zinc-500 font-mono select-all truncate">/{item.slug}</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleArchiveForm(item.id)}
                                            className="p-2.5 rounded-lg border border-zinc-800 hover:border-red-500/50 text-zinc-500 hover:text-red-500 hover:bg-red-500/5 transition duration-200"
                                            title="Archive Form"
                                        >
                                            <IconTrash className="size-4" />
                                        </button>

                                        <Button
                                            onClick={() => {
                                                setSelectedId(item.id);
                                                setActiveTab("builder");
                                            }}
                                            className="val-btn-cyan h-9 text-[10px] uppercase font-semibold px-4 hover:scale-[1.01]"
                                        >
                                            Form Workspace
                                        </Button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </section>
                )}
            </main>
        );
    }

    // LEVEL 2: Workspace detailing
    return (
        <main className="val-dot-grid min-h-[calc(100dvh-6rem)] p-6 space-y-6 w-full px-6 mx-auto animate-in fade-in duration-200">

            {/* Workspace Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => setSelectedId("")}
                        className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-lg text-xs font-semibold px-4 gap-2 h-9"
                    >
                        <IconArrowLeft className="size-4" />
                        BACK
                    </Button>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2">

                            <div className="text-[14px] font-mono bg-gray-800 px-2 py-2 rounded-md">
                                {syncStatus === "SYNCING" ? (
                                    <span className="text-amber-400 flex items-center gap-1.5 animate-pulse">
                                        <IconLoader className="size-3 animate-spin" />
                                        Saving...
                                    </span>
                                ) : syncStatus === "ERROR" ? (
                                    <span className="text-red-400 flex items-center gap-1.5">
                                        <IconAlertCircle className="size-5" />
                                        Sync Error
                                    </span>
                                ) : (
                                    <span className="text-green-300 flex items-center gap-1.5">
                                        <IconCheck className="size-5" />
                                        Saved
                                    </span>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {form && (
                        <>
                            {form.status === "PUBLISHED" ? (
                                <Button
                                    onClick={handleUnpublish}
                                    className="bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold px-4 h-9"
                                >
                                    UNPUBLISH
                                </Button>
                            ) : (
                                <Button
                                    onClick={handlePublish}
                                    className="val-btn-cyan px-4 h-9 text-[10px] font-semibold"
                                >
                                    PUBLISH FORM
                                </Button>
                            )}

                            <Button
                                onClick={() => window.open(`/f/${form.slug}?preview=true`, "_blank")}
                                className="bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold px-4 h-9"
                            >
                                <IconEye className="size-4 mr-2 text-zinc-400" />
                                PREVIEW
                            </Button>
                        </>
                    )}
                </div>
            </header>

            {/* CORE 2-COLUMN MINIMALIST SAAS WORKSPACE */}
            <div className="grid gap-6 xl:grid-cols-[280px_1fr]">

                {/* LEFT COLUMN: Static properties panel */}
                <aside className="space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-5">
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest border-b border-zinc-800 pb-3">
                            Survey Settings
                        </h3>

                        <div className="space-y-4 text-xs font-sans">
                            <div className="space-y-2">
                                <Label htmlFor="form-title" className="text-zinc-400 font-medium">Form Title</Label>
                                <Input
                                    id="form-title"
                                    value={draftTitle}
                                    onChange={(e) => {
                                        setDraftTitle(e.target.value);
                                        handleMetadataChange({ title: e.target.value });
                                    }}
                                    className="bg-zinc-950 border-zinc-800 text-white rounded-lg text-xs focus-visible:ring-zinc-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="form-desc" className="text-zinc-400 font-medium">Description Briefing</Label>
                                <Textarea
                                    id="form-desc"
                                    value={draftDescription}
                                    onChange={(e) => {
                                        setDraftDescription(e.target.value);
                                        handleMetadataChange({ description: e.target.value });
                                    }}
                                    rows={4}
                                    className="bg-zinc-950 border-zinc-800 text-white rounded-lg text-xs focus-visible:ring-zinc-700 resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-zinc-400 font-medium">Visibility Mode</Label>
                                <Select
                                    value={draftVisibility}
                                    onValueChange={(val) => handleVisibilityChange(val as "PUBLIC" | "UNLISTED")}
                                >
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white rounded-lg text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-lg">
                                        <SelectItem value="PUBLIC" className="text-xs focus:bg-zinc-800 hover:bg-zinc-800">
                                            PUBLIC SURVEY
                                        </SelectItem>
                                        <SelectItem value="UNLISTED" className="text-xs focus:bg-zinc-800 hover:bg-zinc-800">
                                            UNLISTED LINK
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {form && (
                            <div className="mt-4 pt-4 border-t border-zinc-800 space-y-2.5">
                                <Button
                                    onClick={copyShareLink}
                                    className="val-btn-cyan w-full justify-center gap-2 hover:scale-[1.01] text-[10px]"
                                >
                                    <IconCopy className="size-3.5" />
                                    COPY URL LINK
                                </Button>

                                <Button
                                    asChild
                                    className="w-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-[10px] justify-center gap-2 py-4 font-semibold"
                                >
                                    <Link href={`/f/${form.slug}`} target="_blank">
                                        <IconEye className="size-3.5" />
                                        OPEN LIVE SURVEY
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </aside>

                {/* RIGHT COLUMN: Questions Deck / Analytics Panel */}
                <section className="space-y-6">
                    {form && form.status === "PUBLISHED" && (
                        <div className="flex bg-zinc-900/60 border border-zinc-850 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab("builder")}
                                className={`flex-1 text-center py-2.5 text-xs font-semibold uppercase tracking-wider rounded-md transition duration-200 ${activeTab === "builder"
                                    ? "bg-zinc-800 text-white"
                                    : "text-zinc-500 hover:text-white"
                                    }`}
                            >
                                Questions Builder
                            </button>
                            <button
                                onClick={() => setActiveTab("analytics")}
                                className={`flex-1 text-center py-2.5 text-xs font-semibold uppercase tracking-wider rounded-md transition duration-200 ${activeTab === "analytics"
                                    ? "bg-zinc-800 text-white"
                                    : "text-zinc-500 hover:text-white"
                                    }`}
                            >
                                Analytics & Submissions
                            </button>
                        </div>
                    )}

                    {activeTab === "builder" ? (
                        <div className="space-y-4">

                            {/* Question Add Button block */}
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Form Questions</h3>
                                    <p className="text-[10px] text-zinc-500 uppercase font-mono mt-1">
                                        {isFormLoading ? "Syncing..." : `${form ? form.fields.length : 0} active questions`}
                                    </p>
                                </div>

                                <Button
                                    onClick={openAddFieldModal}
                                    className="val-btn-red py-5 px-6 text-xs uppercase tracking-wider font-semibold"
                                >
                                    <IconPlus className="size-4 mr-2" />
                                    Add Question
                                </Button>
                            </div>

                            {/* Questions list */}
                            {isFormLoading ? (
                                <div className="text-center py-12">
                                    <IconLoader className="size-8 text-zinc-500 animate-spin mx-auto" />
                                </div>
                            ) : form && form.fields.length === 0 ? (
                                <div className="bg-zinc-900 border border-dashed border-zinc-800 rounded-xl p-12 text-center text-xs text-zinc-500 uppercase tracking-widest font-mono">
                                    No survey questions mapped yet. Click Add Question to build your first field.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {form?.fields.map((field, idx) => (
                                        <div
                                            key={field.id}
                                            className="bg-zinc-900 border border-zinc-850 hover:border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition duration-150"
                                        >
                                            <div className="min-w-0 flex items-start gap-4">
                                                <span className="text-xs font-mono font-bold text-zinc-600 pt-0.5">
                                                    {String(idx + 1).padStart(2, "0")}
                                                </span>

                                                <div className="min-w-0 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-white font-sans">{field.label}</span>
                                                        <Badge className="bg-zinc-800 text-zinc-500 text-[8px] border-none uppercase rounded-md py-0">
                                                            {field.type}
                                                        </Badge>
                                                        {field.isRequired && (
                                                            <span className="text-amber-500 text-[9px] font-medium font-sans">[MANDATORY]</span>
                                                        )}
                                                    </div>
                                                    {field.placeholder && (
                                                        <p className="text-[10px] text-zinc-500 truncate font-mono">Placeholder: {field.placeholder}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 sm:justify-end">
                                                <button
                                                    onClick={() => handleReorderUp(idx)}
                                                    disabled={idx === 0}
                                                    className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-20 transition"
                                                >
                                                    <IconArrowUp className="size-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleReorderDown(idx)}
                                                    disabled={idx === form.fields.length - 1}
                                                    className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-20 transition"
                                                >
                                                    <IconArrowDown className="size-3.5" />
                                                </button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => openEditFieldModal(field)}
                                                    className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-[10px] font-semibold uppercase px-3 h-8"
                                                >
                                                    Edit
                                                </Button>
                                                <button
                                                    onClick={() => handleDeleteField(field.id)}
                                                    className="p-1.5 rounded-lg border border-zinc-800 hover:border-red-500/50 text-zinc-500 hover:text-red-500 hover:bg-red-500/5 transition"
                                                >
                                                    <IconTrash className="size-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        // ANALYTICS PANEL
                        <div className="space-y-6">

                            {/* Analytics Metric Cards */}
                            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <MetricTile
                                    label="TOTAL SUBMISSIONS"
                                    value={(analytics?.totalSubmissions ?? 0).toString()}
                                />
                                <MetricTile
                                    label="RESPONSE LIMIT"
                                    value={analytics?.responseLimit?.toString() ?? "UNLIMITED"}
                                />
                                <MetricTile
                                    label="REMAINING RESPONSES"
                                    value={analytics?.remainingResponses?.toString() ?? "UNLIMITED"}
                                />
                                <MetricTile
                                    label="COMPLETION RATE"
                                    value={`${Math.round((analytics?.completionRate ?? 0) * 100)}%`}
                                />
                            </section>

                            {/* Chart and Submissions List */}
                            <section className="grid gap-6 lg:grid-cols-2">

                                {/* Responses Graph */}
                                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between min-h-[300px]">
                                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5 mb-4">
                                        <div>
                                            <h2 className="text-xs font-semibold text-white uppercase tracking-wider">Submissions Volume</h2>
                                            <p className="text-[10px] text-zinc-500 uppercase font-sans mt-0.5">Daily completion records</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex items-end gap-3 border-b border-zinc-800 border-l border-zinc-800 p-4 min-h-[160px]">
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
                                                <div key={item.date} className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer">
                                                    <div className="text-[8px] font-mono text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {item.count}
                                                    </div>
                                                    <div
                                                        className="w-full bg-zinc-800 hover:bg-zinc-700 rounded-t-sm transition-all origin-bottom"
                                                        style={{ height: `${barHeight}px` }}
                                                    />
                                                    <span className="max-w-[45px] truncate text-[8px] uppercase font-mono text-zinc-500 text-center">
                                                        {item.date.slice(5)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Submissions List */}
                                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between min-h-[300px]">
                                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5 mb-4">
                                        <div>
                                            <h2 className="text-xs font-semibold text-white uppercase tracking-wider">Responses Logs</h2>
                                            <p className="text-[10px] text-zinc-500 uppercase font-sans mt-0.5">Chronological list</p>
                                        </div>
                                        <Button
                                            onClick={handleCsvExport}
                                            disabled={responses.length === 0}
                                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-[10px] h-8 font-semibold uppercase gap-1.5 px-3"
                                        >
                                            <IconDownload className="size-3.5" />
                                            CSV Export
                                        </Button>
                                    </div>

                                    <div className="flex-1 max-h-[190px] overflow-y-auto space-y-2 pr-1">
                                        {responses.length === 0 ? (
                                            <div className="text-center py-12 uppercase text-[9px] font-mono text-zinc-500">
                                                No responses logged yet.
                                            </div>
                                        ) : (
                                            responses.map((response, index) => (
                                                <div key={response.id} className="border border-zinc-800/80 bg-zinc-950/40 p-3 rounded-lg space-y-1.5 font-sans text-xs">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="truncate font-semibold text-zinc-200">
                                                            {response.respondentEmail ?? `Anonymous respondent #${responses.length - index}`}
                                                        </span>
                                                        <Badge className="bg-zinc-800 text-zinc-400 border-none text-[8px] uppercase rounded-md py-0 font-mono">
                                                            {response.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-[9px] text-zinc-500 font-mono">
                                                        Submitted: {response.submittedAt ? new Date(response.submittedAt).toLocaleString() : "N/A"}
                                                    </div>
                                                    {response.answers.length > 0 && (
                                                        <div className="border-t border-zinc-850 pt-2 space-y-1">
                                                            {response.answers.slice(0, 3).map((answer) => (
                                                                <p key={answer.fieldId} className="truncate text-[10px] text-zinc-400">
                                                                    <span className="text-zinc-500 font-medium font-mono mr-1.5 uppercase">{answer.fieldKey}:</span>
                                                                    <span className="text-zinc-200">
                                                                        {Array.isArray(answer.value) ? answer.value.join(", ") : String(answer.value)}
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
                        </div>
                    )}

                </section>
            </div>

            {/* POPUP QUESTION EDITOR MODAL OVERLAY */}
            {isFieldModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-zinc-800 max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
                            <div className="space-y-0.5">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
                                    {editingFieldId ? "Configure Question Details" : "Compose New Question"}
                                </h3>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                                    {editingFieldId ? "Modifying existing question properties" : "Creating new survey coordinate"}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsFieldModalOpen(false)}
                                className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition duration-150"
                            >
                                <IconX className="size-4" />
                            </button>
                        </div>

                        {/* Modal Body (Scrollable) */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-sans">

                            {/* Type Select */}
                            <div className="space-y-2">
                                <Label className="text-zinc-400 font-medium">Question Type category</Label>
                                <Select
                                    value={fieldType}
                                    onValueChange={(val) => setFieldType(val as FieldType)}
                                    disabled={Boolean(editingFieldId)} // Prevent type changes after creation for safety
                                >
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white rounded-lg text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-lg">
                                        {fieldTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value} className="text-xs hover:bg-zinc-800">
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Prompt Input */}
                            <div className="space-y-2">
                                <Label htmlFor="modal-label" className="text-zinc-400 font-medium">Question Label / Prompt</Label>
                                <Input
                                    id="modal-label"
                                    value={fieldLabel}
                                    onChange={(e) => setFieldLabel(e.target.value)}
                                    placeholder="e.g. Enter your corporate email address"
                                    className="bg-zinc-950 border-zinc-800 text-white rounded-lg text-xs"
                                />
                            </div>

                            {/* Placeholder Input */}
                            {fieldType !== "CHECKBOX" && fieldType !== "YES_NO" && fieldType !== "DATE" && (
                                <div className="space-y-2">
                                    <Label htmlFor="modal-placeholder" className="text-zinc-400 font-medium">Placeholder Instructions</Label>
                                    <Input
                                        id="modal-placeholder"
                                        value={fieldPlaceholder}
                                        onChange={(e) => setFieldPlaceholder(e.target.value)}
                                        placeholder="e.g. m@example.com"
                                        className="bg-zinc-950 border-zinc-800 text-white rounded-lg text-xs"
                                    />
                                </div>
                            )}

                            {/* Mandatory switch */}
                            <div className="flex items-center space-x-3 bg-zinc-950/30 p-3 rounded-lg border border-zinc-850">
                                <Switch
                                    checked={fieldIsRequired}
                                    onCheckedChange={setFieldIsRequired}
                                    className="data-[state=checked]:bg-zinc-100"
                                />
                                <Label className="text-zinc-300 font-semibold cursor-pointer select-none">
                                    This question is mandatory to submit
                                </Label>
                            </div>

                            {/* CHOICE OPTIONS MANAGER for SELECT */}
                            {fieldType === "SELECT" && (
                                <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-950/20 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-zinc-400 font-medium">Multiple Choice Options List</Label>
                                        <Select
                                            value={fieldSelectMode ?? "SINGLE"}
                                            onValueChange={(val) => setFieldSelectMode(val as any)}
                                        >
                                            <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white rounded-lg text-[10px] h-7 w-32">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                <SelectItem value="SINGLE" className="text-[10px]">Single Select</SelectItem>
                                                <SelectItem value="MULTIPLE" className="text-[10px]">Multi Select</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        {fieldOptions.map((opt, oIdx) => (
                                            <div key={opt.id || oIdx} className="flex gap-2 items-center">
                                                <Input
                                                    value={opt.label}
                                                    onChange={(e) => {
                                                        const updated = [...fieldOptions];
                                                        updated[oIdx] = {
                                                            ...updated[oIdx]!,
                                                            label: e.target.value,
                                                            value: e.target.value.toLowerCase().replace(/ /g, "_"),
                                                        };
                                                        setFieldOptions(updated);
                                                    }}
                                                    className="bg-zinc-950 border-zinc-800 h-8 text-xs text-white rounded-lg"
                                                    placeholder="Option label description"
                                                />
                                                <button
                                                    onClick={() => {
                                                        setFieldOptions(fieldOptions.filter((_, idx) => idx !== oIdx));
                                                    }}
                                                    className="p-1.5 rounded-lg border border-zinc-850 hover:border-red-500/50 text-zinc-500 hover:text-red-500 transition"
                                                >
                                                    <IconTrash className="size-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setFieldOptions([
                                                ...fieldOptions,
                                                {
                                                    id: `temp_${Date.now()}`,
                                                    label: `Option ${fieldOptions.length + 1}`,
                                                    value: `option_${fieldOptions.length + 1}`,
                                                    order: fieldOptions.length,
                                                    isDefault: false,
                                                },
                                            ]);
                                        }}
                                        className="val-btn-cyan h-7 text-[9px] uppercase px-3"
                                    >
                                        <IconPlus className="size-3 mr-1" />
                                        Add Option Choice
                                    </Button>
                                </div>
                            )}

                            {/* NUMBER Validation limits */}
                            {(fieldType === "NUMBER" || fieldType === "RATING") && (
                                <div className="grid gap-4 grid-cols-2 bg-zinc-950/20 p-4 border border-zinc-800 rounded-xl">
                                    <div className="space-y-1.5">
                                        <Label className="text-zinc-400 font-medium">Minimum Allowed Value</Label>
                                        <Input
                                            type="number"
                                            value={validationMin !== undefined ? validationMin : ""}
                                            onChange={(e) => setValidationMin(e.target.value === "" ? undefined : Number(e.target.value))}
                                            className="bg-zinc-950 border-zinc-800 text-white rounded-lg text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-zinc-400 font-medium">Maximum Allowed Value</Label>
                                        <Input
                                            type="number"
                                            value={validationMax !== undefined ? validationMax : ""}
                                            onChange={(e) => setValidationMax(e.target.value === "" ? undefined : Number(e.target.value))}
                                            className="bg-zinc-950 border-zinc-800 text-white rounded-lg text-xs"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* TEXT validation limits */}
                            {(fieldType === "TEXT" || fieldType === "LONG_TEXT") && (
                                <div className="grid gap-4 grid-cols-2 bg-zinc-950/20 p-4 border border-zinc-800 rounded-xl">
                                    <div className="space-y-1.5">
                                        <Label className="text-zinc-400 font-medium">Minimum Characters Length</Label>
                                        <Input
                                            type="number"
                                            value={validationMinLength !== undefined ? validationMinLength : ""}
                                            onChange={(e) => setValidationMinLength(e.target.value === "" ? undefined : Number(e.target.value))}
                                            className="bg-zinc-950 border-zinc-800 text-white rounded-lg text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-zinc-400 font-medium">Maximum Characters Length</Label>
                                        <Input
                                            type="number"
                                            value={validationMaxLength !== undefined ? validationMaxLength : ""}
                                            onChange={(e) => setValidationMaxLength(e.target.value === "" ? undefined : Number(e.target.value))}
                                            className="bg-zinc-950 border-zinc-800 text-white rounded-lg text-xs"
                                        />
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/40 flex justify-end gap-3">
                            <Button
                                onClick={() => setIsFieldModalOpen(false)}
                                className="bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700 px-5 rounded-lg text-xs font-semibold"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveFieldFromModal}
                                disabled={createField.isPending || updateField.isPending}
                                className="val-btn-red px-6 text-xs font-semibold"
                            >
                                {createField.isPending || updateField.isPending ? (
                                    <IconLoader className="size-3 animate-spin mr-1.5" />
                                ) : null}
                                Done
                            </Button>
                        </div>

                    </div>
                </div>
            )}

        </main>
    );
}

function MetricTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="border border-zinc-800 bg-zinc-900 p-5 rounded-xl flex flex-col justify-between h-28 hover:scale-[1.01] transition duration-200">
            <p className="text-2xl font-bold tracking-tight text-white font-sans">
                {value}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-sans font-semibold mt-2">
                {label}
            </p>
        </div>
    );
}
