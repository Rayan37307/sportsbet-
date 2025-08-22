import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, isLoading, user, hasRole, token } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Verifying authentication...
          </p>
        </div>
      </div>
    );
  }

  // Only redirect to login if we're sure the user is not authenticated
  // (no token and not loading)
  if (!isAuthenticated && !token && !isLoading) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If we have a token but no user yet (still loading user data), show loading
  if (token && !user && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Loading user data...
          </p>
        </div>
      </div>
    );
  }

  // Check if user account is active
  if (user && user.status !== "active") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Account {user.status}
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {user.status === "suspended"
                ? "Your account has been suspended. Please contact support for assistance."
                : user.status === "banned"
                  ? "Your account has been banned. Contact support if you believe this is an error."
                  : "Your account is not active. Please contact support."}
            </p>
            <div className="mt-6">
              <button
                onClick={() =>
                  (window.location.href = "mailto:support@sportsbook.com")
                }
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check role-based access if required
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <svg
                className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Access Denied
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              You don't have permission to access this area.
              {Array.isArray(requiredRole)
                ? ` Required roles: ${requiredRole.join(", ")}`
                : ` Required role: ${requiredRole}`}
            </p>
            <div className="mt-6">
              <Navigate to="/app/dashboard" replace />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render protected content
  return children;
};

export default ProtectedRoute;
