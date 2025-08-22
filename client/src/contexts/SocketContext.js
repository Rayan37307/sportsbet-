import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

// Create socket context
const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated && token && user) {
      const socketInstance = io(
        process.env.REACT_APP_API_URL || "http://localhost:5000",
        {
          auth: {
            token: token,
            userId: user.id,
          },
          transports: ["websocket", "polling"],
          timeout: 20000,
          forceNew: true,
        },
      );

      // Connection event handlers
      socketInstance.on("connect", () => {
        console.log("✅ Socket connected:", socketInstance.id);
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;
      });

      socketInstance.on("disconnect", (reason) => {
        console.log("❌ Socket disconnected:", reason);
        setIsConnected(false);

        if (reason === "io server disconnect") {
          // Server initiated disconnect, reconnect manually
          socketInstance.connect();
        }
      });

      socketInstance.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setConnectionError(error.message);
        reconnectAttempts.current++;

        if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.error("Max reconnection attempts reached");
          toast.error("Unable to establish real-time connection");
        }
      });

      // Real-time event handlers
      socketInstance.on("odds_update", (data) => {
        console.log("📊 Odds updated:", data);
        // Dispatch custom event for components to listen
        window.dispatchEvent(new CustomEvent("oddsUpdate", { detail: data }));
      });

      socketInstance.on("bet_update", (data) => {
        console.log("🎲 Bet update:", data);
        window.dispatchEvent(new CustomEvent("betUpdate", { detail: data }));

        // Show toast notification for user's bets
        if (data.userId === user.id) {
          if (data.status === "won") {
            toast.success(`🎉 Congratulations! Your bet won $${data.payout}`);
          } else if (data.status === "lost") {
            toast.error(`😔 Your bet on ${data.eventTitle} didn't win`);
          }
        }
      });

      socketInstance.on("event_update", (data) => {
        console.log("⚽ Event updated:", data);
        window.dispatchEvent(new CustomEvent("eventUpdate", { detail: data }));

        // Notify about event status changes
        if (data.status === "live") {
          toast(`🔴 LIVE: ${data.title}`, {
            icon: "⚽",
            duration: 5000,
          });
        } else if (data.status === "finished") {
          toast(`✅ Finished: ${data.title}`, {
            duration: 4000,
          });
        }
      });

      socketInstance.on("balance_update", (data) => {
        console.log("💰 Balance updated:", data);
        window.dispatchEvent(
          new CustomEvent("balanceUpdate", { detail: data }),
        );

        if (data.userId === user.id) {
          toast.success(`💰 Balance updated: $${data.newBalance}`);
        }
      });

      socketInstance.on("notification", (data) => {
        console.log("🔔 Notification:", data);

        // Show notification based on type
        switch (data.type) {
          case "success":
            toast.success(data.message);
            break;
          case "warning":
            toast(data.message, { icon: "⚠️" });
            break;
          case "error":
            toast.error(data.message);
            break;
          case "info":
          default:
            toast(data.message, { icon: "ℹ️" });
            break;
        }
      });

      // Admin/Agent specific events
      if (user.role === "admin" || user.role === "super_admin") {
        socketInstance.on("user_registered", (data) => {
          toast(`👤 New user registered: ${data.username}`, {
            duration: 6000,
          });
        });

        socketInstance.on("high_value_bet", (data) => {
          toast(`🚨 High value bet: $${data.amount} on ${data.eventTitle}`, {
            duration: 8000,
            style: {
              background: "#f59e0b",
              color: "#fff",
            },
          });
        });

        socketInstance.on("system_alert", (data) => {
          toast.error(`🚨 System Alert: ${data.message}`, {
            duration: 10000,
          });
        });
      }

      if (user.role === "agent" || user.role === "sub_agent") {
        socketInstance.on("user_bet_placed", (data) => {
          if (data.agentId === user.id) {
            toast(`🎲 User ${data.username} placed a $${data.amount} bet`, {
              duration: 5000,
            });
          }
        });

        socketInstance.on("commission_earned", (data) => {
          if (data.agentId === user.id) {
            toast.success(`💰 Commission earned: $${data.amount}`, {
              duration: 6000,
            });
          }
        });
      }

      setSocket(socketInstance);

      return () => {
        console.log("🔌 Cleaning up socket connection");
        socketInstance.off("connect");
        socketInstance.off("disconnect");
        socketInstance.off("connect_error");
        socketInstance.off("odds_update");
        socketInstance.off("bet_update");
        socketInstance.off("event_update");
        socketInstance.off("balance_update");
        socketInstance.off("notification");
        socketInstance.disconnect();
      };
    } else {
      // Cleanup socket when user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, token, user]);

  // Socket utility methods
  const emit = (event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    } else {
      console.warn("Socket not connected, cannot emit event:", event);
    }
  };

  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  // Join/leave rooms
  const joinRoom = (room) => {
    emit("join_room", { room });
  };

  const leaveRoom = (room) => {
    emit("leave_room", { room });
  };

  // Betting related events
  const subscribeToBetting = () => {
    joinRoom("betting_updates");
  };

  const unsubscribeFromBetting = () => {
    leaveRoom("betting_updates");
  };

  // Event related events
  const subscribeToEvent = (eventId) => {
    joinRoom(`event_${eventId}`);
  };

  const unsubscribeFromEvent = (eventId) => {
    leaveRoom(`event_${eventId}`);
  };

  // Sport related events
  const subscribeToSport = (sport) => {
    joinRoom(`sport_${sport}`);
  };

  const unsubscribeFromSport = (sport) => {
    leaveRoom(`sport_${sport}`);
  };

  // Admin room
  const joinAdminRoom = () => {
    if (user && (user.role === "admin" || user.role === "super_admin")) {
      joinRoom("admin_updates");
    }
  };

  const leaveAdminRoom = () => {
    leaveRoom("admin_updates");
  };

  // Agent room
  const joinAgentRoom = () => {
    if (user && (user.role === "agent" || user.role === "sub_agent")) {
      joinRoom(`agent_${user.id}`);
    }
  };

  const leaveAgentRoom = () => {
    if (user && (user.role === "agent" || user.role === "sub_agent")) {
      leaveRoom(`agent_${user.id}`);
    }
  };

  // Reconnect manually
  const reconnect = () => {
    if (socket) {
      socket.connect();
    }
  };

  const value = {
    socket,
    isConnected,
    connectionError,
    emit,
    on,
    off,
    joinRoom,
    leaveRoom,
    subscribeToBetting,
    unsubscribeFromBetting,
    subscribeToEvent,
    unsubscribeFromEvent,
    subscribeToSport,
    unsubscribeFromSport,
    joinAdminRoom,
    leaveAdminRoom,
    joinAgentRoom,
    leaveAgentRoom,
    reconnect,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

// Custom hook to use socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export default SocketContext;
