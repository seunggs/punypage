import { createFileRoute } from '@tanstack/react-router';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <ResetPasswordForm />
    </div>
  );
}
