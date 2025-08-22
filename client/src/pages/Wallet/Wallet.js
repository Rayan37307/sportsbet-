import React from 'react';
import { motion } from 'framer-motion';
import {
  CurrencyDollarIcon,
  PlusIcon,
  MinusIcon,
  CreditCardIcon,
  BanknotesIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

const Wallet = () => {
  const balance = 1250.50;
  const transactions = [
    { id: 1, type: 'deposit', amount: 100, date: '2024-01-18', method: 'Credit Card', status: 'completed' },
    { id: 2, type: 'withdrawal', amount: 50, date: '2024-01-17', method: 'Bank Transfer', status: 'pending' },
    { id: 3, type: 'bet_payout', amount: 75, date: '2024-01-16', method: 'Bet Winnings', status: 'completed' },
    { id: 4, type: 'deposit', amount: 200, date: '2024-01-15', method: 'PayPal', status: 'completed' }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Wallet</h1>
            <p className="mt-2 text-green-100">
              Manage your funds and transactions
            </p>
          </div>
          <CurrencyDollarIcon className="h-16 w-16 text-green-300 opacity-50 hidden md:block" />
        </div>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center"
      >
        <h2 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
          Current Balance
        </h2>
        <p className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
          {formatCurrency(balance)}
        </p>

        <div className="flex justify-center space-x-4">
          <button className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <PlusIcon className="h-5 w-5 mr-2" />
            Deposit
          </button>
          <button className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            <MinusIcon className="h-5 w-5 mr-2" />
            Withdraw
          </button>
        </div>
      </motion.div>

      {/* Payment Methods */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Payment Methods
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <CreditCardIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Credit Card</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">**** 1234</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <BanknotesIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">PayPal</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">user@email.com</p>
            </div>
          </div>
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-400 transition-colors">
            <PlusIcon className="h-6 w-6 text-gray-400 mr-2" />
            <span className="text-gray-500 dark:text-gray-400">Add Method</span>
          </button>
        </div>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Recent Transactions
        </h2>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                {transaction.type === 'deposit' || transaction.type === 'bet_payout' ? (
                  <ArrowDownIcon className="h-5 w-5 text-green-600 mr-3" />
                ) : (
                  <ArrowUpIcon className="h-5 w-5 text-red-600 mr-3" />
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">
                    {transaction.type.replace('_', ' ')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {transaction.method} • {transaction.date}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${
                  transaction.type === 'deposit' || transaction.type === 'bet_payout'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {transaction.type === 'deposit' || transaction.type === 'bet_payout' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </p>
                <p className={`text-xs ${
                  transaction.status === 'completed'
                    ? 'text-green-600'
                    : 'text-yellow-600'
                }`}>
                  {transaction.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Wallet;
