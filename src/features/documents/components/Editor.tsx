import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect } from 'react';
import type { JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from '@tiptap/markdown';
import { EditorBubbleMenu } from './EditorBubbleMenu';

interface EditorProps {
  content: string | JSONContent | null;
  onUpdate: (content: JSONContent) => void;
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
      onUpdate(editor.getJSON());
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== null) {
      if (typeof content === 'string') {
        // Check if string is JSON or markdown
        try {
          // Try parsing as JSON first
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed === 'object' && parsed.type === 'doc') {
            editor.commands.setContent(parsed);
          } else {
            throw new Error('Not a TipTap JSON document');
          }
        } catch {
          // If not JSON, treat as markdown
          const json = editor.markdown.parse(content);
          editor.commands.setContent(json);
        }
      } else if (typeof content === 'object') {
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
