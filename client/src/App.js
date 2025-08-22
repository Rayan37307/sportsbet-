import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { Toaster } from "react-hot-toast";
import { HelmetProvider } from "react-helmet-async";
import { ErrorBoundary } from "react-error-boundary";

// Context providers
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { BetSlipProvider } from "./contexts/BetSlipContext";

// Components
import TopNavLayout from "./components/Layout/TopNavLayout";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import ErrorFallback from "./components/Common/ErrorFallback";

// Pages
import Home from "./pages/Home/Home";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import Sports from "./pages/Sports/Sports";
import Live from "./pages/Live/Live";
import Casino from "./pages/Casino/Casino";
import Events from "./pages/Events/Events";
import Betting from "./pages/Betting/Betting";
import Wallet from "./pages/Wallet/Wallet";
import Profile from "./pages/Profile/Profile";
import Admin from "./pages/Admin/Admin";
import Agent from "./pages/Agent/Agent";
import NotFound from "./pages/NotFound/NotFound";
import AuthDebug from "./components/Debug/AuthDebug";

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <Router>
              <AuthProvider>
                <SocketProvider>
                  <BetSlipProvider>
                    <Routes>
                      {/* Public routes */}
                      <Route path="/" element={<Home />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />

                      {/* Protected routes with top navigation layout */}
                      <Route
                        path="/app"
                        element={
                          <ProtectedRoute>
                            <TopNavLayout />
                          </ProtectedRoute>
                        }
                      >
                        <Route
                          index
                          element={<Navigate to="/app/sports" replace />}
                        />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="sports" element={<Sports />} />
                        <Route path="live" element={<Live />} />
                        <Route path="casino" element={<Casino />} />
                        <Route
                          path="live-casino"
                          element={
                            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
                              <h1 className="text-2xl">
                                Live Casino - Coming Soon
                              </h1>
                            </div>
                          }
                        />
                        <Route
                          path="more"
                          element={
                            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
                              <h1 className="text-2xl">
                                More Features - Coming Soon
                              </h1>
                            </div>
                          }
                        />
                        <Route path="cashier" element={<Wallet />} />
                        <Route path="events" element={<Events />} />
                        <Route path="betting" element={<Betting />} />
                        <Route path="wallet" element={<Wallet />} />
                        <Route path="profile" element={<Profile />} />
                        <Route
                          path="settings"
                          element={
                            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
                              <h1 className="text-2xl">
                                Settings - Coming Soon
                              </h1>
                            </div>
                          }
                        />
                        <Route
                          path="search"
                          element={
                            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
                              <h1 className="text-2xl">
                                Search Results - Coming Soon
                              </h1>
                            </div>
                          }
                        />
                      </Route>

                      {/* Admin routes */}
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute requiredRole="admin">
                            <TopNavLayout />
                          </ProtectedRoute>
                        }
                      >
                        <Route index element={<Admin />} />
                      </Route>

                      {/* Agent routes */}
                      <Route
                        path="/agent"
                        element={
                          <ProtectedRoute requiredRole={["agent", "sub_agent"]}>
                            <TopNavLayout />
                          </ProtectedRoute>
                        }
                      >
                        <Route index element={<Agent />} />
                      </Route>

                      {/* 404 route */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>

                    {/* Global toast notifications */}
                    <Toaster
                      position="top-right"
                      toastOptions={{
                        duration: 4000,
                        style: {
                          background: "#1f2937",
                          color: "#fff",
                          border: "1px solid #374151",
                        },
                        success: {
                          duration: 3000,
                          iconTheme: {
                            primary: "#10b981",
                            secondary: "#fff",
                          },
                        },
                        error: {
                          duration: 5000,
                          iconTheme: {
                            primary: "#ef4444",
                            secondary: "#fff",
                          },
                        },
                      }}
                    />

                    {/* Debug component for development */}
                    {process.env.NODE_ENV === "development" && <AuthDebug />}
                  </BetSlipProvider>
                </SocketProvider>
              </AuthProvider>
            </Router>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
