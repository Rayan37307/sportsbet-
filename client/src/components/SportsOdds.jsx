import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const SportsOdds = () => {
  const [sports, setSports] = useState([]);
  const [events, setEvents] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [selectedSport, setSelectedSport] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('connect', () => {
      setConnectionStatus('connected');
      console.log('🔗 Connected to sports data feed');
    });

    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
      console.log('❌ Disconnected from sports data feed');
    });

    newSocket.on('initial_data', (data) => {
      console.log('📊 Received initial data:', data);
      setSports(data.sports || []);
      setEvents(data.events || []);
      setLastUpdate(new Date(data.timestamp));
    });

    newSocket.on('odds_update', (data) => {
      console.log('📈 Odds update:', data);
      setEvents(prevEvents =>
        prevEvents.map(event =>
          event.id === data.eventId ? data.event : event
        )
      );
      setLastUpdate(new Date(data.timestamp));
    });

    newSocket.on('score_update', (data) => {
      console.log('⚽ Score update:', data);
      setLiveEvents(prevLive =>
        prevLive.map(event =>
          event.id === data.eventId
            ? { ...event, scores: data.scores, completed: data.completed }
            : event
        )
      );
      setLastUpdate(new Date(data.timestamp));
    });

    newSocket.on('new_events', (newEvents) => {
      console.log('🆕 New events:', newEvents);
      setEvents(prevEvents => [...prevEvents, ...newEvents]);
      setLastUpdate(new Date());
    });

    // Cleanup
    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    // Fetch initial data
    fetchSportsData();
  }, []);

  const fetchSportsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sportsRes, eventsRes, liveRes] = await Promise.all([
        fetch('/api/sports'),
        fetch('/api/sports/events'),
        fetch('/api/sports/live')
      ]);

      if (sportsRes.ok) {
        const sportsData = await sportsRes.json();
        setSports(sportsData.data || []);
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.data || []);
      }

      if (liveRes.ok) {
        const liveData = await liveRes.json();
        setLiveEvents(liveData.data || []);
      }

      setLastUpdate(new Date());
    } catch (err) {
      setError('Failed to fetch sports data');
      console.error('Error fetching sports data:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      const response = await fetch('/api/sports/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sport: selectedSport === 'all' ? null : selectedSport })
      });

      if (response.ok) {
        fetchSportsData();
      } else {
        const error = await response.json();
        setError(error.message);
      }
    } catch (err) {
      setError('Failed to refresh data');
    }
  };

  const filteredEvents = selectedSport === 'all'
    ? events
    : events.filter(event => event.sport === selectedSport);

  const formatOdds = (odds) => {
    if (odds > 0) return `+${odds}`;
    return odds;
  };

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'text-green-600 bg-green-100';
      case 'upcoming': return 'text-blue-600 bg-blue-100';
      case 'starting_soon': return 'text-yellow-600 bg-yellow-100';
      case 'finished': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'disconnected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Sports Odds</h1>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${getConnectionStatusColor()}`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium">
                {connectionStatus === 'connected' ? 'Live' :
                 connectionStatus === 'connecting' ? 'Connecting' : 'Offline'}
              </span>
            </div>
            {lastUpdate && (
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Sports Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Sport:
        </label>
        <select
          value={selectedSport}
          onChange={(e) => setSelectedSport(e.target.value)}
          className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Sports</option>
          {sports.map(sport => (
            <option key={sport.id} value={sport.id}>
              {sport.name} {sport.priority === 1 ? '⭐' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Live Events Alert */}
      {liveEvents.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            🔴 Live Games ({liveEvents.length})
          </h3>
          <div className="grid gap-2">
            {liveEvents.slice(0, 3).map(event => (
              <div key={event.id} className="text-sm text-green-700">
                {event.homeTeam} vs {event.awayTeam} - {event.sportName}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="grid gap-6">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No events available</p>
            <p className="text-gray-400 text-sm mt-2">
              Try selecting a different sport or refreshing the data
            </p>
          </div>
        ) : (
          filteredEvents.map(event => (
            <div key={event.id} className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              {/* Event Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                    {event.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-600">{event.sportName}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {formatTime(event.commence_time)}
                </div>
              </div>

              {/* Teams */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {event.awayTeam} @ {event.homeTeam}
                </h3>
              </div>

              {/* Odds */}
              {event.odds && (
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Moneyline */}
                  {event.odds.moneyline && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Moneyline</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{event.awayTeam}</span>
                          <div className="text-right">
                            <span className="font-bold">
                              {event.odds.moneyline.awayTeam ? formatOdds(event.odds.moneyline.awayTeam.price) : 'N/A'}
                            </span>
                            {event.odds.moneyline.awayTeam?.bookmaker && (
                              <div className="text-xs text-gray-500">
                                {event.odds.moneyline.awayTeam.bookmaker}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{event.homeTeam}</span>
                          <div className="text-right">
                            <span className="font-bold">
                              {event.odds.moneyline.homeTeam ? formatOdds(event.odds.moneyline.homeTeam.price) : 'N/A'}
                            </span>
                            {event.odds.moneyline.homeTeam?.bookmaker && (
                              <div className="text-xs text-gray-500">
                                {event.odds.moneyline.homeTeam.bookmaker}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Spread */}
                  {event.odds.spread && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Point Spread</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            {event.awayTeam} {event.odds.spread.awayTeam?.point ? `(${event.odds.spread.awayTeam.point > 0 ? '+' : ''}${event.odds.spread.awayTeam.point})` : ''}
                          </span>
                          <div className="text-right">
                            <span className="font-bold">
                              {event.odds.spread.awayTeam ? formatOdds(event.odds.spread.awayTeam.price) : 'N/A'}
                            </span>
                            {event.odds.spread.awayTeam?.bookmaker && (
                              <div className="text-xs text-gray-500">
                                {event.odds.spread.awayTeam.bookmaker}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            {event.homeTeam} {event.odds.spread.homeTeam?.point ? `(${event.odds.spread.homeTeam.point > 0 ? '+' : ''}${event.odds.spread.homeTeam.point})` : ''}
                          </span>
                          <div className="text-right">
                            <span className="font-bold">
                              {event.odds.spread.homeTeam ? formatOdds(event.odds.spread.homeTeam.price) : 'N/A'}
                            </span>
                            {event.odds.spread.homeTeam?.bookmaker && (
                              <div className="text-xs text-gray-500">
                                {event.odds.spread.homeTeam.bookmaker}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Total */}
                  {event.odds.total && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Over/Under {event.odds.total.over?.point || event.odds.total.under?.point || ''}
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Over</span>
                          <div className="text-right">
                            <span className="font-bold">
                              {event.odds.total.over ? formatOdds(event.odds.total.over.price) : 'N/A'}
                            </span>
                            {event.odds.total.over?.bookmaker && (
                              <div className="text-xs text-gray-500">
                                {event.odds.total.over.bookmaker}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Under</span>
                          <div className="text-right">
                            <span className="font-bold">
                              {event.odds.total.under ? formatOdds(event.odds.total.under.price) : 'N/A'}
                            </span>
                            {event.odds.total.under?.bookmaker && (
                              <div className="text-xs text-gray-500">
                                {event.odds.total.under.bookmaker}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bookmakers */}
              {event.bookmakers && event.bookmakers.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Available on: {event.bookmakers.map(b => b.title).join(', ')}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* API Info */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">📊 Free Tier Information</h3>
        <div className="text-xs text-blue-700 space-y-1">
          <p>• Using The Odds API free tier (500 requests/month)</p>
          <p>• Data updates every 15 minutes for efficiency</p>
          <p>• Real-time updates via WebSocket when available</p>
          <p>• <a href="https://the-odds-api.com" target="_blank" rel="noopener noreferrer" className="underline">Get your own API key</a> for more features</p>
        </div>
      </div>
    </div>
  );
};

export default SportsOdds;
