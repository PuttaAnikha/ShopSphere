import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { PageLoader } from './components/common/Spinner';

// Layouts
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';
import SellerLayout from './layouts/SellerLayout';
import SupportLayout from './layouts/SupportLayout';
import DeliveryLayout from './layouts/DeliveryLayout';

// Route guard
import ProtectedRoute from './routes/ProtectedRoute';

// Public / Customer pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductsPage from './pages/ProductsPage';
import DealsPage from './pages/DealsPage';
import SellersPage from './pages/SellersPage';
import SellerStorePage from './pages/SellerStorePage';
import ForYouPage from './pages/ForYouPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import WishlistPage from './pages/WishlistPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import NotFoundPage from './pages/NotFoundPage';
import ForbiddenPage from './pages/ForbiddenPage';

// Admin pages
import AdminUsers from './pages/admin/AdminUsers';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSellers from './pages/admin/AdminSellers';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminReports from './pages/admin/AdminReports';
import AdminDisputes from './pages/admin/AdminDisputes';
import AdminOrders from './pages/admin/AdminOrders';
import AdminReviews from './pages/admin/AdminReviews';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';

// Seller pages
import SellerDashboard from './pages/seller/SellerDashboard';
import SellerProducts from './pages/seller/SellerProducts';
import SellerCreateProduct from './pages/seller/SellerCreateProduct';
import SellerOrders from './pages/seller/SellerOrders';
import SupportDashboard from './pages/support/SupportDashboard';
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';

function App() {
  const { loading } = useAuth();

  if (loading) return <PageLoader />;

  return (
    <Routes>
      {/* Public / Customer Layout */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/shop" element={<ProductsPage />} />
        <Route path="/deals" element={<DealsPage />} />
        <Route path="/sellers" element={<SellersPage />} />
        <Route path="/sellers/:id" element={<SellerStorePage />} />
        <Route path="/for-you" element={<ForYouPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />

        {/* Protected customer routes */}
        <Route path="/cart" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CartPage /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CheckoutPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><OrdersPage /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><OrderDetailPage /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><WishlistPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      </Route>

      {/* Admin Layout */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="sellers" element={<AdminSellers />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="disputes" element={<AdminDisputes />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="audit-logs" element={<AdminAuditLogs />} />
      </Route>

      {/* Seller Layout */}
      <Route path="/seller" element={<ProtectedRoute allowedRoles={['SELLER']}><SellerLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SellerDashboard />} />
        <Route path="products" element={<SellerProducts />} />
        <Route path="products/create" element={<SellerCreateProduct />} />
        <Route path="orders" element={<SellerOrders />} />
        <Route path="inventory" element={<SellerProducts />} />
        <Route path="analytics" element={<SellerDashboard />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="/support" element={<ProtectedRoute allowedRoles={['SUPPORT_AGENT']}><SupportLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SupportDashboard />} />
        <Route path="tickets" element={<SupportDashboard />} />
        <Route path="disputes" element={<SupportDashboard />} />
      </Route>

      <Route path="/delivery" element={<ProtectedRoute allowedRoles={['DELIVERY_PARTNER']}><DeliveryLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DeliveryDashboard />} />
      </Route>

      {/* Error routes */}
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
