import { useState, useEffect, type KeyboardEvent } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export interface ChatInputProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
  isInterrupting: boolean;
  onInterrupt: () => void;
}

export function ChatInput({ onSend, isStreaming, isInterrupting, onInterrupt }: ChatInputProps) {
  const [input, setInput] = useState('');

  // ESC key handler for interrupting
  useEffect(() => {
    const handleEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && isStreaming && !isInterrupting) {
        onInterrupt();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isStreaming, isInterrupting, onInterrupt]);

  const handleButtonClick = () => {
    if (isStreaming && !isInterrupting) {
      onInterrupt();
    } else if (!isStreaming && input.trim()) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && input.trim()) {
        onSend(input.trim());
        setInput('');
      }
    }
  };

  return (
    <div className="flex items-center gap-2 p-4 bg-white dark:bg-gray-900">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={isStreaming}
        rows={1}
        className="flex-1 resize-none min-h-10 max-h-[200px] py-2 text-base md:text-base"
      />
      <Button
        onClick={handleButtonClick}
        disabled={isInterrupting || (!isStreaming && !input.trim())}
        className={
          isStreaming
            ? "flex-shrink-0 w-10 h-10 bg-red-500 hover:bg-red-600 rounded-lg"
            : "flex-shrink-0 w-10 h-10 bg-lime-500 hover:bg-lime-600 rounded-lg"
        }
        size="icon"
      >
        {isStreaming ? <Square size={18} /> : <ArrowUp size={18} />}
      </Button>
    </div>
  );
}
