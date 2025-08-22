import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon,
  StarIcon,
  FireIcon,
  TrophyIcon,
  ArrowPathIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BanknotesIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { useSocket } from "../../contexts/SocketContext";
import { useBetSlip } from "../../contexts/BetSlipContext";
import BetSlip from "../../components/Betting/BetSlip";
import toast from "react-hot-toast";
import axios from "../../config/axios";
import io from "socket.io-client";
import ApiTest from "../../components/Debug/ApiTest";

const ProfessionalSports = () => {
  // State management
  const [events, setEvents] = useState([]);
  const [sports, setSports] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState("all");
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
  const [refreshing, setRefreshing] = useState(false);

  const { socket, isConnected } = useSocket();
  const { addSelection, hasSelection, getSelectionCount } = useBetSlip();

  // Professional sport configurations
  const defaultSports = [
    { id: "all", name: "All Sports", icon: "🏆", priority: 0 },
    { id: "americanfootball_nfl", name: "NFL", icon: "🏈", priority: 1 },
    { id: "basketball_nba", name: "NBA", icon: "🏀", priority: 1 },
    { id: "baseball_mlb", name: "MLB", icon: "⚾", priority: 1 },
    { id: "icehockey_nhl", name: "NHL", icon: "🏒", priority: 1 },
    { id: "soccer_epl", name: "Premier League", icon: "⚽", priority: 2 },
    {
      id: "soccer_uefa_champs_league",
      name: "Champions League",
      icon: "🏆",
      priority: 2,
    },
    {
      id: "americanfootball_ncaaf",
      name: "College Football",
      icon: "🎓",
      priority: 3,
    },
    {
      id: "basketball_ncaab",
      name: "College Basketball",
      icon: "🎓",
      priority: 3,
    },
  ];

  // Initialize favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem("sportsbook_favorites");
    if (savedFavorites) {
      try {
        setFavorites(new Set(JSON.parse(savedFavorites)));
      } catch (err) {
        console.warn("Failed to load favorites:", err);
      }
    }
  }, []);

  // Initialize socket connection for real-time updates
  useEffect(() => {
    const socketUrl =
      process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";
    const newSocket = io(socketUrl);
    setSportsSocket(newSocket);

    // Connection event handlers
    newSocket.on("connect", () => {
      setConnectionStatus("connected");
      console.log("🔗 Connected to sports data feed");
    });

    newSocket.on("disconnect", () => {
      setConnectionStatus("disconnected");
      console.log("❌ Disconnected from sports data feed");
    });

    newSocket.on("reconnect", () => {
      setConnectionStatus("connected");
      toast.success("Reconnected to live data feed");
      fetchSportsData();
    });

    // Data event handlers
    newSocket.on("initial_data", handleInitialData);
    newSocket.on("odds_update", handleOddsUpdate);
    newSocket.on("score_update", handleScoreUpdate);
    newSocket.on("new_events", handleNewEvents);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  // Data event handlers
  const handleInitialData = useCallback((data) => {
    console.log("📊 Received initial sports data:", data);
    if (data.sports) setSports(data.sports);
    if (data.events) setEvents(data.events);
    setLastUpdate(new Date(data.timestamp));
  }, []);

  const handleOddsUpdate = useCallback((data) => {
    console.log("📈 Odds update:", data);
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === data.eventId ? { ...event, ...data.event } : event,
      ),
    );
    setLastUpdate(new Date(data.timestamp));

    if (data.significant) {
      toast(
        `📈 Odds updated for ${data.event.awayTeam} @ ${data.event.homeTeam}`,
        {
          icon: "📊",
          duration: 3000,
        },
      );
    }
  }, []);

  const handleScoreUpdate = useCallback((data) => {
    console.log("⚽ Score update:", data);
    setLiveEvents((prevLive) =>
      prevLive.map((event) =>
        event.id === data.eventId
          ? { ...event, scores: data.scores, completed: data.completed }
          : event,
      ),
    );
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === data.eventId
          ? { ...event, scores: data.scores, completed: data.completed }
          : event,
      ),
    );
    setLastUpdate(new Date(data.timestamp));
  }, []);

  const handleNewEvents = useCallback((newEvents) => {
    console.log("🆕 New events:", newEvents);
    setEvents((prevEvents) => [...prevEvents, ...newEvents]);
    setLastUpdate(new Date());
    if (newEvents.length > 0) {
      toast.success(`${newEvents.length} new games added!`, {
        icon: "🆕",
      });
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchSportsData();
    fetchServiceStatus();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchEventsData();
  }, [selectedSport, showOnlyLive]);

  // Main data fetching function
  const fetchSportsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const requests = [
        axios.get("/api/sports"),
        axios.get("/api/sports/events"),
        axios.get("/api/sports/live"),
      ];

      const [sportsRes, eventsRes, liveRes] =
        await Promise.allSettled(requests);

      // Handle sports data
      if (sportsRes.status === "fulfilled" && sportsRes.value.data.success) {
        const sportsData = sportsRes.value.data.data || defaultSports;
        setSports(sportsData.length > 0 ? sportsData : defaultSports);
      } else {
        setSports(defaultSports);
      }

      // Handle events data
      if (eventsRes.status === "fulfilled" && eventsRes.value.data.success) {
        const eventsData = eventsRes.value.data.data || [];
        setEvents(eventsData);
      } else {
        console.warn("Failed to fetch events:", eventsRes.reason?.message);
      }

      // Handle live events data
      if (liveRes.status === "fulfilled" && liveRes.value.data.success) {
        const liveData = liveRes.value.data.data || [];
        setLiveEvents(liveData);
      }

      setLastUpdate(new Date());
    } catch (err) {
      setError("Unable to fetch sports data. Please check your connection.");
      console.error("Error fetching sports data:", err);
      setSports(defaultSports);
      toast.error("Failed to load sports data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch filtered events
  const fetchEventsData = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedSport && selectedSport !== "all") {
        params.append("sport", selectedSport);
      }
      if (showOnlyLive) {
        params.append("status", "live");
      }

      const url = `/api/sports/events${params.toString() ? `?${params}` : ""}`;
      const response = await axios.get(url);
      if (response.data.success) {
        setEvents(response.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching filtered events:", err);

      // Handle validation errors
      if (err.response?.status === 400 && err.response?.data?.errors) {
        const validationErrors = err.response.data.errors
          .map((e) => e.msg)
          .join(", ");
        toast.error(`Filter validation error: ${validationErrors}`);
      }
    }
  };

  // Fetch service status
  const fetchServiceStatus = async () => {
    try {
      const response = await axios.get("/api/sports/status");
      if (response.data.success) {
        setServiceStatus(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching service status:", err);
    }
  };

  // Manual data refresh
  const refreshData = async () => {
    try {
      setRefreshing(true);

      // Prepare request body - only include sport if it's not "all"
      const requestBody = {};
      if (selectedSport !== "all") {
        requestBody.sport = selectedSport;
      }

      const response = await axios.post("/api/sports/refresh", requestBody);

      if (response.data.success) {
        await fetchSportsData();
        toast.success("Data refreshed successfully!", {
          icon: "✅",
        });
      } else {
        toast.error(response.data.message || "Failed to refresh");
      }
    } catch (err) {
      console.error("Refresh error:", err);

      // Handle validation errors specifically
      if (
        err.response?.data?.errors &&
        Array.isArray(err.response.data.errors)
      ) {
        const validationErrors = err.response.data.errors
          .map((e) => e.msg)
          .join(", ");
        toast.error(`Validation error: ${validationErrors}`);
      } else if (err.response?.status === 400) {
        toast.error("Invalid request. Please check your filters.");
      } else if (err.response?.status === 429) {
        toast.error("Rate limit reached. Please try again later.");
      } else {
        const errorMsg =
          err.response?.data?.message || "Failed to refresh data";
        toast.error(errorMsg);
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Bet selection handler
  const handleBetSelection = (event, marketType, selection, odds) => {
    if (!odds || !odds.price) {
      toast.error("Invalid odds data");
      return;
    }

    const betSelection = {
      eventId: event.id,
      eventTitle: `${event.awayTeam} @ ${event.homeTeam}`,
      eventTime: event.commence_time,
      marketType,
      selection,
      odds: odds.price,
      decimalOdds: odds.decimal || convertToDecimal(odds.price),
      bookmaker: odds.bookmaker || "Multiple",
      team1: event.homeTeam,
      team2: event.awayTeam,
      league: event.sportName || selectedSport,
      sport: event.sport || selectedSport,
    };

    try {
      addSelection(betSelection);
      setBetSlipOpen(true);
      toast.success(`Added ${selection} to bet slip`, {
        icon: "🎯",
      });
    } catch (error) {
      toast.error("Failed to add bet to slip");
    }
  };

  // Favorites management
  const toggleFavorite = (eventId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(eventId)) {
      newFavorites.delete(eventId);
      toast.success("Removed from favorites", { icon: "⭐" });
    } else {
      newFavorites.add(eventId);
      toast.success("Added to favorites", { icon: "⭐" });
    }
    setFavorites(newFavorites);
    localStorage.setItem(
      "sportsbook_favorites",
      JSON.stringify([...newFavorites]),
    );
  };

  // Utility functions
  const convertToDecimal = (americanOdds) => {
    if (americanOdds > 0) {
      return (americanOdds / 100 + 1).toFixed(2);
    } else {
      return (100 / Math.abs(americanOdds) + 1).toFixed(2);
    }
  };

  const formatOdds = (odds) => {
    if (!odds) return "N/A";
    if (odds > 0) return `+${odds}`;
    return odds.toString();
  };

  const formatTime = (timeString) => {
    const date = new Date(timeString);
    const now = new Date();
    const diff = date - now;

    if (diff < 0) return "Started";
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes}m`;
    }
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "live":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      case "upcoming":
        return "text-green-400 bg-green-400/10 border-green-400/20";
      case "starting_soon":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "finished":
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
      default:
        return "text-blue-400 bg-blue-400/10 border-blue-400/20";
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

  // Filter and sort events
  const filteredEvents = events.filter((event) => {
    const matchesSport =
      selectedSport === "all" || event.sport === selectedSport;
    const matchesSearch =
      event.homeTeam?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.awayTeam?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.sportName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFavorites = !showFavorites || favorites.has(event.id);
    const matchesLive = !showOnlyLive || event.status === "live";

    return matchesSport && matchesSearch && matchesFavorites && matchesLive;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    switch (sortBy) {
      case "time":
        return new Date(a.commence_time) - new Date(b.commence_time);
      case "sport":
        return (a.sportName || "").localeCompare(b.sportName || "");
      case "status":
        const statusOrder = {
          live: 0,
          starting_soon: 1,
          upcoming: 2,
          finished: 3,
        };
        return (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4);
      default:
        return 0;
    }
  });

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-t-4 border-blue-500 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <TrophyIcon className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <p className="text-white mt-6 text-lg">Loading Sports Data...</p>
          <p className="text-gray-400 mt-2 text-sm">
            Fetching latest odds and events
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-6">
        {/* Professional Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8"
        >
          <div className="flex items-center space-x-4 mb-4 lg:mb-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <TrophyIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Live Sports Betting
                </h1>
                <p className="text-gray-400 text-sm">
                  Real-time odds and live updates
                </p>
              </div>
            </div>

            {/* Connection Status */}
            <div
              className={`flex items-center px-3 py-1 rounded-full border ${getConnectionStatusColor()}`}
            >
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  connectionStatus === "connected"
                    ? "bg-green-400 animate-pulse"
                    : connectionStatus === "connecting"
                      ? "bg-yellow-400 animate-ping"
                      : "bg-red-400"
                }`}
              ></div>
              <span className="text-sm font-medium">
                {connectionStatus === "connected"
                  ? "Live"
                  : connectionStatus === "connecting"
                    ? "Connecting..."
                    : "Offline"}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {lastUpdate && (
              <div className="flex items-center text-sm text-gray-400">
                <ClockIcon className="h-4 w-4 mr-1" />
                Updated {formatTime(lastUpdate)}
              </div>
            )}
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>
        </motion.div>

        {/* Service Status - Professional Display */}
        {serviceStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl border-2 ${
              serviceStatus.service?.mockMode
                ? "bg-amber-500/10 border-amber-500/20"
                : "bg-green-500/10 border-green-500/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {serviceStatus.service?.mockMode ? (
                  <ExclamationTriangleIcon className="h-6 w-6 text-amber-400" />
                ) : (
                  <SignalIcon className="h-6 w-6 text-green-400" />
                )}
                <div>
                  <h3
                    className={`font-semibold ${serviceStatus.service?.mockMode ? "text-amber-400" : "text-green-400"}`}
                  >
                    {serviceStatus.service?.mockMode
                      ? "Demo Mode Active"
                      : "Live Data Feed"}
                  </h3>
                  <p className="text-sm text-gray-300">
                    {serviceStatus.service?.mockMode
                      ? "Using simulated data for demonstration"
                      : "Real-time data from The Odds API"}
                  </p>
                </div>
              </div>

              {serviceStatus.api_info && (
                <div className="text-right">
                  <p className="text-xs text-gray-400">
                    API Usage: {serviceStatus.api_info.requests_used_today || 0}
                    /{serviceStatus.api_info.daily_limit || "500"} today
                  </p>
                  {serviceStatus.service?.mockMode && (
                    <a
                      href="https://the-odds-api.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-amber-400 hover:text-amber-300 underline"
                    >
                      Get API Key →
                    </a>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Live Events Ticker */}
        {liveEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl"
          >
            <div className="flex items-center mb-3">
              <FireIcon className="h-5 w-5 text-red-400 mr-2 animate-pulse" />
              <h3 className="text-lg font-semibold text-red-400">
                Live Games ({liveEvents.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {liveEvents.slice(0, 6).map((event) => (
                <div
                  key={event.id}
                  className="text-sm text-red-300 bg-red-500/5 p-2 rounded"
                >
                  <span className="font-medium">{event.homeTeam}</span> vs{" "}
                  <span className="font-medium">{event.awayTeam}</span>
                  <div className="text-xs text-red-400">{event.sportName}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Professional Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          {/* Sport Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sport Category
            </label>
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {(sports.length > 0 ? sports : defaultSports).map((sport) => (
                <option
                  key={sport.id || sport.key}
                  value={sport.id || sport.key}
                >
                  {sport.icon} {sport.name || sport.title}
                  {sport.priority === 1 ? " ⭐" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Search Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search Teams
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search teams or leagues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Sort Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="time">Game Time</option>
              <option value="sport">Sport Type</option>
              <option value="status">Game Status</option>
            </select>
          </div>

          {/* Toggle Filters */}
          <div className="flex flex-col justify-end space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showOnlyLive}
                onChange={(e) => setShowOnlyLive(e.target.checked)}
                className="rounded bg-gray-800 border-gray-600 text-red-600 focus:ring-red-500 mr-2"
              />
              <span className="text-sm text-gray-300">Live Games Only</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showFavorites}
                onChange={(e) => setShowFavorites(e.target.checked)}
                className="rounded bg-gray-800 border-gray-600 text-yellow-600 focus:ring-yellow-500 mr-2"
              />
              <span className="text-sm text-gray-300">Favorites Only</span>
            </label>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
          >
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-400">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Events List */}
        <div className="space-y-4">
          <AnimatePresence>
            {sortedEvents.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <TrophyIcon className="h-20 w-20 text-gray-600 mx-auto mb-6" />
                <h3 className="text-xl text-gray-400 mb-2">
                  No Events Available
                </h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  {searchQuery
                    ? `No events match your search "${searchQuery}"`
                    : showOnlyLive
                      ? "No live games at the moment. Check back soon!"
                      : "Try adjusting your filters or refreshing the data"}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-4 text-blue-400 hover:text-blue-300 text-sm underline"
                  >
                    Clear search
                  </button>
                )}
              </motion.div>
            ) : (
              sortedEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gradient-to-br from-gray-800/80 to-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 hover:shadow-xl transition-all duration-300"
                >
                  {/* Event Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.status)}`}
                      >
                        {event.status === "live" && (
                          <FireIcon className="h-3 w-3 inline mr-1" />
                        )}
                        {event.status?.replace("_", " ").toUpperCase() ||
                          "SCHEDULED"}
                      </span>
                      <div>
                        <span className="text-sm text-gray-400 font-medium">
                          {event.sportName || "Sports Event"}
                        </span>
                        {event.league && (
                          <span className="text-xs text-gray-500 ml-2">
                            • {event.league}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-sm text-gray-300 font-medium">
                          {formatTime(event.commence_time)}
                        </div>
                        {event.commence_time && (
                          <div className="text-xs text-gray-500">
                            {new Date(event.commence_time).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => toggleFavorite(event.id)}
                        className="p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                      >
                        {favorites.has(event.id) ? (
                          <StarIconSolid className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <StarIcon className="h-5 w-5 text-gray-400 hover:text-yellow-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Teams Matchup */}
                  <div className="mb-6">
                    <div className="flex items-center justify-center">
                      <div className="text-center flex-1">
                        <div className="text-lg font-bold text-white mb-1">
                          {event.awayTeam || "Away Team"}
                        </div>
                        <div className="text-sm text-gray-400">Away</div>
                      </div>
                      <div className="mx-6 text-gray-500 font-bold">VS</div>
                      <div className="text-center flex-1">
                        <div className="text-lg font-bold text-white mb-1">
                          {event.homeTeam || "Home Team"}
                        </div>
                        <div className="text-sm text-gray-400">Home</div>
                      </div>
                    </div>
                  </div>

                  {/* Professional Odds Display */}
                  {event.odds ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Moneyline */}
                      {event.odds.moneyline && (
                        <div className="bg-gradient-to-br from-gray-700/30 to-gray-700/10 backdrop-blur-sm rounded-lg p-4 border border-gray-600/30">
                          <div className="flex items-center mb-3">
                            <BanknotesIcon className="h-4 w-4 text-green-400 mr-2" />
                            <h4 className="font-semibold text-gray-300">
                              Moneyline
                            </h4>
                          </div>
                          <div className="space-y-3">
                            {event.odds.moneyline.awayTeam && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-300 font-medium">
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
                                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg font-bold transition-all duration-200 shadow-md hover:shadow-lg"
                                >
                                  {formatOdds(
                                    event.odds.moneyline.awayTeam.price,
                                  )}
                                </button>
                              </div>
                            )}
                            {event.odds.moneyline.homeTeam && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-300 font-medium">
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
                                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg font-bold transition-all duration-200 shadow-md hover:shadow-lg"
                                >
                                  {formatOdds(
                                    event.odds.moneyline.homeTeam.price,
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Point Spread */}
                      {event.odds.spread && (
                        <div className="bg-gradient-to-br from-gray-700/30 to-gray-700/10 backdrop-blur-sm rounded-lg p-4 border border-gray-600/30">
                          <div className="flex items-center mb-3">
                            <ChartBarIcon className="h-4 w-4 text-purple-400 mr-2" />
                            <h4 className="font-semibold text-gray-300">
                              Point Spread
                            </h4>
                          </div>
                          <div className="space-y-3">
                            {event.odds.spread.awayTeam && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-300 font-medium">
                                  {event.awayTeam}
                                  <span className="text-purple-400 ml-2">
                                    (
                                    {event.odds.spread.awayTeam.point > 0
                                      ? "+"
                                      : ""}
                                    {event.odds.spread.awayTeam.point})
                                  </span>
                                </span>
                                <button
                                  onClick={() =>
                                    handleBetSelection(
                                      event,
                                      "spread",
                                      `${event.awayTeam} ${event.odds.spread.awayTeam.point}`,
                                      event.odds.spread.awayTeam,
                                    )
                                  }
                                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 rounded-lg font-bold transition-all duration-200 shadow-md hover:shadow-lg"
                                >
                                  {formatOdds(event.odds.spread.awayTeam.price)}
                                </button>
                              </div>
                            )}
                            {event.odds.spread.homeTeam && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-300 font-medium">
                                  {event.homeTeam}
                                  <span className="text-purple-400 ml-2">
                                    (
                                    {event.odds.spread.homeTeam.point > 0
                                      ? "+"
                                      : ""}
                                    {event.odds.spread.homeTeam.point})
                                  </span>
                                </span>
                                <button
                                  onClick={() =>
                                    handleBetSelection(
                                      event,
                                      "spread",
                                      `${event.homeTeam} ${event.odds.spread.homeTeam.point}`,
                                      event.odds.spread.homeTeam,
                                    )
                                  }
                                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 rounded-lg font-bold transition-all duration-200 shadow-md hover:shadow-lg"
                                >
                                  {formatOdds(event.odds.spread.homeTeam.price)}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Over/Under */}
                      {event.odds.total && (
                        <div className="bg-gradient-to-br from-gray-700/30 to-gray-700/10 backdrop-blur-sm rounded-lg p-4 border border-gray-600/30">
                          <div className="flex items-center mb-3">
                            <ArrowPathIcon className="h-4 w-4 text-orange-400 mr-2" />
                            <h4 className="font-semibold text-gray-300">
                              Total:{" "}
                              {event.odds.total.over?.point ||
                                event.odds.total.under?.point}
                            </h4>
                          </div>
                          <div className="space-y-3">
                            {event.odds.total.over && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-300 font-medium">
                                  Over {event.odds.total.over.point}
                                </span>
                                <button
                                  onClick={() =>
                                    handleBetSelection(
                                      event,
                                      "total",
                                      `Over ${event.odds.total.over.point}`,
                                      event.odds.total.over,
                                    )
                                  }
                                  className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-4 py-2 rounded-lg font-bold transition-all duration-200 shadow-md hover:shadow-lg"
                                >
                                  {formatOdds(event.odds.total.over.price)}
                                </button>
                              </div>
                            )}
                            {event.odds.total.under && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-300 font-medium">
                                  Under {event.odds.total.under.point}
                                </span>
                                <button
                                  onClick={() =>
                                    handleBetSelection(
                                      event,
                                      "total",
                                      `Under ${event.odds.total.under.point}`,
                                      event.odds.total.under,
                                    )
                                  }
                                  className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-4 py-2 rounded-lg font-bold transition-all duration-200 shadow-md hover:shadow-lg"
                                >
                                  {formatOdds(event.odds.total.under.price)}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-700/30 rounded-lg p-6 text-center">
                      <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <p className="text-gray-400">Odds not available</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Check back soon for updated odds
                      </p>
                    </div>
                  )}

                  {/* Bookmakers Info */}
                  {event.bookmakers && event.bookmakers.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-600/50">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-400">
                          <span className="font-medium">Available on:</span>{" "}
                          {event.bookmakers
                            .slice(0, 3)
                            .map((b) => b.title || b.key)
                            .join(", ")}
                          {event.bookmakers.length > 3 &&
                            ` +${event.bookmakers.length - 3} more`}
                        </div>
                        {event.lastUpdate && (
                          <div className="text-xs text-gray-500">
                            Updated {formatTime(event.lastUpdate)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Professional Footer Information */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* API Information */}
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center">
              <SignalIcon className="h-5 w-5 mr-2" />
              Data & Technology
            </h3>
            <div className="text-sm text-blue-300 space-y-2">
              <p>• Professional-grade odds from The Odds API</p>
              <p>• Real-time updates via WebSocket connections</p>
              <p>• Smart caching for optimal performance</p>
              <p>• Multiple bookmaker coverage</p>
              <p>• Sub-second latency for live events</p>
            </div>
            {serviceStatus?.service?.mockMode && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-sm text-amber-300">
                  <strong>Demo Mode:</strong> Get your{" "}
                  <a
                    href="https://the-odds-api.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-amber-200"
                  >
                    free API key
                  </a>{" "}
                  for live data
                </p>
              </div>
            )}
          </div>

          {/* Betting Markets */}
          <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center">
              <BanknotesIcon className="h-5 w-5 mr-2" />
              Betting Markets
            </h3>
            <div className="text-sm text-green-300 space-y-2">
              <p>
                • <strong>Moneyline:</strong> Win/loss betting
              </p>
              <p>
                • <strong>Point Spread:</strong> Margin betting
              </p>
              <p>
                • <strong>Over/Under:</strong> Total points betting
              </p>
              <p>
                • <strong>Live Betting:</strong> In-game wagering
              </p>
              <p>
                • <strong>Multi-Bets:</strong> Parlay combinations
              </p>
            </div>
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-300">
                <strong>Responsible Gaming:</strong> Set limits and bet
                responsibly
              </p>
            </div>
          </div>
        </motion.div>

        {/* Bet Slip */}
        <BetSlip isOpen={betSlipOpen} onClose={() => setBetSlipOpen(false)} />

        {/* API Test Component for Debugging */}
        {process.env.NODE_ENV === "development" && <ApiTest />}
      </div>
    </div>
  );
};

export default ProfessionalSports;
