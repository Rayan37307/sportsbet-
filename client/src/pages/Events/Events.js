import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  ClockIcon,
  FireIcon,
  EyeIcon,
  StarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulate loading events data
    setTimeout(() => {
      setEvents([
        {
          id: 1,
          title: 'Manchester United vs Liverpool',
          sport: 'Football',
          league: 'Premier League',
          startTime: '2024-01-20T15:00:00Z',
          status: 'upcoming',
          odds: { home: 2.10, draw: 3.20, away: 1.85 },
          bettors: 1250,
          volume: 45000
        },
        {
          id: 2,
          title: 'Lakers vs Warriors',
          sport: 'Basketball',
          league: 'NBA',
          startTime: '2024-01-18T20:30:00Z',
          status: 'live',
          odds: { home: 1.95, away: 1.89 },
          bettors: 890,
          volume: 32000
        },
        {
          id: 3,
          title: 'Chiefs vs Patriots',
          sport: 'American Football',
          league: 'NFL',
          startTime: '2024-01-21T18:00:00Z',
          status: 'upcoming',
          odds: { home: 1.75, away: 2.05 },
          bettors: 2100,
          volume: 78000
        },
        {
          id: 4,
          title: 'Novak Djokovic vs Rafael Nadal',
          sport: 'Tennis',
          league: 'Australian Open',
          startTime: '2024-01-19T09:00:00Z',
          status: 'finished',
          odds: { home: 1.65, away: 2.25 },
          bettors: 560,
          volume: 28000,
          result: 'home'
        },
        {
          id: 5,
          title: 'Barcelona vs Real Madrid',
          sport: 'Football',
          league: 'La Liga',
          startTime: '2024-01-22T21:00:00Z',
          status: 'upcoming',
          odds: { home: 1.90, draw: 3.40, away: 1.95 },
          bettors: 3200,
          volume: 125000
        },
        {
          id: 6,
          title: 'Celtics vs Heat',
          sport: 'Basketball',
          league: 'NBA',
          startTime: '2024-01-18T19:00:00Z',
          status: 'live',
          odds: { home: 2.05, away: 1.78 },
          bettors: 720,
          volume: 25000
        }
      ]);
      setLoading(false);
    }, 1200);
  }, []);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'finished':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesFilter = filter === 'all' || event.status === filter;
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.league.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
        className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Events</h1>
            <p className="mt-2 text-green-100">
              Discover and bet on live and upcoming sporting events
            </p>
          </div>
          <CalendarIcon className="h-16 w-16 text-green-300 opacity-50 hidden md:block" />
        </div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        {/* Search */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search events, sports, leagues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-2">
          {['all', 'live', 'upcoming', 'finished'].map((filterOption) => (
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

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              {/* Event Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(event.status)}`}>
                    {event.status === 'live' && <FireIcon className="h-3 w-3 mr-1" />}
                    {event.status}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {event.sport} • {event.league}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {event.title}
                </h3>

                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {formatDateTime(event.startTime).date} at {formatDateTime(event.startTime).time}
                  </div>
                  <div className="flex items-center">
                    <EyeIcon className="h-4 w-4 mr-1" />
                    {event.bettors.toLocaleString()} bettors
                  </div>
                  <div className="flex items-center">
                    <StarIcon className="h-4 w-4 mr-1" />
                    ${event.volume.toLocaleString()} volume
                  </div>
                </div>
              </div>

              {/* Odds */}
              <div className="mt-4 lg:mt-0 lg:ml-6">
                {event.status !== 'finished' ? (
                  <div className="flex space-x-2">
                    <button className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors font-medium min-w-16">
                      {event.odds.home}
                    </button>
                    {event.odds.draw && (
                      <button className="bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors font-medium min-w-16">
                        {event.odds.draw}
                      </button>
                    )}
                    <button className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors font-medium min-w-16">
                      {event.odds.away}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Final Result:</span>
                    <span className={`font-semibold ${
                      event.result === 'home' ? 'text-green-600' :
                      event.result === 'away' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {event.result === 'home' ? 'Home Win' :
                       event.result === 'away' ? 'Away Win' : 'Draw'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm
              ? `No events found matching "${searchTerm}"`
              : `No ${filter === 'all' ? '' : filter} events available`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default Events;
