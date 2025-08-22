import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

// Create auth context
const AuthContext = createContext();

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_TOKENS: 'SET_TOKENS',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false
      };
    
    case AUTH_ACTIONS.SET_TOKENS:
      return {
        ...state,
        token: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.tokens.accessToken,
        refreshToken: action.payload.tokens.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();

  // Set up axios interceptors
  useEffect(() => {
    // Request interceptor to add auth token
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (state.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newTokens = await refreshAuthToken();
            if (newTokens) {
              // Retry the original request with new token
              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [state.token]);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (state.token) {
        try {
          await getCurrentUser();
        } catch (error) {
          console.error('Auth check failed:', error);
          logout();
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    checkAuth();
  }, []);

  // Store tokens in localStorage when they change
  useEffect(() => {
    if (state.token) {
      localStorage.setItem('accessToken', state.token);
    } else {
      localStorage.removeItem('accessToken');
    }

    if (state.refreshToken) {
      localStorage.setItem('refreshToken', state.refreshToken);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }, [state.token, state.refreshToken]);

  // Get current user from API
  const getCurrentUser = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await axios.get('/api/auth/me');
      const user = response.data.data.user;
      
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  };

  // Refresh auth token
  const refreshAuthToken = async () => {
    try {
      if (!state.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post('/api/auth/refresh', {
        refreshToken: state.refreshToken
      });

      const { accessToken, refreshToken } = response.data.data.tokens;
      
      dispatch({ type: AUTH_ACTIONS.SET_TOKENS, payload: { accessToken, refreshToken } });
      
      return { accessToken, refreshToken };
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  };

  // Login user
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await axios.post('/api/auth/login', credentials);
      const { user, tokens } = response.data.data;

      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { user, tokens } });

      // Navigate based on user role
      if (user.role === 'admin' || user.role === 'super_admin') {
        navigate('/admin');
      } else if (user.role === 'agent' || user.role === 'sub_agent') {
        navigate('/agent');
      } else {
        navigate('/app/dashboard');
      }

      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Register user
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await axios.post('/api/auth/register', userData);
      const { user, tokens } = response.data.data;

      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { user, tokens } });

      // Navigate to dashboard for new users
      navigate('/app/dashboard');
      
      toast.success('Registration successful! Welcome to Sportsbook!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      // Call logout API if token exists
      if (state.token) {
        await axios.post('/api/auth/logout');
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear state and localStorage
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      
      // Clear any stored data
      localStorage.clear();
      
      // Navigate to home
      navigate('/');
      
      toast.success('Logged out successfully');
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/api/users/profile', profileData);
      const updatedUser = response.data.data.user;
      
      dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: updatedUser });
      
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      await axios.post('/api/auth/change-password', passwordData);
      
      toast.success('Password changed successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password change failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      await axios.post('/api/auth/forgot-password', { email });
      
      toast.success('Password reset email sent. Please check your inbox.');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password reset failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Check if user has specific role
  const hasRole = (requiredRoles) => {
    if (!state.user) return false;
    
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return roles.includes(state.user.role);
  };

  // Check if user can access specific feature
  const canAccess = (feature) => {
    if (!state.user) return false;
    
    const permissions = {
      'place_bets': ['player', 'agent', 'sub_agent'],
      'manage_odds': ['admin', 'super_admin'],
      'view_reports': ['agent', 'sub_agent', 'admin', 'super_admin'],
      'manage_users': ['admin', 'super_admin'],
      'earn_commission': ['agent', 'sub_agent']
    };
    
    const allowedRoles = permissions[feature] || [];
    return allowedRoles.includes(state.user.role);
  };

  // Context value
  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    hasRole,
    canAccess,
    refreshAuthToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 