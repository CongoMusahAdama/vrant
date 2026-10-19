import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SiteLogo from '@/components/brand/SiteLogo';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import type { AuthUser } from '@/types/customer';

/** Same photo as the sign-in dialog */
const BACKGROUND = '/lookbook/look-26.jpg';

const fieldClass =
  'h-11 pl-10 pr-10 rounded-none border-black/15 focus-visible:border-black focus-visible:ring-0 focus-visible:ring-offset-0 text-sm';

/** Landing page for the emailed reset link: /reset-password/:token */
const ResetPassword = () => {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirm) return setError('Passwords do not match');

    setLoading(true);
    setError('');
    try {
      const res = await apiFetch<{ success: boolean; data: { token: string; user: AuthUser } }>(
        `/api/auth/reset-password/${encodeURIComponent(token)}`,
        { method: 'POST', body: JSON.stringify({ password }) }
      );
      const user = await login(res.data.token, res.data.user);
      navigate(user?.role === 'admin' ? '/admin' : '/account', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center lg:justify-start p-3 sm:p-6 lg:pl-[7vw] bg-[#2a2a2a] bg-cover bg-center relative"
      style={{ backgroundImage: `url(${BACKGROUND})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/55 via-black/30 to-black/60" />

      <div className="relative w-full max-w-[440px] bg-white shadow-2xl">
        <div className="px-5 pt-6 pb-4 sm:px-7 border-b border-black/10">
          <Link to="/" aria-label="VRANT home" className="inline-block mb-4">
            <SiteLogo variant="light" className="h-10" />
          </Link>
          <h1 className="text-sm font-bold tracking-[0.15em] uppercase text-black mb-1">Choose a new password</h1>
          <p className="text-[10px] font-bold tracking-[0.08em] uppercase text-black/40">
            You will be signed in once it is saved
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4 sm:px-7 sm:py-6">
          {error && (
            <div className="border border-red-300 bg-red-50 text-red-700 px-4 py-3 text-[10px] font-bold uppercase tracking-wider leading-relaxed">
              {error}
            </div>
          )}

          {[
            { id: 'new-password', label: 'New password *', value: password, set: setPassword, placeholder: 'Min. 6 characters' },
            { id: 'confirm-password', label: 'Confirm password *', value: confirm, set: setConfirm, placeholder: 'Re-enter password' },
          ].map((f) => (
            <div key={f.id}>
              <Label htmlFor={f.id} className="text-[10px] font-bold tracking-[0.15em] uppercase text-black/60">
                {f.label}
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/30" />
                <Input
                  id={f.id}
                  type={show ? 'text' : 'password'}
                  value={f.value}
                  onChange={(e) => {
                    f.set(e.target.value);
                    setError('');
                  }}
                  placeholder={f.placeholder}
                  className={fieldClass}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 flex items-center justify-center bg-transparent"
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? <EyeOff className="h-4 w-4 text-black/40" /> : <Eye className="h-4 w-4 text-black/40" />}
                </button>
              </div>
            </div>
          ))}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-army-green hover:bg-army-green-light text-white rounded-none text-[10px] font-bold tracking-[0.2em] uppercase min-h-[48px]"
          >
            {loading ? 'Saving…' : 'Save new password'}
          </Button>
        </form>

        <div className="border-t border-black/10 bg-[#f6f4f4] px-5 py-4 sm:px-7 text-center">
          <Link
            to="/"
            className="text-[10px] font-bold tracking-[0.12em] uppercase text-army-green underline underline-offset-2"
          >
            Back to the shop
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
