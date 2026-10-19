import { ReactNode, useState } from 'react';

import ShopHeader from '@/components/navigation/ShopHeader';

import Footer from '@/components/layout/Footer';

import SignOutConfirmDialog from '@/components/account/SignOutConfirmDialog';

import { AdminConfirmProvider } from '@/admin/contexts/AdminConfirmContext';

import AdminSidebar from './AdminSidebar';

import AdminMobileNav from './AdminMobileNav';

import { useAuth } from '@/contexts/AuthContext';

import { useCart } from '@/contexts/CartContext';

import { ACCOUNT_ADMIN_OFFSET_PT, ADMIN_MOBILE_BOTTOM_SAFE, PAGE_X } from '@/lib/page-layout';

import { cn } from '@/lib/utils';



type AdminLayoutProps = {

  children: ReactNode;

  orderCount?: number;

  productCount?: number;

};



const AdminLayout = ({ children, orderCount = 0, productCount = 0 }: AdminLayoutProps) => {

  const { user, logout } = useAuth();

  const { cartCount } = useCart();

  const [signOutOpen, setSignOutOpen] = useState(false);



  const handleSignOut = () => {

    logout();

    setSignOutOpen(false);

  };



  return (

    <div className="min-h-screen bg-white overflow-x-hidden">

      <ShopHeader cartCount={cartCount} />



      <main className={cn(ACCOUNT_ADMIN_OFFSET_PT, ADMIN_MOBILE_BOTTOM_SAFE, 'sm:pb-16', PAGE_X)}>

        <div className="w-full max-w-6xl mx-auto py-1 sm:py-4">

          <div className="flex flex-col gap-3 sm:gap-6 lg:flex-row lg:gap-8 xl:gap-10">

            <AdminSidebar

              userName={user?.name}

              userEmail={user?.email}

              orderCount={orderCount}

              productCount={productCount}

              onSignOut={() => setSignOutOpen(true)}

            />

            <div className="flex-1 min-w-0 lg:pt-2">

              <AdminConfirmProvider>{children}</AdminConfirmProvider>

            </div>

          </div>

        </div>

      </main>



      <AdminMobileNav />



      <SignOutConfirmDialog

        open={signOutOpen}

        onOpenChange={setSignOutOpen}

        onConfirm={handleSignOut}

      />



      <div className="hidden sm:block">

        <Footer />

      </div>

    </div>

  );

};



export default AdminLayout;

