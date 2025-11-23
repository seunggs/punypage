import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
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
import { useCreateDocument } from '../hooks/useCreateDocument';

interface NewDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewDocumentDialog({ open, onOpenChange }: NewDocumentDialogProps) {
  const [title, setTitle] = useState('');
  const [path, setPath] = useState('/');
  const navigate = useNavigate();
  const createDocument = useCreateDocument();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !path.trim()) {
      return;
    }

    createDocument.mutate(
      {
        title: title.trim(),
        path: path.trim(),
        content: '',
      },
      {
        onSuccess: (document) => {
          // Reset form
          setTitle('');
          setPath('/');
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
              <Input
                id="path"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/projects/readme.md"
              />
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
