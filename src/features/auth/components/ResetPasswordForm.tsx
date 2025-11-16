import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useResetPassword } from '../hooks/useResetPassword';

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const resetPassword = useResetPassword();
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await resetPassword.mutateAsync({ email });
      // Show success message
    } catch (error) {
      console.error('Reset password error:', error);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you a link to reset your password
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          {resetPassword.isError && (
            <div className="text-sm text-red-600">
              {resetPassword.error?.message || 'Failed to send reset email. Please try again.'}
            </div>
          )}
          {resetPassword.isSuccess && (
            <div className="text-sm text-green-600">
              Success! Check your email for a password reset link.
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={resetPassword.isPending}>
            {resetPassword.isPending ? 'Sending...' : 'Send reset link'}
          </Button>
          <div className="text-sm text-center">
            Remember your password?{' '}
            <button
              type="button"
              onClick={() => navigate({ to: '/sign-in' })}
              className="text-blue-600 hover:underline"
            >
              Sign in
            </button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
