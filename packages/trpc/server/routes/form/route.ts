import { TRPCError } from "@trpc/server";
import { and, asc, count, db, desc, eq, inArray, sql } from "@repo/database";
import { randomUUID } from "node:crypto";
import {
  formFieldOptionsTable,
  formFieldsTable,
  formsTable,
  formSubmissionAnswersTable,
  formSubmissionsTable,
} from "@repo/database/models/form";

import { authenticatedProcedure, publicProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import {
  analyticsOutputModel,
  createFieldInputModel,
  createFormInputModel,
  deleteFieldInputModel,
  formFieldOutputModel,
  formIdInputModel,
  formOutputModel,
  getPublicFormInputModel,
  listFormsInputModel,
  listFormsOutputModel,
  listPublicFormsInputModel,
  listPublicFormsOutputModel,
  listResponsesOutputModel,
  publicFormOutputModel,
  publishFormInputModel,
  responseListInputModel,
  submitFormInputModel,
  submitFormOutputModel,
  updateFieldInputModel,
  updateFormInputModel,
} from "./model";

const TAGS = ["Forms"];
const getPath = generatePath("/forms");
const DEFAULT_SUBMISSION_LIMIT = 100;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 12;

const submissionAttempts = new Map<string, { count: number; resetAt: number }>();

type AnswerValue = string | number | boolean | string[] | null;
type FieldType =
  | "TEXT"
  | "LONG_TEXT"
  | "NUMBER"
  | "EMAIL"
  | "YES_NO"
  | "CHECKBOX"
  | "FILE_URL"
  | "SELECT"
  | "DATE"
  | "RATING";
type SelectMode = "SINGLE" | "MULTIPLE" | null;

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function normalizeKey(value: string) {
  return slugify(value).replace(/-/g, "_");
}

function assertRateLimit(key: string) {
  const now = Date.now();
  const current = submissionAttempts.get(key);

  if (!current || current.resetAt <= now) {
    submissionAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return;
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many submissions. Please wait a minute and try again.",
    });
  }

  current.count += 1;
}

async function createUniqueSlug(title: string, requestedSlug?: string) {
  const baseSlug = slugify(requestedSlug ?? title) || randomUUID().slice(0, 8);
  let candidate = baseSlug;
  let suffix = 1;

  while (true) {
    const [existing] = await db
      .select({ id: formsTable.id })
      .from(formsTable)
      .where(eq(formsTable.slug, candidate))
      .limit(1);

    if (!existing) return candidate;

    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }
}

async function ensureCreatorForm(formId: string, ownerId: string) {
  const [form] = await db
    .select()
    .from(formsTable)
    .where(and(eq(formsTable.id, formId), eq(formsTable.ownerId, ownerId)))
    .limit(1);

  if (!form) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Form not found or you do not have access to it.",
    });
  }

  return form;
}

function mapOption(option: typeof formFieldOptionsTable.$inferSelect) {
  return {
    id: option.id,
    label: option.label,
    value: option.value,
    order: option.order,
    isDefault: option.isDefault,
  };
}

function mapField(
  field: typeof formFieldsTable.$inferSelect,
  options: Array<typeof formFieldOptionsTable.$inferSelect>,
) {
  return {
    id: field.id,
    formId: field.formId,
    label: field.label,
    labelKey: field.labelKey,
    description: field.description,
    placeholder: field.placeholder,
    isRequired: field.isRequired,
    order: field.order,
    type: field.type,
    selectMode: field.selectMode,
    validation: field.validation,
    metadata: field.metadata,
    options: options.map(mapOption),
  };
}

function mapForm(form: typeof formsTable.$inferSelect, fields: ReturnType<typeof mapField>[] = []) {
  return {
    id: form.id,
    ownerId: form.ownerId,
    title: form.title,
    description: form.description,
    posterUrl: form.posterUrl,
    status: form.status,
    visibility: form.visibility,
    slug: form.slug,
    isAcceptingSubmissions: form.isAcceptingSubmissions,
    submissionLimit: form.submissionLimit,
    submissionCount: form.submissionCount,
    publishedAt: toIso(form.publishedAt),
    createdAt: toIso(form.createdAt),
    updatedAt: toIso(form.updatedAt),
    fields,
  };
}

