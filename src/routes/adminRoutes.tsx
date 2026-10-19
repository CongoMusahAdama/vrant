import { Route } from 'react-router-dom';
import Dashboard from '../admin/pages/Dashboard';
import Products from '../admin/pages/Products';
import Orders from '../admin/pages/Orders';
import Customers from '../admin/pages/Customers';
import Analytics from '../admin/pages/Analytics';
import Settings from '../admin/pages/Settings';

export const adminRoutes = [
  <Route key="admin-dashboard" path="/admin" element={<Dashboard />} />,
  <Route key="admin-products" path="/admin/products" element={<Products />} />,
  <Route key="admin-orders" path="/admin/orders" element={<Orders />} />,
  <Route key="admin-customers" path="/admin/customers" element={<Customers />} />,
  <Route key="admin-analytics" path="/admin/analytics" element={<Analytics />} />,
  <Route key="admin-settings" path="/admin/settings" element={<Settings />} />,
];
