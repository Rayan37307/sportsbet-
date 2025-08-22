import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon,
  TrophyIcon,
  FireIcon,
  StarIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  HeartIcon,
  ClockIcon,
  UsersIcon,
  CurrencyDollarIcon,
  GiftIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import toast from 'react-hot-toast';

const Casino = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState(new Set());
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [jackpots, setJackpots] = useState({});
  const [promotions, setPromotions] = useState([]);
  const [sortBy, setSortBy] = useState('popular');

  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  const categories = [
    { id: 'all', name: 'All Games', icon: '🎮', color: 'bg-purple-600' },
    { id: 'slots', name: 'Slots', icon: '🎰', color: 'bg-red-600' },
    { id: 'table', name: 'Table Games', icon: '🎲', color: 'bg-green-600' },
    { id: 'poker', name: 'Poker', icon: '♠️', color: 'bg-blue-600' },
    { id: 'blackjack', name: 'Blackjack', icon: '🃏', color: 'bg-yellow-600' },
    { id: 'roulette', name: 'Roulette', icon: '🎡', color: 'bg-pink-600' },
    { id: 'baccarat', name: 'Baccarat', icon: '💎', color: 'bg-indigo-600' },
    { id: 'jackpot', name: 'Jackpots', icon: '💰', color: 'bg-orange-600' }
  ];

  // Real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('jackpot_update', (data) => {
        setJackpots(prev => ({
          ...prev,
          [data.gameId]: data.amount
        }));
      });

      socket.on('game_winner', (data) => {
        toast.success(`🎉 ${data.username} won $${data.amount.toLocaleString()} on ${data.gameName}!`, {
          duration: 6000
        });
      });

      socket.on('new_promotion', (data) => {
        setPromotions(prev => [data, ...prev]);
        toast(`🎁 New promotion: ${data.title}`, {
          icon: '🎁'
        });
      });

      return () => {
        socket.off('jackpot_update');
        socket.off('game_winner');
        socket.off('new_promotion');
      };
    }
  }, [socket]);

  // Load casino data
  useEffect(() => {
    loadCasinoData();
  }, [selectedCategory]);

  const loadCasinoData = async () => {
    setLoading(true);
    try {
      const [gamesRes, promotionsRes, favoritesRes, recentRes] = await Promise.all([
        fetch(`/api/casino/games?category=${selectedCategory}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        }),
        fetch('/api/casino/promotions', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        }),
        fetch('/api/casino/favorites', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        }),
        fetch('/api/casino/recent', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        })
      ]);

      const [gamesData, promotionsData, favoritesData, recentData] = await Promise.all([
        gamesRes.json(),
        promotionsRes.json(),
        favoritesRes.json(),
        recentRes.json()
      ]);

      if (gamesData.success) setGames(gamesData.data.games);
      if (promotionsData.success) setPromotions(promotionsData.data.promotions);
      if (favoritesData.success) setFavorites(new Set(favoritesData.data.favorites));
      if (recentData.success) setRecentlyPlayed(recentData.data.recent);

    } catch (error) {
      console.error('Failed to load casino data:', error);
      toast.error('Failed to load casino games');
    } finally {
      setLoading(false);
    }
  };

  const playGame = (game) => {
    if (user?.wallet?.balance < game.minBet) {
      toast.error('Insufficient balance to play this game');
      return;
    }

    // Add to recently played
    const updatedRecent = [game, ...recentlyPlayed.filter(g => g._id !== game._id)].slice(0, 10);
    setRecentlyPlayed(updatedRecent);

    // Open game in new window/iframe
    const gameWindow = window.open(`/casino/game/${game._id}`, '_blank', 'width=1200,height=800');

    if (socket) {
      socket.emit('game_started', {
        userId: user._id,
        gameId: game._id,
        gameName: game.name
      });
    }

    toast.success(`Starting ${game.name}...`);
  };

  const toggleFavorite = async (gameId) => {
    const newFavorites = new Set(favorites);
    const isFavorite = newFavorites.has(gameId);

    if (isFavorite) {
      newFavorites.delete(gameId);
    } else {
      newFavorites.add(gameId);
    }

    setFavorites(newFavorites);

    try {
      await fetch(`/api/casino/favorites/${gameId}`, {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
    } catch (error) {
      console.error('Failed to update favorites:', error);
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

  const filteredGames = games
    .filter(game => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return game.name.toLowerCase().includes(query) ||
               game.provider.toLowerCase().includes(query) ||
               game.category.toLowerCase().includes(query);
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.popularity - a.popularity;
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'rtp':
          return b.rtp - a.rtp;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-white mt-4">Loading casino...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold flex items-center space-x-3">
              <SparklesIcon className="w-10 h-10 text-purple-500" />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Casino
              </span>
            </h1>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">Your Balance</div>
                <div className="text-xl font-bold text-green-400">
                  {formatCurrency(user?.wallet?.balance || 0)}
                </div>
              </div>
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${isConnected ? 'bg-green-900' : 'bg-red-900'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-sm">{isConnected ? 'Connected' : 'Offline'}</span>
              </div>
            </div>
          </div>

          {/* Promotions Banner */}
          {promotions.length > 0 && (
            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <GiftIcon className="w-6 h-6 text-white" />
                    <span className="text-white font-bold text-lg">Special Promotion</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{promotions[0].title}</h3>
                  <p className="text-orange-100">{promotions[0].description}</p>
                </div>
                <button className="bg-white text-orange-600 px-6 py-3 rounded-lg font-bold hover:bg-orange-50 transition-colors">
                  Claim Now
                </button>
              </div>
            </div>
          )}

          {/* Category Navigation */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  selectedCategory === category.id
                    ? `${category.color} text-white shadow-lg`
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                <span>{category.icon}</span>
                <span className="font-medium">{category.name}</span>
              </button>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search games..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-300">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest</option>
                <option value="rtp">Highest RTP</option>
                <option value="name">A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Recently Played */}
        {recentlyPlayed.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <ClockIcon className="w-6 h-6 text-blue-400" />
              <span>Recently Played</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recentlyPlayed.slice(0, 6).map(game => (
                <motion.div
                  key={game._id}
                  whileHover={{ scale: 1.05 }}
                  className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => playGame(game)}
                >
                  <div className="relative">
                    <img
                      src={game.thumbnail || '/images/game-placeholder.jpg'}
                      alt={game.name}
                      className="w-full h-24 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <PlayIcon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="p-2">
                    <h3 className="font-medium text-sm truncate">{game.name}</h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredGames.map(game => {
              const isFavorite = favorites.has(game._id);
              const jackpotAmount = jackpots[game._id];

              return (
                <motion.div
                  key={game._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  whileHover={{ y: -5 }}
                  className="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  <div className="relative">
                    <img
                      src={game.thumbnail || '/images/game-placeholder.jpg'}
                      alt={game.name}
                      className="w-full h-48 object-cover"
                    />

                    {/* Jackpot Badge */}
                    {jackpotAmount && (
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                        💰 {formatCurrency(jackpotAmount)}
                      </div>
                    )}

                    {/* Hot Badge */}
                    {game.isHot && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                        <FireIcon className="w-3 h-3" />
                        <span>HOT</span>
                      </div>
                    )}

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(game._id);
                      }}
                      className="absolute top-2 right-10 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-75 transition-colors"
                    >
                      {isFavorite ? (
                        <HeartIconSolid className="w-4 h-4 text-red-500" />
                      ) : (
                        <HeartIcon className="w-4 h-4 text-white" />
                      )}
                    </button>

                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => playGame(game)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold flex items-center space-x-2 transform hover:scale-105 transition-all"
                      >
                        <PlayIcon className="w-5 h-5" />
                        <span>Play Now</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg truncate">{game.name}</h3>
                      {game.rtp && (
                        <span className="text-green-400 text-sm font-medium">
                          {game.rtp}% RTP
                        </span>
                      )}
                    </div>

                    <p className="text-gray-400 text-sm mb-2">{game.provider}</p>

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <UsersIcon className="w-4 h-4" />
                        <span>{game.playersOnline || 0} playing</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        Min: {formatCurrency(game.minBet)}
                      </div>
                    </div>

                    {/* Game Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        <StarIcon className="w-3 h-3" />
                        <span>{game.rating}/5</span>
                      </div>
                      <div>{game.category}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredGames.length === 0 && !loading && (
          <div className="text-center py-12">
            <SparklesIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No games found</h3>
            <p className="text-gray-400">
              Try adjusting your search or category filters.
            </p>
          </div>
        )}

        {/* Game Providers */}
        <div className="mt-12 border-t border-gray-800 pt-8">
          <h2 className="text-xl font-bold mb-4 text-center">Powered by Top Game Providers</h2>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            {['NetEnt', 'Microgaming', 'Playtech', 'Evolution Gaming', 'Pragmatic Play', 'Play\'n GO'].map(provider => (
              <div key={provider} className="text-gray-400 font-medium">
                {provider}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Casino;
