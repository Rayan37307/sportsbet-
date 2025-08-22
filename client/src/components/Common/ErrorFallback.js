import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
        <div className="text-center">
          {/* Error icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>

          {/* Error title */}
          <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
            Oops! Something went wrong
          </h1>

          {/* Error message */}
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            We're sorry, but something unexpected happened. Our team has been notified and is working to fix this issue.
          </p>

          {/* Error details (only in development) */}
          {process.env.NODE_ENV === 'development' && error && (
            <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-left">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Error Details:
              </h3>
              <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap overflow-auto max-h-32">
                {error.message}
              </pre>
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                    Stack Trace
                  </summary>
                  <pre className="text-xs text-gray-500 dark:text-gray-500 whitespace-pre-wrap overflow-auto max-h-40 mt-2">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-8 space-y-3">
            {resetErrorBoundary && (
              <button
                onClick={resetErrorBoundary}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Try Again
              </button>
            )}

            <button
              onClick={handleReload}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              Reload Page
            </button>

            <button
              onClick={handleGoHome}
              className="w-full text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors duration-200"
            >
              Go to Homepage
            </button>
          </div>

          {/* Help text */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              If this problem persists, please contact our support team at{' '}
              <a
                href="mailto:support@sportsbook.com"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
              >
                support@sportsbook.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;
