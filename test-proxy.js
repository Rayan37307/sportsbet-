const axios = require('axios');

async function testProxyConnection() {
  console.log('🔗 Testing Proxy Connection and API Endpoints...\n');

  // Test configurations
  const configs = [
    {
      name: 'Direct Connection',
      baseURL: 'http://localhost:5000',
      description: 'Direct connection to API server'
    },
    {
      name: 'Proxy Connection (CRA Dev Server)',
      baseURL: 'http://localhost:3000',
      description: 'Connection through React dev server proxy'
    }
  ];

  for (const config of configs) {
    console.log(`\n📡 Testing ${config.name}`);
    console.log(`   ${config.description}`);
    console.log(`   Base URL: ${config.baseURL}`);

    const api = axios.create({
      baseURL: config.baseURL,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    try {
      // Test 1: Health check
      console.log('   🏥 Testing health endpoint...');
      const healthResponse = await api.get('/health');
      console.log(`   ✅ Health check: ${healthResponse.data.status}`);
    } catch (error) {
      console.log(`   ❌ Health check failed: ${error.code || error.message}`);
    }

    try {
      // Test 2: API endpoint (should fail without auth)
      console.log('   🔐 Testing auth endpoint...');
      await api.get('/api/auth/me');
      console.log('   ⚠️  Auth endpoint accessible without token (unexpected)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ✅ Auth endpoint properly protected (401)');
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`   ❌ Connection refused: ${config.baseURL} not available`);
      } else {
        console.log(`   ❌ Auth test failed: ${error.code || error.message}`);
      }
    }

    try {
      // Test 3: Non-existent endpoint
      console.log('   🔍 Testing 404 handling...');
      await api.get('/api/nonexistent');
      console.log('   ⚠️  Non-existent endpoint returned success (unexpected)');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('   ✅ 404 handling working correctly');
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`   ❌ Connection refused: ${config.baseURL} not available`);
      } else {
        console.log(`   ❌ 404 test failed: ${error.code || error.message}`);
      }
    }

    console.log('   ---');
  }

  console.log('\n🧪 Testing CORS and CSP Scenarios...');

  // Simulate frontend requests
  const scenarios = [
    { url: 'http://localhost:5000/api/auth/me', description: 'Cross-origin API call' },
    { url: 'http://localhost:3000/api/auth/me', description: 'Same-origin API call (via proxy)' }
  ];

  for (const scenario of scenarios) {
    try {
      console.log(`\n   📋 ${scenario.description}`);
      console.log(`   URL: ${scenario.url}`);

      const response = await axios.get(scenario.url, {
        timeout: 3000,
        headers: {
          'Origin': 'http://localhost:3000',
          'Referer': 'http://localhost:3000',
          'User-Agent': 'TestScript/1.0'
        }
      });

      console.log('   ✅ Request successful');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ✅ Request reached server (401 - auth required)');
      } else if (error.code === 'ECONNREFUSED') {
        console.log('   ❌ Connection refused - server not running');
      } else {
        console.log(`   ❌ Request failed: ${error.code || error.message}`);
      }
    }
  }

  console.log('\n📋 Summary and Recommendations:');
  console.log('\n   For Development Setup:');
  console.log('   1. Start API server: npm run dev (from /server directory)');
  console.log('   2. Start React app: npm start (from /client directory)');
  console.log('   3. React app runs on http://localhost:3000');
  console.log('   4. API server runs on http://localhost:5000');
  console.log('   5. Proxy in package.json forwards /api/* to localhost:5000');
  console.log('\n   CSP Configuration:');
  console.log('   - Current CSP allows localhost connections');
  console.log('   - WebSocket connections are permitted');
  console.log('   - Development tools (unsafe-eval) are enabled');
  console.log('\n   If you\'re still seeing CSP errors:');
  console.log('   1. Clear browser cache and hard refresh (Ctrl+F5)');
  console.log('   2. Check browser console for specific CSP violations');
  console.log('   3. Verify both servers are running');
  console.log('   4. Check network tab for failed requests');
}

// Test WebSocket connectivity
async function testWebSocketConnection() {
  console.log('\n🔌 Testing WebSocket Connection...');

  // Note: This is a basic test. Real WebSocket testing would require socket.io
  const wsUrls = [
    'ws://localhost:5000',
    'wss://localhost:5000'
  ];

  wsUrls.forEach(url => {
    console.log(`\n   🔗 Testing ${url}`);
    try {
      // Simple connection test (will likely fail without socket.io server)
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log(`   ✅ WebSocket connection opened: ${url}`);
        ws.close();
      };

      ws.onerror = (error) => {
        console.log(`   ❌ WebSocket connection failed: ${url}`);
      };

      ws.onclose = () => {
        console.log(`   🔒 WebSocket connection closed: ${url}`);
      };

    } catch (error) {
      console.log(`   ❌ WebSocket test failed: ${error.message}`);
    }
  });
}

// Network connectivity test
async function testNetworkConnectivity() {
  console.log('\n🌐 Testing Network Connectivity...');

  const testUrls = [
    'http://localhost:5000',
    'http://localhost:3000',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:3000'
  ];

  for (const url of testUrls) {
    try {
      console.log(`\n   📡 Testing ${url}`);
      const response = await axios.get(url, {
        timeout: 2000,
        maxRedirects: 0
      });
      console.log(`   ✅ ${url} is accessible (${response.status})`);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`   ❌ ${url} - Connection refused (server not running)`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`   ❌ ${url} - Connection timeout`);
      } else {
        console.log(`   ⚠️  ${url} - ${error.message}`);
      }
    }
  }
}

// Main test runner
async function runAllTests() {
  try {
    await testProxyConnection();
    await testNetworkConnectivity();

    console.log('\n🎯 Next Steps:');
    console.log('   1. Ensure both servers are running');
    console.log('   2. Test the actual React application');
    console.log('   3. Check browser console for CSP violations');
    console.log('   4. Use the AuthDebug component (🐛 button) for real-time monitoring');

  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
  }
}

// Run tests
runAllTests().catch(console.error);
