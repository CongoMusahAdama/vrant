import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (password: string) => Promise<void>;
  loading?: boolean;
}

const inputCls =
  'w-full border border-black px-3 py-3 min-h-[48px] text-[11px] font-bold text-black placeholder:text-black/30 focus:outline-none focus:ring-1 focus:ring-black';

const DeleteAccountDialog = ({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: DeleteAccountDialogProps) => {
  const [password, setPassword] = useState('');

  const handleOpenChange = (next: boolean) => {
    if (!next) setPassword('');
    onOpenChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading) return;
    await onConfirm(password);
    setPassword('');
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="rounded-none border-black w-[calc(100vw-1.5rem)] max-w-[min(100vw-1.5rem,420px)] mx-4 sm:mx-auto">
        <form onSubmit={handleSubmit}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[11px] font-bold tracking-[0.2em] uppercase text-red-700">
              Delete account?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[10px] font-bold text-black/50 uppercase tracking-wider leading-relaxed">
              This permanently removes your profile, wishlist, and saved delivery details. Your past
              orders stay on record for VRANT. Enter your password to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <label
              htmlFor="delete-account-password"
              className="text-[10px] font-bold tracking-[0.15em] uppercase text-black/60 block mb-1"
            >
              Password *
            </label>
            <input
              id="delete-account-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>

          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-2">
            <AlertDialogCancel
              type="button"
              disabled={loading}
              className="rounded-none border-black text-[10px] font-bold tracking-[0.15em] uppercase min-h-[48px] w-full sm:w-auto mt-0"
            >
              Keep account
            </AlertDialogCancel>
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="rounded-none bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold tracking-[0.15em] uppercase min-h-[48px] w-full sm:w-auto px-6 disabled:opacity-50"
            >
              {loading ? 'Deleting…' : 'Delete account'}
            </button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;
