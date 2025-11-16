import { useState, useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useSignUp } from '../hooks/useSignUp';
import { PASSWORD_MIN_LENGTH } from '../constants';

export function SignUpForm() {
  const navigate = useNavigate();
  const signUp = useSignUp();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
  });

  // Redirect to sign-in after successful signup
  useEffect(() => {
    if (signUp.isSuccess) {
      const timer = setTimeout(() => {
        navigate({ to: '/sign-in' });
      }, 2000); // Wait 2 seconds to show success message
      return () => clearTimeout(timer);
    }
  }, [signUp.isSuccess, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await signUp.mutateAsync(formData);
    } catch (error) {
      // Error is handled by mutation
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information to create your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="John Doe"
            />
          </div>
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
              minLength={PASSWORD_MIN_LENGTH}
            />
          </div>
          {signUp.isError && (
            <div className="text-sm text-red-600">
              {signUp.error?.message || 'Failed to sign up. Please try again.'}
            </div>
          )}
          {signUp.isSuccess && (
            <div className="text-sm text-green-600">
              Account created successfully! You can now sign in.
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-4">
          <Button type="submit" className="w-full" disabled={signUp.isPending}>
            {signUp.isPending ? 'Creating account...' : 'Sign up'}
          </Button>
          <div className="text-sm text-center">
            Already have an account?{' '}
            <Link to="/sign-in" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
