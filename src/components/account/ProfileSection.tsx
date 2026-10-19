import { useState, useEffect } from 'react';
import { Phone, User } from 'lucide-react';
import type { AuthUser } from '@/types/customer';
import { apiFetch } from '@/lib/api';
import { sweetSuccess, sweetError } from '@/lib/sweet-alert';
import DeleteAccountDialog from '@/components/account/DeleteAccountDialog';

type ProfileSectionProps = {
  user: AuthUser;
  token: string;
  onSaved: (updated: AuthUser) => void;
  onDeleted: () => void;
};

const labelCls =
  'text-[10px] font-bold tracking-[0.15em] uppercase text-black/60 block mb-1';
const inputCls =
  'w-full border border-black px-3 py-3 min-h-[48px] text-[11px] font-bold text-black placeholder:text-black/30 focus:outline-none focus:ring-1 focus:ring-black';

const ProfileSection = ({ user, token, onSaved, onDeleted }: ProfileSectionProps) => {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(user.name);
    setPhone(user.phone || '');
  }, [user.name, user.phone]);

  const validate = () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (phone.trim() && !/^\+?[\d\s-()]{7,20}$/.test(phone.trim())) {
      setError('Please enter a valid phone number (e.g. +233 20 123 4567)');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const res = await apiFetch<{ success: boolean; data: { user: AuthUser } }>(
        '/api/auth/profile',
        {
          method: 'PUT',
          token,
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
          }),
        }
      );
      onSaved({
        ...res.data.user,
        id: String(res.data.user.id),
      });
      sweetSuccess('Profile updated', 'Your account details have been saved.');
    } catch (err) {
      sweetError('Could not save', err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async (password: string) => {
    setDeleting(true);
    try {
      await apiFetch<{ success: boolean; message: string }>('/api/auth/account', {
        method: 'DELETE',
        token,
        body: JSON.stringify({ password }),
      });
      setDeleteOpen(false);
      sweetSuccess('Account deleted', 'Your account has been removed.');
      onDeleted();
    } catch (err) {
      sweetError('Could not delete account', err instanceof Error ? err.message : undefined);
    } finally {
      setDeleting(false);
    }
  };

  const hasPhone = Boolean(user.phone?.trim());
  const phoneVerified = user.phoneVerified === true;

  return (
    <section className="w-full max-w-lg">
      <div className="mb-5 p-4 sm:p-5 border border-black/10 bg-black/[0.02]">
        <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-black/40 mb-1">
          Account email
        </p>
        <p className="text-[11px] font-bold text-black break-all">{user.email}</p>
        <p className="text-[9px] font-bold text-black/40 mt-2 leading-relaxed">
          Email cannot be changed here. Contact support if you need help.
        </p>
      </div>

      {hasPhone && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span
            className={
              phoneVerified
                ? 'inline-flex items-center px-2.5 py-1 text-[8px] font-bold tracking-[0.12em] uppercase bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'inline-flex items-center px-2.5 py-1 text-[8px] font-bold tracking-[0.12em] uppercase bg-amber-50 text-amber-900 border border-amber-200'
            }
          >
            {phoneVerified ? 'Phone verified' : 'Phone not verified'}
          </span>
          {!phoneVerified && (
            <p className="text-[9px] font-bold text-black/45 leading-relaxed">
              SMS verification coming soon — save your number now for order updates.
            </p>
          )}
        </div>
      )}

      {!hasPhone && (
        <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-black/45 mb-5 leading-relaxed">
          Add a phone number for SMS order updates. Verification will be available soon.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelCls} htmlFor="profile-name">
            Full name *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/30" />
            <input
              id="profile-name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              className={`${inputCls} pl-10`}
              autoComplete="name"
              required
            />
          </div>
        </div>

        <div>
          <label className={labelCls} htmlFor="profile-phone">
            Phone (optional)
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/30" />
            <input
              id="profile-phone"
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError('');
              }}
              placeholder="+233 20 123 4567"
              className={`${inputCls} pl-10`}
              autoComplete="tel"
            />
          </div>
        </div>

        {error && (
          <p className="text-[10px] font-bold text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto bg-black text-white px-8 py-3.5 min-h-[48px] text-[10px] font-bold tracking-[0.2em] uppercase hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>

      <div className="mt-10 pt-8 border-t border-red-200">
        <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-red-700 mb-2">
          Danger zone
        </p>
        <p className="text-[10px] font-bold text-black/45 leading-relaxed mb-4 max-w-md">
          Permanently delete your account. You will lose access to orders, wishlist, and saved
          delivery details in your dashboard.
        </p>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="w-full sm:w-auto border border-red-600 text-red-700 px-8 py-3.5 min-h-[48px] text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-red-600 hover:text-white transition-colors"
        >
          Delete account
        </button>
      </div>

      <DeleteAccountDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDeleteAccount}
        loading={deleting}
      />
    </section>
  );
};

export default ProfileSection;
