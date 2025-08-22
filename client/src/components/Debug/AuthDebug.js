import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

const AuthDebug = () => {
  const auth = useAuth();
  const [logs, setLogs] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  // Add log entry
  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      id: Date.now(),
      timestamp,
      message,
      type,
    };
    setLogs((prev) => [...prev.slice(-19), logEntry]); // Keep last 20 logs
  };

  // Monitor auth state changes
  useEffect(() => {
    addLog(
      `Auth state changed: isAuthenticated=${auth.isAuthenticated}, isLoading=${auth.isLoading}, hasToken=${!!auth.token}`,
      "state",
    );
  }, [auth.isAuthenticated, auth.isLoading, auth.token]);

  // Monitor user changes
  useEffect(() => {
    if (auth.user) {
      addLog(`User loaded: ${auth.user.username} (${auth.user.role})`, "user");
    } else if (!auth.isLoading && !auth.user) {
      addLog("User cleared", "user");
    }
  }, [auth.user, auth.isLoading]);

  // Monitor errors
  useEffect(() => {
    if (auth.error) {
      addLog(`Error: ${auth.error}`, "error");
    }
  }, [auth.error]);

  // Check localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken");
    const storedRefreshToken = localStorage.getItem("refreshToken");
    addLog(
      `Initial localStorage check: accessToken=${!!storedToken}, refreshToken=${!!storedRefreshToken}`,
      "storage",
    );
  }, []);

  // Only show in development and when debug is enabled
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.REACT_APP_ENABLE_AUTH_DEBUG
  ) {
    return null;
  }

  if (!isVisible && process.env.NODE_ENV === "production") {
    return null;
  }

  const getLogColor = (type) => {
    switch (type) {
      case "error":
        return "text-red-400";
      case "user":
        return "text-green-400";
      case "state":
        return "text-blue-400";
      case "storage":
        return "text-yellow-400";
      default:
        return "text-gray-300";
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case "error":
        return "❌";
      case "user":
        return "👤";
      case "state":
        return "🔄";
      case "storage":
        return "💾";
      default:
        return "ℹ️";
    }
  };

  return (
    <>
      {/* Debug Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="Toggle Auth Debug"
      >
        🐛
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-40 bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-md w-80 max-h-96 overflow-hidden shadow-xl">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-white font-semibold text-sm">Auth Debug</h3>
            <button
              onClick={() => setLogs([])}
              className="text-gray-400 hover:text-white text-xs"
              title="Clear logs"
            >
              Clear
            </button>
          </div>

          {/* Current State */}
          <div className="mb-3 p-2 bg-gray-800 rounded text-xs">
            <div className="text-gray-300 mb-1">Current State:</div>
            <div className="text-green-400">
              ✓ Authenticated: {auth.isAuthenticated ? "Yes" : "No"}
            </div>
            <div className="text-blue-400">
              🔄 Loading: {auth.isLoading ? "Yes" : "No"}
            </div>
            <div className="text-yellow-400">
              🎫 Has Token: {auth.token ? "Yes" : "No"}
            </div>
            <div className="text-purple-400">
              🔄 Refresh Token: {auth.refreshToken ? "Yes" : "No"}
            </div>
            {auth.user && (
              <div className="text-green-400">
                👤 User: {auth.user.username} ({auth.user.role})
              </div>
            )}
            {auth.error && (
              <div className="text-red-400">❌ Error: {auth.error}</div>
            )}
          </div>

          {/* Logs */}
          <div className="space-y-1 text-xs overflow-y-auto max-h-48">
            <div className="text-gray-400 sticky top-0 bg-gray-900 py-1">
              Recent Activity:
            </div>
            {logs.length === 0 ? (
              <div className="text-gray-500 italic">No logs yet...</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 py-1">
                  <span className="flex-shrink-0">{getLogIcon(log.type)}</span>
                  <span className="text-gray-500 flex-shrink-0 w-16">
                    {log.timestamp}
                  </span>
                  <span className={`${getLogColor(log.type)} break-words`}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="mt-3 pt-2 border-t border-gray-700 flex gap-2">
            <button
              onClick={() => {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                window.location.reload();
              }}
              className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
              title="Clear tokens and reload"
            >
              Force Logout
            </button>
            <button
              onClick={() => {
                console.log("Current Auth State:", {
                  ...auth,
                  localStorage: {
                    accessToken: localStorage.getItem("accessToken"),
                    refreshToken: localStorage.getItem("refreshToken"),
                  },
                });
              }}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
              title="Log state to console"
            >
              Log State
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// Only export in development or when explicitly enabled
export default process.env.NODE_ENV === "development" ||
process.env.REACT_APP_ENABLE_AUTH_DEBUG
  ? AuthDebug
  : () => null;
