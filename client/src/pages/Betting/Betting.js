import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CurrencyDollarIcon,
  TrophyIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const Betting = () => {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulate loading betting history
    setTimeout(() => {
      setBets([
        {
          id: 1,
          event: 'Manchester United vs Liverpool',
          type: 'Moneyline',
          selection: 'Manchester United',
          amount: 100,
          odds: 2.10,
          potentialPayout: 210,
          actualPayout: 210,
          status: 'won',
          placedAt: '2024-01-15T14:30:00Z',
          settledAt: '2024-01-15T16:45:00Z'
        },
        {
          id: 2,
          event: 'Lakers vs Warriors',
          type: 'Point Spread',
          selection: 'Lakers +5.5',
          amount: 50,
          odds: 1.91,
          potentialPayout: 95.50,
          status: 'pending',
          placedAt: '2024-01-18T10:15:00Z'
        },
        {
          id: 3,
          event: 'Chiefs vs Patriots',
          type: 'Over/Under',
          selection: 'Over 45.5',
          amount: 75,
          odds: 1.85,
          potentialPayout: 138.75,
          status: 'pending',
          placedAt: '2024-01-18T12:00:00Z'
        },
        {
          id: 4,
          event: 'Barcelona vs Real Madrid',
          type: 'Moneyline',
          selection: 'Barcelona',
          amount: 25,
          odds: 1.90,
          potentialPayout: 47.50,
          actualPayout: 0,
          status: 'lost',
          placedAt: '2024-01-14T16:20:00Z',
          settledAt: '2024-01-14T18:30:00Z'
        },
        {
          id: 5,
          event: 'Celtics vs Heat',
          type: 'Moneyline',
          selection: 'Celtics',
          amount: 150,
          odds: 1.75,
          potentialPayout: 262.50,
          actualPayout: 262.50,
          status: 'won',
          placedAt: '2024-01-13T19:45:00Z',
          settledAt: '2024-01-13T22:15:00Z'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDateTime = (dateString) => {
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
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'lost':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'won':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'lost':
        return <XCircleIcon className="h-4 w-4" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const filteredBets = bets.filter(bet => {
    const matchesFilter = filter === 'all' || bet.status === filter;
    const matchesSearch = bet.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bet.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bet.selection.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Calculate stats
  const totalBets = bets.length;
  const totalStaked = bets.reduce((sum, bet) => sum + bet.amount, 0);
  const totalWinnings = bets.filter(bet => bet.status === 'won').reduce((sum, bet) => sum + (bet.actualPayout || 0), 0);
  const pendingAmount = bets.filter(bet => bet.status === 'pending').reduce((sum, bet) => sum + bet.amount, 0);
  const winRate = totalBets > 0 ? (bets.filter(bet => bet.status === 'won').length / bets.filter(bet => bet.status !== 'pending').length * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Bets</h1>
            <p className="mt-2 text-indigo-100">
              Track your betting history and performance
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <TrophyIcon className="h-16 w-16 text-indigo-300 opacity-50 hidden md:block" />
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Staked</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalStaked)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center">
            <TrophyIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Winnings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalWinnings)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(pendingAmount)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Win Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{winRate}%</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center">
            <PlusIcon className="h-8 w-8 text-indigo-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Bets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalBets}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        {/* Search */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search bets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-2">
          {['all', 'pending', 'won', 'lost'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                filter === filterOption
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {filterOption}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Bets List */}
      <div className="space-y-4">
        {filteredBets.map((bet, index) => (
          <motion.div
            key={bet.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              {/* Bet Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bet.status)}`}>
                    {getStatusIcon(bet.status)}
                    <span className="ml-1">{bet.status}</span>
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {bet.type}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {bet.event}
                </h3>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  {bet.selection} @ {bet.odds}
                </p>

                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>Placed: {formatDateTime(bet.placedAt)}</span>
                  {bet.settledAt && (
                    <span>Settled: {formatDateTime(bet.settledAt)}</span>
                  )}
                </div>
              </div>

              {/* Bet Amount and Payout */}
              <div className="mt-4 lg:mt-0 lg:ml-6 lg:text-right">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Stake:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(bet.amount)}
                    </span>
                  </div>

                  {bet.status === 'pending' && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Potential:</span>
                      <span className="ml-2 font-semibold text-yellow-600 dark:text-yellow-400">
                        {formatCurrency(bet.potentialPayout)}
                      </span>
                    </div>
                  )}

                  {bet.status === 'won' && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Won:</span>
                      <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(bet.actualPayout)}
                      </span>
                    </div>
                  )}

                  {bet.status === 'lost' && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Lost:</span>
                      <span className="ml-2 font-semibold text-red-600 dark:text-red-400">
                        {formatCurrency(bet.amount)}
                      </span>
                    </div>
                  )}
                </div>

                {bet.status === 'pending' && (
                  <button className="mt-3 px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors text-sm">
                    Cancel Bet
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredBets.length === 0 && (
        <div className="text-center py-12">
          <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm
              ? `No bets found matching "${searchTerm}"`
              : `No ${filter === 'all' ? '' : filter} bets found`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default Betting;
