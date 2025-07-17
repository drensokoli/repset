'use client';

import { signIn, getProviders } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dumbbell, Mail, Chrome } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getProviders();
        console.log('Fetched providers:', result);
        
        if (!result?.google) {
          console.warn('Google provider not found in:', result);
          setError('Google Sign In is not properly configured');
        }
      } catch (error) {
        console.error('Error fetching providers:', error);
        setError('Failed to load sign-in options');
        toast.error('Failed to load sign-in options');
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await signIn('email', { 
        email, 
        callbackUrl: '/',
        redirect: false
      });
      
      if (result?.error) {
        toast.error('Failed to sign in with email');
      } else {
        toast.success('Check your email for the sign-in link');
      }
    } catch (error) {
      console.error('Email sign in error:', error);
      toast.error('Failed to sign in with email');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signIn('google', { 
        callbackUrl: '/',
        redirect: true
      });
    } catch (error) {
      console.error('Google sign in error:', error);
      toast.error('Failed to sign in with Google');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Dumbbell className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to RepSet</CardTitle>
          <CardDescription>
            Sign in to start planning your workouts and achieving your fitness goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email Sign In */}
          <form onSubmit={handleEmailSignIn} className="space-y-3">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              <Mail className="w-4 h-4 mr-2" />
              Sign in with Email
            </Button>
          </form>

          <Separator />

          {/* Social Providers */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={loading || !!error}
            >
              <Chrome className="w-4 h-4 mr-2" />
              Continue with Google
            </Button>
          </div>

          {loading && (
            <p className="text-center text-sm text-blue-600">
              Loading sign-in options...
            </p>
          )}

          {error && (
            <p className="text-center text-sm text-red-600">
              {error}
            </p>
          )}

          <p className="text-xs text-center text-gray-600 dark:text-gray-400">
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}