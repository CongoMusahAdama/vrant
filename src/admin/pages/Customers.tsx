import { useCallback, useEffect, useState } from 'react';
import { Mail, MessageCircle, Phone, Trash2 } from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import AdminPageHeader from '../components/ui/AdminPageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminConfirm } from '@/admin/contexts/AdminConfirmContext';
import { apiFetch } from '@/lib/api';
import type { AdminCustomer } from '../types/admin';
import { formatShortDate } from '../lib/format';
import {
  customerEmailHref,
  customerPhoneHref,
  customerWhatsAppHref,
} from '../lib/customerContact';
import { sweetError, sweetSuccessCenter } from '@/lib/sweet-alert';
import AdminPagination from '../components/ui/AdminPagination';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 15;

const CustomersContent = () => {
  const { token } = useAuth();
  const { confirm } = useAdminConfirm();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (search.trim()) params.set('search', search.trim());

      const res = await apiFetch<{
        success: boolean;
        data: {
          customers: AdminCustomer[];
          pagination: {
            currentPage: number;
            totalPages: number;
            totalCustomers: number;
          };
        };
      }>(`/api/customers?${params}`, { token });

      setCustomers(res.data.customers);
      setTotal(res.data.pagination.totalCustomers);
      setTotalPages(res.data.pagination.totalPages);
    } catch {
      setCustomers([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [token, page, search]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleDelete = async (customer: AdminCustomer) => {
    const ok = await confirm({
      title: 'Delete customer account?',
      message: `"${customer.name}" will be removed from the customer list. Their past orders stay on record for VRANT.`,
      confirmLabel: 'Delete account',
      variant: 'danger',
    });
    if (!ok || !token) return;

    setDeletingId(customer._id);
    try {
      await apiFetch(`/api/customers/${customer._id}`, {
        method: 'DELETE',
        token,
      });
      sweetSuccessCenter('Customer deleted', `${customer.name} was removed.`);
      await loadCustomers();
    } catch (err) {
      sweetError('Could not delete', err instanceof Error ? err.message : undefined);
    } finally {
      setDeletingId(null);
    }
  };

  const actionBtn =
    'inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 border border-black/15 text-[8px] font-bold tracking-[0.12em] uppercase hover:bg-black hover:text-white transition-colors disabled:opacity-40';

  return (
    <>
      <AdminPageHeader
        title="Customers"
        description="All registered shoppers. Contact them for order issues or delete accounts when needed."
      />

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name, email, phone…"
        className="w-full mb-4 border border-black/20 bg-white px-4 py-3 min-h-[48px] text-[10px] font-bold uppercase tracking-wider placeholder:text-black/30"
      />

      {loading ? (
        <div className="py-12 text-center border border-black/10">
          <p className="text-[10px] font-bold uppercase text-black/40 animate-pulse">
            Loading customers…
          </p>
        </div>
      ) : customers.length === 0 ? (
        <div className="border border-dashed border-black/20 p-8 sm:p-12 text-center">
          <p className="text-[11px] font-bold uppercase text-black/50">No customers found</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block border border-black/10 bg-white overflow-x-auto">
            <table className="w-full text-left min-w-[720px]">
              <thead>
                <tr className="border-b border-black/10 text-[8px] font-bold tracking-[0.14em] uppercase text-black/45">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {customers.map((c) => {
                  const waHref = c.phone ? customerWhatsAppHref(c.phone, c.name) : null;
                  const telHref = c.phone ? customerPhoneHref(c.phone) : null;
                  return (
                    <tr key={c._id}>
                      <td className="px-4 py-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-black">
                          {c.name}
                        </p>
                        <p className="text-[9px] font-bold text-black/40 mt-0.5 break-all">
                          {c.email}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-[9px] font-bold text-black/55">
                        {c.phone || '—'}
                      </td>
                      <td className="px-4 py-4 text-[10px] font-bold tabular-nums text-black/70">
                        {c.orderCount ?? 0}
                      </td>
                      <td className="px-4 py-4 text-[8px] font-bold uppercase text-black/40">
                        {formatShortDate(c.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <a href={customerEmailHref(c.email, c.name)} className={actionBtn}>
                            <Mail className="h-3.5 w-3.5" />
                            Email
                          </a>
                          {telHref ? (
                            <a href={telHref} className={actionBtn}>
                              <Phone className="h-3.5 w-3.5" />
                              Call
                            </a>
                          ) : null}
                          {waHref ? (
                            <a
                              href={waHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={actionBtn}
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              WhatsApp
                            </a>
                          ) : null}
                          <button
                            type="button"
                            disabled={deletingId === c._id}
                            onClick={() => handleDelete(c)}
                            className={cn(actionBtn, 'border-red-300 text-red-700 hover:bg-red-600 hover:border-red-600')}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="md:hidden border border-black/10 divide-y divide-black/10 bg-white">
            {customers.map((c) => {
              const waHref = c.phone ? customerWhatsAppHref(c.phone, c.name) : null;
              const telHref = c.phone ? customerPhoneHref(c.phone) : null;
              return (
                <li key={c._id} className="px-4 py-4 space-y-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-black">
                      {c.name}
                    </p>
                    <p className="text-[9px] font-bold text-black/45 mt-0.5 break-all">{c.email}</p>
                    {c.phone ? (
                      <p className="text-[9px] font-bold text-black/35 mt-0.5">{c.phone}</p>
                    ) : null}
                    <p className="text-[8px] font-bold uppercase text-black/35 mt-2">
                      {c.orderCount ?? 0} orders · joined {formatShortDate(c.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href={customerEmailHref(c.email, c.name)} className={actionBtn}>
                      <Mail className="h-3.5 w-3.5" />
                      Email
                    </a>
                    {telHref ? (
                      <a href={telHref} className={actionBtn}>
                        <Phone className="h-3.5 w-3.5" />
                        Call
                      </a>
                    ) : null}
                    {waHref ? (
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={actionBtn}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    ) : null}
                    <button
                      type="button"
                      disabled={deletingId === c._id}
                      onClick={() => handleDelete(c)}
                      className={cn(actionBtn, 'border-red-300 text-red-700 hover:bg-red-600 hover:border-red-600')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <AdminPagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            itemLabel="customers"
          />
        </>
      )}
    </>
  );
};

const Customers = () => (
  <AdminLayout orderCount={0} productCount={0}>
    <CustomersContent />
  </AdminLayout>
);

export default Customers;
