import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useUpdatePassword } from '../hooks/useUpdatePassword';
import { PASSWORD_MIN_LENGTH, PASSWORD_VALIDATION } from '../constants';

export function UpdatePasswordForm() {
  const navigate = useNavigate();
  const updatePassword = useUpdatePassword();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < PASSWORD_MIN_LENGTH) {
      setError(PASSWORD_VALIDATION.errorMessage);
      return;
    }

    try {
      await updatePassword.mutateAsync({ password: formData.password });
      // Navigate to sign in or home
      navigate({ to: '/sign-in' });
    } catch (error) {
      console.error('Update password error:', error);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Update password</CardTitle>
        <CardDescription>
          Enter your new password
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
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
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="••••••••"
              required
              minLength={PASSWORD_MIN_LENGTH}
            />
          </div>
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}
          {updatePassword.isError && (
            <div className="text-sm text-red-600">
              {updatePassword.error?.message || 'Failed to update password. Please try again.'}
            </div>
          )}
          {updatePassword.isSuccess && (
            <div className="text-sm text-green-600">
              Password updated successfully! Redirecting...
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={updatePassword.isPending}>
            {updatePassword.isPending ? 'Updating...' : 'Update password'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
