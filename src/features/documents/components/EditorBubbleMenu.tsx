import { Editor, useEditorState } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3 } from 'lucide-react';

interface EditorBubbleMenuProps {
  editor: Editor;
}

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  const { isBold, isItalic, isStrike, isCode, isH1, isH2, isH3 } = useEditorState({
    editor,
    selector: (ctx) => ({
      isBold: ctx.editor.isActive('bold'),
      isItalic: ctx.editor.isActive('italic'),
      isStrike: ctx.editor.isActive('strike'),
      isCode: ctx.editor.isActive('code'),
      isH1: ctx.editor.isActive('heading', { level: 1 }),
      isH2: ctx.editor.isActive('heading', { level: 2 }),
      isH3: ctx.editor.isActive('heading', { level: 3 }),
    }),
  });

  return (
    <BubbleMenu editor={editor} options={{ placement: 'top', offset: 8 }}>
      <div className="flex items-center gap-1 rounded-lg border bg-background p-1 shadow-md">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-accent ${isBold ? 'bg-secondary' : ''}`}
          type="button"
        >
          <Bold className="h-4 w-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-accent ${isItalic ? 'bg-secondary' : ''}`}
          type="button"
        >
          <Italic className="h-4 w-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-accent ${isStrike ? 'bg-secondary' : ''}`}
          type="button"
        >
          <Strikethrough className="h-4 w-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-accent ${isCode ? 'bg-secondary' : ''}`}
          type="button"
        >
          <Code className="h-4 w-4" />
        </button>

        <div className="mx-1 h-6 w-px bg-border" />

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-accent ${isH1 ? 'bg-secondary' : ''}`}
          type="button"
        >
          <Heading1 className="h-4 w-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-accent ${isH2 ? 'bg-secondary' : ''}`}
          type="button"
        >
          <Heading2 className="h-4 w-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-accent ${isH3 ? 'bg-secondary' : ''}`}
          type="button"
        >
          <Heading3 className="h-4 w-4" />
        </button>
      </div>
    </BubbleMenu>
  );
}
