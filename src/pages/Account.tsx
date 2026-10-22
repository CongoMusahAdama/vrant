import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import ShopHeader from '@/components/navigation/ShopHeader';
import { useSeo } from '@/lib/seo';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/ui/scroll-to-top';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import AccountOrdersTable from '@/components/account/AccountOrdersTable';
import AccountWishlistGrid from '@/components/account/AccountWishlistGrid';
import { ORDERS_PAGE_SIZE } from '@/components/account/OrdersTablePagination';
import TablePagination from '@/components/ui/TablePagination';
import DeliverySection from '@/components/account/DeliverySection';
import ProfileSection from '@/components/account/ProfileSection';
import AccountSidebar, { type AccountSection } from '@/components/account/AccountSidebar';
import SignOutConfirmDialog from '@/components/account/SignOutConfirmDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { apiFetch } from '@/lib/api';
import { useShopCatalog } from '@/contexts/ShopCatalogContext';
import type { ShopOrder } from '@/types/customer';
import { mockShopOrders } from '@/data/mockOrders';
import { ACCOUNT_ADMIN_OFFSET_PT, PAGE_X } from '@/lib/page-layout';
import { cn } from '@/lib/utils';
import {
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  orderStatusMessage,
} from '@/lib/order-status';
import { sweetInfo } from '@/lib/sweet-alert';
import { useOrderPolling } from '@/hooks/useOrderPolling';

const ORDERS_POLL_MS = 20_000;
const WISHLIST_PAGE_SIZE = 6;

const SECTION_TITLE: Record<AccountSection, string> = {
  orders: 'Your orders',
  wishlist: 'Wishlist',
  delivery: 'Delivery details',
  profile: 'Profile & phone',
};

