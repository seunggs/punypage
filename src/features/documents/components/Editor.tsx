import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect } from 'react';
import type { JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from '@tiptap/markdown';
import { EditorBubbleMenu } from './EditorBubbleMenu';

interface EditorProps {
  content: string | JSONContent | null;
  onUpdate: (content: string) => void;
}

export function Editor({ content, onUpdate }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: {
          depth: 100,
        },
      }),
      Markdown,
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
    ],
    // Initial content will be set by useEffect to properly parse markdown
    editorProps: {
      attributes: {
        class: 'editor-content max-w-none focus:outline-none min-h-full p-4',
      },
    },
    onUpdate: ({ editor }) => {
      // Convert editor content to markdown before saving
      const markdown = editor.getMarkdown();
      onUpdate(markdown);
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== null) {
      if (typeof content === 'string') {
        // Content from database is markdown - parse it to JSON first
        const json = editor.markdown.parse(content);
        editor.commands.setContent(json);
      } else if (typeof content === 'object') {
        // Legacy JSONContent support
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="h-full w-full">
      <EditorBubbleMenu editor={editor} />
      <EditorContent editor={editor} className="h-full" />
    </div>
  );
}
