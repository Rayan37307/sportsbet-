import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CurrencyDollarIcon,
  TrophyIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  FireIcon,
  EyeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const { isConnected } = useSocket();
  const [stats, setStats] = useState({
    balance: 0,
    totalBets: 0,
    winRate: 0,
    totalWinnings: 0,
    pendingBets: 0,
    todayBets: 0
  });
  const [recentBets, setRecentBets] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading user stats and data
    setTimeout(() => {
      setStats({
        balance: user?.balance || 1250.00,
        totalBets: 47,
        winRate: 68.5,
        totalWinnings: 2340.50,
        pendingBets: 3,
        todayBets: 5
      });

      setRecentBets([
        {
          id: 1,
          event: 'Lakers vs Warriors',
          type: 'Moneyline',
          amount: 50,
          odds: 1.85,
          status: 'won',
          payout: 92.50,
          date: '2024-01-15'
        },
        {
          id: 2,
          event: 'Chiefs vs Patriots',
          type: 'Spread',
          amount: 100,
          odds: 1.91,
          status: 'pending',
          payout: 191.00,
          date: '2024-01-16'
        },
        {
          id: 3,
          event: 'Barcelona vs Real Madrid',
          type: 'Over/Under',
          amount: 25,
          odds: 1.75,
          status: 'lost',
          payout: 0,
          date: '2024-01-14'
        }
      ]);

      setUpcomingEvents([
        {
          id: 1,
          title: 'Manchester United vs Liverpool',
          sport: 'Football',
          date: '2024-01-18T15:00:00Z',
          odds: { home: 2.10, away: 1.85, draw: 3.20 }
        },
        {
          id: 2,
          title: 'Celtics vs Heat',
          sport: 'Basketball',
          date: '2024-01-18T20:30:00Z',
          odds: { home: 1.95, away: 1.89 }
        },
        {
          id: 3,
          title: 'Rams vs Cardinals',
          sport: 'American Football',
          date: '2024-01-19T18:00:00Z',
          odds: { home: 1.75, away: 2.05 }
        }
      ]);

      setLoading(false);
    }, 1500);
  }, [user]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'won':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'lost':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, trend, trendValue }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center">
            <Icon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            <h3 className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400">
              {title}
            </h3>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-300">{subtitle}</p>
          )}
        </div>
        {trend && (
          <div className={`flex items-center ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? (
              <ArrowUpIcon className="h-4 w-4" />
            ) : (
              <ArrowDownIcon className="h-4 w-4" />
            )}
            <span className="ml-1 text-sm font-medium">{trendValue}</span>
          </div>
        )}
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Message */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {user?.firstName || 'User'}! 👋
            </h1>
            <p className="mt-2 text-indigo-100">
              Ready to place some winning bets today?
            </p>
            <div className="mt-4 flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} mr-2`} />
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                Last login: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <TrophyIcon className="h-24 w-24 text-indigo-300 opacity-50" />
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={CurrencyDollarIcon}
          title="Account Balance"
          value={formatCurrency(stats.balance)}
          trend="up"
          trendValue="12.5%"
        />
        <StatCard
          icon={ChartBarIcon}
          title="Total Bets"
          value={stats.totalBets}
          subtitle="All time"
        />
        <StatCard
          icon={TrophyIcon}
          title="Win Rate"
          value={`${stats.winRate}%`}
          trend="up"
          trendValue="5.2%"
        />
        <StatCard
          icon={FireIcon}
          title="Total Winnings"
          value={formatCurrency(stats.totalWinnings)}
          trend="up"
          trendValue="8.1%"
        />
        <StatCard
          icon={ClockIcon}
          title="Pending Bets"
          value={stats.pendingBets}
          subtitle="Awaiting results"
        />
        <StatCard
          icon={UserGroupIcon}
          title="Today's Bets"
          value={stats.todayBets}
          subtitle="So far today"
        />
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/app/sports"
            className="flex items-center justify-center px-4 py-3 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
          >
            <TrophyIcon className="h-5 w-5 mr-2" />
            Browse Sports
          </Link>
          <Link
            to="/app/events"
            className="flex items-center justify-center px-4 py-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
          >
            <EyeIcon className="h-5 w-5 mr-2" />
            Live Events
          </Link>
          <Link
            to="/app/wallet"
            className="flex items-center justify-center px-4 py-3 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Funds
          </Link>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bets */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Bets
            </h2>
            <Link
              to="/app/betting"
              className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentBets.map((bet) => (
              <div
                key={bet.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {bet.event}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {bet.type} • {formatCurrency(bet.amount)} @ {bet.odds}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bet.status)}`}>
                    {bet.status}
                  </span>
                  {bet.status === 'won' && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      +{formatCurrency(bet.payout)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Upcoming Events */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Upcoming Events
            </h2>
            <Link
              to="/app/events"
              className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {event.title}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                    {event.sport}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {formatDate(event.date)}
                </p>
                <div className="flex space-x-2">
                  <button className="flex-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 py-1 px-2 rounded text-sm hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors">
                    {event.odds.home}
                  </button>
                  {event.odds.draw && (
                    <button className="flex-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-1 px-2 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors">
                      {event.odds.draw}
                    </button>
                  )}
                  <button className="flex-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 py-1 px-2 rounded text-sm hover:bg-red-200 dark:hover:bg-red-800 transition-colors">
                    {event.odds.away}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Agent/Admin Specific Sections */}
      {hasRole(['agent', 'sub_agent', 'admin']) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {hasRole(['admin']) ? 'Admin Dashboard' : 'Agent Portal'}
              </h2>
              <p className="mt-2 text-green-100">
                Manage your {hasRole(['admin']) ? 'platform' : 'players'} and track performance
              </p>
            </div>
            <div className="flex space-x-4">
              {hasRole(['admin']) && (
                <Link
                  to="/admin"
                  className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Admin Panel
                </Link>
              )}
              {hasRole(['agent', 'sub_agent']) && (
                <Link
                  to="/agent"
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Agent Panel
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