async function getFormFields(formId: string) {
  const fields = await db
    .select()
    .from(formFieldsTable)
    .where(eq(formFieldsTable.formId, formId))
    .orderBy(asc(formFieldsTable.order));

  if (fields.length === 0) return [];

  const options = await db
    .select()
    .from(formFieldOptionsTable)
    .where(
      inArray(
        formFieldOptionsTable.fieldId,
        fields.map((field) => field.id),
      ),
    )
    .orderBy(asc(formFieldOptionsTable.order));

  return fields.map((field) =>
    mapField(
      field,
      options.filter((option) => option.fieldId === field.id),
    ),
  );
}

function validateAnswer(field: ReturnType<typeof mapField>, value: AnswerValue) {
  const validation = field.validation as {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    minSelected?: number;
    maxSelected?: number;
  };

  const hasEmptyValue =
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0) ||
    typeof value === "undefined";

  if (field.isRequired && hasEmptyValue) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${field.label} is required.`,
    });
  }

  if (hasEmptyValue) return null;

  switch (field.type as FieldType) {
    case "TEXT":
    case "LONG_TEXT": {
      if (typeof value !== "string") {
        throw new TRPCError({ code: "BAD_REQUEST", message: `${field.label} must be text.` });
      }
      if (validation.minLength && value.length < validation.minLength) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${field.label} must have at least ${validation.minLength} characters.`,
        });
      }
      if (validation.maxLength && value.length > validation.maxLength) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${field.label} must have at most ${validation.maxLength} characters.`,
        });
      }
      return value;
    }
    case "EMAIL": {
      if (typeof value !== "string" || !/^\S+@\S+\.\S+$/.test(value)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `${field.label} must be an email.` });
      }
      return value;
    }
    case "FILE_URL": {
      if (typeof value !== "string") {
        throw new TRPCError({ code: "BAD_REQUEST", message: `${field.label} must be a URL.` });
      }
      try {
        new URL(value);
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${field.label} must be a valid URL.`,
        });
      }
      return value;
    }
    case "DATE": {
      if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `${field.label} must be a date.` });
      }
      return value;
    }
    case "NUMBER":
    case "RATING": {
      if (typeof value !== "number" || Number.isNaN(value)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `${field.label} must be a number.` });
      }
      const min = validation.min ?? (field.type === "RATING" ? 1 : undefined);
      const max = validation.max ?? (field.type === "RATING" ? 5 : undefined);

      if (typeof min === "number" && value < min) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${field.label} must be at least ${min}.`,
        });
      }
      if (typeof max === "number" && value > max) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${field.label} must be at most ${max}.`,
        });
      }
      return value;
    }
    case "YES_NO":
    case "CHECKBOX": {
      if (typeof value !== "boolean") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${field.label} must be true or false.`,
        });
      }
      return value;
    }
    case "SELECT": {
      const allowedValues = new Set(field.options.map((option) => option.value));

      if ((field.selectMode as SelectMode) === "MULTIPLE") {
        if (!Array.isArray(value) || value.some((item) => !allowedValues.has(item))) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `${field.label} contains an invalid option.`,
          });
        }
        if (validation.minSelected && value.length < validation.minSelected) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `${field.label} needs at least ${validation.minSelected} option(s).`,
          });
        }
        if (validation.maxSelected && value.length > validation.maxSelected) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `${field.label} allows at most ${validation.maxSelected} option(s).`,
          });
        }
        return value;
      }

      if (typeof value !== "string" || !allowedValues.has(value)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${field.label} contains an invalid option.`,
        });
      }
      return value;
    }
    default:
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `${field.label} has an unsupported type.`,
      });
  }
}

