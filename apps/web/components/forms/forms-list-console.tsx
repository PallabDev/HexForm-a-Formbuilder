"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
    IconPlus,
    IconTrash,
    IconLoader,
    IconUsers,
    IconEdit,
    IconLink,
    IconChartBar,
    IconFileText,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useMyForms, useCreateForm, useArchiveForm } from "~/hooks/api/forms";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "~/components/ui/alert-dialog";

export function FormsListConsole() {
    const { forms, isLoading, refetch: refetchForms } = useMyForms({ limit: 50 });
    const createForm = useCreateForm();
    const archiveForm = useArchiveForm();

    const activeForms = useMemo(() => forms.filter((f) => f.status !== "ARCHIVED"), [forms]);

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
                        placeholder: "Jane Doe",
                    },
                ],
            });
            toast.success("New survey workspace launched");
            await refetchForms();
            window.location.href = `/dashboard/forms/${created.id}/builder`;
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to create form");
        }
    };

    const handleArchiveForm = async (id: string) => {
        try {
            await archiveForm.mutateAsync({ id });
            toast.success("Form deleted successfully");
            await refetchForms();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to delete form");
        }
    };

    const copyShareLink = (slug: string) => {
        const link = `${window.location.origin}/f/${slug}`;
        void navigator.clipboard.writeText(link);
        toast.success("Share link copied to clipboard!");
    };

    if (isLoading) {
        return (
            <main className="min-h-[calc(100dvh-6rem)] flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <IconLoader className="size-8 text-muted-foreground animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading forms...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="space-y-6 p-6 w-full max-w-7xl mx-auto animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">My Forms</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage and view analytics for your forms
                    </p>
                </div>

                <Button
                    onClick={handleCreateForm}
                    disabled={createForm.isPending}
                    className="cursor-pointer"
                >
                    <IconPlus className="size-4 mr-1.5" />
                    Create Form
                </Button>
            </div>

            {/* Empty State */}
            {activeForms.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-16 text-center max-w-md mx-auto space-y-4">
                    <IconFileText className="size-12 text-muted-foreground mx-auto" />
                    <h3 className="text-base font-semibold">No Active Forms</h3>
                    <p className="text-sm text-muted-foreground">
                        Create your first form to start gathering responses.
                    </p>
                    <Button onClick={handleCreateForm} className="cursor-pointer">
                        <IconPlus className="size-4 mr-1.5" />
                        Create Form
                    </Button>
                </div>
            ) : (
                <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {activeForms.map((item) => (
                        <article
                            key={item.id}
                            className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between min-h-[220px] transition-colors hover:border-zinc-700"
                        >
                            <div className="space-y-3">
                                {/* Badge row */}
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant={item.status === "PUBLISHED" ? "default" : "secondary"}
                                        className="text-[10px]"
                                    >
                                        {item.status === "PUBLISHED" ? "Public" : "Draft"}
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px]">
                                        {item.visibility}
                                    </Badge>
                                </div>

                                {/* Title */}
                                <h2 className="text-base font-semibold line-clamp-1 tracking-tight">{item.title}</h2>

                                {/* Stats */}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <IconUsers className="size-3.5" />
                                        {item.submissionCount} responses
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-4 space-y-3 pt-3 border-t border-border">
                                <div className="flex items-center gap-2">
                                    <Button asChild variant="outline" size="sm" className="flex-1 cursor-pointer text-xs">
                                        <Link href={`/dashboard/forms/${item.id}/builder`}>
                                            <IconEdit className="size-3.5 mr-1" />
                                            Edit
                                        </Link>
                                    </Button>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive cursor-pointer">
                                                <IconTrash className="size-3.5" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-card border-border rounded-xl max-w-sm">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-base">
                                                    Delete form?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription className="text-sm text-muted-foreground">
                                                    This will permanently delete &quot;{item.title}&quot; and all associated responses. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="mt-4 gap-2">
                                                <AlertDialogCancel className="cursor-pointer">
                                                    Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleArchiveForm(item.id)}
                                                    className="bg-destructive text-white hover:bg-destructive/90 cursor-pointer"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>

                                {/* Footer links */}
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <button
                                        onClick={() => copyShareLink(item.slug)}
                                        className="flex items-center gap-1.5 hover:text-foreground transition cursor-pointer"
                                    >
                                        <IconLink className="size-3.5" />
                                        Share link
                                    </button>

                                    <Link
                                        href={`/dashboard/forms/${item.id}/analytics`}
                                        className="flex items-center gap-1.5 hover:text-foreground transition"
                                    >
                                        <IconChartBar className="size-3.5" />
                                        Analytics
                                    </Link>
                                </div>
                            </div>
                        </article>
                    ))}
                </section>
            )}
        </main>
    );
}
