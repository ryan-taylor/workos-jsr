import { useEffect, useState } from 'preact/hooks';
import { signal } from '@preact/signals';
import type { JSX } from 'preact';

// Telemetry metrics signals for real-time updates
const activeUsers = signal(0);
const authAttempts = signal({ success: 0, failure: 0 });
const apiCallStats = signal({
  total: 0,
  success: 0,
  error: 0,
  avgResponseTime: 0,
});
const operationsPerModule = signal({
  sso: 0,
  directorySync: 0,
  userManagement: 0,
  other: 0,
  total: 0,
});

// Chart data for the API calls over time
const apiCallHistory = signal<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

// Helper function to add a new data point to the history
function addApiCallDataPoint(value: number) {
  const newHistory = [...apiCallHistory.value];
  newHistory.push(value);
  if (newHistory.length > 10) {
    newHistory.shift();
  }
  apiCallHistory.value = newHistory;
}

/**
 * TelemetryDashboard component for displaying real-time SDK metrics
 */
export default function TelemetryDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  // Simulate fetching data from server
  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real implementation, this would fetch data from a server endpoint
        // that collects telemetry data

        // For the demo, we'll use mock data that changes over time
        setIsLoading(true);

        // Simulate an API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Update signals with new random data
        activeUsers.value = Math.floor(Math.random() * 50) + 10;

        authAttempts.value = {
          success: authAttempts.value.success + Math.floor(Math.random() * 3),
          failure: authAttempts.value.failure + Math.floor(Math.random() * 1),
        };

        const newApiCalls = Math.floor(Math.random() * 5) + 1;
        const newApiErrors = Math.floor(Math.random() * 2);

        apiCallStats.value = {
          total: apiCallStats.value.total + newApiCalls,
          success: apiCallStats.value.success + (newApiCalls - newApiErrors),
          error: apiCallStats.value.error + newApiErrors,
          avgResponseTime: Math.floor(Math.random() * 200) + 50,
        };

        // Update operations per module
        const moduleDistribution = {
          sso: Math.floor(Math.random() * newApiCalls * 0.3),
          directorySync: Math.floor(Math.random() * newApiCalls * 0.3),
          userManagement: Math.floor(Math.random() * newApiCalls * 0.3),
          other: 0,
        };

        // Ensure the total adds up
        moduleDistribution.other = newApiCalls -
          (moduleDistribution.sso +
            moduleDistribution.directorySync +
            moduleDistribution.userManagement);

        operationsPerModule.value = {
          sso: operationsPerModule.value.sso + moduleDistribution.sso,
          directorySync: operationsPerModule.value.directorySync + moduleDistribution.directorySync,
          userManagement: operationsPerModule.value.userManagement + moduleDistribution.userManagement,
          other: operationsPerModule.value.other + moduleDistribution.other,
          total: operationsPerModule.value.total + newApiCalls,
        };

        // Add new data point to history
        addApiCallDataPoint(newApiCalls);

        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch telemetry data');
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchData();

    // Set up polling interval
    const intervalId = setInterval(fetchData, 3000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  /**
   * Renders a simple bar chart for API call history
   */
  const renderApiCallChart = (): JSX.Element => {
    const maxValue = Math.max(...apiCallHistory.value, 5); // Minimum height of 5

    return (
      <div class='flex items-end h-24 gap-1 mb-4 bg-gray-100 rounded p-2'>
        {apiCallHistory.value.map((value, index) => {
          const height = (value / maxValue) * 100;
          return (
            <div
              key={index}
              class='bg-blue-500 rounded w-full'
              style={{ height: `${height}%` }}
              title={`${value} calls`}
            >
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div class='p-4 bg-white rounded-lg shadow-md'>
      <div class='flex justify-between items-center mb-6'>
        <h2 class='text-2xl font-bold text-gray-800'>SDK Telemetry Dashboard</h2>
        <div class='text-sm text-gray-500'>
          Last updated: {lastUpdated.toLocaleTimeString()}
          {isLoading && <span class='ml-2 inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></span>}
        </div>
      </div>

      {error && (
        <div class='bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4'>
          <p>{error}</p>
        </div>
      )}

      <div class='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
        {/* Active Users */}
        <div class='bg-blue-50 p-4 rounded-lg shadow'>
          <h3 class='text-lg font-semibold text-gray-700'>Active Users</h3>
          <p class='text-3xl font-bold text-blue-600'>{activeUsers}</p>
        </div>

        {/* Authentication Success Rate */}
        <div class='bg-green-50 p-4 rounded-lg shadow'>
          <h3 class='text-lg font-semibold text-gray-700'>Auth Success Rate</h3>
          <p class='text-3xl font-bold text-green-600'>
            {authAttempts.value.success + authAttempts.value.failure > 0
              ? Math.round((authAttempts.value.success / (authAttempts.value.success + authAttempts.value.failure)) * 100)
              : 0}%
          </p>
          <p class='text-sm text-gray-500'>
            {authAttempts.value.success} successful / {authAttempts.value.failure} failed
          </p>
        </div>

        {/* API Calls */}
        <div class='bg-purple-50 p-4 rounded-lg shadow'>
          <h3 class='text-lg font-semibold text-gray-700'>API Calls</h3>
          <p class='text-3xl font-bold text-purple-600'>{apiCallStats.value.total}</p>
          <p class='text-sm text-gray-500'>
            {apiCallStats.value.success} successful / {apiCallStats.value.error} errors
          </p>
        </div>

        {/* Average Response Time */}
        <div class='bg-yellow-50 p-4 rounded-lg shadow'>
          <h3 class='text-lg font-semibold text-gray-700'>Avg Response Time</h3>
          <p class='text-3xl font-bold text-yellow-600'>{apiCallStats.value.avgResponseTime} ms</p>
        </div>
      </div>

      <div class='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* API Call History Chart */}
        <div class='bg-gray-50 p-4 rounded-lg shadow'>
          <h3 class='text-lg font-semibold text-gray-700 mb-2'>API Calls (Last 10 updates)</h3>
          {renderApiCallChart()}
        </div>

        {/* Operations by Module */}
        <div class='bg-gray-50 p-4 rounded-lg shadow'>
          <h3 class='text-lg font-semibold text-gray-700 mb-4'>Operations by Module</h3>
          <div class='space-y-3'>
            <div>
              <div class='flex justify-between mb-1'>
                <span class='text-sm font-medium text-gray-700'>SSO</span>
                <span class='text-sm font-medium text-gray-700'>{operationsPerModule.value.sso}</span>
              </div>
              <div class='w-full bg-gray-200 rounded-full h-2'>
                <div
                  class='bg-indigo-600 h-2 rounded-full'
                  style={{
                    width: `${operationsPerModule.value.total > 0 ? (operationsPerModule.value.sso / operationsPerModule.value.total) * 100 : 0}%`,
                  }}
                >
                </div>
              </div>
            </div>

            <div>
              <div class='flex justify-between mb-1'>
                <span class='text-sm font-medium text-gray-700'>Directory Sync</span>
                <span class='text-sm font-medium text-gray-700'>{operationsPerModule.value.directorySync}</span>
              </div>
              <div class='w-full bg-gray-200 rounded-full h-2'>
                <div
                  class='bg-green-600 h-2 rounded-full'
                  style={{
                    width: `${
                      operationsPerModule.value.total > 0 ? (operationsPerModule.value.directorySync / operationsPerModule.value.total) * 100 : 0
                    }%`,
                  }}
                >
                </div>
              </div>
            </div>

            <div>
              <div class='flex justify-between mb-1'>
                <span class='text-sm font-medium text-gray-700'>User Management</span>
                <span class='text-sm font-medium text-gray-700'>{operationsPerModule.value.userManagement}</span>
              </div>
              <div class='w-full bg-gray-200 rounded-full h-2'>
                <div
                  class='bg-blue-600 h-2 rounded-full'
                  style={{
                    width: `${
                      operationsPerModule.value.total > 0 ? (operationsPerModule.value.userManagement / operationsPerModule.value.total) * 100 : 0
                    }%`,
                  }}
                >
                </div>
              </div>
            </div>

            <div>
              <div class='flex justify-between mb-1'>
                <span class='text-sm font-medium text-gray-700'>Other</span>
                <span class='text-sm font-medium text-gray-700'>{operationsPerModule.value.other}</span>
              </div>
              <div class='w-full bg-gray-200 rounded-full h-2'>
                <div
                  class='bg-gray-600 h-2 rounded-full'
                  style={{
                    width: `${operationsPerModule.value.total > 0 ? (operationsPerModule.value.other / operationsPerModule.value.total) * 100 : 0}%`,
                  }}
                >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class='mt-6 text-sm text-gray-500'>
        <p class='mb-1'>
          This dashboard demonstrates how the OpenTelemetry integration can be used to monitor WorkOS SDK usage in real-time.
        </p>
        <p>
          In a production environment, telemetry data would be collected from actual SDK usage and stored in a time-series database.
        </p>
      </div>
    </div>
  );
}
