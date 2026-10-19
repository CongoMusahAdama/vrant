import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-[#f3efe6] text-[#6b5c45] border-[#ddd4c4]',
  confirmed: 'bg-[#e8edf2] text-[#4a5f6e] border-[#cdd6de]',
  processing: 'bg-[#e6eaef] text-[#4a5568] border-[#c8d0d9]',
  shipped: 'bg-[#ebe8f0] text-[#5c5470] border-[#d4cede]',
  delivered: 'bg-[#e8efe9] text-[#4a5f4f] border-[#cdd8cf]',
  cancelled: 'bg-[#f0e8e8] text-[#6b4f4f] border-[#ddd0d0]',
  paid: 'bg-[#e8efe9] text-[#4a5f4f] border-[#cdd8cf]',
  failed: 'bg-[#f0e8e8] text-[#6b4f4f] border-[#ddd0d0]',
  whatsapp: 'bg-[#e8ebe6] text-[#4f5a52] border-[#d0d8d2]',
};

type AdminStatusBadgeProps = {
  status: string;
  className?: string;
};

const AdminStatusBadge = ({ status, className }: AdminStatusBadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center px-2 py-0.5 text-[8px] font-bold tracking-[0.12em] uppercase border',
      STATUS_STYLES[status] || 'bg-black/5 text-black/60 border-black/10',
      className
    )}
  >
    {status}
  </span>
);

export default AdminStatusBadge;
