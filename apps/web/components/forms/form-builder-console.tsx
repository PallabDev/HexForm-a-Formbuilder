"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { RouterInputs, RouterOutputs } from "@repo/trpc/client";
import {
  IconArchive,
  IconCheckbox,
  IconCopy,
  IconDeviceFloppy,
  IconEye,
  IconForms,
  IconPlus,
  IconSend,
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
import {
  useCreateField,
  useCreateForm,
  useForm,
  useMyForms,
  usePublishForm,
  useUnpublishForm,
  useUpdateForm,
} from "~/hooks/api/forms";

type FormSummary = RouterOutputs["form"]["listMine"][number];
type FieldType = RouterInputs["form"]["createField"]["type"];

const fieldTypes: Array<{ value: FieldType; label: string }> = [
  { value: "TEXT", label: "Short text" },
  { value: "LONG_TEXT", label: "Long text" },
  { value: "EMAIL", label: "Email" },
  { value: "NUMBER", label: "Number" },
  { value: "SELECT", label: "Select" },
  { value: "CHECKBOX", label: "Checkbox" },
  { value: "RATING", label: "Rating" },
  { value: "DATE", label: "Date" },
  { value: "FILE_URL", label: "File URL" },
  { value: "YES_NO", label: "Yes / No" },
];

export function FormBuilderConsole() {
  const { forms, isLoading, error } = useMyForms({ limit: 50 });
  const [selectedId, setSelectedId] = useState("");
  const activeFormId = selectedId || forms[0]?.id || "";
  const {
    form,
    error: formError,
    isLoading: isFormLoading,
  } = useForm(activeFormId, Boolean(activeFormId));
  const createForm = useCreateForm();
  const updateForm = useUpdateForm();
  const publishForm = usePublishForm();
  const unpublishForm = useUnpublishForm();
  const createField = useCreateField();

  const [draftTitle, setDraftTitle] = useState("Neon Product Feedback");
  const [draftDescription, setDraftDescription] = useState(
    "Collect sharp feedback from early users after a launch round.",
  );
  const [draftVisibility, setDraftVisibility] = useState<"PUBLIC" | "UNLISTED">("UNLISTED");
  const [fieldLabel, setFieldLabel] = useState("What should we improve next?");
  const [fieldType, setFieldType] = useState<FieldType>("TEXT");

  const selectedSummary = useMemo(
    () => forms.find((item) => item.id === activeFormId),
    [activeFormId, forms],
  );

  async function handleCreateForm() {
    try {
      const created = await createForm.mutateAsync({
        title: draftTitle,
        description: draftDescription,
        visibility: draftVisibility,
        submissionLimit: 100,
        fields: [
          {
            label: "Your name",
            type: "TEXT",
            order: 0,
            isRequired: true,
            validation: { minLength: 2 },
          },
          {
            label: "Rate this experience",
            type: "RATING",
            order: 1,
            isRequired: true,
            validation: { min: 1, max: 5 },
          },
        ],
      });
      setSelectedId(created.id);
      toast.success("Form created");
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  async function handleAddField() {
    if (!form) return;

    try {
      await createField.mutateAsync({
        formId: form.id,
        label: fieldLabel,
        type: fieldType,
        order: form.fields.length,
        isRequired: fieldType !== "CHECKBOX",
        selectMode: fieldType === "SELECT" ? "SINGLE" : null,
        validation: fieldType === "RATING" ? { min: 1, max: 5 } : {},
        options:
          fieldType === "SELECT"
            ? [
                { label: "Movies", value: "movies", order: 0 },
                { label: "Anime", value: "anime", order: 1 },
                { label: "Games", value: "games", order: 2 },
              ]
            : [],
      });
      toast.success("Field added");
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  async function handleSaveForm() {
    if (!form) return;

    try {
      await updateForm.mutateAsync({
        id: form.id,
        title: draftTitle,
        description: draftDescription,
        visibility: draftVisibility,
      });
      toast.success("Form updated");
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  async function handlePublish() {
    if (!form) return;

    try {
      await publishForm.mutateAsync({ id: form.id, visibility: draftVisibility });
      toast.success("Form published");
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  async function handleUnpublish() {
    if (!form) return;

    try {
      await unpublishForm.mutateAsync({ id: form.id });
      toast.success("Form unpublished");
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  function copyShareLink() {
    if (!form) return;
    const link = `${window.location.origin}/f/${form.slug}`;
    void navigator.clipboard.writeText(link);
    toast.success("Share link copied");
  }

  return (
    <main className="grid min-h-[calc(100dvh-7rem)] gap-4 xl:grid-cols-[320px_1fr_360px]">
      <section className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="font-semibold">Form Arsenal</h1>
              <p className="text-sm text-muted-foreground">Create and deploy form missions.</p>
            </div>
            <IconForms className="size-5 text-primary" />
          </div>
        </div>
        <div className="space-y-2 p-3">
          {isLoading ? <p className="p-3 text-sm text-muted-foreground">Loading forms...</p> : null}
          {error ? <ErrorBox message={error.message} /> : null}
          {forms.map((item) => (
            <FormListButton
              key={item.id}
              form={item}
              active={item.id === activeFormId}
              onSelect={() => {
                setSelectedId(item.id);
                setDraftTitle(item.title);
                setDraftDescription(item.description ?? "");
                setDraftVisibility(item.visibility);
              }}
            />
          ))}
          {!isLoading && forms.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No forms yet. Configure a draft and hit Create.
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Badge variant="outline" className="border-primary/40 text-primary">
                Builder Console
              </Badge>
              <h2 className="mt-2 text-2xl font-semibold tracking-normal">
                {form?.title ?? "Create your first form"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Public forms appear in explore. Unlisted forms only open by direct link.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleCreateForm} disabled={createForm.isPending}>
                <IconPlus />
                Create
              </Button>
              <Button
                onClick={handleSaveForm}
                disabled={!form || updateForm.isPending}
                variant="outline"
              >
                <IconDeviceFloppy />
                Save
              </Button>
              <Button
                onClick={handlePublish}
                disabled={!form || publishForm.isPending}
                variant="outline"
              >
                <IconSend />
                Publish
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">Mission Brief</h3>
            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="form-title">Title</Label>
                <Input
                  id="form-title"
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="form-description">Description</Label>
                <Textarea
                  id="form-description"
                  value={draftDescription}
                  onChange={(event) => setDraftDescription(event.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Visibility</Label>
                <Select
                  value={draftVisibility}
                  onValueChange={(value) => setDraftVisibility(value as "PUBLIC" | "UNLISTED")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                    <SelectItem value="UNLISTED">Unlisted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">Add Field</h3>
            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="field-label">Prompt</Label>
                <Input
                  id="field-label"
                  value={fieldLabel}
                  onChange={(event) => setFieldLabel(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Field type</Label>
                <Select
                  value={fieldType}
                  onValueChange={(value) => setFieldType(value as FieldType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAddField}
                disabled={!form || createField.isPending}
                className="w-full"
              >
                <IconPlus />
                Add to form
              </Button>
            </div>
          </div>
        </div>

        <section className="rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <h3 className="font-semibold">Live Preview</h3>
              <p className="text-sm text-muted-foreground">
                {isFormLoading
                  ? "Syncing schema..."
                  : `${form?.fields.length ?? 0} fields configured`}
              </p>
            </div>
            {form ? (
              <Badge variant={form.status === "PUBLISHED" ? "default" : "outline"}>
                {form.status}
              </Badge>
            ) : null}
          </div>
          <div className="space-y-3 p-4">
            {formError ? <ErrorBox message={formError.message} /> : null}
            {form?.fields.length ? (
              form.fields.map((field, index) => (
                <div key={field.id} className="rounded-md border bg-background/35 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Question {index + 1}</p>
                      <h4 className="font-medium">{field.label}</h4>
                      <p className="text-xs text-muted-foreground">
                        {field.type} {field.isRequired ? "/ required" : "/ optional"}
                      </p>
                    </div>
                    <IconCheckbox className="size-5 text-accent" />
                  </div>
                  <div className="mt-3">
                    <PreviewInput type={field.type} options={field.options} />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                Select or create a form, then add fields to preview the respondent flow.
              </div>
            )}
          </div>
        </section>
      </section>

      <aside className="space-y-4">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">Deployment</h3>
          <div className="mt-4 space-y-3">
            <InfoRow label="Slug" value={form ? `/${form.slug}` : "No form selected"} />
            <InfoRow label="Visibility" value={form?.visibility ?? draftVisibility} />
            <InfoRow
              label="Responses"
              value={form ? `${form.submissionCount}/${form.submissionLimit ?? "∞"}` : "0/100"}
            />
          </div>
          <div className="mt-4 grid gap-2">
            <Button onClick={copyShareLink} disabled={!form} variant="outline">
              <IconCopy />
              Copy link
            </Button>
            <Button asChild disabled={!form} variant="outline">
              <Link href={form ? `/f/${form.slug}` : "#"}>
                <IconEye />
                Open public form
              </Link>
            </Button>
            <Button
              onClick={handleUnpublish}
              disabled={!form || unpublishForm.isPending}
              variant="outline"
            >
              <IconArchive />
              Unpublish
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">Style Direction</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Dark tactical surfaces, signal red actions, mint highlights, compressed cards, and
            readable form controls for repeated creator work.
          </p>
        </div>
      </aside>
    </main>
  );
}

function FormListButton({
  form,
  active,
  onSelect,
}: {
  form: FormSummary;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`w-full rounded-md border p-3 text-left transition ${
        active ? "border-primary bg-primary/10" : "bg-background/30 hover:bg-accent/10"
      }`}
      type="button"
      onClick={onSelect}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium">{form.title}</p>
        <Badge variant={form.status === "PUBLISHED" ? "default" : "outline"}>{form.status}</Badge>
      </div>
      <p className="mt-1 truncate text-xs text-muted-foreground">/{form.slug}</p>
    </button>
  );
}

function PreviewInput({
  type,
  options,
}: {
  type: string;
  options: Array<{ id: string; label: string; value: string }>;
}) {
  if (type === "LONG_TEXT") return <Textarea placeholder="Long answer" rows={3} />;
  if (type === "SELECT") {
    return (
      <Select>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose one" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (type === "RATING") {
    return (
      <div className="flex gap-1 text-primary">
        {"★★★★★".split("").map((star, index) => (
          <span key={index}>{star}</span>
        ))}
      </div>
    );
  }
  if (type === "CHECKBOX" || type === "YES_NO") return <Input type="checkbox" className="size-5" />;
  return <Input placeholder={type === "EMAIL" ? "agent@example.com" : "Answer"} />;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-background/35 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="truncate text-sm font-medium">{value}</span>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
      {message}
    </div>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
