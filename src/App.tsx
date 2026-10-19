import { lazy, Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RouteScrollToTop from './components/ui/RouteScrollToTop';
import CartNavBridge from './components/shop/CartNavBridge';
import NewDropsModal from './components/shop/NewDropsModal';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ShopCatalogProvider } from './contexts/ShopCatalogContext';
import { CategoriesProvider } from './contexts/CategoriesContext';
import { SiteSettingsProvider } from './contexts/SiteSettingsContext';
import { PaystackProvider } from './contexts/PaystackContext';
import AuthModal from './components/auth/AuthModal';
import ErrorBoundary from './components/ui/error-boundary';

import Home from './pages/Index';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Gallery from './pages/Gallery';
import About from './pages/About';
import Shipping from './pages/Shipping';
import Privacy from './pages/Privacy';
import Account from './pages/Account';
import PaymentCallback from './pages/PaymentCallback';
import PaymentMoMoPending from './pages/PaymentMoMoPending';
import ResetPassword from './pages/ResetPassword';
import CustomDesign from './pages/CustomDesign';

const AdminDashboard = lazy(() => import('./admin/pages/Dashboard'));
const AdminProducts = lazy(() => import('./admin/pages/Products'));
const AdminOrders = lazy(() => import('./admin/pages/Orders'));
const AdminGallery = lazy(() => import('./admin/pages/Gallery'));
const AdminReceipts = lazy(() => import('./admin/pages/Receipts'));
const AdminCustomers = lazy(() => import('./admin/pages/Customers'));
const AdminSettings = lazy(() => import('./admin/pages/Settings'));
const AdminCustomOrders = lazy(() => import('./admin/pages/CustomOrders'));

const AdminFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 animate-pulse">
      Loading admin…
    </p>
  </div>
);

const ProtectedRoute = ({
  children,
  requireAuth = true,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}) => {
  const { isAuthenticated, isAdmin, loading, login } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-army-green" />
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
          <div className="text-center max-w-sm">
            <h2 className="text-[12px] font-bold tracking-[0.2em] uppercase text-black mb-4">
              Sign in required
            </h2>
            <p className="text-[10px] font-bold text-black/50 mb-6 uppercase tracking-wider">
              Please sign in to access your account
            </p>
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="bg-black text-white px-8 py-3 text-[10px] font-bold tracking-[0.2em] uppercase"
            >
              Sign in
            </button>
          </div>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={async (token, user) => {
            await login(token, user);
            setShowAuthModal(false);
          }}
          initialMode="login"
        />
      </>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don&apos;t have permission to access this page</p>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const AppContent = () => (
  <Router>
    <RouteScrollToTop />
    <CartProvider>
      <SiteSettingsProvider>
      <CategoriesProvider>
        <ShopCatalogProvider>
          <PaystackProvider>
            <CartNavBridge />
            <NewDropsModal />
            <Toaster />
            <div className="min-h-screen flex flex-col">
              <main className="flex-grow">
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/gallery" element={<Gallery />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/shipping" element={<Shipping />} />
                    <Route path="/returns" element={<Navigate to="/shipping#returns" replace />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/payment/callback" element={<PaymentCallback />} />
                    <Route path="/payment/momo" element={<PaymentMoMoPending />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/custom-design" element={<CustomDesign />} />
                    <Route
                      path="/admin/custom-orders"
                      element={
                        <ProtectedRoute requireAuth requireAdmin>
                          <Suspense fallback={<AdminFallback />}>
                            <AdminCustomOrders />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/account"
                      element={
                        <ProtectedRoute requireAuth>
                          <Account />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute requireAuth requireAdmin>
                          <Suspense fallback={<AdminFallback />}>
                            <AdminDashboard />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/products"
                      element={
                        <ProtectedRoute requireAuth requireAdmin>
                          <Suspense fallback={<AdminFallback />}>
                            <AdminProducts />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/orders"
                      element={
                        <ProtectedRoute requireAuth requireAdmin>
                          <Suspense fallback={<AdminFallback />}>
                            <AdminOrders />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/gallery"
                      element={
                        <ProtectedRoute requireAuth requireAdmin>
                          <Suspense fallback={<AdminFallback />}>
                            <AdminGallery />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/receipts"
                      element={
                        <ProtectedRoute requireAuth requireAdmin>
                          <Suspense fallback={<AdminFallback />}>
                            <AdminReceipts />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/customers"
                      element={
                        <ProtectedRoute requireAuth requireAdmin>
                          <Suspense fallback={<AdminFallback />}>
                            <AdminCustomers />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/admin/analytics" element={<Navigate to="/admin" replace />} />
                    <Route
                      path="/admin/settings"
                      element={
                        <ProtectedRoute requireAuth requireAdmin>
                          <Suspense fallback={<AdminFallback />}>
                            <AdminSettings />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </ErrorBoundary>
              </main>
            </div>
          </PaystackProvider>
        </ShopCatalogProvider>
      </CategoriesProvider>
      </SiteSettingsProvider>
    </CartProvider>
  </Router>
);

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
