import { createFileRoute } from '@tanstack/react-router';
import { SignUpForm } from '@/features/auth/components/SignUpForm';
import { redirectIfAuthenticated } from '@/features/auth/utils/routeProtection';

export const Route = createFileRoute('/sign-up')({
  beforeLoad: redirectIfAuthenticated,
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <SignUpForm />
    </div>
  );
}
