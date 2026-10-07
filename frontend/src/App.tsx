import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';

// Protected User Pages
import { Dashboard } from './pages/user/Dashboard';
import { Chat } from './pages/user/Chat';
import { Conversations } from './pages/user/Conversations';
import { Usage } from './pages/user/Usage';
import { Profile } from './pages/user/Profile';

// Protected Admin Pages
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminModels } from './pages/admin/AdminModels';
import { AdminPolicies } from './pages/admin/AdminPolicies';
import { PolicyDocuments } from './pages/admin/PolicyDocuments';
import { SecurityEvents } from './pages/admin/SecurityEvents';
import { AuditLogs } from './pages/admin/AuditLogs';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({
  children,
  requiredRole,
}) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
        Loading AURA Gateway Session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (
    requiredRole &&
    !['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'SECURITY_ADMIN', 'POLICY_ADMIN'].includes(role || '')
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <Sidebar />
      {children}
    </>
  );
};

export const App: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isPublicPage = ['/', '/login', '/register', '/forgot-password', '/reset-password'].includes(
    location.pathname
  );

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected User Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/conversations"
        element={
          <ProtectedRoute>
            <Conversations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/usage"
        element={
          <ProtectedRoute>
            <Usage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Protected Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminOverview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/models"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminModels />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/policies"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminPolicies />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/policies/documents"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <PolicyDocuments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/security"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <SecurityEvents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit-logs"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AuditLogs />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
