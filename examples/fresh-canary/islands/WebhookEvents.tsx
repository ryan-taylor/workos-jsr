// WebhookEvents island component
// Displays webhook events received from WorkOS with filtering and syntax highlighting

import { useEffect, useState } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import { WebhookEvent } from "../utils/webhook-types.ts";

// Component Props
interface WebhookEventsProps {
  initialEvents?: WebhookEvent[];
}

export default function WebhookEvents({ initialEvents = [] }: WebhookEventsProps) {
  // State
  const [events, setEvents] = useState<WebhookEvent[]>(initialEvents);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch events on load and when filters change
  useEffect(() => {
    fetchEvents();

    // Poll for new events every 5 seconds
    const intervalId = setInterval(fetchEvents, 5000);
    
    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [selectedEventType, startDate, endDate]);

  // Fetch webhook events from the API
  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedEventType) params.append("eventType", selectedEventType);
      if (startDate) params.append("startTime", new Date(startDate).toISOString());
      if (endDate) params.append("endTime", new Date(endDate).toISOString());
      
      // Fetch events from the API
      const response = await fetch(`/api/webhooks/listener?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.statusText}`);
      }
      
      const data = await response.json() as WebhookEvent[];
      setEvents(data);
      
      // Extract unique event types for filter dropdown
      const types = Array.from(
        new Set(data.map((event) => event.event))
      );
      setEventTypes(types);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      console.error("Error fetching webhook events:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Format timestamp to readable date
  const formatDate = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      return timestamp;
    }
  };

  // Toggle event expansion
  const toggleEventExpansion = (id: string) => {
    if (expandedEvent === id) {
      setExpandedEvent(null);
    } else {
      setExpandedEvent(id);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedEventType("");
    setStartDate("");
    setEndDate("");
  };

  // Format JSON with syntax highlighting
  const formatJson = (json: string) => {
    try {
      const obj = typeof json === "string" ? JSON.parse(json) : json;
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return json;
    }
  };

  // Event type badge color
  const getEventTypeColor = (eventType: string) => {
    if (eventType.includes("created")) return "bg-green-100 text-green-800";
    if (eventType.includes("updated")) return "bg-blue-100 text-blue-800";
    if (eventType.includes("deleted")) return "bg-red-100 text-red-800";
    if (eventType.includes("succeeded")) return "bg-green-100 text-green-800";
    if (eventType.includes("failed")) return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div class="flex flex-col space-y-6">
      {/* Filters */}
      <div class="bg-white rounded-lg shadow p-4">
        <h2 class="text-lg font-semibold mb-4">Filter Webhook Events</h2>
        <div class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Event Type
            </label>
            <select
              class="w-full rounded-md border border-gray-300 p-2"
              value={selectedEventType}
              onChange={(e) => setSelectedEventType((e.target as HTMLSelectElement).value)}
            >
              <option value="">All Event Types</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="datetime-local"
              class="w-full rounded-md border border-gray-300 p-2"
              value={startDate}
              onChange={(e) => setStartDate((e.target as HTMLInputElement).value)}
            />
          </div>
          
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="datetime-local"
              class="w-full rounded-md border border-gray-300 p-2"
              value={endDate}
              onChange={(e) => setEndDate((e.target as HTMLInputElement).value)}
            />
          </div>
          
          <div class="flex-1 min-w-[200px] flex items-end">
            <Button onClick={clearFilters} class="ml-2">
              Clear Filters
            </Button>
            <Button onClick={fetchEvents} class="ml-2 bg-blue-600 hover:bg-blue-700">
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong class="font-bold">Error:</strong>
          <span class="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div class="flex justify-center my-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Events List */}
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Event Type
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Verified
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} class="px-6 py-4 text-center text-gray-500">
                  No webhook events received yet. Send a webhook to get started.
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <>
                  <tr key={event.id} class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEventTypeColor(event.event)}`}>
                        {event.event}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(event.timestamp)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      {event.id.substring(0, 8)}...
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      {event.verified ? (
                        <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Verified
                        </span>
                      ) : (
                        <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Unverified
                        </span>
                      )}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => toggleEventExpansion(event.id)}
                        class="text-blue-600 hover:text-blue-900"
                      >
                        {expandedEvent === event.id ? "Hide Details" : "Show Details"}
                      </button>
                    </td>
                  </tr>
                  {expandedEvent === event.id && (
                    <tr>
                      <td colSpan={5} class="px-6 py-4 bg-gray-50">
                        <div class="space-y-4">
                          <div>
                            <h4 class="text-sm font-medium text-gray-700">Event Details</h4>
                            <pre class="mt-2 p-4 bg-gray-800 text-white rounded-lg overflow-auto text-xs">
                              {formatJson(event.rawPayload)}
                            </pre>
                          </div>
                          
                          <div>
                            <h4 class="text-sm font-medium text-gray-700">Verification Status</h4>
                            <p class="mt-1 text-sm text-gray-500">
                              {event.verified 
                                ? "✅ This webhook's signature was verified with your WORKOS_WEBHOOK_SECRET" 
                                : "❌ This webhook's signature could not be verified. Check your WORKOS_WEBHOOK_SECRET"}
                            </p>
                            <p class="mt-1 text-sm text-gray-500">
                              Webhooks can be configured in your WorkOS Dashboard. Make sure to set the webhook URL to:
                            </p>
                            <code class="block mt-1 p-2 bg-gray-100 rounded text-sm font-mono">
                              {`${window.location.origin}/api/webhooks/listener`}
                            </code>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}