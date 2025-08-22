import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { useBetSlip } from '../../contexts/BetSlipContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const BetSlip = ({ isOpen, onClose }) => {
  const {
    selections,
    totalStake,
    potentialPayout,
    totalOdds,
    betType,
    isLoading,
    error,
    addSelection,
    removeSelection,
    updateStake,
    setBetType,
    clearSelections,
    placeBet,
    validateBetSlip,
    getSelectionCount
  } = useBetSlip();

  const { user } = useAuth();
  const [quickBetAmounts] = useState([5, 10, 25, 50, 100]);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatOdds = (odds) => {
    // Convert decimal odds to American odds
    if (odds >= 2) {
      return `+${Math.round((odds - 1) * 100)}`;
    } else {
      return `-${Math.round(100 / (odds - 1))}`;
    }
  };

  const getOddsColor = (selection) => {
    if (selection.updated) {
      return selection.odds > selection.originalOdds ? 'text-green-400' : 'text-red-400';
    }
    return 'text-white';
  };

  const handleStakeChange = (selectionId, value) => {
    const numericValue = parseFloat(value) || 0;
    updateStake(selectionId, numericValue);
  };

  const handleQuickStake = (selectionId, amount) => {
    updateStake(selectionId, amount);
  };

  const handlePlaceBet = async () => {
    const validation = validateBetSlip();
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    const result = await placeBet();
    if (result.success) {
      onClose();
    }
  };

  const handleClearSelections = () => {
    if (selections.length > 0) {
      setShowConfirmClear(true);
    }
  };

  const confirmClear = () => {
    clearSelections();
    setShowConfirmClear(false);
  };

  const getTimeUntilEvent = (eventTime) => {
    const now = new Date();
    const event = new Date(eventTime);
    const diff = event - now;

    if (diff <= 0) return 'Started';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const betSlipVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300
      }
    },
    exit: {
      x: '100%',
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Bet Slip Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={betSlipVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-800 border-l border-gray-700 shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-semibold text-white">Bet Slip</h2>
                {getSelectionCount() > 0 && (
                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">
                    {getSelectionCount()}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {selections.length === 0 ? (
                /* Empty State */
                <div className="flex-1 flex items-center justify-center p-8 text-center">
                  <div>
                    <CurrencyDollarIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Your bet slip is empty</h3>
                    <p className="text-gray-400 text-sm">
                      Add selections from the sports markets to get started
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  {/* Bet Type Selector */}
                  {selections.length > 1 && (
                    <div className="p-4 border-b border-gray-700">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setBetType('single')}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            betType === 'single'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          Single
                        </button>
                        <button
                          onClick={() => setBetType('parlay')}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            betType === 'parlay'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          Parlay
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Selections List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <AnimatePresence>
                      {selections.map((selection) => (
                        <motion.div
                          key={selection.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="bg-gray-700 rounded-lg p-4 space-y-3"
                        >
                          {/* Selection Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-blue-400">
                                  {selection.league}
                                </span>
                                <ClockIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-400">
                                  {getTimeUntilEvent(selection.eventTime)}
                                </span>
                              </div>
                              <h4 className="text-white font-medium mt-1">
                                {selection.team1} vs {selection.team2}
                              </h4>
                              <p className="text-sm text-gray-300">
                                {selection.marketType} - {selection.selection}
                              </p>
                            </div>
                            <button
                              onClick={() => removeSelection(selection.eventId, selection.marketType, selection.selection)}
                              className="p-1 hover:bg-gray-600 rounded transition-colors"
                            >
                              <XMarkIcon className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>

                          {/* Odds Display */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className={`text-lg font-bold ${getOddsColor(selection)}`}>
                                {formatOdds(selection.odds)}
                              </span>
                              {selection.updated && (
                                <div className="flex items-center">
                                  {selection.odds > selection.originalOdds ? (
                                    <ArrowTrendingUpIcon className="w-4 h-4 text-green-400" />
                                  ) : (
                                    <ArrowTrendingDownIcon className="w-4 h-4 text-red-400" />
                                  )}
                                </div>
                              )}
                            </div>
                            <span className="text-sm text-gray-400">
                              ({selection.odds.toFixed(2)})
                            </span>
                          </div>

                          {/* Stake Input */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">
                              Stake
                            </label>
                            <div className="flex space-x-2">
                              <div className="flex-1">
                                <input
                                  type="number"
                                  min="1"
                                  max="10000"
                                  step="0.01"
                                  value={selection.stake || ''}
                                  onChange={(e) => handleStakeChange(selection.id, e.target.value)}
                                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>

                            {/* Quick Stakes */}
                            <div className="flex space-x-1">
                              {quickBetAmounts.map((amount) => (
                                <button
                                  key={amount}
                                  onClick={() => handleQuickStake(selection.id, amount)}
                                  className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors"
                                >
                                  ${amount}
                                </button>
                              ))}
                            </div>

                            {/* Potential Payout for Single Bet */}
                            {selection.stake > 0 && (
                              <div className="text-right">
                                <span className="text-sm text-gray-400">To win: </span>
                                <span className="text-sm font-semibold text-green-400">
                                  {formatCurrency(selection.stake * selection.odds)}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Summary */}
                  <div className="border-t border-gray-700 p-4 space-y-3">
                    {betType === 'parlay' && selections.length > 1 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Combined Odds:</span>
                        <span className="text-white font-semibold">
                          {formatOdds(totalOdds)} ({totalOdds.toFixed(2)})
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Stake:</span>
                      <span className="text-white font-semibold">
                        {formatCurrency(totalStake)}
                      </span>
                    </div>

                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-gray-300">Potential Payout:</span>
                      <span className="text-green-400">
                        {formatCurrency(potentialPayout)}
                      </span>
                    </div>

                    {/* Error Display */}
                    {error && (
                      <div className="flex items-center space-x-2 p-2 bg-red-900 bg-opacity-50 border border-red-500 rounded">
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                        <span className="text-red-400 text-sm">{error}</span>
                      </div>
                    )}

                    {/* Balance Check */}
                    {user?.wallet && totalStake > user.wallet.available && (
                      <div className="flex items-center space-x-2 p-2 bg-yellow-900 bg-opacity-50 border border-yellow-500 rounded">
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
                        <span className="text-yellow-400 text-sm">
                          Insufficient funds. Available: {formatCurrency(user.wallet.available)}
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={handleClearSelections}
                        className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium transition-colors"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={handlePlaceBet}
                        disabled={isLoading || totalStake === 0 || (user?.wallet && totalStake > user.wallet.available)}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-medium transition-colors flex items-center justify-center space-x-2"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Placing...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>Place Bet</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear Confirmation Modal */}
      <AnimatePresence>
        {showConfirmClear && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-60"
              onClick={() => setShowConfirmClear(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 flex items-center justify-center z-60 p-4"
            >
              <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full border border-gray-700">
                <div className="flex items-center space-x-3 mb-4">
                  <TrashIcon className="w-6 h-6 text-red-400" />
                  <h3 className="text-lg font-semibold text-white">Clear Bet Slip</h3>
                </div>
                <p className="text-gray-300 mb-6">
                  Are you sure you want to remove all selections from your bet slip?
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowConfirmClear(false)}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmClear}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default BetSlip;
