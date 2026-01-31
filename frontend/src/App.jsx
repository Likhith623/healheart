import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';

// Layout
import Layout from './components/Layout';

// Pages
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import SearchPage from './pages/SearchPage';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import FavoritesPage from './pages/customer/FavoritesPage';
import NotificationsPage from './pages/customer/NotificationsPage';
import RetailerDashboard from './pages/retailer/RetailerDashboard';
import StoreManagement from './pages/retailer/StoreManagement';
import InventoryManagement from './pages/retailer/InventoryManagement';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Redirect authenticated users
const PublicRoute = ({ children }) => {
  const { user, profile, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (user && profile) {
    // Redirect based on role
    if (profile.role === 'retailer') {
      return <Navigate to="/retailer/dashboard" replace />;
    }
    return <Navigate to="/customer/dashboard" replace />;
  }

  return children;
};

function App() {
  const { initialize, loading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'glass',
          style: {
            background: 'rgba(15, 23, 42, 0.9)',
            color: 'white',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: 'white',
            },
          },
        }}
      />

      {/* Floating background elements */}
      <div className="floating-bg bg-primary-500 top-0 left-0" />
      <div className="floating-bg bg-purple-500 bottom-0 right-0" style={{ animationDelay: '-10s' }} />
      <div className="floating-bg bg-pink-500 top-1/2 left-1/2" style={{ animationDelay: '-5s' }} />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route
            path="auth"
            element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            }
          />
          <Route path="search" element={<SearchPage />} />

          {/* Customer Routes */}
          <Route
            path="customer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="customer/favorites"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="customer/notifications"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Retailer Routes */}
          <Route
            path="retailer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['retailer']}>
                <RetailerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="retailer/stores"
            element={
              <ProtectedRoute allowedRoles={['retailer']}>
                <StoreManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="retailer/inventory"
            element={
              <ProtectedRoute allowedRoles={['retailer']}>
                <InventoryManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="retailer/inventory/:storeId"
            element={
              <ProtectedRoute allowedRoles={['retailer']}>
                <InventoryManagement />
              </ProtectedRoute>
            }
          />

          {/* Profile */}
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
