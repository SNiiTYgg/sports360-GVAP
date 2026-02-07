/**
 * Auth Page - campus360
 * 
 * Login and signup page for admin access.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/useTheme';
import { ArrowLeft, Loader2, Moon, Sun } from 'lucide-react';
import { logAdminAction } from '@/lib/adminActivityLog';
import { z } from 'zod';

// Validation schema
const authSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDark, toggleTheme } = useTheme();

  // Check if user is already logged in
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          navigate('/admin');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate('/admin');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateForm = () => {
    try {
      authSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'email') fieldErrors.email = err.message;
          if (err.path[0] === 'password') fieldErrors.password = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isLogin) {
        // Login with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          toast({
            title: 'Login failed',
            description: error.message,
            variant: 'destructive',
          });
          return;
        }

        if (data.user) {
          // Log successful login
          await logAdminAction({
            action: 'update',
            entityType: 'auth',
            featureName: 'admin_login',
            oldValue: null,
            newValue: { email: data.user.email },
            source: 'admin-panel'
          });

          toast({
            title: 'Welcome back!',
            description: 'Successfully logged in.',
          });
          navigate('/admin');
        }
      } else {
        // Sign up with Supabase
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          toast({
            title: 'Sign up failed',
            description: error.message,
            variant: 'destructive',
          });
          return;
        }

        if (data.user) {
          toast({
            title: 'Account created!',
            description: 'Please check your email to verify your account.',
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{isLogin ? 'Login' : 'Sign Up'} | campus360</title>
        <meta name="description" content="Admin login for campus360" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        {/* Header with Back button and Theme toggle */}
        <div className="w-full max-w-sm mb-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-sm bg-card border border-border rounded-lg p-6 shadow-sm">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <img
              src="/logo.png"
              alt="Campus 360 Logo"
              className="h-10 w-10 object-contain"
            />
            <h1 className="text-2xl font-bold">
              campus<span className="text-primary">360</span>
            </h1>
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-center mb-6">
            {isLogin ? 'Admin Login' : 'Create Account'}
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLogin ? 'Logging in...' : 'Creating account...'}
                </>
              ) : (
                isLogin ? 'Login' : 'Sign Up'
              )}
            </Button>
          </form>

        </div>
      </div>
    </>
  );
};

export default Auth;
