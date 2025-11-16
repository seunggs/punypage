import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearch } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useSignIn } from '../hooks/useSignIn';
import { useAuth } from '../hooks/useAuth';

export function SignInForm() {
  const navigate = useNavigate();
  const signIn = useSignIn();
  const { isAuthenticated } = useAuth();
  const search = useSearch({ from: '/sign-in' }) as { redirect?: string };
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Navigate when authentication succeeds
  useEffect(() => {
    if (isAuthenticated && signIn.isSuccess) {
      const redirectTo = search.redirect || '/';
      navigate({ to: redirectTo });
    }
  }, [isAuthenticated, signIn.isSuccess, navigate, search.redirect]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn.mutate(formData);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>
          {signIn.isError && (
            <div className="text-sm text-red-600">
              {signIn.error?.message || 'Failed to sign in. Please check your credentials.'}
            </div>
          )}
          <div className="text-sm">
            <button
              type="button"
              onClick={() => navigate({ to: '/reset-password' })}
              className="text-blue-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-4">
          <Button type="submit" className="w-full" disabled={signIn.isPending}>
            {signIn.isPending ? 'Signing in...' : 'Sign in'}
          </Button>
          <div className="text-sm text-center">
            Don't have an account?{' '}
            <Link to="/sign-up" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
