import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

// Create bet slip context
const BetSlipContext = createContext();

// Initial state
const initialState = {
  selections: [],
  totalStake: 0,
  potentialPayout: 0,
  totalOdds: 1,
  betType: 'single', // single, parlay, system
  isLoading: false,
  error: null,
  minStake: 1,
  maxStake: 10000
};

// Action types
const BET_SLIP_ACTIONS = {
  ADD_SELECTION: 'ADD_SELECTION',
  REMOVE_SELECTION: 'REMOVE_SELECTION',
  UPDATE_SELECTION: 'UPDATE_SELECTION',
  CLEAR_SELECTIONS: 'CLEAR_SELECTIONS',
  SET_STAKE: 'SET_STAKE',
  SET_BET_TYPE: 'SET_BET_TYPE',
  UPDATE_ODDS: 'UPDATE_ODDS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  PLACE_BET_SUCCESS: 'PLACE_BET_SUCCESS',
  CALCULATE_TOTALS: 'CALCULATE_TOTALS'
};

// Bet slip reducer
const betSlipReducer = (state, action) => {
  switch (action.type) {
    case BET_SLIP_ACTIONS.ADD_SELECTION:
      const existingIndex = state.selections.findIndex(
        sel => sel.eventId === action.payload.eventId &&
               sel.marketType === action.payload.marketType &&
               sel.selection === action.payload.selection
      );

      let newSelections;
      if (existingIndex >= 0) {
        // Update existing selection
        newSelections = state.selections.map((sel, index) =>
          index === existingIndex ? action.payload : sel
        );
      } else {
        // Add new selection
        newSelections = [...state.selections, { ...action.payload, stake: 0 }];
      }

      return {
        ...state,
        selections: newSelections,
        error: null
      };

    case BET_SLIP_ACTIONS.REMOVE_SELECTION:
      return {
        ...state,
        selections: state.selections.filter(
          sel => !(sel.eventId === action.payload.eventId &&
                  sel.marketType === action.payload.marketType &&
                  sel.selection === action.payload.selection)
        )
      };

    case BET_SLIP_ACTIONS.UPDATE_SELECTION:
      return {
        ...state,
        selections: state.selections.map(sel =>
          sel.id === action.payload.id ? { ...sel, ...action.payload.updates } : sel
        )
      };

    case BET_SLIP_ACTIONS.CLEAR_SELECTIONS:
      return {
        ...state,
        selections: [],
        totalStake: 0,
        potentialPayout: 0,
        totalOdds: 1,
        error: null
      };

    case BET_SLIP_ACTIONS.SET_STAKE:
      const updatedSelections = state.selections.map(sel =>
        sel.id === action.payload.id ? { ...sel, stake: action.payload.stake } : sel
      );
      return {
        ...state,
        selections: updatedSelections
      };

    case BET_SLIP_ACTIONS.SET_BET_TYPE:
      return {
        ...state,
        betType: action.payload
      };

    case BET_SLIP_ACTIONS.UPDATE_ODDS:
      return {
        ...state,
        selections: state.selections.map(sel =>
          sel.eventId === action.payload.eventId &&
          sel.marketType === action.payload.marketType &&
          sel.selection === action.payload.selection
            ? { ...sel, odds: action.payload.odds, updated: true }
            : sel
        )
      };

    case BET_SLIP_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case BET_SLIP_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload
      };

    case BET_SLIP_ACTIONS.PLACE_BET_SUCCESS:
      return {
        ...state,
        selections: [],
        totalStake: 0,
        potentialPayout: 0,
        totalOdds: 1,
        isLoading: false,
        error: null
      };

    case BET_SLIP_ACTIONS.CALCULATE_TOTALS:
      const totalStake = state.selections.reduce((sum, sel) => sum + (sel.stake || 0), 0);

      let totalOdds = 1;
      let potentialPayout = 0;

      if (state.betType === 'single') {
        potentialPayout = state.selections.reduce((sum, sel) => {
          return sum + ((sel.stake || 0) * sel.odds);
        }, 0);
      } else if (state.betType === 'parlay') {
        if (state.selections.length > 0) {
          totalOdds = state.selections.reduce((odds, sel) => odds * sel.odds, 1);
          potentialPayout = totalStake * totalOdds;
        }
      }

      return {
        ...state,
        totalStake,
        potentialPayout,
        totalOdds
      };

    default:
      return state;
  }
};

