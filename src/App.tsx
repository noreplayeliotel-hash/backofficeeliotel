import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/Users';
import ListingsPage from './pages/Listings';
import BookingsPage from './pages/Bookings';
import CreateBookingPage from './pages/CreateBooking';
import ClientRefundsPage from './pages/ClientRefunds';
import BillingPage from './pages/Billing';
import PaymentHistoryPage from './pages/PaymentHistory';
import ReviewsPage from './pages/Reviews';
import ReportsPage from './pages/Reports';
import SendNotificationPage from './pages/SendNotification';
import PricingConfigPage from './pages/PricingConfig';
import './responsive.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Redirections racine et auth */}
              <Route path="/" element={<Navigate to="/admin" replace />} />
              <Route path="/login" element={<Navigate to="/admin/login" replace />} />
              <Route path="/signup" element={<Navigate to="/admin/signup" replace />} />

              {/* Routes authentification admin */}
              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin/signup" element={<Signup />} />

              {/* Backoffice sécurisé */}
              <Route path="/admin" element={
                <ProtectedRoute adminOnly>
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="listings" element={<ListingsPage />} />
                <Route path="bookings" element={<BookingsPage />} />
                <Route path="bookings/new" element={<CreateBookingPage />} />
                <Route path="refunds" element={<ClientRefundsPage />} />
                <Route path="billing" element={<BillingPage />} />
                <Route path="billing/history" element={<PaymentHistoryPage />} />
                <Route path="pricing" element={<PricingConfigPage />} />
                <Route path="reviews" element={<ReviewsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="notifications" element={<SendNotificationPage />} />
              </Route>

              {/* Redirection wildcard vers /admin */}
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
