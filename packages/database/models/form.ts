import { text } from "drizzle-orm/pg-core";
import { numeric } from "drizzle-orm/pg-core";
import { unique } from "drizzle-orm/pg-core";
import { boolean } from "drizzle-orm/pg-core";
import { timestamp } from "drizzle-orm/pg-core";
import { pgTable, uuid, varchar, pgEnum } from "drizzle-orm/pg-core";


export const formTable = pgTable("forms", {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 60 }).notNull(),
    description: text("description"), // Text Because we support rich text here
    posterUrl: varchar("poster_url", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
})


export const fieldTypeEnum = pgEnum("field_type", ['Text', 'NUMBER', 'EMAIL', 'YES_NO', 'PASSWORD'])

export const formFieldsTable = pgTable("form_fields", {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id").notNull().references(() => formTable.id),
    lable: varchar("label", { length: 100 }).notNull(),
    lableKey: varchar("label_key", { length: 100 }).notNull(), // slug
    placeholder: text("placeholder"),
    isRequired: boolean("is_required").notNull(),
    index: numeric("index", { scale: 2 }).notNull(),
    type: fieldTypeEnum("type").notNull(),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),

}, (table) => {
    return {
        uniqeFormIdIndex: unique().on(table.formId, table.index)
    }
})
