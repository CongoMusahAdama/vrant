import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Images,
  FileText,
  Settings,
  Users,
  Scissors,
  type LucideIcon,
} from 'lucide-react';

export type AdminNavItem = {
  href: string;
  label: string;
  short: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin', label: 'Overview', short: 'Home', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'Manage orders', short: 'Orders', icon: ShoppingCart },
  { href: '/admin/custom-orders', label: 'Custom orders', short: 'Custom', icon: Scissors },
  { href: '/admin/customers', label: 'Customers', short: 'People', icon: Users },
  { href: '/admin/receipts', label: 'Order receipts', short: 'Receipts', icon: FileText },
  { href: '/admin/products', label: 'Product catalog', short: 'Stock', icon: Package },
  { href: '/admin/gallery', label: 'Site gallery', short: 'Photos', icon: Images },
  { href: '/admin/settings', label: 'Settings', short: 'Settings', icon: Settings },
];

export function isAdminNavActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname.startsWith(href);
}
