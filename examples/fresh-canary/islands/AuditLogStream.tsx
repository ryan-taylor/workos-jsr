/**
 * @fileoverview AuditLogStream component for displaying and filtering WorkOS audit logs
 *
 * This component provides a real-time audit log display with filtering capabilities,
 * visually distinct event types, and pagination for historical logs.
 */

import { useEffect, useState } from 'preact/hooks';
import { type signal, useComputed, useSignal } from '@preact/signals';
import { useWorkOS } from '../hooks/use-workos.ts';
import { type AuditLogEvent, getMockAuditLogs, getUniqueActionTypes, getUniqueActorNames } from '../utils/audit-logs.ts';

// Filter options for audit logs
interface FilterOptions {
  search: string;
  actions: string[];
  actorNames: string[];
  timeRange: 'today' | 'yesterday' | 'week' | 'month' | 'custom';
  customRangeStart?: Date;
  customRangeEnd?: Date;
}

export interface AuditLogStreamProps {
  /**
   * Organization ID to fetch audit logs for
   */
  organizationId: string;

  /**
   * Number of logs to display per page
   * @default 10
   */
  pageSize?: number;

  /**
   * Auto-refresh interval in milliseconds
   * @default 30000 (30 seconds)
   */
  refreshInterval?: number;

  /**
   * Whether to enable real-time updates
   * @default true
   */
  enableRealtime?: boolean;

  /**
   * Whether to show detailed metadata for each log
   * @default false
   */
  showDetailedMetadata?: boolean;

  /**
   * Custom class name for styling
   */
  className?: string;

  /**
   * Optional callback for when a log is selected
   */
  onLogSelect?: (log: AuditLogEvent) => void;
}

/**
 * AuditLogStream component for displaying and filtering WorkOS audit logs in real-time
 *
 * Features:
 * - Real-time updates of audit logs
 * - Filtering by action type, actor, and time range
 * - Visually distinct event types
 * - Detailed view of log metadata
 * - Pagination for historical logs
 *
 * @example
 * ```tsx
 * // Basic usage
 * <AuditLogStream organizationId="org_123" />
 *
 * // With custom refresh interval and page size
 * <AuditLogStream
 *   organizationId="org_123"
 *   refreshInterval={10000}
 *   pageSize={20}
 * />
 *
 * // With detailed metadata display
 * <AuditLogStream
 *   organizationId="org_123"
 *   showDetailedMetadata={true}
 * />
 * ```
 */
