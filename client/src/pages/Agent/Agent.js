import React from 'react';
import { motion } from 'framer-motion';
import {
  UsersIcon,
  CurrencyDollarIcon,
  ChartPieIcon,
  TrophyIcon,
  PlusIcon,
  EyeIcon,
  StarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const Agent = () => {
  const stats = {
    totalUsers: 45,
    activeUsers: 38,
    totalCommission: 2450.75,
    monthlyCommission: 890.25,
    conversionRate: 68.5
  };

  const myUsers = [
    { id: 1, username: 'john_doe', balance: 450.50, lastActive: '2 hours ago', status: 'active' },
    { id: 2, username: 'mike_smith', balance: 1250.00, lastActive: '1 day ago', status: 'active' },
    { id: 3, username: 'sarah_jones', balance: 75.25, lastActive: '3 days ago', status: 'suspended' },
    { id: 4, username: 'alex_brown', balance: 890.80, lastActive: '5 hours ago', status: 'active' }
  ];

  const commissionHistory = [
    { id: 1, user: 'john_doe', amount: 45.50, type: 'betting_commission', date: '2024-01-18' },
    { id: 2, user: 'mike_smith', amount: 125.75, type: 'betting_commission', date: '2024-01-17' },
    { id: 3, user: 'sarah_jones', amount: 32.25, type: 'deposit_bonus', date: '2024-01-16' },
    { id: 4, user: 'alex_brown', amount: 67.80, type: 'betting_commission', date: '2024-01-15' }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'banned':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Agent Dashboard</h1>
            <p className="mt-2 text-teal-100">
              Manage your players and track your commissions
            </p>
          </div>
          <StarIcon className="h-16 w-16 text-teal-300 opacity-50 hidden md:block" />
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center">
            <UsersIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalUsers}
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
            <EyeIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.activeUsers}
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
            <CurrencyDollarIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Commission</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.totalCommission)}
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
            <ChartPieIcon className="h-8 w-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">This Month</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.monthlyCommission)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center">
            <TrophyIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.conversionRate}%
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors">
            <PlusIcon className="h-6 w-6 mr-2" />
            Add New User
          </button>
          <button className="flex items-center justify-center p-4 bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-800 transition-colors">
            <UsersIcon className="h-6 w-6 mr-2" />
            Manage Users
          </button>
          <button className="flex items-center justify-center p-4 bg-purple-50 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors">
            <ChartPieIcon className="h-6 w-6 mr-2" />
            View Reports
          </button>
        </div>
      </motion.div>

      {/* My Users and Commission History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Users */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              My Users
            </h2>
            <button className="text-teal-600 hover:text-teal-500 text-sm font-medium">
              View all
            </button>
          </div>
          <div className="space-y-4">
            {myUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <UsersIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.username}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Balance: {formatCurrency(user.balance)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {user.lastActive}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Commission History */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Commissions
            </h2>
            <button className="text-teal-600 hover:text-teal-500 text-sm font-medium">
              View all
            </button>
          </div>
          <div className="space-y-4">
            {commissionHistory.map((commission) => (
              <div
                key={commission.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {commission.user}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {commission.type.replace('_', ' ')}
                  </p>
                  <div className="flex items-center mt-1">
                    <ClockIcon className="h-3 w-3 text-gray-400 mr-1" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {commission.date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    +{formatCurrency(commission.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Performance Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">Great Performance! 🎉</h3>
            <p className="mt-2 text-yellow-100">
              You're in the top 10% of agents this month with {stats.conversionRate}% conversion rate
            </p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <p className="text-3xl font-bold">{formatCurrency(stats.monthlyCommission)}</p>
              <p className="text-yellow-200">This month's earnings</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Agent;
