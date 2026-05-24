"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import {
    IconBold,
    IconItalic,
    IconStrikethrough,
    IconH1,
    IconH2,
    IconList,
    IconListNumbers,
    IconQuote,
    IconCode,
} from "@tabler/icons-react";

interface TiptapEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function TiptapEditor({ value, onChange, placeholder }: TiptapEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2],
                },
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: "prose prose-invert max-w-none focus:outline-none min-h-[120px] p-3 text-xs text-zinc-100 font-mono",
            },
        },
    });

    // Synchronize editor content when value changes from outside (e.g. initial load)
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    if (!editor) return null;

    return (
        <div className="border border-border bg-[#0F172A] rounded-[3px] overflow-hidden focus-within:ring-1 focus-within:ring-primary">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 border-b border-border bg-[#1E293B] p-1.5">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-1.5 rounded-[2px] transition ${
                        editor.isActive("bold")
                            ? "bg-[#7C3AED] text-white"
                            : "text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#0F172A]"
                    }`}
                    title="Bold"
                >
                    <IconBold className="size-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-1.5 rounded-[2px] transition ${
                        editor.isActive("italic")
                            ? "bg-[#7C3AED] text-white"
                            : "text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#0F172A]"
                    }`}
                    title="Italic"
                >
                    <IconItalic className="size-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={`p-1.5 rounded-[2px] transition ${
                        editor.isActive("strike")
                            ? "bg-[#7C3AED] text-white"
                            : "text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#0F172A]"
                    }`}
                    title="Strikethrough"
                >
                    <IconStrikethrough className="size-3.5" />
                </button>
                
                <span className="h-4 w-[1px] bg-border/50 mx-1" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`p-1.5 rounded-[2px] transition ${
                        editor.isActive("heading", { level: 1 })
                            ? "bg-[#7C3AED] text-white"
                            : "text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#0F172A]"
                    }`}
                    title="Heading 1"
                >
                    <IconH1 className="size-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-1.5 rounded-[2px] transition ${
                        editor.isActive("heading", { level: 2 })
                            ? "bg-[#7C3AED] text-white"
                            : "text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#0F172A]"
                    }`}
                    title="Heading 2"
                >
                    <IconH2 className="size-3.5" />
                </button>

                <span className="h-4 w-[1px] bg-border/50 mx-1" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-1.5 rounded-[2px] transition ${
                        editor.isActive("bulletList")
                            ? "bg-[#7C3AED] text-white"
                            : "text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#0F172A]"
                    }`}
                    title="Bullet List"
                >
                    <IconList className="size-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-1.5 rounded-[2px] transition ${
                        editor.isActive("orderedList")
                            ? "bg-[#7C3AED] text-white"
                            : "text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#0F172A]"
                    }`}
                    title="Numbered List"
                >
                    <IconListNumbers className="size-3.5" />
                </button>

                <span className="h-4 w-[1px] bg-border/50 mx-1" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`p-1.5 rounded-[2px] transition ${
                        editor.isActive("blockquote")
                            ? "bg-[#7C3AED] text-white"
                            : "text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#0F172A]"
                    }`}
                    title="Blockquote"
                >
                    <IconQuote className="size-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    className={`p-1.5 rounded-[2px] transition ${
                        editor.isActive("codeBlock")
                            ? "bg-[#7C3AED] text-white"
                            : "text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#0F172A]"
                    }`}
                    title="Code Block"
                >
                    <IconCode className="size-3.5" />
                </button>
            </div>

            {/* Editor Content */}
            <div className="bg-[#0F172A] border-t-0 min-h-[120px]">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
