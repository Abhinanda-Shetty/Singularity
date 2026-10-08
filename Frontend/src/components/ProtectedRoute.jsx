import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../services/api';

/**
 * ProtectedRoute — wraps dashboard routes.
 * Redirects unauthenticated users to /login.
 */
export default function ProtectedRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
