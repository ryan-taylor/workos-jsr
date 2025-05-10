import { useEffect, useState } from "preact/hooks";
import { AuditLogEvent } from "../utils/audit-logs.ts";

interface AuditLogsListProps {
  initialLogs: AuditLogEvent[];
  totalCount: number;
  uniqueActionTypes: string[];
  uniqueActorNames: string[];
}

export default function AuditLogsList({ 
  initialLogs, 
  totalCount, 
  uniqueActionTypes, 
  uniqueActorNames 
}: AuditLogsListProps) {
  // State for audit logs data
  const [logs, setLogs] = useState<AuditLogEvent[]>(initialLogs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(totalCount);
  const [hasMore, setHasMore] = useState(total > limit);
  
  // State for sorting
  const [sortField, setSortField] = useState<string>("occurredAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // State for filters
  const [filters, setFilters] = useState({
    actions: [] as string[],
    actorNames: [] as string[],
    rangeStart: undefined as Date | undefined,
    rangeEnd: undefined as Date | undefined
  });

  // Format date to ISO string for input fields
  const formatDate = (date: Date | undefined): string => {
    if (!date) return "";
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  // Load audit logs with current filters and pagination
  const loadAuditLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build URL with query parameters
      const params = new URLSearchParams();
      
      // Add filter parameters
      if (filters.actions.length > 0) {
        params.set("actions", filters.actions.join(","));
      }
      
      if (filters.actorNames.length > 0) {
        params.set("actorNames", filters.actorNames.join(","));
      }
      
      if (filters.rangeStart) {
        params.set("rangeStart", filters.rangeStart.toISOString());
      }
      
      if (filters.rangeEnd) {
        params.set("rangeEnd", filters.rangeEnd.toISOString());
      }
      
      // Add pagination parameters
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      
      // Fetch audit logs
      const response = await fetch(`/api/audit-logs/list?${params.toString()}`);
      const data = await response.json();
      
      if (data.status === "success") {
        setLogs(data.data);
        setTotal(data.pagination.totalCount);
        setHasMore(data.pagination.hasMore);
      } else {
        setError(data.message || "Failed to load audit logs");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Initialize by loading data with current filters
  useEffect(() => {
    loadAuditLogs();
  }, [page, limit, filters, sortField, sortDirection]);

  // Handle sort change
  const handleSort = (field: string) => {
    if (field === sortField) {
      // Toggle sort direction if clicking on the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new sort field and default to descending
      setSortField(field);
      setSortDirection("desc");
    }
    
    // Reset to first page when sorting changes
    setPage(1);
  };

  // Handle filter changes
  const handleFilterChange = (
    filterType: "actions" | "actorNames" | "rangeStart" | "rangeEnd",
    value: any
  ) => {
    setFilters(prev => {
      // For select multiple filters (actions, actorNames)
      if (filterType === "actions" || filterType === "actorNames") {
        const selectElement = value.target as HTMLSelectElement;
        const selectedOptions = Array.from(selectElement.selectedOptions).map(
          option => option.value
        );
        
        return {
          ...prev,
          [filterType]: selectedOptions
        };
      }
      
      // For date filters
      if (filterType === "rangeStart" || filterType === "rangeEnd") {
        const dateValue = value.target.value 
          ? new Date(value.target.value) 
          : undefined;
        
        return {
          ...prev,
          [filterType]: dateValue
        };
      }
      
      return prev;
    });
    
    // Reset to first page when filters change
    setPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      actions: [],
      actorNames: [],
      rangeStart: undefined,
      rangeEnd: undefined
    });
    
    // Reset to first page
    setPage(1);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Handle refresh button click
  const handleRefresh = () => {
    loadAuditLogs();
  };

  // Format datetime for display
  const formatDateTime = (dateString: Date) => {
    return new Date(dateString).toLocaleString();
  };

  // Get sort indicator arrow
  const getSortIndicator = (field: string) => {
    if (field !== sortField) return null;
    return sortDirection === "asc" ? "↑" : "↓";
  };

  return (
    <div class="w-full">
      {/* Filters section */}
      <div class="bg-white p-4 rounded-lg shadow mb-6">
        <h2 class="text-lg font-semibold mb-4">Filters</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Event Type Filter */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Event Type
            </label>
            <select
              multiple
              class="form-select block w-full border-gray-300 rounded-md shadow-sm h-24"
              value={filters.actions}
              onChange={(e) => handleFilterChange("actions", e)}
            >
              {uniqueActionTypes.map(action => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>
          
          {/* User Filter */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              User
            </label>
            <select
              multiple
              class="form-select block w-full border-gray-300 rounded-md shadow-sm h-24"
              value={filters.actorNames}
              onChange={(e) => handleFilterChange("actorNames", e)}
            >
              {uniqueActorNames.map(actor => (
                <option key={actor} value={actor}>
                  {actor}
                </option>
              ))}
            </select>
          </div>
          
          {/* Date Range Start */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="datetime-local"
              class="form-input block w-full border-gray-300 rounded-md shadow-sm"
              value={formatDate(filters.rangeStart)}
              onChange={(e) => handleFilterChange("rangeStart", e)}
            />
          </div>
          
          {/* Date Range End */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="datetime-local"
              class="form-input block w-full border-gray-300 rounded-md shadow-sm"
              value={formatDate(filters.rangeEnd)}
              onChange={(e) => handleFilterChange("rangeEnd", e)}
            />
          </div>
        </div>
        
        <div class="flex justify-end space-x-2">
          <button
            onClick={clearFilters}
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Clear Filters
          </button>
          
          <button
            onClick={handleRefresh}
            class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Results table */}
      <div class="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg mb-4">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("occurredAt")}
              >
                Time {getSortIndicator("occurredAt")}
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("action")}
              >
                Event Type {getSortIndicator("action")}
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("actor.name")}
              >
                User {getSortIndicator("actor.name")}
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Target
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Location
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Details
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} class="px-6 py-4 text-center text-sm text-gray-500">
                  {loading ? "Loading..." : "No audit logs found"}
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id}>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(log.occurredAt)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {log.action}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.actor.name} 
                    <span class="text-xs text-gray-400 ml-1">
                      ({log.actor.type})
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500">
                    {log.targets.map(target => (
                      <div key={target.id}>
                        {target.name} 
                        <span class="text-xs text-gray-400 ml-1">
                          ({target.type})
                        </span>
                      </div>
                    ))}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.context.location}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500">
                    {log.metadata && Object.entries(log.metadata).map(([key, value]) => (
                      <div key={key} class="text-xs">
                        <span class="font-medium">{key}:</span> {value.toString()}
                      </div>
                    ))}
                    {log.context.userAgent && (
                      <div class="text-xs mt-1">
                        <span class="font-medium">User Agent:</span> {log.context.userAgent}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div class="flex-1 flex justify-between items-center">
          <div>
            <p class="text-sm text-gray-700">
              Showing <span class="font-medium">{logs.length > 0 ? ((page - 1) * limit) + 1 : 0}</span> to{" "}
              <span class="font-medium">{Math.min(page * limit, total)}</span> of{" "}
              <span class="font-medium">{total}</span> results
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                class={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                  page === 1 
                  ? "text-gray-300 cursor-not-allowed" 
                  : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                Previous
              </button>
              
              {/* Current page indicator */}
              <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                Page {page}
              </span>
              
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={!hasMore}
                class={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                  !hasMore 
                  ? "text-gray-300 cursor-not-allowed" 
                  : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}