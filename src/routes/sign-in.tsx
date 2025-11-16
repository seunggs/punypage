import { createFileRoute } from '@tanstack/react-router';
import { SignInForm } from '@/features/auth/components/SignInForm';
import { redirectIfAuthenticated } from '@/features/auth/utils/routeProtection';

export const Route = createFileRoute('/sign-in')({
  beforeLoad: redirectIfAuthenticated,
  component: SignInPage,
});

function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <SignInForm />
    </div>
  );
}
