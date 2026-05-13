import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';

import CustomerLayout from '../components/layout/CustomerLayout.jsx';
import AdminLayout from '../components/layout/AdminLayout.jsx';

// Lazy-loaded customer pages
const HomePage = lazy(() => import('../pages/customer/HomePage.jsx'));
const CatalogPage = lazy(() => import('../pages/customer/CatalogPage.jsx'));
const ProductPage = lazy(() => import('../pages/customer/ProductPage.jsx'));
const CartPage = lazy(() => import('../pages/customer/CartPage.jsx'));
const CheckoutPage = lazy(() => import('../pages/customer/CheckoutPage.jsx'));
const ConfirmationPage = lazy(() => import('../pages/customer/ConfirmationPage.jsx'));
const FavoritesPage = lazy(() => import('../pages/customer/FavoritesPage.jsx'));
const AccountPage = lazy(() => import('../pages/customer/AccountPage.jsx'));
const LoginPage = lazy(() => import('../pages/customer/LoginPage.jsx'));
const AboutPage = lazy(() => import('../pages/customer/AboutPage.jsx'));
const ContactPage = lazy(() => import('../pages/customer/ContactPage.jsx'));
const ForgotPasswordPage = lazy(() => import('../pages/customer/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('../pages/customer/ResetPasswordPage.jsx'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage.jsx'));

// Lazy-loaded admin pages
const DashboardPage = lazy(() => import('../pages/admin/DashboardPage.jsx'));
const OrdersPage = lazy(() => import('../pages/admin/OrdersPage.jsx'));
const OrderDetailPage = lazy(() => import('../pages/admin/OrderDetailPage.jsx'));
const ProductsPage = lazy(() => import('../pages/admin/ProductsPage.jsx'));
const CustomersPage = lazy(() => import('../pages/admin/CustomersPage.jsx'));
const SettingsPage = lazy(() => import('../pages/admin/SettingsPage.jsx'));
const PromotionsPage = lazy(() => import('../pages/admin/PromotionsPage.jsx'));
const ReviewsPage = lazy(() => import('../pages/admin/ReviewsPage.jsx'));

function PageSpinner() {
  return <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>;
}

function ProtectedAdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function AppRouter() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Customer routes */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/produs/:id" element={<ProductPage />} />
          <Route path="/cos" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/comanda/:id" element={<ConfirmationPage />} />
          <Route path="/favorite" element={<FavoritesPage />} />
          <Route path="/cont" element={<AccountPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/despre" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedAdminRoute><AdminLayout /></ProtectedAdminRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="comenzi" element={<OrdersPage />} />
          <Route path="comenzi/:id" element={<OrderDetailPage />} />
          <Route path="produse" element={<ProductsPage />} />
          <Route path="clienti" element={<CustomersPage />} />
          <Route path="promotii" element={<PromotionsPage />} />
          <Route path="recenzii" element={<ReviewsPage />} />
          <Route path="setari" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
