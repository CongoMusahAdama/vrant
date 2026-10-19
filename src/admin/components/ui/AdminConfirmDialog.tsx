import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

export type AdminConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
};

type AdminConfirmDialogProps = {
  open: boolean;
  options: AdminConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
};

const AdminConfirmDialog = ({
  open,
  options,
  onConfirm,
  onCancel,
}: AdminConfirmDialogProps) => {
  const isDanger = options.variant === 'danger';

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent className="rounded-none border-black w-[calc(100vw-2rem)] max-w-[min(100vw-2rem,420px)] mx-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[11px] font-bold tracking-[0.2em] uppercase text-black">
            {options.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[11px] font-medium text-black/55 leading-relaxed">
            {options.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-2">
          <AlertDialogCancel
            onClick={onCancel}
            className="rounded-none border-black/20 text-[10px] font-bold tracking-[0.15em] uppercase min-h-[48px] w-full sm:w-auto mt-0 hover:bg-black/[0.03]"
          >
            {options.cancelLabel || 'Cancel'}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              'rounded-none text-white text-[10px] font-bold tracking-[0.15em] uppercase min-h-[48px] w-full sm:w-auto',
              isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-black/90'
            )}
          >
            {options.confirmLabel || 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AdminConfirmDialog;
