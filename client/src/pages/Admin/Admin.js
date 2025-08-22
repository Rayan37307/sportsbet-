import React from 'react';
import { motion } from 'framer-motion';
import {
  UsersIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CogIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const Admin = () => {
  const stats = {
    totalUsers: 15420,
    activeBets: 2340,
    totalRevenue: 125000,
    systemStatus: 'operational'
  };

  const recentActivity = [
    { id: 1, type: 'user_registration', message: 'New user registered: john_doe', time: '2 minutes ago' },
    { id: 2, type: 'large_bet', message: 'Large bet placed: $5000 on Lakers vs Warriors', time: '15 minutes ago' },
    { id: 3, type: 'payout', message: 'Payout processed: $2500 to user mike_smith', time: '32 minutes ago' },
    { id: 4, type: 'system', message: 'Odds updated for upcoming NFL games', time: '1 hour ago' }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="mt-2 text-red-100">
              Monitor and manage your sportsbook platform
            </p>
          </div>
          <CogIcon className="h-16 w-16 text-red-300 opacity-50 hidden md:block" />
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center">
            <UsersIcon className="h-12 w-12 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalUsers.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center">
            <TrophyIcon className="h-12 w-12 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Bets</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.activeBets.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-12 w-12 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center">
            <CheckCircleIcon className="h-12 w-12 text-emerald-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">System Status</p>
              <p className="text-xl font-bold text-emerald-600 capitalize">
                {stats.systemStatus}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors">
            <UsersIcon className="h-6 w-6 mr-2" />
            Manage Users
          </button>
          <button className="flex items-center justify-center p-4 bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-800 transition-colors">
            <TrophyIcon className="h-6 w-6 mr-2" />
            Manage Events
          </button>
          <button className="flex items-center justify-center p-4 bg-purple-50 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors">
            <ChartBarIcon className="h-6 w-6 mr-2" />
            View Reports
          </button>
          <button className="flex items-center justify-center p-4 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-800 transition-colors">
            <CogIcon className="h-6 w-6 mr-2" />
            System Settings
          </button>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Recent Activity
        </h2>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-shrink-0">
                {activity.type === 'user_registration' && (
                  <UsersIcon className="h-6 w-6 text-blue-600" />
                )}
                {activity.type === 'large_bet' && (
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                )}
                {activity.type === 'payout' && (
                  <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                )}
                {activity.type === 'system' && (
                  <CogIcon className="h-6 w-6 text-gray-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">
                  {activity.message}
                </p>
                <div className="flex items-center mt-1">
                  <ClockIcon className="h-3 w-3 text-gray-400 mr-1" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.time}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* System Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-xl p-6"
      >
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-3 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              System Notifications
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                • Scheduled maintenance tonight at 2:00 AM EST (2 hours)
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                • New API rate limits will be enforced starting next week
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                • Database backup completed successfully at 1:00 AM
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Admin;
