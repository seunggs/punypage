import { createFileRoute } from '@tanstack/react-router';
import { UpdatePasswordForm } from '@/features/auth/components/UpdatePasswordForm';

export const Route = createFileRoute('/update-password')({
  component: UpdatePasswordPage,
});

function UpdatePasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <UpdatePasswordForm />
    </div>
  );
}