export default function AuditLogStream({
  organizationId,
  pageSize = 10,
  refreshInterval = 30000,
  enableRealtime = true,
  showDetailedMetadata = false,
  className = '',
  onLogSelect,
}: AuditLogStreamProps) {
  // Fetch WorkOS integration
  const { workos, isLoading, error } = useWorkOS();

  // Audit log data and pagination signals
  const auditLogs = useSignal<AuditLogEvent[]>([]);
  const totalCount = useSignal<number>(0);
  const currentPage = useSignal<number>(1);
  const isStreamLoading = useSignal<boolean>(true);
  const streamError = useSignal<Error | null>(null);
  const selectedLog = useSignal<AuditLogEvent | null>(null);

  // Available filter options from loaded logs
  const availableActionTypes = useSignal<string[]>([]);
  const availableActorNames = useSignal<string[]>([]);

  // Filter signals
  const filters = useSignal<FilterOptions>({
    search: '',
    actions: [],
    actorNames: [],
    timeRange: 'week',
    customRangeStart: undefined,
    customRangeEnd: undefined,
  });

  // Local state for filter inputs
  const [searchInput, setSearchInput] = useState('');
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [selectedActors, setSelectedActors] = useState<string[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<FilterOptions['timeRange']>('week');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Computed properties
  const totalPages = useComputed(() => {
    return Math.ceil(totalCount.value / pageSize);
  });

  const currentPageDisplay = useComputed(() => {
    return `Page ${currentPage.value} of ${totalPages.value || 1}`;
  });

  const hasNextPage = useComputed(() => {
    return currentPage.value < totalPages.value;
  });

  const hasPreviousPage = useComputed(() => {
    return currentPage.value > 1;
  });

  // Auto-refresh effect
  useEffect(() => {
    fetchAuditLogs();

    // Set up auto-refresh if enabled
    let refreshTimer: number | undefined;
    if (enableRealtime && refreshInterval > 0) {
      refreshTimer = setInterval(() => {
        fetchAuditLogs(true);
      }, refreshInterval);
    }

    return () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    };
  }, [organizationId, enableRealtime, refreshInterval]);

  // Reload when filters or pagination changes
  useEffect(() => {
    fetchAuditLogs();
  }, [filters.value, currentPage.value]);

  /**
   * Generate time range dates based on selected range
   */
  const getTimeRangeDates = () => {
    const now = new Date();
    let start: Date | undefined;
    let end: Date | undefined;

    switch (filters.value.timeRange) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date();
        break;
      case 'yesterday':
        start = new Date(now);
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);

        end = new Date(now);
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        end = new Date();
        break;
      case 'month':
        start = new Date(now);
        start.setMonth(start.getMonth() - 1);
        end = new Date();
        break;
      case 'custom':
        start = filters.value.customRangeStart;
        end = filters.value.customRangeEnd;
        break;
    }

    return { start, end };
  };

  /**
   * Fetch audit logs with current filters
   */
  const fetchAuditLogs = async (isBackgroundRefresh = false) => {
    if (!isBackgroundRefresh) {
      isStreamLoading.value = true;
    }
    streamError.value = null;

    try {
      // Get date range based on selected time range
      const { start, end } = getTimeRangeDates();

      // Fetch logs using mock function (would be replaced with real API in production)
      const result = await getMockAuditLogs({
        organizationId: organizationId,
        actions: filters.value.actions.length > 0 ? filters.value.actions : undefined,
        actorNames: filters.value.actorNames.length > 0 ? filters.value.actorNames : undefined,
        rangeStart: start,
        rangeEnd: end,
        page: currentPage.value,
        limit: pageSize,
      });

      // Update log data
      auditLogs.value = result.data;
      totalCount.value = result.totalCount;

      // Extract unique values for filters if this is the first load
      if (availableActionTypes.value.length === 0) {
        availableActionTypes.value = getUniqueActionTypes(result.data);
      }

      if (availableActorNames.value.length === 0) {
        availableActorNames.value = getUniqueActorNames(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      streamError.value = err instanceof Error ? err : new Error(String(err));
    } finally {
      isStreamLoading.value = false;
    }
  };

  /**
   * Apply filters from form inputs
   */
  const applyFilters = () => {
    // Calculate custom date range if selected
    let customRangeStart: Date | undefined;
    let customRangeEnd: Date | undefined;

    if (selectedTimeRange === 'custom') {
      if (customStartDate) {
        customRangeStart = new Date(customStartDate);
      }
      if (customEndDate) {
        customRangeEnd = new Date(customEndDate);
        // Set time to end of day
        customRangeEnd.setHours(23, 59, 59, 999);
      }
    }

    // Update filters signal
    filters.value = {
      search: searchInput,
      actions: selectedActions,
      actorNames: selectedActors,
      timeRange: selectedTimeRange,
      customRangeStart,
      customRangeEnd,
    };

    // Reset to first page when filters change
    currentPage.value = 1;
  };

  /**
   * Reset all filters to default values
   */
  const resetFilters = () => {
    setSearchInput('');
    setSelectedActions([]);
    setSelectedActors([]);
    setSelectedTimeRange('week');
    setCustomStartDate('');
    setCustomEndDate('');

    filters.value = {
      search: '',
      actions: [],
      actorNames: [],
      timeRange: 'week',
      customRangeStart: undefined,
      customRangeEnd: undefined,
    };

    // Reset to first page
    currentPage.value = 1;
  };

  /**
   * Handle page navigation
   */
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages.value) return;

    currentPage.value = page;
  };

  /**
   * Handle next page navigation
   */
  const goToNextPage = () => {
    if (!hasNextPage.value) return;

    currentPage.value++;
  };

  /**
   * Handle previous page navigation
   */
  const goToPreviousPage = () => {
    if (!hasPreviousPage.value) return;

    currentPage.value--;
  };

  /**
   * View log details
   */
  const viewLogDetails = (log: AuditLogEvent) => {
    selectedLog.value = log;

    if (onLogSelect) {
      onLogSelect(log);
    }
  };

  /**
   * Close detailed view
   */
  const closeDetails = () => {
    selectedLog.value = null;
  };

  /**
   * Get badge class for action type
   */
  const getActionTypeClass = (action: string): string => {
    if (action.startsWith('user.login') || action.startsWith('user.logout')) {
      return 'action-auth';
    } else if (action.startsWith('user.')) {
      return 'action-user';
    } else if (action.startsWith('organization.')) {
      return 'action-org';
    } else if (action.startsWith('api_key.')) {
      return 'action-api';
    } else if (action.startsWith('document.')) {
      return 'action-document';
    } else if (action.startsWith('settings.')) {
      return 'action-settings';
    } else {
      return 'action-other';
    }
  };

  /**
   * Format date in a human-readable format
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleString();
  };

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return `${diffSec} seconds ago`;
    } else if (diffMin < 60) {
      return `${diffMin} minutes ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hours ago`;
    } else {
      return `${diffDay} days ago`;
    }
  };

  // Render loading state
  if (isStreamLoading.value && auditLogs.value.length === 0) {
    return (
      <div class={`audit-log-stream-loading ${className}`}>
        <div class='loading-spinner'>Loading audit logs...</div>
      </div>
    );
  }

  // Render error state
  if (streamError.value && auditLogs.value.length === 0) {
    return (
      <div class={`audit-log-stream-error ${className}`}>
        <div class='error-message'>
          <h3>Error loading audit logs</h3>
          <p>{streamError.value.message}</p>
          <button
            onClick={() => fetchAuditLogs()}
            class='retry-button'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render detailed log view
  if (selectedLog.value) {
    return (
      <div class={`audit-log-detail ${className}`}>
        <div class='detail-header'>
          <button
            onClick={closeDetails}
            class='back-button'
          >
            ← Back to Log Stream
          </button>
          <h2>Audit Log Details</h2>
        </div>

        <div class='log-detail-content'>
          <div class='log-badge'>
            <span class={`action-badge ${getActionTypeClass(selectedLog.value.action)}`}>
              {selectedLog.value.action}
            </span>
            <span class='log-time'>{formatDate(selectedLog.value.occurredAt)}</span>
          </div>

          <div class='log-sections'>
            <div class='actor-section'>
              <h3>Actor</h3>
              <div class='actor-details'>
                <div>
                  <strong>Name:</strong> {selectedLog.value.actor.name}
                </div>
                <div>
                  <strong>ID:</strong> {selectedLog.value.actor.id}
                </div>
                <div>
                  <strong>Type:</strong> {selectedLog.value.actor.type}
                </div>
              </div>
            </div>

            <div class='targets-section'>
              <h3>Targets</h3>
              {selectedLog.value.targets.map((target, index) => (
                <div key={index} class='target-item'>
                  <div>
                    <strong>Name:</strong> {target.name}
                  </div>
                  <div>
                    <strong>ID:</strong> {target.id}
                  </div>
                  <div>
                    <strong>Type:</strong> {target.type}
                  </div>
                </div>
              ))}
            </div>

            <div class='context-section'>
              <h3>Context</h3>
              <div>
                <strong>Location:</strong> {selectedLog.value.context.location}
              </div>
              {selectedLog.value.context.userAgent && (
                <div>
                  <strong>User Agent:</strong> {selectedLog.value.context.userAgent}
                </div>
              )}
            </div>

            {selectedLog.value.metadata && (
              <div class='metadata-section'>
                <h3>Metadata</h3>
                <pre>
                  {JSON.stringify(selectedLog.value.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render main log stream view
  return (
    <div class={`audit-log-stream ${className}`}>
      <div class='stream-header'>
        <h2>Audit Log Stream</h2>
        {enableRealtime && (
          <div class='realtime-indicator'>
            <span class='indicator-dot'></span>
            Real-time updates enabled
          </div>
        )}
      </div>

      <div class='filters-section'>
        <div class='filter-row'>
          <div class='search-filter'>
            <input
              type='text'
              placeholder='Search logs...'
              value={searchInput}
              onInput={(e) => setSearchInput((e.target as HTMLInputElement).value)}
            />
          </div>

          <div class='time-range-filter'>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange((e.target as HTMLSelectElement).value as FilterOptions['timeRange'])}
            >
              <option value='today'>Today</option>
              <option value='yesterday'>Yesterday</option>
              <option value='week'>Last 7 days</option>
              <option value='month'>Last 30 days</option>
              <option value='custom'>Custom range</option>
            </select>
          </div>
        </div>

        {selectedTimeRange === 'custom' && (
          <div class='custom-date-range'>
            <div class='date-input'>
              <label>Start Date:</label>
              <input
                type='date'
                value={customStartDate}
                onChange={(e) => setCustomStartDate((e.target as HTMLInputElement).value)}
              />
            </div>
            <div class='date-input'>
              <label>End Date:</label>
              <input
                type='date'
                value={customEndDate}
                onChange={(e) => setCustomEndDate((e.target as HTMLInputElement).value)}
              />
            </div>
          </div>
        )}

        <div class='filter-row'>
          <div class='action-filter'>
            <select
              multiple
              value={selectedActions}
              onChange={(e) => {
                const select = e.target as HTMLSelectElement;
                const options = Array.from(select.selectedOptions);
                setSelectedActions(options.map((option) => option.value));
              }}
            >
              {availableActionTypes.value.map((actionType) => (
                <option key={actionType} value={actionType}>
                  {actionType}
                </option>
              ))}
            </select>
            <div class='select-label'>Action Types</div>
          </div>

          <div class='actor-filter'>
            <select
              multiple
              value={selectedActors}
              onChange={(e) => {
                const select = e.target as HTMLSelectElement;
                const options = Array.from(select.selectedOptions);
                setSelectedActors(options.map((option) => option.value));
              }}
            >
              {availableActorNames.value.map((actorName) => (
                <option key={actorName} value={actorName}>
                  {actorName}
                </option>
              ))}
            </select>
            <div class='select-label'>Actors</div>
          </div>
        </div>

        <div class='filter-actions'>
          <button
            onClick={applyFilters}
            class='apply-filters-button'
          >
            Apply Filters
          </button>
          <button
            onClick={resetFilters}
            class='reset-filters-button'
          >
            Reset
          </button>
        </div>
      </div>

      {auditLogs.value.length === 0
        ? (
          <div class='no-logs-found'>
            <p>No audit logs found matching the current filters.</p>
          </div>
        )
        : (
          <>
            <div class='logs-list'>
              {auditLogs.value.map((log) => (
                <div
                  key={log.id}
                  class='log-item'
                  onClick={() => viewLogDetails(log)}
                >
                  <div class='log-header'>
                    <span class={`action-badge ${getActionTypeClass(log.action)}`}>
                      {log.action}
                    </span>
                    <span class='log-time'>{formatRelativeTime(log.occurredAt)}</span>
                  </div>

                  <div class='log-content'>
                    <div class='log-actor'>
                      {log.actor.name} ({log.actor.type})
                    </div>

                    <div class='log-targets'>
                      {log.targets.map((target, index) => (
                        <span key={index} class='target-badge'>
                          {target.name}
                        </span>
                      ))}
                    </div>

                    {showDetailedMetadata && log.metadata && (
                      <div class='log-metadata'>
                        {Object.entries(log.metadata).map(([key, value]) => (
                          <div key={key} class='metadata-item'>
                            <span class='metadata-key'>{key}:</span>
                            <span class='metadata-value'>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div class='log-location'>
                    <span class='location-icon'>📍</span>
                    {log.context.location}
                  </div>
                </div>
              ))}
            </div>

            <div class='pagination'>
              <div class='pagination-info'>
                {currentPageDisplay}
              </div>

              <div class='pagination-controls'>
                <button
                  onClick={() => goToPreviousPage()}
                  disabled={!hasPreviousPage.value || isStreamLoading.value}
                  class='pagination-prev'
                >
                  Previous
                </button>

                <button
                  onClick={() => goToNextPage()}
                  disabled={!hasNextPage.value || isStreamLoading.value}
                  class='pagination-next'
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

      <style>
        {`
        .audit-log-stream {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          border: 1px solid #e1e4e8;
          border-radius: 6px;
          padding: 20px;
          background-color: #fff;
        }
        
        .stream-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .stream-header h2 {
          margin: 0;
          font-size: 1.5rem;
        }
        
        .realtime-indicator {
          display: flex;
          align-items: center;
          font-size: 0.875rem;
          color: #24292e;
        }
        
        .indicator-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          background-color: #2ea44f;
          border-radius: 50%;
          margin-right: 8px;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        .filters-section {
          margin-bottom: 20px;
          padding: 16px;
          background-color: #f6f8fa;
          border-radius: 6px;
        }
        
        .filter-row {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .search-filter {
          flex: 1;
        }
        
        .search-filter input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5da;
          border-radius: 4px;
          font-size: 0.875rem;
        }
        
        .time-range-filter {
          width: 150px;
        }
        
        .time-range-filter select,
        .action-filter select,
        .actor-filter select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5da;
          border-radius: 4px;
          font-size: 0.875rem;
          background-color: #fff;
        }
        
        .custom-date-range {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .date-input {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .date-input label {
          font-size: 0.875rem;
        }
        
        .date-input input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #d1d5da;
          border-radius: 4px;
          font-size: 0.875rem;
        }
        
        .action-filter,
        .actor-filter {
          flex: 1;
          position: relative;
        }
        
        .action-filter select,
        .actor-filter select {
          height: 120px;
        }
        
        .select-label {
          font-size: 0.75rem;
          color: #586069;
          margin-top: 4px;
        }
        
        .filter-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 12px;
        }
        
        .apply-filters-button,
        .reset-filters-button,
        .retry-button,
        .back-button {
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 0.875rem;
          cursor: pointer;
          border: 1px solid;
        }
        
        .apply-filters-button {
          background-color: #2ea44f;
          border-color: #2a9147;
          color: #fff;
        }
        
        .reset-filters-button,
        .back-button {
          background-color: #f6f8fa;
          border-color: #d1d5da;
          color: #24292e;
        }
        
        .retry-button {
          background-color: #0366d6;
          border-color: #0366d6;
          color: #fff;
        }
        
        .logs-list {
          margin-bottom: 20px;
        }
        
        .log-item {
          padding: 16px;
          border: 1px solid #e1e4e8;
          border-radius: 6px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: box-shadow 0.2s ease-in-out;
        }
        
        .log-item:hover {
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        .log-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .action-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .action-auth {
          background-color: #ddf4ff;
          color: #0969da;
        }
        
        .action-user {
          background-color: #ddf4ff;
          color: #0969da;
        }
        
        .action-org {
          background-color: #ffefdb;
          color: #bc4c00;
        }
        
        .action-api {
          background-color: #fff8c5;
          color: #9a6700;
        }
        
        .action-document {
          background-color: #ddf4e5;
          color: #1f883d;
        }
        
        .action-settings {
          background-color: #f2ebe9;
          color: #9e6a52;
        }
        
        .action-other {
          background-color: #f6f8fa;
          color: #57606a;
        }
        
        .log-time {
          font-size: 0.75rem;
          color: #586069;
        }
        
        .log-content {
          margin-bottom: 8px;
        }
        
        .log-actor {
          font-weight: 500;
          margin-bottom: 4px;
        }
        
        .log-targets {
          margin-bottom: 4px;
        }
        
        .target-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 0.75rem;
          background-color: #f6f8fa;
          color: #24292e;
          margin-right: 4px;
        }
        
        .log-metadata {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px dashed #e1e4e8;
          font-size: 0.75rem;
        }
        
        .metadata-item {
          margin-bottom: 2px;
        }
        
        .metadata-key {
          font-weight: 500;
          color: #586069;
        }
        
        .log-location {
          font-size: 0.75rem;
          color: #586069;
        }
        
        .location-icon {
          margin-right: 4px;
        }
        
        .pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
        }
        
        .pagination-info {
          font-size: 0.875rem;
          color: #586069;
        }
        
        .pagination-controls {
          display: flex;
          gap: 8px;
        }
        
        .pagination-prev,
        .pagination-next {
          padding: 6px 12px;
          border: 1px solid #d1d5da;
          border-radius: 4px;
          background-color: #f6f8fa;
          color: #24292e;
          font-size: 0.875rem;
          cursor: pointer;
        }
        
        .pagination-prev:disabled,
        .pagination-next:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .audit-log-detail {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          border: 1px solid #e1e4e8;
          border-radius: 6px;
          padding: 20px;
          background-color: #fff;
        }
        
        .detail-header {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
          gap: 16px;
        }
        
        .detail-header h2 {
          margin: 0;
          font-size: 1.5rem;
        }
        
        .log-detail-content {
          padding: 20px;
          background-color: #f6f8fa;
          border-radius: 6px;
        }
        
        .log-badge {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .log-sections {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }
        
        .actor-section,
        .targets-section,
        .context-section,
        .metadata-section {
          background-color: #fff;
          border-radius: 6px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .actor-section h3,
        .targets-section h3,
        .context-section h3,
        .metadata-section h3 {
          margin-top: 0;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e1e4e8;
          font-size: 1.1rem;
        }
        
        .target-item {
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px dashed #e1e4e8;
        }
        
        .target-item:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }
        
        .metadata-section pre {
          background-color: #f6f8fa;
          padding: 8px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 0.875rem;
        }
        
        .audit-log-stream-loading,
        .audit-log-stream-error {
          text-align: center;
          padding: 40px;
          border: 1px solid #e1e4e8;
          border-radius: 6px;
          background-color: #fff;
        }
        
        .loading-spinner {
          display: inline-block;
          position: relative;
          width: 80px;
          height: 80px;
        }
        
        .loading-spinner:after {
          content: '';
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          width: 64px;
          height: 64px;
          margin: 8px;
          border-radius: 50%;
          border: 6px solid #0366d6;
          border-color: #0366d6 transparent #0366d6 transparent;
          animation: spinner 1.2s linear infinite;
        }
        
        @keyframes spinner {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error-message {
          color: #cb2431;
        }
        
        .error-message h3 {
          margin-top: 0;
        }
        
        .no-logs-found {
          text-align: center;
          padding: 40px;
          background-color: #f6f8fa;
          border-radius: 6px;
          color: #586069;
        }
      `}
      </style>
    </div>
  );
}
