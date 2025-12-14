import { useEditor, EditorContent } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorBubbleMenu } from './EditorBubbleMenu';

interface EditorProps {
  content: JSONContent | null;
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
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
    ],
    content: content || undefined,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-full p-4',
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate(editor.getJSON());
    },
  });

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