const Account = () => {
  useSeo({ title: 'My account', noindex: true });
  const navigate = useNavigate();
  const { user, token, logout, refreshUser, updateUser, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const { products: catalogProducts } = useShopCatalog();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const previewOrders = searchParams.get('previewOrders') === '1';
  const initialSection: AccountSection =
    tabParam === 'wishlist' || tabParam === 'delivery' || tabParam === 'profile'
      ? tabParam
      : 'orders';

  const [section, setSection] = useState<AccountSection>(initialSection);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [wishlistPage, setWishlistPage] = useState(1);
  const ordersSnapshotRef = useRef<Map<string, { status: string; paymentStatus?: string }>>(
    new Map()
  );
  const ordersBootstrappedRef = useRef(false);

  const wishlistProducts = useMemo(
    () => catalogProducts.filter((p) => user?.wishlist?.includes(p.id)),
    [catalogProducts, user?.wishlist]
  );

  const wishlistTotalPages = Math.max(1, Math.ceil(wishlistProducts.length / WISHLIST_PAGE_SIZE));
  const pagedWishlistProducts = wishlistProducts.slice(
    (wishlistPage - 1) * WISHLIST_PAGE_SIZE,
    wishlistPage * WISHLIST_PAGE_SIZE
  );

  useEffect(() => {
    setWishlistPage(1);
  }, [wishlistProducts.length]);

  useEffect(() => {
    if (wishlistPage > wishlistTotalPages) setWishlistPage(wishlistTotalPages);
  }, [wishlistPage, wishlistTotalPages]);

  const loadOrders = useCallback(
    async (page = 1, options?: { notify?: boolean; silent?: boolean }) => {
      if (!token) return;
      if (!options?.silent) setLoadingOrders(true);
      try {
        const res = await apiFetch<{
          success: boolean;
          data: {
            orders: ShopOrder[];
            pagination: { page: number; limit: number; total: number; totalPages: number };
          };
        }>(`/api/shop-orders?page=${page}&limit=${ORDERS_PAGE_SIZE}`, { token });

        const nextOrders = res.data.orders;

        if (!ordersBootstrappedRef.current) {
          nextOrders.forEach((order) => {
            ordersSnapshotRef.current.set(order._id, {
              status: order.status,
              paymentStatus: order.paymentStatus,
            });
          });
          ordersBootstrappedRef.current = true;
        } else if (options?.notify) {
          nextOrders.forEach((order) => {
            const prev = ordersSnapshotRef.current.get(order._id);
            if (prev) {
              if (prev.status !== order.status) {
                sweetInfo(
                  'Order status updated',
                  `${order.orderNumber} is now ${ORDER_STATUS_LABEL[order.status] || order.status}. ${orderStatusMessage(order.status)}`
                );
              }
              if (
                order.paymentStatus &&
                prev.paymentStatus &&
                prev.paymentStatus !== order.paymentStatus
              ) {
                sweetInfo(
                  'Payment updated',
                  `${order.orderNumber}: ${PAYMENT_STATUS_LABEL[order.paymentStatus] || order.paymentStatus}.`
                );
              }
            }
            ordersSnapshotRef.current.set(order._id, {
              status: order.status,
              paymentStatus: order.paymentStatus,
            });
          });
        } else {
          nextOrders.forEach((order) => {
            ordersSnapshotRef.current.set(order._id, {
              status: order.status,
              paymentStatus: order.paymentStatus,
            });
          });
        }

        setOrders(nextOrders);
        setOrdersPage(res.data.pagination.page);
        setOrdersTotal(res.data.pagination.total);
        setOrdersTotalPages(res.data.pagination.totalPages);
      } catch {
        setOrders([]);
        setOrdersTotal(0);
        setOrdersTotalPages(1);
      } finally {
        if (!options?.silent) setLoadingOrders(false);
      }
    },
    [token]
  );

  useEffect(() => {
    ordersBootstrappedRef.current = false;
    ordersSnapshotRef.current.clear();
  }, [token]);

  useEffect(() => {
    if (section === 'orders') {
      loadOrders(ordersPage);
    }
  }, [loadOrders, ordersPage, section]);

  const pollOrders = useCallback(
    (options: { notify: boolean; silent: boolean }) => loadOrders(ordersPage, options),
    [loadOrders, ordersPage]
  );

  useOrderPolling({
    enabled: section === 'orders',
    intervalMs: ORDERS_POLL_MS,
    token,
    onPoll: pollOrders,
  });

  useEffect(() => {
    const onPaid = () => {
      setSection('orders');
      setOrdersPage(1);
      loadOrders(1);
    };
    window.addEventListener('vrant:order-paid', onPaid);
    return () => window.removeEventListener('vrant:order-paid', onPaid);
  }, [loadOrders]);

  const handleSectionChange = (next: AccountSection) => {
    setSection(next);
    setSearchParams(next === 'orders' ? {} : { tab: next }, { replace: true });
    if (next === 'orders') loadOrders(ordersPage);
  };

  const handleSignOut = () => {
    setSignOutOpen(false);
    logout();
  };

  const useMockOrders = previewOrders;

  const mockTotal = mockShopOrders.length;
  const mockTotalPages = Math.max(1, Math.ceil(mockTotal / ORDERS_PAGE_SIZE));
  const mockPage = Math.min(ordersPage, mockTotalPages);
  const displayOrders: ShopOrder[] = useMockOrders
    ? mockShopOrders.slice((mockPage - 1) * ORDERS_PAGE_SIZE, mockPage * ORDERS_PAGE_SIZE)
    : orders;

  const paginationTotal = useMockOrders ? mockTotal : ordersTotal;
  const paginationTotalPages = useMockOrders ? mockTotalPages : ordersTotalPages;
  const paginationPage = useMockOrders ? mockPage : ordersPage;

  const paidCount = (useMockOrders ? mockShopOrders : orders).filter(
    (o) => o.paymentStatus === 'paid'
  ).length;

  const handleOrdersPageChange = (page: number) => {
    setOrdersPage(page);
  };

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <ShopHeader cartCount={cartCount} />

      <main className={cn(ACCOUNT_ADMIN_OFFSET_PT, 'pb-28 sm:pb-20', PAGE_X)}>
        <div className="w-full max-w-6xl mx-auto py-2 sm:py-4">
          <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:gap-8 xl:gap-10">
            <AccountSidebar
              active={section}
              onSelect={handleSectionChange}
              isAuthenticated
              userName={user?.name}
              userEmail={user?.email}
              userPhone={user?.phone}
              orderCount={paginationTotal}
              wishlistCount={wishlistProducts.length}
              onSignIn={() => undefined}
              onSignOut={() => setSignOutOpen(true)}
            />

            <div className="flex-1 min-w-0 lg:pt-2">
              <header className="mb-4 pb-4 border-b border-black/10 lg:hidden">
                <h1 className="text-sm font-bold tracking-[0.12em] uppercase text-black">
                  {SECTION_TITLE[section]}
                </h1>
                {section === 'orders' && (
                  <p className="text-[9px] font-bold tracking-[0.08em] uppercase text-black/45 mt-2 leading-relaxed">
                    {ORDERS_PAGE_SIZE} orders per page · tap Delivery or WhatsApp on each order
                  </p>
                )}
                {section === 'wishlist' && (
                  <p className="text-[9px] font-bold tracking-[0.08em] uppercase text-black/45 mt-2">
                    Tap Remove to take items off your list
                  </p>
                )}
                {section === 'delivery' && (
                  <p className="text-[9px] font-bold tracking-[0.08em] uppercase text-black/45 mt-2 leading-relaxed">
                    Update address or pickup station anytime
                  </p>
                )}
                {section === 'profile' && (
                  <p className="text-[9px] font-bold tracking-[0.08em] uppercase text-black/45 mt-2 leading-relaxed">
                    Add or update your phone for order SMS updates
                  </p>
                )}
              </header>
              <header className="hidden lg:block mb-6 sm:mb-8 pb-6 border-b border-black/10">
                <h1 className="text-base sm:text-lg font-bold tracking-[0.12em] uppercase text-black">
                  {SECTION_TITLE[section]}
                </h1>
                {section === 'orders' && (
                  <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-black/45 mt-2 leading-relaxed max-w-lg">
                    Track orders in the table below ({ORDERS_PAGE_SIZE} per page). Status updates
                    from VRANT appear here automatically — confirmed, shipped, delivered, and more.
                    {paidCount > 0 && (
                      <span className="text-black"> · {paidCount} paid</span>
                    )}
                  </p>
                )}
                {section === 'orders' && useMockOrders && (
                  <p className="text-[9px] font-bold tracking-[0.12em] uppercase text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 mt-3 max-w-lg">
                    Preview: sample orders shown{previewOrders ? '' : ' (no real orders yet)'}. Add{' '}
                    <code className="text-[8px]">?previewOrders=1</code> to force preview anytime.
                  </p>
                )}
                {section === 'wishlist' && (
                  <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-black/45 mt-2 leading-relaxed">
                    Saved pieces — use Remove to delete from your wishlist.
                  </p>
                )}
                {section === 'delivery' && (
                  <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-black/45 mt-2 leading-relaxed max-w-lg">
                    View saved details or tap Change to update your address or pickup station.
                  </p>
                )}
                {section === 'profile' && (
                  <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-black/45 mt-2 leading-relaxed max-w-lg">
                    Phone is optional at signup. Add or change it here anytime — SMS verification
                    will be available in a future update.
                  </p>
                )}
              </header>

              {section === 'orders' && (
                <section>
                  {loadingOrders ? (
                    <div className="py-12 text-center border border-black/10">
                      <p className="text-[10px] font-bold uppercase text-black/40 animate-pulse">
                        Loading orders…
                      </p>
                    </div>
                  ) : (
                    <AccountOrdersTable
                      orders={displayOrders}
                      pagination={{
                        page: paginationPage,
                        totalPages: paginationTotalPages,
                        total: paginationTotal,
                        onPageChange: handleOrdersPageChange,
                      }}
                    />
                  )}
                </section>
              )}

              {section === 'wishlist' && (
                <section>
                  {wishlistProducts.length === 0 ? (
                    <div className="border border-dashed border-black/20 p-8 sm:p-12 text-center">
                      <p className="text-[11px] font-bold uppercase text-black/50 mb-2">
                        Nothing saved yet
                      </p>
                      <p className="text-[10px] font-bold text-black/40 mb-6 uppercase tracking-wider">
                        Tap the heart on any product
                      </p>
                      <a
                        href="/products"
                        className="inline-flex items-center justify-center w-full sm:w-auto border border-black px-8 py-3.5 min-h-[48px] text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-black hover:text-white active:bg-black active:text-white transition-colors"
                      >
                        Browse shop
                      </a>
                    </div>
                  ) : (
                    <>
                      <AccountWishlistGrid products={pagedWishlistProducts} />
                      <TablePagination
                        page={wishlistPage}
                        totalPages={wishlistTotalPages}
                        total={wishlistProducts.length}
                        pageSize={WISHLIST_PAGE_SIZE}
                        onPageChange={setWishlistPage}
                        itemLabel="items"
                        className="mt-6 border border-black/10"
                        showWhenSinglePage
                      />
                    </>
                  )}
                </section>
              )}

              {section === 'delivery' && (
                <DeliverySection user={user} token={token} onSaved={refreshUser} />
              )}

              {section === 'profile' && user && token && (
                <ProfileSection
                  user={user}
                  token={token}
                  onSaved={(updated) => {
                    updateUser(updated);
                    void refreshUser();
                  }}
                  onDeleted={() => {
                    logout();
                    navigate('/', { replace: true });
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <SignOutConfirmDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        onConfirm={handleSignOut}
      />

      <Footer />
      <ScrollToTop />
      <WhatsAppButton />
    </div>
  );
};

export default Account;
