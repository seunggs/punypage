import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useCreateDocument } from '../hooks/useCreateDocument';
import { useDocuments } from '../hooks/useDocuments';

interface NewDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Validates a document path
 * @param path - The path to validate
 * @returns An object with isValid boolean and optional error message
 */
function validatePath(path: string): { isValid: boolean; error?: string } {
  if (!path) {
    return { isValid: false, error: 'Path is required' };
  }

  if (!path.startsWith('/')) {
    return { isValid: false, error: 'Path must start with /' };
  }

  // Reject path traversal attempts
  if (path.includes('../') || path.includes('/..')) {
    return { isValid: false, error: 'Path cannot contain ../' };
  }

  // Reject double slashes
  if (path.includes('//')) {
    return { isValid: false, error: 'Path cannot contain //' };
  }

  // Reject null bytes
  if (path.includes('\0')) {
    return { isValid: false, error: 'Path cannot contain null bytes' };
  }

  // Limit path length
  if (path.length > 500) {
    return { isValid: false, error: 'Path too long (max 500 characters)' };
  }

  return { isValid: true };
}

export function NewDocumentDialog({ open, onOpenChange }: NewDocumentDialogProps) {
  const [title, setTitle] = useState('');
  const [path, setPath] = useState('/');
  const [pathOpen, setPathOpen] = useState(false);
  const [pathError, setPathError] = useState<string | null>(null);
  const navigate = useNavigate();
  const createDocument = useCreateDocument();
  const { data: documents } = useDocuments();

  // Extract unique paths from existing documents for suggestions
  const existingPaths = useMemo(() => {
    if (!documents) return ['/'];

    const pathSet = new Set<string>();
    pathSet.add('/'); // Always include root

    documents.forEach((doc) => {
      // Add the document's parent path
      const parentPath = doc.path;
      if (parentPath !== '/') {
        pathSet.add(parentPath);
      }
    });

    return Array.from(pathSet).sort();
  }, [documents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !path.trim()) {
      return;
    }

    // Validate path format
    const validation = validatePath(path.trim());
    if (!validation.isValid) {
      setPathError(validation.error || 'Invalid path');
      return;
    }

    createDocument.mutate(
      {
        title: title.trim(),
        path: path.trim(),
        content: { type: 'doc', content: [] }, // Proper TipTap document structure
      },
      {
        onSuccess: (document) => {
          // Reset form
          setTitle('');
          setPath('/');
          setPathError(null);
          onOpenChange(false);

          // Navigate to new document
          navigate({ to: `/documents/${document.id}` });
        },
        onError: (error) => {
          console.error('Failed to create document:', error);
          // TODO: Show error toast
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Document</DialogTitle>
          <DialogDescription>
            Create a new document. The path will be used for organization.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Document"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="path">Path</Label>
              <Popover open={pathOpen} onOpenChange={setPathOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={pathOpen}
                    className={cn(
                      'w-full justify-between font-normal',
                      pathError && 'border-red-500'
                    )}
                  >
                    <span className="truncate">{path || 'Select or type path...'}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Type or select path..."
                      value={path}
                      onValueChange={(value) => {
                        setPath(value);
                        setPathError(null);
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <div className="p-2 text-sm text-muted-foreground">
                          Type a path (e.g., /AI/LLM) and press Enter
                        </div>
                      </CommandEmpty>
                      <CommandGroup heading="Existing paths">
                        {existingPaths.map((existingPath) => (
                          <CommandItem
                            key={existingPath}
                            value={existingPath}
                            onSelect={(currentValue) => {
                              setPath(currentValue === path ? '/' : currentValue);
                              setPathError(null);
                              setPathOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                path === existingPath ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {existingPath}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {pathError && (
                <p className="text-sm text-red-500">{pathError}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Full path to the document (e.g., /AI/LLM). Folders are derived from document paths.
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createDocument.isPending}>
              {createDocument.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