async function replaceOptions(
  fieldId: string,
  options: Array<typeof formFieldOptionsTable.$inferInsert>,
) {
  await db.delete(formFieldOptionsTable).where(eq(formFieldOptionsTable.fieldId, fieldId));

  if (options.length > 0) {
    await db.insert(formFieldOptionsTable).values(options);
  }
}

export const formRouter = router({
  listMine: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/mine"), tags: TAGS } })
    .input(listFormsInputModel)
    .output(listFormsOutputModel)
    .query(async ({ input, ctx }) => {
      const conditions = [eq(formsTable.ownerId, ctx.user.id)];

      if (input?.status) conditions.push(eq(formsTable.status, input.status));
      if (input?.visibility) conditions.push(eq(formsTable.visibility, input.visibility));

      const forms = await db
        .select()
        .from(formsTable)
        .where(and(...conditions))
        .orderBy(desc(formsTable.createdAt))
        .limit(input?.limit ?? 50);

      return forms.map((form) => {
        const { fields, ...rest } = mapForm(form);
        return rest;
      });
    }),

  getMineById: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/mine/get"), tags: TAGS } })
    .input(formIdInputModel)
    .output(formOutputModel)
    .query(async ({ input, ctx }) => {
      const form = await ensureCreatorForm(input.id, ctx.user.id);
      const fields = await getFormFields(form.id);
      return mapForm(form, fields);
    }),

  create: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/create"), tags: TAGS } })
    .input(createFormInputModel)
    .output(formOutputModel)
    .mutation(async ({ input, ctx }) => {
      const slug = await createUniqueSlug(input.title, input.slug);
      const [form] = await db
        .insert(formsTable)
        .values({
          ownerId: ctx.user.id,
          title: input.title,
          description: input.description,
          posterUrl: input.posterUrl,
          slug,
          visibility: input.visibility ?? "UNLISTED",
          submissionLimit: input.submissionLimit ?? DEFAULT_SUBMISSION_LIMIT,
        })
        .returning();

      if (!form) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to create form." });
      }

      for (const field of input.fields ?? []) {
        const [createdField] = await db
          .insert(formFieldsTable)
          .values({
            formId: form.id,
            label: field.label,
            labelKey: field.labelKey ?? normalizeKey(field.label),
            description: field.description,
            placeholder: field.placeholder,
            isRequired: field.isRequired ?? false,
            order: field.order,
            type: field.type,
            selectMode: field.type === "SELECT" ? (field.selectMode ?? "SINGLE") : null,
            validation: field.validation ?? {},
            metadata: field.metadata ?? {},
          })
          .returning();

        if (createdField && field.options && field.options.length > 0) {
          await db.insert(formFieldOptionsTable).values(
            field.options.map((option) => ({
              fieldId: createdField.id,
              label: option.label,
              value: option.value,
              order: option.order,
              isDefault: option.isDefault ?? false,
            })),
          );
        }
      }

      const fields = await getFormFields(form.id);
      return mapForm(form, fields);
    }),

  update: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/update"), tags: TAGS } })
    .input(updateFormInputModel)
    .output(formOutputModel)
    .mutation(async ({ input, ctx }) => {
      await ensureCreatorForm(input.id, ctx.user.id);

      const updatePayload: Partial<typeof formsTable.$inferInsert> = {};

      if (input.title !== undefined) updatePayload.title = input.title;
      if (input.description !== undefined) updatePayload.description = input.description;
      if (input.posterUrl !== undefined) updatePayload.posterUrl = input.posterUrl;
      if (input.visibility !== undefined) updatePayload.visibility = input.visibility;
      if (input.submissionLimit !== undefined)
        updatePayload.submissionLimit = input.submissionLimit;
      if (input.slug !== undefined) updatePayload.slug = slugify(input.slug);

      const [updatedForm] = await db
        .update(formsTable)
        .set(updatePayload)
        .where(and(eq(formsTable.id, input.id), eq(formsTable.ownerId, ctx.user.id)))
        .returning();

      if (!updatedForm) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to update form." });
      }

      const fields = await getFormFields(updatedForm.id);
      return mapForm(updatedForm, fields);
    }),

  publish: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/publish"), tags: TAGS } })
    .input(publishFormInputModel)
    .output(formOutputModel)
    .mutation(async ({ input, ctx }) => {
      await ensureCreatorForm(input.id, ctx.user.id);

      const [form] = await db
        .update(formsTable)
        .set({
          status: "PUBLISHED",
          ...(input.visibility ? { visibility: input.visibility } : {}),
          isAcceptingSubmissions: true,
          publishedAt: new Date(),
        })
        .where(and(eq(formsTable.id, input.id), eq(formsTable.ownerId, ctx.user.id)))
        .returning();

      if (!form)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to publish form." });

      return mapForm(form, await getFormFields(form.id));
    }),

  unpublish: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/unpublish"), tags: TAGS } })
    .input(formIdInputModel)
    .output(formOutputModel)
    .mutation(async ({ input, ctx }) => {
      await ensureCreatorForm(input.id, ctx.user.id);

      const [form] = await db
        .update(formsTable)
        .set({ status: "DRAFT", isAcceptingSubmissions: false })
        .where(and(eq(formsTable.id, input.id), eq(formsTable.ownerId, ctx.user.id)))
        .returning();

      if (!form)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to unpublish form.",
        });

      return mapForm(form, await getFormFields(form.id));
    }),

  archive: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/archive"), tags: TAGS } })
    .input(formIdInputModel)
    .output(formOutputModel)
    .mutation(async ({ input, ctx }) => {
      await ensureCreatorForm(input.id, ctx.user.id);

      const [form] = await db
        .update(formsTable)
        .set({ status: "ARCHIVED", isAcceptingSubmissions: false })
        .where(and(eq(formsTable.id, input.id), eq(formsTable.ownerId, ctx.user.id)))
        .returning();

      if (!form)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to archive form." });

      return mapForm(form, await getFormFields(form.id));
    }),

  createField: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/fields/create"), tags: TAGS } })
    .input(createFieldInputModel)
    .output(formFieldOutputModel)
    .mutation(async ({ input, ctx }) => {
      await ensureCreatorForm(input.formId, ctx.user.id);

      const [field] = await db
        .insert(formFieldsTable)
        .values({
          formId: input.formId,
          label: input.label,
          labelKey: input.labelKey ?? normalizeKey(input.label),
          description: input.description,
          placeholder: input.placeholder,
          isRequired: input.isRequired ?? false,
          order: input.order,
          type: input.type,
          selectMode: input.type === "SELECT" ? (input.selectMode ?? "SINGLE") : null,
          validation: input.validation ?? {},
          metadata: input.metadata ?? {},
        })
        .returning();

      if (!field)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to create field." });

      if (input.options && input.options.length > 0) {
        await db.insert(formFieldOptionsTable).values(
          input.options.map((option) => ({
            fieldId: field.id,
            label: option.label,
            value: option.value,
            order: option.order,
            isDefault: option.isDefault ?? false,
          })),
        );
      }

      const created = (await getFormFields(input.formId)).find((item) => item.id === field.id);

      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to load created field.",
        });
      }

      return created;
    }),

  updateField: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/fields/update"), tags: TAGS } })
    .input(updateFieldInputModel)
    .output(formFieldOutputModel)
    .mutation(async ({ input, ctx }) => {
      await ensureCreatorForm(input.formId, ctx.user.id);

      const updatePayload: Partial<typeof formFieldsTable.$inferInsert> = {};

      if (input.label !== undefined) updatePayload.label = input.label;
      if (input.labelKey !== undefined) updatePayload.labelKey = input.labelKey;
      if (input.description !== undefined) updatePayload.description = input.description;
      if (input.placeholder !== undefined) updatePayload.placeholder = input.placeholder;
      if (input.isRequired !== undefined) updatePayload.isRequired = input.isRequired;
      if (input.order !== undefined) updatePayload.order = input.order;
      if (input.type !== undefined) updatePayload.type = input.type;
      if (input.selectMode !== undefined) updatePayload.selectMode = input.selectMode;
      if (input.validation !== undefined) updatePayload.validation = input.validation;
      if (input.metadata !== undefined) updatePayload.metadata = input.metadata;

      const [field] = await db
        .update(formFieldsTable)
        .set(updatePayload)
        .where(and(eq(formFieldsTable.id, input.id), eq(formFieldsTable.formId, input.formId)))
        .returning();

      if (!field) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Field not found." });
      }

      if (input.options) {
        await replaceOptions(
          field.id,
          input.options.map((option) => ({
            fieldId: field.id,
            label: option.label,
            value: option.value,
            order: option.order,
            isDefault: option.isDefault ?? false,
          })),
        );
      }

      const updated = (await getFormFields(input.formId)).find((item) => item.id === field.id);

      if (!updated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to load updated field.",
        });
      }

      return updated;
    }),

  deleteField: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/fields/delete"), tags: TAGS } })
    .input(deleteFieldInputModel)
    .output(formFieldOutputModel)
    .mutation(async ({ input, ctx }) => {
      await ensureCreatorForm(input.formId, ctx.user.id);

      const existing = (await getFormFields(input.formId)).find((field) => field.id === input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Field not found." });

      const [answerCount] = await db
        .select({ value: count() })
        .from(formSubmissionAnswersTable)
        .where(eq(formSubmissionAnswersTable.fieldId, input.id));

      if ((answerCount?.value ?? 0) > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "This field already has responses. Archive or clone the form before removing it.",
        });
      }

      await db.delete(formFieldOptionsTable).where(eq(formFieldOptionsTable.fieldId, input.id));
      await db
        .delete(formFieldsTable)
        .where(and(eq(formFieldsTable.id, input.id), eq(formFieldsTable.formId, input.formId)));

      return existing;
    }),

  getPublicBySlug: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/public/get"), tags: TAGS } })
    .input(getPublicFormInputModel)
    .output(publicFormOutputModel)
    .query(async ({ input }) => {
      const [form] = await db
        .select()
        .from(formsTable)
        .where(eq(formsTable.slug, input.slug))
        .limit(1);

      if (!form || form.status !== "PUBLISHED" || !form.isAcceptingSubmissions) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This form is unavailable, unpublished, or no longer accepting responses.",
        });
      }

      const { ownerId, status, isAcceptingSubmissions, ...publicForm } = mapForm(
        form,
        await getFormFields(form.id),
      );

      return publicForm;
    }),

  explorePublic: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/public/explore"), tags: TAGS } })
    .input(listPublicFormsInputModel)
    .output(listPublicFormsOutputModel)
    .query(async ({ input }) => {
      const forms = await db
        .select()
        .from(formsTable)
        .where(
          and(
            eq(formsTable.status, "PUBLISHED"),
            eq(formsTable.visibility, "PUBLIC"),
            eq(formsTable.isAcceptingSubmissions, true),
          ),
        )
        .orderBy(desc(formsTable.publishedAt))
        .limit(input?.limit ?? 24);

      return forms.map((form) => {
        const { ownerId, status, isAcceptingSubmissions, fields, ...publicForm } = mapForm(form);
        return publicForm;
      });
    }),

  submitPublic: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/public/submit"), tags: TAGS } })
    .input(submitFormInputModel)
    .output(submitFormOutputModel)
    .mutation(async ({ input, ctx }) => {
      assertRateLimit(`${ctx.ip}:${input.slug}`);

      if (input.honeypot) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Submission rejected." });
      }

      const [form] = await db
        .select()
        .from(formsTable)
        .where(eq(formsTable.slug, input.slug))
        .limit(1);

      if (!form || form.status !== "PUBLISHED" || !form.isAcceptingSubmissions) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This form is unavailable, unpublished, or no longer accepting responses.",
        });
      }

      if (form.submissionLimit !== null && form.submissionCount >= form.submissionLimit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This form has reached its response limit.",
        });
      }

      const fields = await getFormFields(form.id);
      const answerMap = new Map(input.answers.map((answer) => [answer.fieldKey, answer.value]));
      const validatedAnswers = fields.map((field) => ({
        field,
        value: validateAnswer(field, answerMap.get(field.labelKey) ?? null),
      }));

      const [submission] = await db
        .insert(formSubmissionsTable)
        .values({
          formId: form.id,
          respondentEmail: input.respondentEmail,
          metadata: {
            ip: ctx.ip,
            userAgent: ctx.userAgent,
          },
        })
        .returning();

      if (!submission) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to submit form." });
      }

      const answerRows = validatedAnswers
        .filter((answer) => answer.value !== null)
        .map((answer) => ({
          submissionId: submission.id,
          fieldId: answer.field.id,
          fieldKey: answer.field.labelKey,
          value: answer.value,
        }));

      if (answerRows.length > 0) {
        await db.insert(formSubmissionAnswersTable).values(answerRows);
      }

      await db
        .update(formsTable)
        .set({ submissionCount: sql`${formsTable.submissionCount} + 1` })
        .where(eq(formsTable.id, form.id));

      return {
        submissionId: submission.id,
        message: "Thanks for submitting the form.",
      };
    }),

  listResponses: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/responses"), tags: TAGS } })
    .input(responseListInputModel)
    .output(listResponsesOutputModel)
    .query(async ({ input, ctx }) => {
      await ensureCreatorForm(input.formId, ctx.user.id);

      const submissions = await db
        .select()
        .from(formSubmissionsTable)
        .where(eq(formSubmissionsTable.formId, input.formId))
        .orderBy(desc(formSubmissionsTable.submittedAt))
        .limit(input.limit ?? 50);

      if (submissions.length === 0) return [];

      const answers = await db
        .select()
        .from(formSubmissionAnswersTable)
        .where(
          inArray(
            formSubmissionAnswersTable.submissionId,
            submissions.map((submission) => submission.id),
          ),
        );

      return submissions.map((submission) => ({
        id: submission.id,
        formId: submission.formId,
        respondentEmail: submission.respondentEmail,
        status: submission.status,
        submittedAt: toIso(submission.submittedAt),
        answers: answers
          .filter((answer) => answer.submissionId === submission.id)
          .map((answer) => ({
            fieldId: answer.fieldId,
            fieldKey: answer.fieldKey,
            value: answer.value,
          })),
      }));
    }),

  analytics: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/analytics"), tags: TAGS } })
    .input(responseListInputModel.pick({ formId: true }))
    .output(analyticsOutputModel)
    .query(async ({ input, ctx }) => {
      const form = await ensureCreatorForm(input.formId, ctx.user.id);

      const [total] = await db
        .select({ value: count() })
        .from(formSubmissionsTable)
        .where(eq(formSubmissionsTable.formId, form.id));

      const rows = await db
        .select({
          date: sql<string>`to_char(${formSubmissionsTable.submittedAt}, 'YYYY-MM-DD')`,
          value: count(),
        })
        .from(formSubmissionsTable)
        .where(eq(formSubmissionsTable.formId, form.id))
        .groupBy(sql`to_char(${formSubmissionsTable.submittedAt}, 'YYYY-MM-DD')`)
        .orderBy(sql`to_char(${formSubmissionsTable.submittedAt}, 'YYYY-MM-DD')`);

      const totalSubmissions = total?.value ?? 0;

      return {
        formId: form.id,
        totalSubmissions,
        completionRate: totalSubmissions > 0 ? 1 : 0,
        responseLimit: form.submissionLimit,
        remainingResponses:
          form.submissionLimit === null
            ? null
            : Math.max(form.submissionLimit - totalSubmissions, 0),
        responsesByDay: rows.map((row) => ({
          date: row.date,
          count: row.value,
        })),
      };
    }),
});
