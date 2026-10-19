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

interface SignOutConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const SignOutConfirmDialog = ({ open, onOpenChange, onConfirm }: SignOutConfirmDialogProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="rounded-none border-black w-[calc(100vw-1.5rem)] max-w-[min(100vw-1.5rem,400px)] mx-4 sm:mx-auto">
      <AlertDialogHeader>
        <AlertDialogTitle className="text-[11px] font-bold tracking-[0.2em] uppercase">
          Sign out?
        </AlertDialogTitle>
        <AlertDialogDescription className="text-[10px] font-bold text-black/50 uppercase tracking-wider leading-relaxed">
          You will need to sign in again to access your orders, wishlist, and Paystack checkout.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-2">
        <AlertDialogCancel className="rounded-none border-black text-[10px] font-bold tracking-[0.15em] uppercase min-h-[48px] w-full sm:w-auto mt-0">
          Stay signed in
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className="rounded-none bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold tracking-[0.15em] uppercase min-h-[48px] w-full sm:w-auto"
        >
          Sign out
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default SignOutConfirmDialog;
