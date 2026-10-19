import { TrendingUp, TrendingDown, Package, ShoppingCart, Users, DollarSign } from 'lucide-react';
import { AdminStats } from '../../types/admin';

interface StatsCardsProps {
  stats: AdminStats;
}

const StatsCards = ({ stats }: StatsCardsProps) => {
  const cards = [
    {
      title: 'Total Sales',
      value: `₵${stats.totalSales.toLocaleString()}`,
      icon: DollarSign,
       color: stats.totalSales > 0 ? 'bg-green-500' : 'bg-gray-500',
      trend: stats.totalSales > 0 ? '+12%' : '0%',
      trendUp: stats.totalSales > 0,
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      color: stats.totalOrders > 0 ? 'bg-blue-500' : 'bg-gray-500',
      trend: stats.totalOrders > 0 ? '+8%' : '0%',
      trendUp: stats.totalOrders > 0,
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers.toLocaleString(),
      icon: Users,
      color: stats.totalCustomers > 0 ? 'bg-purple-500' : 'bg-gray-500',
      trend: stats.totalCustomers > 0 ? '+15%' : '0%',
      trendUp: stats.totalCustomers > 0,
    },
    {
      title: 'Total Products',
      value: stats.totalProducts.toLocaleString(),
      icon: Package,
      color: stats.totalProducts > 0 ? 'bg-orange-500' : 'bg-gray-500',
      trend: stats.totalProducts > 0 ? '+5%' : '0%',
      trendUp: stats.totalProducts > 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-full ${card.color}`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              {card.trendUp ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-gray-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${card.trendUp ? 'text-green-600' : 'text-gray-600'}`}>
                {card.trend}
              </span>
              <span className="text-sm text-gray-500 ml-1">from last month</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
