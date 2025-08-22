import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  BellIcon,
  UserIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';

const TopNavLayout = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [walletData, setWalletData] = useState({
    balance: 0,
    pending: 0,
    available: 0
  });

  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();

  // Navigation items
  const navigationItems = [
    { name: 'SPORTS', href: '/app/sports', color: 'bg-red-500' },
    { name: 'LIVE', href: '/app/live', color: 'bg-green-500' },
    { name: 'CASINO', href: '/app/casino', color: 'bg-purple-500' },
    { name: 'LIVE CASINO', href: '/app/live-casino', color: 'bg-pink-500' },
    { name: 'MORE', href: '/app/more', color: 'bg-blue-500' },
    { name: 'CASHIER', href: '/app/cashier', color: 'bg-yellow-500' }
  ];

  // Real-time wallet updates
  useEffect(() => {
    if (socket) {
      socket.on('wallet_update', (data) => {
        setWalletData(data);
      });

      socket.on('balance_change', (data) => {
        setWalletData(prev => ({
          ...prev,
          balance: data.balance,
          available: data.available
        }));
      });

      socket.on('bet_placed', (data) => {
        setWalletData(prev => ({
          ...prev,
          pending: prev.pending + data.amount,
          available: prev.available - data.amount
        }));
      });

      socket.on('bet_settled', (data) => {
        setWalletData(prev => ({
          ...prev,
          pending: prev.pending - data.amount,
          balance: data.won ? prev.balance + data.payout : prev.balance
        }));
      });

      return () => {
        socket.off('wallet_update');
        socket.off('balance_change');
        socket.off('bet_placed');
        socket.off('bet_settled');
      };
    }
  }, [socket]);

  // Initialize wallet data
  useEffect(() => {
    if (user?.wallet) {
      setWalletData({
        balance: user.wallet.balance || 0,
        pending: user.wallet.pending || 0,
        available: user.wallet.available || user.wallet.balance || 0
      });
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/app/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isActiveRoute = (href) => {
    if (href === '/app/sports') {
      return location.pathname === '/app/sports' || location.pathname === '/app';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Top Navigation Bar */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo and Navigation */}
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <Link to="/app" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SB</span>
                </div>
                <span className="text-white font-bold text-xl hidden sm:block">SportsBet</span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex space-x-1">
                {navigationItems.map((item) => {
                  const isActive = isActiveRoute(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? `${item.color} text-white`
                          : 'text-gray-300 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* Right side - Wallet Info and User Menu */}
            <div className="flex items-center space-x-6">
              {/* Wallet Display */}
              <div className="hidden md:flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="text-gray-400 text-xs uppercase tracking-wide">Balance</div>
                  <div className="text-green-400 font-semibold">{formatCurrency(walletData.balance)}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400 text-xs uppercase tracking-wide">Pending</div>
                  <div className="text-yellow-400 font-semibold">{formatCurrency(walletData.pending)}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400 text-xs uppercase tracking-wide">Available</div>
                  <div className="text-blue-400 font-semibold">{formatCurrency(walletData.available)}</div>
                </div>
              </div>

              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-xs text-gray-400 hidden sm:block">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 relative"
                >
                  <BellIcon className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                </button>
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  <UserIcon className="h-5 w-5" />
                  <span className="hidden sm:block text-sm font-medium">
                    {user?.username || 'User'}
                  </span>
                  <ChevronDownIcon className="h-4 w-4" />
                </button>

                {/* User Dropdown */}
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 divide-y divide-gray-700 z-50"
                    >
                      <div className="p-4">
                        <p className="text-sm font-medium text-white">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-gray-400 capitalize">
                          {user?.role}
                        </p>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/app/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <UserIcon className="mr-3 h-4 w-4" />
                          Profile
                        </Link>
                        <Link
                          to="/app/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <CogIcon className="mr-3 h-4 w-4" />
                          Settings
                        </Link>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                        >
                          <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-gray-700"
            >
              <div className="px-4 py-4 space-y-2">
                {navigationItems.map((item) => {
                  const isActive = isActiveRoute(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`block px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? `${item.color} text-white`
                          : 'text-gray-300 hover:text-white hover:bg-gray-700'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>

              {/* Mobile Wallet Info */}
              <div className="px-4 pb-4 border-t border-gray-700 pt-4">
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="text-gray-400 text-xs uppercase tracking-wide">Balance</div>
                    <div className="text-green-400 font-semibold">{formatCurrency(walletData.balance)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs uppercase tracking-wide">Pending</div>
                    <div className="text-yellow-400 font-semibold">{formatCurrency(walletData.pending)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs uppercase tracking-wide">Available</div>
                    <div className="text-blue-400 font-semibold">{formatCurrency(walletData.available)}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Secondary Navigation Bar */}
      <div className="bg-gray-700 border-b border-gray-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-800 text-gray-300 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-white focus:text-gray-900 focus:placeholder-gray-500 sm:text-sm"
                />
              </div>
            </form>

            {/* Props and Sports Selector */}
            <div className="flex items-center space-x-4 ml-4">
              <button className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors">
                <span>PROPS +</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>

              <div className="hidden md:flex items-center space-x-2">
                <button className="px-3 py-1 bg-red-600 text-white rounded text-sm font-medium">
                  MLB
                </button>
                <button className="px-3 py-1 text-gray-300 hover:text-white hover:bg-gray-600 rounded text-sm font-medium transition-colors">
                  NBA
                </button>
                <button className="px-3 py-1 text-gray-300 hover:text-white hover:bg-gray-600 rounded text-sm font-medium transition-colors">
                  NFL
                </button>
              </div>
            </div>

            {/* Bet Slip Toggle */}
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors">
                <span>Bet Slip</span>
                <span className="bg-green-500 px-2 py-1 rounded text-xs">0</span>
              </button>
              <button className="px-3 py-1 text-gray-300 hover:text-white hover:bg-gray-600 rounded text-sm font-medium transition-colors">
                My Bets
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {notificationOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setNotificationOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-4 top-16 w-80 bg-gray-800 rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-50"
            >
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-medium text-white">Notifications</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="p-4 text-sm text-gray-400 text-center">
                  No new notifications
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Click outside handlers */}
      {(userMenuOpen || notificationOpen) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setUserMenuOpen(false);
            setNotificationOpen(false);
          }}
        />
      )}

      {/* Main Content */}
      <main className="min-h-screen bg-gray-900">
        <Outlet />
      </main>
    </div>
  );
};

export default TopNavLayout;
