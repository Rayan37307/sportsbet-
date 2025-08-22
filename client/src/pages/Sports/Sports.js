import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  StarIcon,
  ClockIcon,
  FireIcon,
  TrophyIcon,
  ChevronDownIcon,
  ArrowPathIcon,
  SignalIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { useSocket } from "../../contexts/SocketContext";
import { useBetSlip } from "../../contexts/BetSlipContext";
import BetSlip from "../../components/Betting/BetSlip";
import toast from "react-hot-toast";
import io from "socket.io-client";

const Sports = () => {
  const [events, setEvents] = useState([]);
  const [sports, setSports] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedLeague, setSelectedLeague] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("time");
  const [showOnlyLive, setShowOnlyLive] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [betSlipOpen, setBetSlipOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [sportsSocket, setSportsSocket] = useState(null);
  const [serviceStatus, setServiceStatus] = useState(null);
  const [error, setError] = useState(null);

  const { socket, isConnected } = useSocket();
  const { addSelection, hasSelection, getSelectionCount } = useBetSlip();

  const defaultSports = [
    { id: "all", name: "All Sports", icon: "🏆" },
    { id: "americanfootball_nfl", name: "NFL", icon: "🏈" },
    { id: "basketball_nba", name: "NBA", icon: "🏀" },
    { id: "baseball_mlb", name: "MLB", icon: "⚾" },
    { id: "icehockey_nhl", name: "NHL", icon: "🏒" },
    { id: "soccer_epl", name: "Premier League", icon: "⚽" },
  ];

  const leagues = [
    { id: "all", name: "All Leagues" },
    { id: "americanfootball_nfl", name: "NFL" },
    { id: "basketball_nba", name: "NBA" },
    { id: "baseball_mlb", name: "MLB" },
    { id: "icehockey_nhl", name: "NHL" },
    { id: "soccer_epl", name: "Premier League" },
    { id: "americanfootball_ncaaf", name: "NCAA Football" },
    { id: "basketball_ncaab", name: "NCAA Basketball" },
  ];

  // Initialize sports socket connection
  useEffect(() => {
    const newSocket = io(
      process.env.REACT_APP_API_URL || "http://localhost:5000",
    );
    setSportsSocket(newSocket);

    // Socket event listeners for sports data
    newSocket.on("connect", () => {
      setConnectionStatus("connected");
      console.log("🔗 Connected to sports data feed");
    });

    newSocket.on("disconnect", () => {
      setConnectionStatus("disconnected");
      console.log("❌ Disconnected from sports data feed");
    });

    newSocket.on("initial_data", (data) => {
      console.log("📊 Received initial sports data:", data);
      if (data.sports) setSports(data.sports);
      if (data.events) setEvents(data.events);
      setLastUpdate(new Date(data.timestamp));
    });

    newSocket.on("odds_update", (data) => {
      console.log("📈 Odds update:", data);
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === data.eventId ? data.event : event,
        ),
      );
      setLastUpdate(new Date(data.timestamp));
    });

    newSocket.on("score_update", (data) => {
      console.log("⚽ Score update:", data);
      setLiveEvents((prevLive) =>
        prevLive.map((event) =>
          event.id === data.eventId
            ? { ...event, scores: data.scores, completed: data.completed }
            : event,
        ),
      );
      setLastUpdate(new Date(data.timestamp));
    });

    newSocket.on("new_events", (newEvents) => {
      console.log("🆕 New events:", newEvents);
      setEvents((prevEvents) => [...prevEvents, ...newEvents]);
      setLastUpdate(new Date());
      if (newEvents.length > 0) {
        toast.success(`${newEvents.length} new games available!`);
      }
    });

    // Cleanup
    return () => {
      newSocket.close();
    };
  }, []);

  // Fetch initial data and setup
  useEffect(() => {
    fetchSportsData();
    fetchServiceStatus();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchEventsData();
  }, [selectedSport, selectedLeague, showOnlyLive]);

  const fetchSportsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sportsRes, eventsRes, liveRes] = await Promise.all([
        fetch("/api/sports"),
        fetch("/api/sports/events"),
        fetch("/api/sports/live"),
      ]);

      if (sportsRes.ok) {
        const sportsData = await sportsRes.json();
        setSports(sportsData.data || defaultSports);
      } else {
        setSports(defaultSports);
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
      setError("Failed to fetch sports data");
      console.error("Error fetching sports data:", err);
      setSports(defaultSports);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventsData = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedSport !== "all") params.append("sport", selectedSport);
      if (showOnlyLive) params.append("status", "live");

      const response = await fetch(`/api/sports/events?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  };

  const fetchServiceStatus = async () => {
    try {
      const response = await fetch("/api/sports/status");
      if (response.ok) {
        const data = await response.json();
        setServiceStatus(data.data);
      }
    } catch (err) {
      console.error("Error fetching service status:", err);
    }
  };

  const refreshData = async () => {
    try {
      const response = await fetch("/api/sports/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sport: selectedSport === "all" ? null : selectedSport,
        }),
      });

      if (response.ok) {
        fetchSportsData();
        toast.success("Data refreshed successfully!");
      } else {
        const error = await response.json();
        toast.error(error.message);
      }
    } catch (err) {
      toast.error("Failed to refresh data");
    }
  };

  const handleBetSelection = (event, marketType, selection, odds) => {
    const betSelection = {
      eventId: event.id,
      eventTitle: `${event.awayTeam} @ ${event.homeTeam}`,
      eventTime: event.commence_time,
      marketType,
      selection,
      odds: odds.price,
      decimalOdds: odds.decimal,
      bookmaker: odds.bookmaker,
      team1: event.homeTeam,
      team2: event.awayTeam,
      league: event.sportName,
      sport: event.sport,
    };

    addSelection(betSelection);
    setBetSlipOpen(true);
    toast.success(`Added ${selection} to bet slip`);
  };

  const toggleFavorite = (eventId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(eventId)) {
      newFavorites.delete(eventId);
      toast.success("Removed from favorites");
    } else {
      newFavorites.add(eventId);
      toast.success("Added to favorites");
    }
    setFavorites(newFavorites);
    localStorage.setItem(
      "sportsbook_favorites",
      JSON.stringify([...newFavorites]),
    );
  };

  const formatOdds = (odds) => {
    if (odds > 0) return `+${odds}`;
    return odds;
  };

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "live":
        return "text-green-400 bg-green-400/10";
      case "upcoming":
        return "text-blue-400 bg-blue-400/10";
      case "starting_soon":
        return "text-yellow-400 bg-yellow-400/10";
      case "finished":
        return "text-gray-400 bg-gray-400/10";
      default:
        return "text-gray-400 bg-gray-400/10";
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "text-green-400";
      case "connecting":
        return "text-yellow-400";
      case "disconnected":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSport =
      selectedSport === "all" || event.sport === selectedSport;
    const matchesSearch =
      event.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.awayTeam.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFavorites = !showFavorites || favorites.has(event.id);
    const matchesLive = !showOnlyLive || event.status === "live";

    return matchesSport && matchesSearch && matchesFavorites && matchesLive;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    switch (sortBy) {
      case "time":
        return new Date(a.commence_time) - new Date(b.commence_time);
      case "sport":
        return a.sportName.localeCompare(b.sportName);
      case "status":
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-white mt-4">Loading sports data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <TrophyIcon className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold">Live Sports Odds</h1>
            <div className={`flex items-center ${getConnectionStatusColor()}`}>
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  connectionStatus === "connected"
                    ? "bg-green-400"
                    : connectionStatus === "connecting"
                      ? "bg-yellow-400"
                      : "bg-red-400"
                }`}
              ></div>
              <span className="text-sm font-medium">
                {connectionStatus === "connected"
                  ? "Live"
                  : connectionStatus === "connecting"
                    ? "Connecting"
                    : "Offline"}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {lastUpdate && (
              <span className="text-sm text-gray-400">
                Updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={refreshData}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sport
            </label>
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {(sports.length > 0 ? sports : defaultSports).map((sport) => (
                <option key={sport.id} value={sport.id}>
                  {sport.icon} {sport.name} {sport.priority === 1 ? "⭐" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sort by
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="time">Game Time</option>
              <option value="sport">Sport</option>
              <option value="status">Status</option>
            </select>
          </div>

          <div className="flex items-end space-x-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showOnlyLive}
                onChange={(e) => setShowOnlyLive(e.target.checked)}
                className="rounded bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-300">Live only</span>
            </label>
          </div>
        </div>

        {/* Live Events Alert */}
        {liveEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
          >
            <h3 className="text-lg font-semibold text-red-400 mb-2 flex items-center">
              <FireIcon className="h-5 w-5 mr-2" />
              Live Games ({liveEvents.length})
            </h3>
            <div className="grid gap-2">
              {liveEvents.slice(0, 3).map((event) => (
                <div key={event.id} className="text-sm text-red-300">
                  {event.homeTeam} vs {event.awayTeam} - {event.sportName}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* API Status Info */}
        {serviceStatus && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-blue-400 flex items-center">
                <SignalIcon className="h-4 w-4 mr-2" />
                API Status
              </h3>
              <span className="text-xs text-blue-300">
                {serviceStatus.api_info?.requests_used_today || 0}/
                {serviceStatus.api_info?.daily_limit || "N/A"} requests today
              </span>
            </div>
            <div className="text-xs text-blue-300 mt-1">
              {serviceStatus.service?.mockMode
                ? "🎭 Demo mode - Get your free API key at the-odds-api.com for live data"
                : "📡 Live data from The Odds API"}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Events List */}
        <div className="space-y-4">
          <AnimatePresence>
            {sortedEvents.length === 0 ? (
              <div className="text-center py-12">
                <TrophyIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No events available</p>
                <p className="text-gray-500 text-sm mt-2">
                  Try adjusting your filters or refreshing the data
                </p>
              </div>
            ) : (
              sortedEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  {/* Event Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}
                      >
                        {event.status === "live" && (
                          <FireIcon className="h-3 w-3 inline mr-1" />
                        )}
                        {event.status.replace("_", " ").toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-400">
                        {event.sportName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">
                        {formatTime(event.commence_time)}
                      </span>
                      <button
                        onClick={() => toggleFavorite(event.id)}
                        className="p-1 rounded-full hover:bg-gray-700 transition-colors"
                      >
                        {favorites.has(event.id) ? (
                          <StarIconSolid className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <StarIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Teams */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-1">
                      {event.awayTeam} @ {event.homeTeam}
                    </h3>
                  </div>

                  {/* Odds */}
                  {event.odds && (
                    <div className="grid md:grid-cols-3 gap-4">
                      {/* Moneyline */}
                      {event.odds.moneyline &&
                        (event.odds.moneyline.homeTeam ||
                          event.odds.moneyline.awayTeam) && (
                          <div className="bg-gray-700/50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-300 mb-3">
                              Moneyline
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-300">
                                  {event.awayTeam}
                                </span>
                                <button
                                  onClick={() =>
                                    handleBetSelection(
                                      event,
                                      "moneyline",
                                      event.awayTeam,
                                      event.odds.moneyline.awayTeam,
                                    )
                                  }
                                  className="bg-gray-600 hover:bg-blue-600 px-3 py-1 rounded transition-colors"
                                >
                                  <span className="font-bold">
                                    {event.odds.moneyline.awayTeam
                                      ? formatOdds(
                                          event.odds.moneyline.awayTeam.price,
                                        )
                                      : "N/A"}
                                  </span>
                                  {event.odds.moneyline.awayTeam?.bookmaker && (
                                    <div className="text-xs text-gray-400">
                                      {event.odds.moneyline.awayTeam.bookmaker}
                                    </div>
                                  )}
                                </button>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-300">
                                  {event.homeTeam}
                                </span>
                                <button
                                  onClick={() =>
                                    handleBetSelection(
                                      event,
                                      "moneyline",
                                      event.homeTeam,
                                      event.odds.moneyline.homeTeam,
                                    )
                                  }
                                  className="bg-gray-600 hover:bg-blue-600 px-3 py-1 rounded transition-colors"
                                >
                                  <span className="font-bold">
                                    {event.odds.moneyline.homeTeam
                                      ? formatOdds(
                                          event.odds.moneyline.homeTeam.price,
                                        )
                                      : "N/A"}
                                  </span>
                                  {event.odds.moneyline.homeTeam?.bookmaker && (
                                    <div className="text-xs text-gray-400">
                                      {event.odds.moneyline.homeTeam.bookmaker}
                                    </div>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                      {/* Spread */}
                      {event.odds.spread &&
                        (event.odds.spread.homeTeam ||
                          event.odds.spread.awayTeam) && (
                          <div className="bg-gray-700/50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-300 mb-3">
                              Point Spread
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-300">
                                  {event.awayTeam}{" "}
                                  {event.odds.spread.awayTeam?.point
                                    ? `(${event.odds.spread.awayTeam.point > 0 ? "+" : ""}${event.odds.spread.awayTeam.point})`
                                    : ""}
                                </span>
                                <button
                                  onClick={() =>
                                    handleBetSelection(
                                      event,
                                      "spread",
                                      `${event.awayTeam} ${event.odds.spread.awayTeam?.point}`,
                                      event.odds.spread.awayTeam,
                                    )
                                  }
                                  className="bg-gray-600 hover:bg-blue-600 px-3 py-1 rounded transition-colors"
                                >
                                  <span className="font-bold">
                                    {event.odds.spread.awayTeam
                                      ? formatOdds(
                                          event.odds.spread.awayTeam.price,
                                        )
                                      : "N/A"}
                                  </span>
                                </button>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-300">
                                  {event.homeTeam}{" "}
                                  {event.odds.spread.homeTeam?.point
                                    ? `(${event.odds.spread.homeTeam.point > 0 ? "+" : ""}${event.odds.spread.homeTeam.point})`
                                    : ""}
                                </span>
                                <button
                                  onClick={() =>
                                    handleBetSelection(
                                      event,
                                      "spread",
                                      `${event.homeTeam} ${event.odds.spread.homeTeam?.point}`,
                                      event.odds.spread.homeTeam,
                                    )
                                  }
                                  className="bg-gray-600 hover:bg-blue-600 px-3 py-1 rounded transition-colors"
                                >
                                  <span className="font-bold">
                                    {event.odds.spread.homeTeam
                                      ? formatOdds(
                                          event.odds.spread.homeTeam.price,
                                        )
                                      : "N/A"}
                                  </span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                      {/* Total */}
                      {event.odds.total &&
                        (event.odds.total.over || event.odds.total.under) && (
                          <div className="bg-gray-700/50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-300 mb-3">
                              Over/Under{" "}
                              {event.odds.total.over?.point ||
                                event.odds.total.under?.point ||
                                ""}
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-300">
                                  Over
                                </span>
                                <button
                                  onClick={() =>
                                    handleBetSelection(
                                      event,
                                      "total",
                                      `Over ${event.odds.total.over?.point}`,
                                      event.odds.total.over,
                                    )
                                  }
                                  className="bg-gray-600 hover:bg-blue-600 px-3 py-1 rounded transition-colors"
                                >
                                  <span className="font-bold">
                                    {event.odds.total.over
                                      ? formatOdds(event.odds.total.over.price)
                                      : "N/A"}
                                  </span>
                                </button>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-300">
                                  Under
                                </span>
                                <button
                                  onClick={() =>
                                    handleBetSelection(
                                      event,
                                      "total",
                                      `Under ${event.odds.total.under?.point}`,
                                      event.odds.total.under,
                                    )
                                  }
                                  className="bg-gray-600 hover:bg-blue-600 px-3 py-1 rounded transition-colors"
                                >
                                  <span className="font-bold">
                                    {event.odds.total.under
                                      ? formatOdds(event.odds.total.under.price)
                                      : "N/A"}
                                  </span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Bookmakers */}
                  {event.bookmakers && event.bookmakers.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-600">
                      <div className="text-xs text-gray-400">
                        Available on:{" "}
                        {event.bookmakers.map((b) => b.title).join(", ")}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* API Info */}
        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-400 mb-2">
            📊 Sports Betting Data
          </h3>
          <div className="text-xs text-blue-300 space-y-1">
            <p>• Free tier: 500 API requests/month from The Odds API</p>
            <p>• Real-time updates via WebSocket when available</p>
            <p>• Data updates every 15 minutes for optimal efficiency</p>
            <p>
              •{" "}
              <a
                href="https://the-odds-api.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-200"
              >
                Get your free API key
              </a>{" "}
              for live data
            </p>
          </div>
        </div>

        {/* Bet Slip */}
        <BetSlip isOpen={betSlipOpen} onClose={() => setBetSlipOpen(false)} />
      </div>
    </div>
  );
};

export default Sports;
