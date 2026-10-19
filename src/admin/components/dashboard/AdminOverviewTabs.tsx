import { cn } from '@/lib/utils';

export type OverviewTab = 'sales' | 'orders';

type AdminOverviewTabsProps = {
  active: OverviewTab;
  onChange: (tab: OverviewTab) => void;
};

const TABS: { id: OverviewTab; label: string }[] = [
  { id: 'sales', label: 'Sales' },
  { id: 'orders', label: 'Orders' },
];

const AdminOverviewTabs = ({ active, onChange }: AdminOverviewTabsProps) => (
  <div
    className="grid grid-cols-2 gap-2 sm:flex sm:gap-2 border-b border-black/10 pb-px"
    role="tablist"
    aria-label="Overview sections"
  >
    {TABS.map((tab) => (
      <button
        key={tab.id}
        type="button"
        role="tab"
        aria-selected={active === tab.id}
        onClick={() => onChange(tab.id)}
        className={cn(
          'flex-1 sm:flex-none px-4 py-3.5 min-h-[52px] text-[10px] font-bold tracking-[0.16em] uppercase border border-b-0 transition-colors -mb-px touch-manipulation',
          active === tab.id
            ? 'bg-black text-white border-black'
            : 'bg-white text-black/50 border-black/15 hover:text-black hover:border-black/30 active:bg-black/[0.03]'
        )}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default AdminOverviewTabs;
