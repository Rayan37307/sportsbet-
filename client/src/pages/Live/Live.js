import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FireIcon,
  ClockIcon,
  PlayIcon,
  TvIcon,
  ChartBarIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowPathIcon,
  StarIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  SignalIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { useSocket } from "../../contexts/SocketContext";
import { useBetSlip } from "../../contexts/BetSlipContext";
import BetSlip from "../../components/Betting/BetSlip";
import toast from "react-hot-toast";

const Live = () => {
  const [liveEvents, setLiveEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState("all");
  const [sortBy, setSortBy] = useState("popularity");
  const [favorites, setFavorites] = useState(new Set());
  const [betSlipOpen, setBetSlipOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const { socket, isConnected } = useSocket();
  const { addSelection, hasSelection, getSelectionCount } = useBetSlip();

  const sports = [
    { id: "all", name: "All Sports", icon: "🏆" },
    { id: "football", name: "Football", icon: "🏈" },
    { id: "basketball", name: "Basketball", icon: "🏀" },
    { id: "baseball", name: "Baseball", icon: "⚾" },
    { id: "hockey", name: "Hockey", icon: "🏒" },
    { id: "soccer", name: "Soccer", icon: "⚽" },
  ];

  // Real-time updates for live events
  useEffect(() => {
    if (socket) {
      socket.on("live_odds_update", (data) => {
        setLiveEvents((prevEvents) =>
          prevEvents.map((event) =>
            event._id === data.eventId
              ? {
                  ...event,
                  odds: { ...event.odds, ...data.odds },
                  lastUpdated: new Date(),
                }
              : event,
          ),
        );
        setLastUpdate(new Date());

        if (soundEnabled) {
          // Play subtle sound for odds changes
          try {
            const audio = new Audio(
              "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEeAzaY5fLLaCMDAzSJzvzVjC4ABx1++U6s",
            );
            audio.volume = 0.1;
            audio.play().catch(() => {});
          } catch (error) {
            // Ignore audio errors
          }
        }
      });

      socket.on("live_score_update", (data) => {
        setLiveEvents((prevEvents) =>
          prevEvents.map((event) =>
            event._id === data.eventId
              ? {
                  ...event,
                  score: data.score,
                  gameTime: data.gameTime,
                  period: data.period,
                }
              : event,
          ),
        );

        if (soundEnabled) {
          toast.success(
            `Score Update: ${data.team1} ${data.score.team1} - ${data.score.team2} ${data.team2}`,
            {
              duration: 4000,
            },
          );
        }
      });

      socket.on("event_started", (data) => {
        setLiveEvents((prevEvents) => [data, ...prevEvents]);
        toast(`🔴 ${data.team1} vs ${data.team2} is now LIVE!`, {
          duration: 5000,
          icon: "🚨",
        });
      });

      socket.on("event_ended", (data) => {
        setLiveEvents((prevEvents) =>
          prevEvents.filter((event) => event._id !== data.eventId),
        );
        toast(`✅ ${data.team1} vs ${data.team2} has finished`, {
          duration: 4000,
        });
      });

      socket.on("market_suspended", (data) => {
        setLiveEvents((prevEvents) =>
          prevEvents.map((event) =>
            event._id === data.eventId
              ? {
                  ...event,
                  suspendedMarkets: [
                    ...(event.suspendedMarkets || []),
                    data.marketType,
                  ],
                }
              : event,
          ),
        );
        toast.error(
          `Market ${data.marketType} suspended for ${data.eventTitle}`,
        );
      });

      socket.on("market_reopened", (data) => {
        setLiveEvents((prevEvents) =>
          prevEvents.map((event) =>
            event._id === data.eventId
              ? {
                  ...event,
                  suspendedMarkets: (event.suspendedMarkets || []).filter(
                    (m) => m !== data.marketType,
                  ),
                }
              : event,
          ),
        );
        toast.success(
          `Market ${data.marketType} reopened for ${data.eventTitle}`,
        );
      });

      return () => {
        socket.off("live_odds_update");
        socket.off("live_score_update");
        socket.off("event_started");
        socket.off("event_ended");
        socket.off("market_suspended");
        socket.off("market_reopened");
      };
    }
  }, [socket, soundEnabled]);

  // Load live events
  useEffect(() => {
    fetchLiveEvents();

    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem("favoriteLiveEvents");
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, [selectedSport]);

  const fetchLiveEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: "live",
        sport: selectedSport,
      });

      const response = await fetch(`/api/sports/live?${params}`);

      const result = await response.json();
      if (result.success) {
        setLiveEvents(result.data || []);
      } else {
        // Mock data for development
        setLiveEvents([
          {
            _id: "1",
            team1: "Lakers",
            team2: "Warriors",
            sport: "basketball",
            league: "NBA",
            status: "live",
            startTime: new Date(Date.now() - 3600000).toISOString(),
            gameTime: "2nd 15:30",
            period: "2nd Quarter",
            score: { team1: 45, team2: 52 },
            viewerCount: 15420,
            hasVideo: true,
            odds: {
              moneyline: { team1: 2.1, team2: 1.8 },
              spread: {
                team1Points: -3.5,
                team1Odds: 1.9,
                team2Points: 3.5,
                team2Odds: 1.9,
              },
              total: { points: 215.5, overOdds: 1.85, underOdds: 1.95 },
              nextPoint: { team1: 1.95, team2: 1.85, none: 15.0 },
            },
            suspendedMarkets: [],
          },
          {
            _id: "2",
            team1: "Red Sox",
            team2: "Yankees",
            sport: "baseball",
            league: "MLB",
            status: "live",
            startTime: new Date(Date.now() - 7200000).toISOString(),
            gameTime: "7th Inning",
            period: "Top 7th",
            score: { team1: 3, team2: 5 },
            viewerCount: 8950,
            hasVideo: true,
            odds: {
              moneyline: { team1: 2.8, team2: 1.4 },
              spread: {
                team1Points: 1.5,
                team1Odds: 1.95,
                team2Points: -1.5,
                team2Odds: 1.85,
              },
              total: { points: 9.5, overOdds: 1.9, underOdds: 1.9 },
            },
            suspendedMarkets: [],
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch live events:", error);
      toast.error("Failed to load live events");

      // Mock data fallback
      setLiveEvents([
        {
          _id: "1",
          team1: "Lakers",
          team2: "Warriors",
          sport: "basketball",
          league: "NBA",
          status: "live",
          startTime: new Date(Date.now() - 3600000).toISOString(),
          gameTime: "2nd 15:30",
          period: "2nd Quarter",
          score: { team1: 45, team2: 52 },
          viewerCount: 15420,
          hasVideo: true,
          odds: {
            moneyline: { team1: 2.1, team2: 1.8 },
            spread: {
              team1Points: -3.5,
              team1Odds: 1.9,
              team2Points: 3.5,
              team2Odds: 1.9,
            },
            total: { points: 215.5, overOdds: 1.85, underOdds: 1.95 },
            nextPoint: { team1: 1.95, team2: 1.85, none: 15.0 },
          },
          suspendedMarkets: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBetSelection = (event, marketType, selection, odds) => {
    if (event.suspendedMarkets?.includes(marketType)) {
      toast.error("This market is currently suspended");
      return;
    }

    const betSelection = {
      eventId: event._id,
      eventTitle: `${event.team1} vs ${event.team2}`,
      eventTime: event.startTime,
      marketType,
      selection,
      odds,
      team1: event.team1,
      team2: event.team2,
      league: event.league,
      sport: event.sport,
      isLive: true,
    };

    addSelection(betSelection);

    if (getSelectionCount() === 1) {
      setBetSlipOpen(true);
    }
  };

  const toggleFavorite = (eventId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(eventId)) {
      newFavorites.delete(eventId);
    } else {
      newFavorites.add(eventId);
    }
    setFavorites(newFavorites);
    localStorage.setItem(
      "favoriteLiveEvents",
      JSON.stringify([...newFavorites]),
    );
  };

  const formatOdds = (odds) => {
    if (odds >= 2) {
      return `+${Math.round((odds - 1) * 100)}`;
    } else {
      return `-${Math.round(100 / (odds - 1))}`;
    }
  };

  const getGameTime = (event) => {
    if (event.gameTime) {
      return event.gameTime;
    }
    const elapsed = Math.floor(
      (new Date() - new Date(event.startTime)) / 60000,
    );
    return `${elapsed}'`;
  };

  const filteredEvents = liveEvents
    .filter((event) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          event.team1.toLowerCase().includes(query) ||
          event.team2.toLowerCase().includes(query) ||
          event.league.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "popularity":
          return (b.viewerCount || 0) - (a.viewerCount || 0);
        case "recent":
          return new Date(b.startTime) - new Date(a.startTime);
        case "league":
          return a.league.localeCompare(b.league);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-white mt-4">Loading live events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold flex items-center space-x-2">
                <FireIcon className="w-8 h-8 text-red-500" />
                <span>Live Betting</span>
                <div className="flex items-center space-x-2 ml-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-lg text-red-400">LIVE</span>
                </div>
              </h1>

              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span>{filteredEvents.length} live events</span>
                <span>•</span>
                <span
                  className={`flex items-center space-x-1 ${isConnected ? "text-green-400" : "text-red-400"}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`}
                  />
                  <span>{isConnected ? "Connected" : "Disconnected"}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  soundEnabled
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
                title={
                  soundEnabled ? "Mute notifications" : "Enable notifications"
                }
              >
                {soundEnabled ? (
                  <SpeakerWaveIcon className="w-5 h-5" />
                ) : (
                  <SpeakerXMarkIcon className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={() => setBetSlipOpen(!betSlipOpen)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                <span>Bet Slip</span>
                {getSelectionCount() > 0 && (
                  <span className="bg-green-500 px-2 py-1 rounded text-sm font-bold">
                    {getSelectionCount()}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-300">
                Sport:
              </label>
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
              >
                {sports.map((sport) => (
                  <option key={sport.id} value={sport.id}>
                    {sport.icon} {sport.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-300">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500"
              >
                <option value="popularity">By Viewers</option>
                <option value="recent">Most Recent</option>
                <option value="league">By League</option>
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search live events..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={fetchLiveEvents}
              className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span className="text-sm">Refresh</span>
            </button>
          </div>

          <div className="text-right text-xs text-gray-400">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>

        {/* Live Events */}
        <div className="space-y-6">
          <AnimatePresence>
            {filteredEvents.map((event) => {
              const isFavorite = favorites.has(event._id);
              const isMarketSuspended = (marketType) =>
                event.suspendedMarkets?.includes(marketType);

              return (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl border-2 border-red-500 shadow-2xl overflow-hidden"
                >
                  {/* Event Header */}
                  <div className="bg-red-600 px-6 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                          <span className="text-white font-bold">LIVE</span>
                        </div>
                        <span className="text-red-100 font-medium">
                          {event.league}
                        </span>
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="w-4 h-4 text-red-200" />
                          <span className="text-red-100 text-sm">
                            {getGameTime(event)}
                          </span>
                        </div>
                        {event.period && (
                          <span className="text-red-100 text-sm">
                            • {event.period}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3">
                        {event.hasVideo && (
                          <div className="flex items-center space-x-1 text-red-100">
                            <TvIcon className="w-4 h-4" />
                            <span className="text-sm">Live Stream</span>
                          </div>
                        )}

                        {event.viewerCount && (
                          <div className="flex items-center space-x-1 text-red-100">
                            <UsersIcon className="w-4 h-4" />
                            <span className="text-sm">
                              {event.viewerCount.toLocaleString()}
                            </span>
                          </div>
                        )}

                        <button
                          onClick={() => toggleFavorite(event._id)}
                          className="p-1 rounded-full hover:bg-red-500 transition-colors"
                        >
                          {isFavorite ? (
                            <StarIconSolid className="w-5 h-5 text-yellow-300" />
                          ) : (
                            <StarIcon className="w-5 h-5 text-red-200 hover:text-yellow-300" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Teams and Score */}
                  <div className="px-6 py-4 bg-gray-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-center flex-1">
                        <h3 className="text-xl font-bold text-white">
                          {event.team1}
                        </h3>
                        <div className="text-3xl font-bold text-green-400 mt-2">
                          {event.score?.team1 || 0}
                        </div>
                      </div>

                      <div className="text-center px-4">
                        <div className="text-gray-400 text-sm">VS</div>
                        <div className="text-red-400 text-xs mt-1">LIVE</div>
                      </div>

                      <div className="text-center flex-1">
                        <h3 className="text-xl font-bold text-white">
                          {event.team2}
                        </h3>
                        <div className="text-3xl font-bold text-green-400 mt-2">
                          {event.score?.team2 || 0}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live Betting Markets */}
                  <div className="px-6 py-6 space-y-6">
                    {/* Next Point/Goal Market */}
                    {event.odds?.nextPoint && (
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-3 text-center flex items-center justify-center space-x-2">
                          <span>NEXT POINT</span>
                          {isMarketSuspended("nextPoint") && (
                            <span className="bg-yellow-500 text-black px-2 py-1 text-xs rounded font-bold">
                              SUSPENDED
                            </span>
                          )}
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() =>
                              handleBetSelection(
                                event,
                                "nextPoint",
                                event.team1,
                                event.odds.nextPoint.team1,
                              )
                            }
                            disabled={isMarketSuspended("nextPoint")}
                            className={`p-3 rounded border-2 transition-all duration-200 ${
                              hasSelection(event._id, "nextPoint", event.team1)
                                ? "border-green-500 bg-green-900 bg-opacity-50"
                                : "border-gray-600 hover:border-gray-500 bg-gray-800 hover:bg-gray-700"
                            } ${isMarketSuspended("nextPoint") ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <div className="text-center">
                              <div className="font-medium text-white text-sm">
                                {event.team1}
                              </div>
                              <div className="text-green-400 font-bold">
                                {formatOdds(event.odds.nextPoint.team1)}
                              </div>
                            </div>
                          </button>

                          <button
                            onClick={() =>
                              handleBetSelection(
                                event,
                                "nextPoint",
                                "Neither",
                                event.odds.nextPoint.none,
                              )
                            }
                            disabled={isMarketSuspended("nextPoint")}
                            className={`p-3 rounded border-2 transition-all duration-200 ${
                              hasSelection(event._id, "nextPoint", "Neither")
                                ? "border-green-500 bg-green-900 bg-opacity-50"
                                : "border-gray-600 hover:border-gray-500 bg-gray-800 hover:bg-gray-700"
                            } ${isMarketSuspended("nextPoint") ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <div className="text-center">
                              <div className="font-medium text-white text-sm">
                                Neither
                              </div>
                              <div className="text-green-400 font-bold">
                                {formatOdds(event.odds.nextPoint.none)}
                              </div>
                            </div>
                          </button>

                          <button
                            onClick={() =>
                              handleBetSelection(
                                event,
                                "nextPoint",
                                event.team2,
                                event.odds.nextPoint.team2,
                              )
                            }
                            disabled={isMarketSuspended("nextPoint")}
                            className={`p-3 rounded border-2 transition-all duration-200 ${
                              hasSelection(event._id, "nextPoint", event.team2)
                                ? "border-green-500 bg-green-900 bg-opacity-50"
                                : "border-gray-600 hover:border-gray-500 bg-gray-800 hover:bg-gray-700"
                            } ${isMarketSuspended("nextPoint") ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <div className="text-center">
                              <div className="font-medium text-white text-sm">
                                {event.team2}
                              </div>
                              <div className="text-green-400 font-bold">
                                {formatOdds(event.odds.nextPoint.team2)}
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Live Markets Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Live Moneyline */}
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-3 text-center flex items-center justify-center space-x-2">
                          <span>MATCH RESULT</span>
                          {isMarketSuspended("moneyline") && (
                            <span className="bg-yellow-500 text-black px-2 py-1 text-xs rounded font-bold">
                              SUSPENDED
                            </span>
                          )}
                        </h4>
                        <div className="space-y-2">
                          <button
                            onClick={() =>
                              handleBetSelection(
                                event,
                                "moneyline",
                                event.team1,
                                event.odds?.moneyline?.team1 || 2.0,
                              )
                            }
                            disabled={
                              isMarketSuspended("moneyline") ||
                              !event.odds?.moneyline?.team1
                            }
                            className={`w-full flex items-center justify-between p-3 rounded border-2 transition-all duration-200 ${
                              hasSelection(event._id, "moneyline", event.team1)
                                ? "border-green-500 bg-green-900 bg-opacity-50"
                                : "border-gray-600 hover:border-gray-500 bg-gray-800 hover:bg-gray-700"
                            } ${isMarketSuspended("moneyline") || !event.odds?.moneyline?.team1 ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <span className="font-medium">{event.team1}</span>
                            <span className="text-green-400 font-bold">
                              {event.odds?.moneyline?.team1
                                ? formatOdds(event.odds.moneyline.team1)
                                : "N/A"}
                            </span>
                          </button>

                          {event.odds?.moneyline?.draw && (
                            <button
                              onClick={() =>
                                handleBetSelection(
                                  event,
                                  "moneyline",
                                  "Draw",
                                  event.odds.moneyline.draw,
                                )
                              }
                              disabled={isMarketSuspended("moneyline")}
                              className={`w-full flex items-center justify-between p-3 rounded border-2 transition-all duration-200 ${
                                hasSelection(event._id, "moneyline", "Draw")
                                  ? "border-green-500 bg-green-900 bg-opacity-50"
                                  : "border-gray-600 hover:border-gray-500 bg-gray-800 hover:bg-gray-700"
                              } ${isMarketSuspended("moneyline") ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <span className="font-medium">Draw</span>
                              <span className="text-green-400 font-bold">
                                {formatOdds(event.odds.moneyline.draw)}
                              </span>
                            </button>
                          )}

                          <button
                            onClick={() =>
                              handleBetSelection(
                                event,
                                "moneyline",
                                event.team2,
                                event.odds?.moneyline?.team2 || 2.0,
                              )
                            }
                            disabled={
                              isMarketSuspended("moneyline") ||
                              !event.odds?.moneyline?.team2
                            }
                            className={`w-full flex items-center justify-between p-3 rounded border-2 transition-all duration-200 ${
                              hasSelection(event._id, "moneyline", event.team2)
                                ? "border-green-500 bg-green-900 bg-opacity-50"
                                : "border-gray-600 hover:border-gray-500 bg-gray-800 hover:bg-gray-700"
                            } ${isMarketSuspended("moneyline") || !event.odds?.moneyline?.team2 ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <span className="font-medium">{event.team2}</span>
                            <span className="text-green-400 font-bold">
                              {event.odds?.moneyline?.team2
                                ? formatOdds(event.odds.moneyline.team2)
                                : "N/A"}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Live Over/Under */}
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-3 text-center flex items-center justify-center space-x-2">
                          <span>TOTAL POINTS</span>
                          {isMarketSuspended("total") && (
                            <span className="bg-yellow-500 text-black px-2 py-1 text-xs rounded font-bold">
                              SUSPENDED
                            </span>
                          )}
                        </h4>
                        <div className="space-y-2">
                          <button
                            onClick={() =>
                              handleBetSelection(
                                event,
                                "total",
                                `Over ${event.odds?.total?.points || 0}`,
                                event.odds?.total?.overOdds || 1.9,
                              )
                            }
                            disabled={
                              isMarketSuspended("total") ||
                              !event.odds?.total?.overOdds
                            }
                            className={`w-full flex items-center justify-between p-3 rounded border-2 transition-all duration-200 ${
                              hasSelection(
                                event._id,
                                "total",
                                `Over ${event.odds?.total?.points || 0}`,
                              )
                                ? "border-green-500 bg-green-900 bg-opacity-50"
                                : "border-gray-600 hover:border-gray-500 bg-gray-800 hover:bg-gray-700"
                            } ${isMarketSuspended("total") || !event.odds?.total?.overOdds ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <div>
                              <div className="font-medium">Over</div>
                              <div className="text-sm text-gray-400">
                                {event.odds?.total?.points || 0}
                              </div>
                            </div>
                            <span className="text-green-400 font-bold">
                              {event.odds?.total?.overOdds
                                ? formatOdds(event.odds.total.overOdds)
                                : "N/A"}
                            </span>
                          </button>

                          <button
                            onClick={() =>
                              handleBetSelection(
                                event,
                                "total",
                                `Under ${event.odds?.total?.points || 0}`,
                                event.odds?.total?.underOdds || 1.9,
                              )
                            }
                            disabled={
                              isMarketSuspended("total") ||
                              !event.odds?.total?.underOdds
                            }
                            className={`w-full flex items-center justify-between p-3 rounded border-2 transition-all duration-200 ${
                              hasSelection(
                                event._id,
                                "total",
                                `Under ${event.odds?.total?.points || 0}`,
                              )
                                ? "border-green-500 bg-green-900 bg-opacity-50"
                                : "border-gray-600 hover:border-gray-500 bg-gray-800 hover:bg-gray-700"
                            } ${isMarketSuspended("total") || !event.odds?.total?.underOdds ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <div>
                              <div className="font-medium">Under</div>
                              <div className="text-sm text-gray-400">
                                {event.odds?.total?.points || 0}
                              </div>
                            </div>
                            <span className="text-green-400 font-bold">
                              {event.odds?.total?.underOdds
                                ? formatOdds(event.odds.total.underOdds)
                                : "N/A"}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Live Stats */}
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-3 text-center flex items-center justify-center space-x-2">
                          <ChartBarIcon className="w-4 h-4" />
                          <span>LIVE STATS</span>
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Possession:</span>
                            <span className="text-white">52% - 48%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Shots:</span>
                            <span className="text-white">8 - 6</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Corners:</span>
                            <span className="text-white">3 - 2</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Fouls:</span>
                            <span className="text-white">5 - 8</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Cards:</span>
                            <span className="text-white">1Y - 2Y</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Markets */}
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-3 text-center">
                        MORE MARKETS
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <button className="p-2 bg-gray-600 hover:bg-gray-500 rounded text-xs text-center transition-colors">
                          <div className="font-medium">Both Teams Score</div>
                          <div className="text-green-400 font-bold">
                            Yes +125
                          </div>
                        </button>
                        <button className="p-2 bg-gray-600 hover:bg-gray-500 rounded text-xs text-center transition-colors">
                          <div className="font-medium">Half Time Result</div>
                          <div className="text-green-400 font-bold">1X2</div>
                        </button>
                        <button className="p-2 bg-gray-600 hover:bg-gray-500 rounded text-xs text-center transition-colors">
                          <div className="font-medium">Exact Score</div>
                          <div className="text-green-400 font-bold">
                            Multiple
                          </div>
                        </button>
                        <button className="p-2 bg-gray-600 hover:bg-gray-500 rounded text-xs text-center transition-colors">
                          <div className="font-medium">Player Props</div>
                          <div className="text-green-400 font-bold">
                            Various
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Market Updates Warning */}
                    {event.suspendedMarkets?.length > 0 && (
                      <div className="bg-yellow-900 border border-yellow-500 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
                          <span className="text-yellow-300 font-medium">
                            Market Updates
                          </span>
                        </div>
                        <p className="text-yellow-200 text-sm mt-2">
                          Some markets are temporarily suspended due to live
                          action. They will reopen shortly.
                        </p>
                        <div className="mt-2">
                          <span className="text-yellow-200 text-sm">
                            Suspended:{" "}
                          </span>
                          <span className="text-yellow-400 text-sm">
                            {event.suspendedMarkets.join(", ")}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredEvents.length === 0 && !loading && (
            <div className="text-center py-12">
              <FireIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">
                No live events
              </h3>
              <p className="text-gray-400">
                Check back soon for live betting opportunities.
              </p>
              <button
                onClick={fetchLiveEvents}
                className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Refresh
              </button>
            </div>
          )}
        </div>

        {/* Live Betting Info */}
        <div className="mt-12 border-t border-gray-800 pt-8">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4 flex items-center justify-center space-x-2">
              <SignalIcon className="w-6 h-6 text-red-500" />
              <span>Live Betting Information</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-400">
              <div>
                <h3 className="font-medium text-white mb-2">Real-Time Odds</h3>
                <p>
                  Odds update in real-time based on live game action and betting
                  activity.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-white mb-2">
                  Market Suspension
                </h3>
                <p>
                  Markets may be temporarily suspended during critical moments
                  in the game.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-white mb-2">Live Streaming</h3>
                <p>
                  Watch select events live while you bet for the ultimate
                  experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bet Slip */}
      <BetSlip isOpen={betSlipOpen} onClose={() => setBetSlipOpen(false)} />
    </div>
  );
};

export default Live;