// Bet slip provider component
export const BetSlipProvider = ({ children }) => {
  const [state, dispatch] = useReducer(betSlipReducer, initialState);
  const { socket } = useSocket();
  const { user } = useAuth();

  // Real-time odds updates
  useEffect(() => {
    if (socket) {
      socket.on('odds_update', (data) => {
        dispatch({
          type: BET_SLIP_ACTIONS.UPDATE_ODDS,
          payload: data
        });
      });

      socket.on('event_suspended', (data) => {
        const hasSelection = state.selections.some(sel => sel.eventId === data.eventId);
        if (hasSelection) {
          toast.error(`Event ${data.eventTitle} has been suspended`);
          dispatch({
            type: BET_SLIP_ACTIONS.SET_ERROR,
            payload: 'One or more events have been suspended'
          });
        }
      });

      socket.on('market_closed', (data) => {
        const hasSelection = state.selections.some(
          sel => sel.eventId === data.eventId && sel.marketType === data.marketType
        );
        if (hasSelection) {
          toast.error(`Market ${data.marketType} for ${data.eventTitle} is now closed`);
        }
      });

      return () => {
        socket.off('odds_update');
        socket.off('event_suspended');
        socket.off('market_closed');
      };
    }
  }, [socket, state.selections]);

  // Calculate totals when selections change
  useEffect(() => {
    dispatch({ type: BET_SLIP_ACTIONS.CALCULATE_TOTALS });
  }, [state.selections, state.betType]);

  // Add selection to bet slip
  const addSelection = (selection) => {
    const betSlipSelection = {
      id: `${selection.eventId}_${selection.marketType}_${selection.selection}`,
      eventId: selection.eventId,
      eventTitle: selection.eventTitle,
      eventTime: selection.eventTime,
      marketType: selection.marketType,
      selection: selection.selection,
      odds: selection.odds,
      stake: 0,
      team1: selection.team1,
      team2: selection.team2,
      league: selection.league,
      sport: selection.sport,
      addedAt: new Date(),
      updated: false
    };

    dispatch({
      type: BET_SLIP_ACTIONS.ADD_SELECTION,
      payload: betSlipSelection
    });

    toast.success(`Added ${selection.selection} to bet slip`);
  };

  // Remove selection from bet slip
  const removeSelection = (eventId, marketType, selection) => {
    dispatch({
      type: BET_SLIP_ACTIONS.REMOVE_SELECTION,
      payload: { eventId, marketType, selection }
    });

    toast.info('Selection removed from bet slip');
  };

  // Update stake for a selection
  const updateStake = (id, stake) => {
    const numericStake = parseFloat(stake) || 0;

    if (numericStake < state.minStake || numericStake > state.maxStake) {
      toast.error(`Stake must be between $${state.minStake} and $${state.maxStake}`);
      return;
    }

    if (user?.wallet?.available && numericStake > user.wallet.available) {
      toast.error('Insufficient funds');
      return;
    }

    dispatch({
      type: BET_SLIP_ACTIONS.SET_STAKE,
      payload: { id, stake: numericStake }
    });
  };

  // Set bet type
  const setBetType = (type) => {
    dispatch({
      type: BET_SLIP_ACTIONS.SET_BET_TYPE,
      payload: type
    });
  };

  // Clear all selections
  const clearSelections = () => {
    dispatch({ type: BET_SLIP_ACTIONS.CLEAR_SELECTIONS });
    toast.info('Bet slip cleared');
  };

  // Place bet
  const placeBet = async () => {
    if (state.selections.length === 0) {
      toast.error('No selections in bet slip');
      return { success: false };
    }

    const hasInvalidStakes = state.selections.some(sel =>
      !sel.stake || sel.stake < state.minStake || sel.stake > state.maxStake
    );

    if (hasInvalidStakes) {
      toast.error(`All selections must have stakes between $${state.minStake} and $${state.maxStake}`);
      return { success: false };
    }

    if (state.totalStake > user?.wallet?.available) {
      toast.error('Insufficient funds');
      return { success: false };
    }

    dispatch({ type: BET_SLIP_ACTIONS.SET_LOADING, payload: true });

    try {
      const betData = {
        selections: state.selections,
        betType: state.betType,
        totalStake: state.totalStake,
        potentialPayout: state.potentialPayout,
        totalOdds: state.totalOdds
      };

      const response = await fetch('/api/bets/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(betData)
      });

      const result = await response.json();

      if (result.success) {
        dispatch({ type: BET_SLIP_ACTIONS.PLACE_BET_SUCCESS });

        // Emit bet placement to socket for real-time updates
        if (socket) {
          socket.emit('bet_placed', {
            userId: user.id,
            betId: result.data.bet._id,
            amount: state.totalStake,
            selections: state.selections
          });
        }

        toast.success('Bet placed successfully!');
        return { success: true, bet: result.data.bet };
      } else {
        throw new Error(result.message || 'Failed to place bet');
      }
    } catch (error) {
      dispatch({
        type: BET_SLIP_ACTIONS.SET_ERROR,
        payload: error.message
      });

      toast.error(error.message || 'Failed to place bet');
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: BET_SLIP_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Quick bet (place single bet with specified amount)
  const quickBet = async (selection, amount) => {
    if (!user?.wallet?.available || amount > user.wallet.available) {
      toast.error('Insufficient funds');
      return { success: false };
    }

    try {
      const response = await fetch('/api/bets/quick-bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          selection,
          amount
        })
      });

      const result = await response.json();

      if (result.success) {
        // Emit bet placement to socket
        if (socket) {
          socket.emit('bet_placed', {
            userId: user.id,
            betId: result.data.bet._id,
            amount,
            selections: [selection]
          });
        }

        toast.success(`Quick bet placed: $${amount}`);
        return { success: true, bet: result.data.bet };
      } else {
        throw new Error(result.message || 'Failed to place quick bet');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to place quick bet');
      return { success: false, error: error.message };
    }
  };

  // Get selection count
  const getSelectionCount = () => state.selections.length;

  // Check if selection exists
  const hasSelection = (eventId, marketType, selection) => {
    return state.selections.some(
      sel => sel.eventId === eventId &&
             sel.marketType === marketType &&
             sel.selection === selection
    );
  };

  // Validate bet slip
  const validateBetSlip = () => {
    const errors = [];

    if (state.selections.length === 0) {
      errors.push('No selections in bet slip');
    }

    if (state.totalStake === 0) {
      errors.push('No stakes set');
    }

    if (state.totalStake > user?.wallet?.available) {
      errors.push('Insufficient funds');
    }

    const expiredSelections = state.selections.filter(sel => {
      const eventTime = new Date(sel.eventTime);
      return eventTime <= new Date();
    });

    if (expiredSelections.length > 0) {
      errors.push('Some events have already started');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Context value
  const value = {
    ...state,
    addSelection,
    removeSelection,
    updateStake,
    setBetType,
    clearSelections,
    placeBet,
    quickBet,
    getSelectionCount,
    hasSelection,
    validateBetSlip
  };

  return (
    <BetSlipContext.Provider value={value}>
      {children}
    </BetSlipContext.Provider>
  );
};

// Custom hook to use bet slip context
export const useBetSlip = () => {
  const context = useContext(BetSlipContext);
  if (!context) {
    throw new Error('useBetSlip must be used within a BetSlipProvider');
  }
  return context;
};

export default BetSlipContext;
