/**
 * Content Security Policy (CSP) utility for environment-specific configuration
 * This helps manage CSP directives based on the current environment
 */

// Get the API URL from environment variables
const getApiUrl = () => {
  return process.env.REACT_APP_API_URL || 'http://localhost:5000';
};

// Get the socket URL from environment variables
const getSocketUrl = () => {
  return process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
};

// Parse URL to get the origin
const getOrigin = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.origin;
  } catch (error) {
    console.warn('Invalid URL:', url);
    return url;
  }
};

// Get WebSocket protocols from URL
const getWebSocketProtocols = (url) => {
  try {
    const urlObj = new URL(url);
    const wsProtocol = urlObj.protocol === 'https:' ? 'wss:' : 'ws:';
    return [`${wsProtocol}//${urlObj.host}`, wsProtocol];
  } catch (error) {
    console.warn('Invalid URL for WebSocket:', url);
    return ['ws:', 'wss:'];
  }
};

// Generate CSP directives based on environment
export const generateCSPDirectives = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  const apiUrl = getApiUrl();
  const socketUrl = getSocketUrl();
  const apiOrigin = getOrigin(apiUrl);
  const socketOrigin = getOrigin(socketUrl);
  const [wsUrl, wsProtocol] = getWebSocketProtocols(socketUrl);

  // Base CSP directives
  const directives = {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': []
  };

  // Development-specific additions
  if (isDevelopment) {
    // Allow unsafe-eval for development tools (React DevTools, etc.)
    directives['script-src'].push("'unsafe-eval'");

    // Allow connections to local API server
    if (apiOrigin !== window.location.origin) {
      directives['connect-src'].push(apiOrigin);
    }

    // Allow WebSocket connections for development
    directives['connect-src'].push(wsUrl, wsProtocol, 'ws:', 'wss:');

    // Allow local development connections
    directives['connect-src'].push('http://localhost:*', 'ws://localhost:*', 'wss://localhost:*');
  }

  // Production-specific additions
  if (isProduction) {
    // Add your production API domains here
    const productionApiDomains = [
      // 'https://api.yourdomain.com',
      // 'wss://api.yourdomain.com'
    ];

    directives['connect-src'].push(...productionApiDomains);

    // Remove upgrade-insecure-requests if not needed
    // delete directives['upgrade-insecure-requests'];
  }

  // Always allow WebSocket protocols
  directives['connect-src'].push('ws:', 'wss:');

  return directives;
};

// Convert CSP directives object to string
export const directivesToString = (directives) => {
  return Object.entries(directives)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive;
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
};

// Generate complete CSP header value
export const generateCSPHeader = () => {
  const directives = generateCSPDirectives();
  return directivesToString(directives);
};

// Apply CSP to document (useful for dynamic updates)
export const applyCSPToDocument = () => {
  const cspContent = generateCSPHeader();

  // Remove existing CSP meta tag if present
  const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (existingCSP) {
    existingCSP.remove();
  }

  // Create new CSP meta tag
  const cspMeta = document.createElement('meta');
  cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
  cspMeta.setAttribute('content', cspContent);

  // Add to document head
  document.head.appendChild(cspMeta);

  console.log('Applied CSP:', cspContent);
};

// Validate if a URL is allowed by current CSP
export const isUrlAllowedByCSP = (url, directive = 'connect-src') => {
  const directives = generateCSPDirectives();
  const allowedSources = directives[directive] || [];

  try {
    const urlObj = new URL(url);
    const urlOrigin = urlObj.origin;

    return allowedSources.some(source => {
      if (source === "'self'") {
        return urlOrigin === window.location.origin;
      }
      if (source === 'http://localhost:*') {
        return urlObj.hostname === 'localhost' && urlObj.protocol === 'http:';
      }
      if (source === 'ws://localhost:*') {
        return urlObj.hostname === 'localhost' && urlObj.protocol === 'ws:';
      }
      if (source === 'wss://localhost:*') {
        return urlObj.hostname === 'localhost' && urlObj.protocol === 'wss:';
      }
      return source === urlOrigin || source === url;
    });
  } catch (error) {
    console.warn('Invalid URL for CSP validation:', url);
    return false;
  }
};

// Debug function to log current CSP configuration
export const debugCSP = () => {
  const directives = generateCSPDirectives();
  const cspString = directivesToString(directives);

  console.group('🔒 Content Security Policy Configuration');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('API URL:', getApiUrl());
  console.log('Socket URL:', getSocketUrl());
  console.log('Generated CSP:', cspString);
  console.table(directives);
  console.groupEnd();

  return { directives, cspString };
};

// Export default configuration for easy use
export default {
  generateCSPDirectives,
  generateCSPHeader,
  applyCSPToDocument,
  isUrlAllowedByCSP,
  debugCSP
};
