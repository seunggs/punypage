import { createFileRoute } from '@tanstack/react-router';
import { DocumentSearchPage } from '@/features/documents/components/DocumentSearchPage';

export const Route = createFileRoute('/documents/')({
  component: DocumentSearchPage,
});
