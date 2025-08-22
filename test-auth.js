const axios = require('axios');

// Configure axios with base URL
const api = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 10000,
});

async function testAuthentication() {
  console.log('🔐 Testing Authentication System...\n');

  let accessToken = null;
  let refreshToken = null;

  try {
    // Test 1: Register a new user
    console.log('1️⃣ Testing user registration...');
    const registerData = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'Test123456',
      firstName: 'Test',
      lastName: 'User'
    };

    try {
      const registerResponse = await api.post('/api/auth/register', registerData);
      console.log('✅ Registration successful');
      console.log(`👤 User: ${registerResponse.data.data.user.username}`);

      accessToken = registerResponse.data.data.tokens.accessToken;
      refreshToken = registerResponse.data.data.tokens.refreshToken;
      console.log('🎫 Tokens received');
    } catch (error) {
      console.log('❌ Registration failed:', error.response?.data?.message || error.message);

      // Try login with existing credentials instead
      console.log('🔄 Attempting login instead...');
      const loginResponse = await api.post('/api/auth/login', {
        username: 'testuser',
        password: 'Test123456'
      });

      accessToken = loginResponse.data.data.tokens.accessToken;
      refreshToken = loginResponse.data.data.tokens.refreshToken;
      console.log('✅ Login successful');
    }

    // Test 2: Test authenticated endpoint
    console.log('\n2️⃣ Testing authenticated endpoint (/api/auth/me)...');
    try {
      const meResponse = await api.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      console.log('✅ /api/auth/me working correctly');
      console.log(`👤 Current user: ${meResponse.data.data.user.username} (${meResponse.data.data.user.role})`);
      console.log(`📊 Status: ${meResponse.data.data.user.status}`);
    } catch (error) {
      console.log('❌ /api/auth/me failed:', error.response?.data?.message || error.message);
    }

    // Test 3: Test token refresh
    console.log('\n3️⃣ Testing token refresh...');
    try {
      const refreshResponse = await api.post('/api/auth/refresh', {
        refreshToken: refreshToken
      });
      console.log('✅ Token refresh working correctly');

      const newAccessToken = refreshResponse.data.data.tokens.accessToken;
      const newRefreshToken = refreshResponse.data.data.tokens.refreshToken;

      console.log('🎫 New tokens received');

      // Test with new token
      const meWithNewTokenResponse = await api.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${newAccessToken}`
        }
      });
      console.log('✅ New access token working correctly');

      accessToken = newAccessToken;
      refreshToken = newRefreshToken;
    } catch (error) {
      console.log('❌ Token refresh failed:', error.response?.data?.message || error.message);
    }

    // Test 4: Test invalid token handling
    console.log('\n4️⃣ Testing invalid token handling...');
    try {
      await api.get('/api/auth/me', {
        headers: {
          Authorization: 'Bearer invalid_token_here'
        }
      });
      console.log('❌ Invalid token was accepted (this is bad!)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Invalid token properly rejected');
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
      }
    }

    // Test 5: Test no token handling
    console.log('\n5️⃣ Testing no token handling...');
    try {
      await api.get('/api/auth/me');
      console.log('❌ No token was accepted (this is bad!)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ No token properly rejected');
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
      }
    }

    // Test 6: Test logout
    console.log('\n6️⃣ Testing logout...');
    try {
      const logoutResponse = await api.post('/api/auth/logout', {}, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      console.log('✅ Logout endpoint working');
      console.log('📝 Note: In JWT systems, logout is typically handled client-side');
    } catch (error) {
      console.log('❌ Logout failed:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Authentication system test completed!');

  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
  }
}

// Test localStorage simulation (for debugging client-side issues)
function testLocalStorageSimulation() {
  console.log('\n🧪 Testing localStorage simulation...');

  const mockStorage = {
    storage: {},
    setItem(key, value) {
      console.log(`💾 localStorage.setItem('${key}', '${value.substring(0, 20)}...')`);
      this.storage[key] = value;
    },
    getItem(key) {
      const value = this.storage[key] || null;
      console.log(`📖 localStorage.getItem('${key}') = ${value ? 'found' : 'null'}`);
      return value;
    },
    removeItem(key) {
      console.log(`🗑️ localStorage.removeItem('${key}')`);
      delete this.storage[key];
    },
    clear() {
      console.log(`🧹 localStorage.clear()`);
      this.storage = {};
    }
  };

  // Simulate the client-side authentication flow
  console.log('\n📱 Simulating client-side auth flow...');

  // Initial state - no tokens
  console.log('Initial state:');
  const initialToken = mockStorage.getItem('accessToken');
  const initialRefreshToken = mockStorage.getItem('refreshToken');
  console.log(`  isAuthenticated would be: ${!!(initialToken)}`);

  // After login - store tokens
  console.log('\nAfter login:');
  mockStorage.setItem('accessToken', 'mock_access_token_123');
  mockStorage.setItem('refreshToken', 'mock_refresh_token_456');

  const afterLoginToken = mockStorage.getItem('accessToken');
  const afterLoginRefreshToken = mockStorage.getItem('refreshToken');
  console.log(`  isAuthenticated would be: ${!!(afterLoginToken)}`);

  // After page refresh - check tokens
  console.log('\nAfter page refresh (page reload):');
  const refreshToken = mockStorage.getItem('accessToken');
  const refreshRefreshToken = mockStorage.getItem('refreshToken');
  console.log(`  isAuthenticated would be: ${!!(refreshToken)}`);

  // After logout - clear tokens
  console.log('\nAfter logout:');
  mockStorage.removeItem('accessToken');
  mockStorage.removeItem('refreshToken');

  const afterLogoutToken = mockStorage.getItem('accessToken');
  const afterLogoutRefreshToken = mockStorage.getItem('refreshToken');
  console.log(`  isAuthenticated would be: ${!!(afterLogoutToken)}`);

  console.log('\n✅ localStorage simulation completed');
}

// Run tests
async function runAllTests() {
  await testAuthentication();
  testLocalStorageSimulation();

  console.log('\n📋 Summary:');
  console.log('If all tests passed, the authentication system should work correctly.');
  console.log('If you\'re still experiencing logout on refresh issues, check:');
  console.log('  1. Network connectivity during the /api/auth/me call');
  console.log('  2. Server running and accessible');
  console.log('  3. Browser console for any JavaScript errors');
  console.log('  4. React DevTools for authentication state changes');
  console.log('  5. Use the AuthDebug component to monitor state changes');
}

runAllTests().catch(console.error);
