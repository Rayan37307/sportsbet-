import React, { useState } from 'react';
import axios from '../../config/axios';
import toast from 'react-hot-toast';

const ApiTest = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test, success, data, error = null) => {
    const result = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      test,
      success,
      data,
      error,
    };
    setResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const testApiEndpoint = async (method, endpoint, data = null, description) => {
    setLoading(true);
    try {
      console.log(`Testing ${method} ${endpoint}`, data);

      let response;
      if (method === 'GET') {
        response = await axios.get(endpoint);
      } else if (method === 'POST') {
        response = await axios.post(endpoint, data);
      }

      addResult(description, true, response.data);
      toast.success(`✅ ${description} - Success`);
      return response.data;
    } catch (error) {
      console.error(`API Test Error (${description}):`, error);
      const errorData = {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        errors: error.response?.data?.errors,
        data: error.response?.data,
      };
      addResult(description, false, null, errorData);
      toast.error(`❌ ${description} - Failed`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const runTests = async () => {
    setResults([]);

    console.log('🧪 Starting API Tests...');

    // Test 1: Basic health check
    await testApiEndpoint('GET', '/api/sports/health', null, 'Health Check');

    // Test 2: Get sports
    await testApiEndpoint('GET', '/api/sports', null, 'Get Sports List');

    // Test 3: Get events
    await testApiEndpoint('GET', '/api/sports/events', null, 'Get Events (No Params)');

    // Test 4: Get events with sport filter
    await testApiEndpoint('GET', '/api/sports/events?sport=americanfootball_nfl', null, 'Get Events (NFL Filter)');

    // Test 5: Get events with status filter
    await testApiEndpoint('GET', '/api/sports/events?status=upcoming', null, 'Get Events (Upcoming Filter)');

    // Test 6: Get service status
    await testApiEndpoint('GET', '/api/sports/status', null, 'Get Service Status');

    // Test 7: Refresh with empty body
    await testApiEndpoint('POST', '/api/sports/refresh', {}, 'Refresh (Empty Body)');

    // Test 8: Refresh with sport
    await testApiEndpoint('POST', '/api/sports/refresh', { sport: 'americanfootball_nfl' }, 'Refresh (With Sport)');

    // Test 9: Refresh with null sport (this might cause the validation error)
    await testApiEndpoint('POST', '/api/sports/refresh', { sport: null }, 'Refresh (Null Sport)');

    // Test 10: Refresh with invalid sport
    await testApiEndpoint('POST', '/api/sports/refresh', { sport: '' }, 'Refresh (Empty Sport)');

    // Test 11: Refresh with force flag
    await testApiEndpoint('POST', '/api/sports/refresh', { force: true }, 'Refresh (Force True)');

    // Test 12: Refresh with invalid force
    await testApiEndpoint('POST', '/api/sports/refresh', { force: 'true' }, 'Refresh (Force String)');
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-lg w-96 max-h-96 overflow-hidden shadow-xl">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-semibold text-sm">API Test Console</h3>
        <div className="flex gap-2">
          <button
            onClick={clearResults}
            className="text-gray-400 hover:text-white text-xs"
            title="Clear results"
          >
            Clear
          </button>
          <button
            onClick={() => setResults([])}
            className="text-gray-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <button
          onClick={runTests}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded text-sm font-medium"
        >
          {loading ? 'Running Tests...' : 'Run API Tests'}
        </button>
      </div>

      {/* Results */}
      <div className="space-y-1 text-xs overflow-y-auto max-h-48">
        <div className="text-gray-400 sticky top-0 bg-gray-900 py-1">
          Test Results:
        </div>
        {results.length === 0 ? (
          <div className="text-gray-500 italic">No test results yet...</div>
        ) : (
          results.map((result) => (
            <div key={result.id} className="border border-gray-700 rounded p-2">
              <div className="flex justify-between items-start mb-1">
                <span className={`font-medium ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                  {result.success ? '✅' : '❌'} {result.test}
                </span>
                <span className="text-gray-500 text-xs">{result.timestamp}</span>
              </div>

              {result.success ? (
                <div className="text-green-300 text-xs">
                  Status: {result.data?.success ? 'Success' : 'Failed'}
                  {result.data?.data && (
                    <div className="text-gray-400 mt-1">
                      Data: {Array.isArray(result.data.data)
                        ? `${result.data.data.length} items`
                        : typeof result.data.data === 'object'
                        ? Object.keys(result.data.data).join(', ')
                        : String(result.data.data).substring(0, 50)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-red-300 text-xs">
                  <div>Status: {result.error?.status || 'Unknown'}</div>
                  <div>Message: {result.error?.message}</div>
                  {result.error?.errors && (
                    <div className="mt-1 bg-red-900/20 p-1 rounded">
                      <div className="text-red-400 font-medium">Validation Errors:</div>
                      {result.error.errors.map((err, idx) => (
                        <div key={idx} className="text-red-300 ml-2">
                          • {err.field}: {err.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400">
        Check console for detailed logs
      </div>
    </div>
  );
};

export default ApiTest;
