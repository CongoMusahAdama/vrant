import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { sweetAuthSuccess, sweetError } from '@/lib/sweet-alert';
import type { AuthUser } from '@/types/customer';

/** Full-screen photo behind the sign-in / sign-up card */
const AUTH_BACKGROUND = '/lookbook/look-26.jpg';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, user: AuthUser) => void | Promise<void>;
  initialMode?: 'login' | 'register';
  /** When true, stay on current page (checkout, wishlist). Default: go to account/admin after auth */
  stayOnPage?: boolean;
}

const emptyForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
};

function getApiErrorMessage(data: { message?: string; errors?: { msg: string }[] }, fallback: string) {
  if (data.message) return data.message;
  if (Array.isArray(data.errors) && data.errors[0]?.msg) return data.errors[0].msg;
  return fallback;
}

function dashboardPathForUser(user: { role?: string }) {
  return user?.role === 'admin' ? '/admin' : '/account';
}

const AuthModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  stayOnPage = false,
}: AuthModalProps) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  /** "Forgot password" mode: email-only form that requests a reset link */
  const [forgot, setForgot] = useState(false);
  const [notice, setNotice] = useState('');

  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (isOpen) {
      setIsLogin(initialMode === 'login');
      setError('');
      setForgot(false);
      setNotice('');
    }
  }, [isOpen, initialMode]);

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email?.trim()) {
      setError('Please enter your email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<{ success: boolean; message: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: formData.email.trim() }),
      });
      setNotice(data.message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not send reset link');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const validateForm = () => {
    if (!formData.email?.trim() || !formData.password) {
      setError('Please fill in all required fields');
      return false;
    }

    if (!isLogin && !formData.name?.trim()) {
      setError('Please enter your name');
      return false;
    }

    if (!isLogin && !formData.confirmPassword) {
      setError('Please confirm your password');
      return false;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (!isLogin && !formData.phone?.trim()) {
      setError('Please enter your phone number');
      return false;
    }

    if (!isLogin && !/^\+?[\d\s-()]{7,20}$/.test(formData.phone.trim())) {
      setError('Please enter a valid phone number');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin
        ? { email: formData.email.trim(), password: formData.password }
        : {
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
            phone: formData.phone.trim(),
          };

      const data = await apiFetch<{
        success: boolean;
        message?: string;
        errors?: { msg: string }[];
        data: { token: string; user: AuthUser };
      }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!data.success) {
        throw new Error(getApiErrorMessage(data, 'Authentication failed'));
      }

      const authedUser = data.data.user;
      await onSuccess(data.data.token, authedUser);
      sweetAuthSuccess(isLogin ? 'login' : 'register');
      onClose();
      setFormData(emptyForm);
      if (!stayOnPage) {
        navigate(dashboardPathForUser(authedUser), { replace: true });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      sweetError(isLogin ? 'Sign in failed' : 'Sign up failed', message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData(emptyForm);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  if (!isOpen) return null;

  // Portal to <body> so a transformed ancestor (e.g. ScrollReveal) can never trap it under the header
  return createPortal(
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center lg:justify-start p-3 sm:p-6 lg:pl-[7vw] bg-[#2a2a2a] bg-cover bg-center animate-fade-in"
      style={{ backgroundImage: `url(${AUTH_BACKGROUND})` }}
      // React bubbles portal events through the component tree: without this, a click inside the
      // dialog reaches a parent <Link> (e.g. the product card's wishlist heart) and navigates away.
      onClick={(e) => e.stopPropagation()}
    >
      {/* Darkening layer over the photo; tapping it closes the dialog */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-transparent bg-gradient-to-br from-black/55 via-black/30 to-black/60 cursor-default"
      />
      <div className="relative flex w-full max-w-[440px] max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] flex-col bg-white shadow-2xl animate-scale-in">
        <div className="flex items-start justify-between px-5 pt-5 pb-4 sm:px-7 sm:pt-6 border-b border-black/10">
          <div>
            <h2 className="text-sm font-bold tracking-[0.15em] uppercase text-black mb-1">
              {forgot ? 'Reset password' : isLogin ? 'Sign in' : 'Create account'}
            </h2>
            <p className="text-[10px] font-bold tracking-[0.08em] uppercase text-black/40">
              {forgot
                ? 'We will email you a reset link'
                : isLogin
                  ? 'Welcome back to VRANT'
                  : 'Save favourites and track your orders'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-9 w-9 shrink-0 p-0 text-black hover:bg-black/5"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {forgot && (
          <form onSubmit={handleForgot} className="flex-1 overflow-y-auto px-5 py-5 space-y-4 sm:px-7 sm:py-6">
            {notice ? (
              <div className="border border-army-green/25 bg-army-green/[0.06] text-army-green px-4 py-3 text-[10px] font-bold uppercase tracking-wider leading-relaxed">
                {notice}
              </div>
            ) : (
              <>
                {error && (
                  <div className="border border-red-300 bg-red-50 text-red-700 px-4 py-3 text-[10px] font-bold uppercase tracking-wider">
                    {error}
                  </div>
                )}
                <div>
                  <Label htmlFor="reset-email" className="text-[10px] font-bold tracking-[0.15em] uppercase text-black/60">
                    Email *
                  </Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/30" />
                    <Input
                      id="reset-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="you@email.com"
                      className="h-11 pl-10 rounded-none border-black/15 focus-visible:border-black focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-army-green hover:bg-army-green-light text-white rounded-none text-[10px] font-bold tracking-[0.2em] uppercase min-h-[48px]"
                  disabled={loading}
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </Button>
              </>
            )}
          </form>
        )}

        {!forgot && (
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 space-y-4 sm:px-7 sm:py-6">
          {error && (
            <div className="border border-red-300 bg-red-50 text-red-700 px-4 py-3 text-[10px] font-bold uppercase tracking-wider">
              {error}
            </div>
          )}

          {!isLogin && (
            <div>
              <Label htmlFor="name" className="text-[10px] font-bold tracking-[0.15em] uppercase text-black/60">
                Full name *
              </Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/30" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Your name"
                  className="h-11 pl-10 rounded-none border-black/15 focus-visible:border-black focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="email" className="text-[10px] font-bold tracking-[0.15em] uppercase text-black/60">
              Email *
            </Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/30" />
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@email.com"
                className="h-11 pl-10 rounded-none border-black/15 focus-visible:border-black focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                autoComplete="email"
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <Label htmlFor="phone" className="text-[10px] font-bold tracking-[0.15em] uppercase text-black/60">
                Phone *
              </Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/30" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+233 20 123 4567"
                  className="h-11 pl-10 rounded-none border-black/15 focus-visible:border-black focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                  autoComplete="tel"
                  required
                />
              </div>
              <p className="text-[9px] font-bold text-black/40 mt-1.5 leading-relaxed">
                Used for order updates and your welcome SMS.
              </p>
            </div>
          )}

          {/* Password + confirm sit side by side when signing up */}
          <div className={isLogin ? '' : 'grid gap-4 sm:grid-cols-2'}>
          <div>
            <Label htmlFor="password" className="text-[10px] font-bold tracking-[0.15em] uppercase text-black/60">
              Password *
            </Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/30" />
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Min. 6 characters"
                className="h-11 pl-10 pr-10 rounded-none border-black/15 focus-visible:border-black focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-black/40" />
                ) : (
                  <Eye className="h-4 w-4 text-black/40" />
                )}
              </Button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <Label
                htmlFor="confirmPassword"
                className="text-[10px] font-bold tracking-[0.15em] uppercase text-black/60"
              >
                Confirm password *
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/30" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Re-enter password"
                  className="h-11 pl-10 pr-10 rounded-none border-black/15 focus-visible:border-black focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                  autoComplete="new-password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-black/40" />
                  ) : (
                    <Eye className="h-4 w-4 text-black/40" />
                  )}
                </Button>
              </div>
            </div>
          )}
          </div>

          {isLogin && (
            <div className="-mt-1 text-right">
              <button
                type="button"
                onClick={() => {
                  setForgot(true);
                  setError('');
                  setNotice('');
                }}
                className="text-[10px] font-bold tracking-[0.12em] uppercase text-black/50 underline underline-offset-2 hover:text-army-green"
              >
                Forgot password?
              </button>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-army-green hover:bg-army-green-light text-white rounded-none text-[10px] font-bold tracking-[0.2em] uppercase min-h-[48px]"
            disabled={loading}
          >
            {loading ? (isLogin ? 'Signing in…' : 'Creating account…') : isLogin ? 'Sign in' : 'Create account'}
          </Button>
        </form>
        )}

        <div className="border-t border-black/10 bg-[#f6f4f4] px-5 py-4 sm:px-7">
          {forgot ? (
            <p className="text-center text-[10px] font-bold tracking-[0.12em] uppercase text-black/50">
              Remembered it?{' '}
              <button
                type="button"
                onClick={() => {
                  setForgot(false);
                  setNotice('');
                  setError('');
                }}
                className="text-army-green underline underline-offset-2 hover:text-army-green-light"
              >
                Back to sign in
              </button>
            </p>
          ) : (
            <p className="text-center text-[10px] font-bold tracking-[0.12em] uppercase text-black/50">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button type="button" onClick={toggleMode} className="text-army-green underline underline-offset-2 hover:text-army-green-light">
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AuthModal;
