import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  ChartBarIcon,
  TrophyIcon,
  CurrencyDollarIcon,
  UserIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  MoonIcon,
  SunIcon,
  ArrowRightOnRectangleIcon,
  UsersIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSocket } from '../../contexts/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasRole } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { isConnected } = useSocket();

  // Navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/app/dashboard', icon: HomeIcon },
      { name: 'Sports', href: '/app/sports', icon: TrophyIcon },
      { name: 'Events', href: '/app/events', icon: ChartBarIcon },
      { name: 'Betting', href: '/app/betting', icon: CurrencyDollarIcon },
      { name: 'Wallet', href: '/app/wallet', icon: CurrencyDollarIcon },
      { name: 'Profile', href: '/app/profile', icon: UserIcon },
    ];

    if (hasRole(['admin', 'super_admin'])) {
      return [
        ...baseItems,
        { name: 'Admin Panel', href: '/admin', icon: CogIcon },
        { name: 'User Management', href: '/admin/users', icon: UsersIcon },
        { name: 'Reports', href: '/admin/reports', icon: ChartPieIcon },
      ];
    }

    if (hasRole(['agent', 'sub_agent'])) {
      return [
        ...baseItems,
        { name: 'Agent Panel', href: '/agent', icon: CogIcon },
        { name: 'My Users', href: '/agent/users', icon: UsersIcon },
        { name: 'Commission', href: '/agent/commission', icon: ChartPieIcon },
      ];
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  const handleLogout = async () => {
    await logout();
  };

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 40
      }
    },
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 40
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        variants={sidebarVariants}
        animate={sidebarOpen ? "open" : "closed"}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg lg:translate-x-0 lg:static lg:inset-0"
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center border-b border-gray-200 dark:border-gray-700 px-4">
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">
                SB
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">
                SportsBet
              </span>
            </div>
            <button
              type="button"
              className="ml-auto lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-gray-400" />
            </button>
          </div>

          {/* User info */}
          <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role}
                </p>
              </div>
              {/* Connection status */}
              <div className="ml-auto">
                <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}
                     title={isConnected ? 'Connected' : 'Disconnected'} />
              </div>
            </div>
            {user?.balance !== undefined && (
              <div className="mt-2 px-2 py-1 bg-green-50 dark:bg-green-900 rounded-md">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Balance: ${user.balance.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive
                        ? 'text-indigo-500 dark:text-indigo-400'
                        : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Settings & Logout */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-2 py-4">
            <button
              onClick={toggleTheme}
              className="group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white transition-colors duration-200"
            >
              {isDark ? (
                <SunIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              ) : (
                <MoonIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              )}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>

            <button
              onClick={handleLogout}
              className="group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-900 dark:text-gray-300 dark:hover:bg-red-900 dark:hover:text-red-100 transition-colors duration-200"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-500" />
              Sign out
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex h-16 items-center gap-x-4 px-4 sm:gap-x-6 sm:px-6 lg:px-8">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* Breadcrumb or page title */}
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {navigationItems.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h1>
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notifications */}
              <div className="relative">
                <button
                  type="button"
                  className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  onClick={() => setNotificationOpen(!notificationOpen)}
                >
                  <BellIcon className="h-6 w-6" />
                  {/* Notification badge */}
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                </button>

                {/* Notification dropdown */}
                <AnimatePresence>
                  {notificationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 dark:divide-gray-700"
                    >
                      <div className="p-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          Notifications
                        </h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                          No new notifications
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile dropdown */}
              <div className="relative">
                <div className="flex items-center text-sm">
                  <span className="hidden lg:flex lg:items-center">
                    <span className="ml-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {user?.username}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Click outside to close notifications */}
      {notificationOpen && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setNotificationOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
