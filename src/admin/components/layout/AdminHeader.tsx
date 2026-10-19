import { Bell, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminHeader = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </Button>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-gray-900">Admin User</div>
              <div className="text-xs text-gray-500">admin@vrant.com</div>
            </div>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
