import { useEffect, useRef, useState } from 'preact/hooks';
import type { Event } from '../../../src/common/interfaces/event.interface.ts';
import type { Signal, signal } from '@preact/signals';

interface EventsStreamProps {
  initialEvents: Event[];
  eventTypes: string[];
}

export default function EventsStream({ initialEvents, eventTypes }: EventsStreamProps) {
  // State for events data
  const [events, setEvents] = useState<Event[]>(initialEvents || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);
  const [followMode, setFollowMode] = useState(true);

  // State for filters
  const [filters, setFilters] = useState({
    eventTypes: [] as string[],
    rangeStart: undefined as Date | undefined,
    rangeEnd: undefined as Date | undefined,
    actor: '',
  });

  // References
  const streamEndRef = useRef<HTMLDivElement>(null);
  const eventsContainerRef = useRef<HTMLDivElement>(null);

  // State for expandable events
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});

  // Polling interval (in milliseconds)
  const POLLING_INTERVAL = 5000;

  // Load events with current filters
  const loadEvents = async (isPolling = false) => {
    if (isPolling && !polling) return;

    setLoading(true);
    setError(null);

    try {
      // Build URL with query parameters
      const params = new URLSearchParams();

      // Add filter parameters
      if (filters.eventTypes.length > 0) {
        params.set('events', filters.eventTypes.join(','));
      }

      if (filters.actor) {
        params.set('actor', filters.actor);
      }

      if (filters.rangeStart) {
        params.set('range_start', filters.rangeStart.toISOString());
      }

      if (filters.rangeEnd) {
        params.set('range_end', filters.rangeEnd.toISOString());
      }

      // Fetch events
      const response = await fetch(`/api/events/list?${params.toString()}`);
      const data = await response.json();

      if (data.status === 'success') {
        // For polling, append new events if any
        if (isPolling && events.length > 0) {
          // Find events that don't exist in the current list
          const existingIds = new Set(events.map((e) => e.id));
          const newEvents = data.data.filter((e: Event) => !existingIds.has(e.id));

          if (newEvents.length > 0) {
            setEvents((prevEvents) => [...newEvents, ...prevEvents]);
            if (followMode) {
              scrollToBottom();
            }
          }
        } else {
          // For initial load or manual refresh, replace the events list
          setEvents(data.data);
          if (followMode) {
            scrollToBottom();
          }
        }
      } else {
        setError(data.message || 'Failed to load events');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Scroll to the bottom of the events list
  const scrollToBottom = () => {
    if (streamEndRef.current) {
      setTimeout(() => {
        streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Handle manual scrolling to detect when user has scrolled away from the bottom
  const handleScroll = () => {
    if (!eventsContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = eventsContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // Within 50px of bottom

    // Only update follow mode if it's currently active and user scrolled away
    if (followMode && !isAtBottom) {
      setFollowMode(false);
    }
  };

  // Initialize by loading data with current filters
  useEffect(() => {
    loadEvents();
  }, [filters]);

  // Set up polling
  useEffect(() => {
    if (!polling) return;

    const intervalId = setInterval(() => {
      loadEvents(true);
    }, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [polling, filters, events]);

  // Toggle polling
  const togglePolling = () => {
    setPolling((prev) => !prev);
  };

  // Toggle follow mode
  const toggleFollowMode = () => {
    const newFollowMode = !followMode;
    setFollowMode(newFollowMode);

    if (newFollowMode) {
      scrollToBottom();
    }
  };

  // Clear all events
  const clearEvents = () => {
    setEvents([]);
  };

  // Handle filter changes
  const handleFilterChange = (
    filterType: 'eventTypes' | 'actor' | 'rangeStart' | 'rangeEnd',
    value: any,
  ) => {
    setFilters((prev) => {
      // For event types filter (multi-select)
      if (filterType === 'eventTypes') {
        const selectElement = value.target as HTMLSelectElement;
        const selectedOptions = Array.from(selectElement.selectedOptions).map(
          (option) => option.value,
        );

        return {
          ...prev,
          [filterType]: selectedOptions,
        };
      }

      // For actor filter (text input)
      if (filterType === 'actor') {
        return {
          ...prev,
          actor: value.target.value,
        };
      }

      // For date filters
      if (filterType === 'rangeStart' || filterType === 'rangeEnd') {
        const dateValue = value.target.value ? new Date(value.target.value) : undefined;

        return {
          ...prev,
          [filterType]: dateValue,
        };
      }

      return prev;
    });
  };

  // Toggle event expansion
  const toggleEventExpand = (eventId: string) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      eventTypes: [],
      actor: '',
      rangeStart: undefined,
      rangeEnd: undefined,
    });
  };

  // Format date to ISO string for input fields
  const formatDate = (date: Date | undefined): string => {
    if (!date) return '';
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  // Format datetime for display
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get the appropriate color for an event type
  const getEventColor = (eventType: string): string => {
    if (eventType.includes('created')) return 'bg-green-100 text-green-800 border-green-300';
    if (eventType.includes('updated')) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (eventType.includes('deleted')) return 'bg-red-100 text-red-800 border-red-300';
    if (eventType.includes('succeeded')) return 'bg-green-100 text-green-800 border-green-300';
    if (eventType.includes('failed')) return 'bg-red-100 text-red-800 border-red-300';
    if (eventType.includes('verification')) return 'bg-purple-100 text-purple-800 border-purple-300';
    if (eventType.includes('authenticated')) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div class='w-full'>
      {/* Controls section */}
      <div class='bg-white p-4 rounded-lg shadow mb-6'>
        <div class='flex justify-between items-center mb-4'>
          <h2 class='text-lg font-semibold'>Events Stream</h2>
          <div class='flex space-x-3'>
            <button
              onClick={togglePolling}
              class={`px-3 py-1 rounded-md text-sm font-medium ${
                polling ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
              }`}
            >
              {polling ? 'Live' : 'Paused'}
            </button>
            <button
              onClick={toggleFollowMode}
              class={`px-3 py-1 rounded-md text-sm font-medium ${
                followMode ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-gray-100 text-gray-800 border border-gray-300'
              }`}
            >
              {followMode ? 'Following' : 'Follow'}
            </button>
            <button
              onClick={() => loadEvents()}
              class='px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50'
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button
              onClick={clearEvents}
              class='px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50'
            >
              Clear
            </button>
          </div>
        </div>

        {/* Filters */}
        <div class='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
          {/* Event Type Filter */}
          <div>
            <label class='block text-sm font-medium text-gray-700 mb-1'>
              Event Type
            </label>
            <select
              multiple
              class='form-select block w-full border-gray-300 rounded-md shadow-sm h-24'
              value={filters.eventTypes}
              onChange={(e) => handleFilterChange('eventTypes', e)}
            >
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Actor Filter */}
          <div>
            <label class='block text-sm font-medium text-gray-700 mb-1'>
              Actor
            </label>
            <input
              type='text'
              class='form-input block w-full border-gray-300 rounded-md shadow-sm'
              value={filters.actor}
              onChange={(e) => handleFilterChange('actor', e)}
              placeholder='Search by actor'
            />
          </div>

          {/* Date Range Start */}
          <div>
            <label class='block text-sm font-medium text-gray-700 mb-1'>
              From Date
            </label>
            <input
              type='datetime-local'
              class='form-input block w-full border-gray-300 rounded-md shadow-sm'
              value={formatDate(filters.rangeStart)}
              onChange={(e) => handleFilterChange('rangeStart', e)}
            />
          </div>

          {/* Date Range End */}
          <div>
            <label class='block text-sm font-medium text-gray-700 mb-1'>
              To Date
            </label>
            <input
              type='datetime-local'
              class='form-input block w-full border-gray-300 rounded-md shadow-sm'
              value={formatDate(filters.rangeEnd)}
              onChange={(e) => handleFilterChange('rangeEnd', e)}
            />
          </div>
        </div>

        <div class='flex justify-end'>
          <button
            onClick={clearFilters}
            class='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50'
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div class='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
          {error}
        </div>
      )}

      {/* Events stream with timeline */}
      <div
        class='bg-white shadow-md rounded-lg overflow-hidden mb-6'
        style={{ height: '600px' }}
      >
        <div class='p-4 border-b border-gray-200 bg-gray-50'>
          <h3 class='text-lg font-medium text-gray-900'>Events Timeline</h3>
        </div>

        <div
          class='h-full overflow-y-auto p-4'
          ref={eventsContainerRef}
          onScroll={handleScroll}
        >
          {events.length === 0
            ? (
              <div class='flex items-center justify-center h-full'>
                <p class='text-gray-500'>
                  {loading ? 'Loading events...' : 'No events found'}
                </p>
              </div>
            )
            : (
              <div class='relative'>
                {/* Timeline line */}
                <div class='absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200'></div>

                {/* Events */}
                <div class='space-y-6'>
                  {events.map((event) => (
                    <div key={event.id} class='relative pl-10'>
                      {/* Timeline dot */}
                      <div class='absolute left-3 top-5 w-3 h-3 rounded-full bg-blue-500 transform -translate-x-1.5'></div>

                      {/* Event card */}
                      <div class={`p-4 rounded-lg border ${getEventColor(event.event)} shadow-sm`}>
                        <div class='flex justify-between items-start'>
                          <div>
                            <span class='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-opacity-50'>
                              {event.event}
                            </span>
                            <div class='mt-1 text-sm text-gray-900'>
                              {formatDateTime(event.createdAt)}
                            </div>
                          </div>
                          <button
                            onClick={() => toggleEventExpand(event.id)}
                            class='text-gray-500 hover:text-gray-700'
                          >
                            <svg xmlns='http://www.w3.org/2000/svg' class='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
                              <path
                                fill-rule='evenodd'
                                d={expandedEvents[event.id]
                                  ? 'M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z'
                                  : 'M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'}
                                clip-rule='evenodd'
                              />
                            </svg>
                          </button>
                        </div>

                        {/* Event details (expanded view) */}
                        {expandedEvents[event.id] && (
                          <div class='mt-4 border-t pt-4'>
                            <div class='grid grid-cols-1 md:grid-cols-2 gap-4'>
                              <div>
                                <h4 class='text-sm font-medium text-gray-700'>Event Data</h4>
                                <pre class='mt-1 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-40'>
                                {JSON.stringify(event.data, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Element to scroll to for follow mode */}
                <div ref={streamEndRef}></div>
              </div>
            )}
        </div>
      </div>

      {/* Status bar */}
      <div class='bg-white shadow px-4 py-3 flex items-center justify-between border-t border-gray-200 rounded-lg'>
        <div class='flex items-center'>
          {polling && (
            <div class='flex items-center mr-4'>
              <div class='w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse'></div>
              <span class='text-sm text-gray-600'>Listening for events</span>
            </div>
          )}
          <span class='text-sm text-gray-600'>
            {events.length} events
          </span>
        </div>
        <div>
          <span class='text-sm text-gray-600'>
            {followMode ? 'Auto-scrolling enabled' : 'Auto-scrolling disabled'}
          </span>
        </div>
      </div>
    </div>
  );
}
