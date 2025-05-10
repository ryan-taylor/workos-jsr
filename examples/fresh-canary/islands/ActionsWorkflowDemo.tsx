import { useEffect, useState } from "preact/hooks";

// Define the Action interface based on WorkOS's Action models
interface Action {
  id: string;
  type: "authentication" | "user_registration";
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  approver?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  context: {
    organization?: {
      id: string;
      name: string;
    };
    ipAddress?: string;
    userAgent?: string;
    deviceFingerprint?: string;
  };
  reason?: string;
  metadata?: Record<string, string>;
}

interface ActionsWorkflowDemoProps {
  initialActions: Action[];
  totalCount: number;
}

export default function ActionsWorkflowDemo({
  initialActions = [],
  totalCount = 0,
}: ActionsWorkflowDemoProps) {
  // State for actions data
  const [actions, setActions] = useState<Action[]>(initialActions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(totalCount);
  const [hasMore, setHasMore] = useState(total > limit);
  
  // State for filtering
  const [filters, setFilters] = useState({
    status: [] as ("pending" | "approved" | "rejected")[],
    type: [] as ("authentication" | "user_registration")[],
    search: "",
    rangeStart: undefined as Date | undefined,
    rangeEnd: undefined as Date | undefined
  });
  
  // State for the create form
  const [formData, setFormData] = useState({
    type: "authentication" as "authentication" | "user_registration",
    email: "",
    firstName: "",
    lastName: "",
    organization: "",
    metadata: ""
  });
  
  // State for UI sections
  const [activeTab, setActiveTab] = useState<"dashboard" | "create">("dashboard");

  // Format date to ISO string for input fields
  const formatDate = (date: Date | undefined): string => {
    if (!date) return "";
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  // Load actions with current filters and pagination
  const loadActions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build URL with query parameters
      const params = new URLSearchParams();
      
      // Add filter parameters
      if (filters.status.length > 0) {
        params.set("status", filters.status.join(","));
      }
      
      if (filters.type.length > 0) {
        params.set("type", filters.type.join(","));
      }
      
      if (filters.search) {
        params.set("search", filters.search);
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
      
      // Fetch actions
      const response = await fetch(`/api/actions/list?${params.toString()}`);
      const data = await response.json();
      
      if (data.status === "success") {
        setActions(data.data.map((action: any) => ({
          ...action,
          createdAt: new Date(action.createdAt)
        })));
        setTotal(data.pagination.totalCount);
        setHasMore(data.pagination.hasMore);
      } else {
        setError(data.message || "Failed to load actions");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Create a new action
  const createAction = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Prepare metadata as a JSON object if provided
      let metadata = {};
      if (formData.metadata) {
        try {
          metadata = JSON.parse(formData.metadata);
        } catch (err) {
          setError("Invalid JSON in metadata field");
          setLoading(false);
          return;
        }
      }
      
      // Prepare request body
      const body = {
        type: formData.type,
        user: {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName
        },
        organization: formData.organization ? { name: formData.organization } : undefined,
        metadata
      };
      
      // Send request to create the action
      const response = await fetch("/api/actions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (data.status === "success") {
        // Reset form and switch to dashboard
        setFormData({
          type: "authentication",
          email: "",
          firstName: "",
          lastName: "",
          organization: "",
          metadata: ""
        });
        setActiveTab("dashboard");
        
        // Reload actions to include the new one
        loadActions();
      } else {
        setError(data.message || "Failed to create action");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Approve or reject an action
  const respondToAction = async (id: string, verdict: "approved" | "rejected", reason?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const endpoint = verdict === "approved" ? "approve" : "reject";
      
      // Send request to approve or reject the action
      const response = await fetch(`/api/actions/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id,
          reason
        })
      });
      
      const data = await response.json();
      
      if (data.status === "success") {
        // Update the action in the list
        setActions(prevActions => 
          prevActions.map(action => 
            action.id === id 
              ? {
                  ...action,
                  status: verdict,
                  approver: data.data.approver,
                  reason: reason
                }
              : action
          )
        );
      } else {
        setError(data.message || `Failed to ${verdict} action`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Initialize by loading data with current filters
  useEffect(() => {
    loadActions();
  }, [page, limit, filters]);

  // Handle filter changes
  const handleFilterChange = (
    filterType: "status" | "type" | "search" | "rangeStart" | "rangeEnd",
    value: any
  ) => {
    setFilters(prev => {
      // For select multiple filters (status, type)
      if (filterType === "status" || filterType === "type") {
        const selectElement = value.target as HTMLSelectElement;
        const selectedOptions = Array.from(selectElement.selectedOptions).map(
          option => option.value
        );
        
        return {
          ...prev,
          [filterType]: selectedOptions
        };
      }
      
      // For text search
      if (filterType === "search") {
        return {
          ...prev,
          search: value.target.value
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
      status: [],
      type: [],
      search: "",
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
    loadActions();
  };
  
  // Handle form input changes
  const handleFormChange = (e: Event) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const name = target.name;
    const value = target.value;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Format datetime for display
  const formatDateTime = (dateString: Date) => {
    return new Date(dateString).toLocaleString();
  };

  // For the approval/rejection dialog
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [currentActionId, setCurrentActionId] = useState<string | null>(null);

  // Open rejection dialog
  const openRejectDialog = (id: string) => {
    setCurrentActionId(id);
    setRejectionReason("");
    setShowRejectDialog(true);
  };

  // Close rejection dialog
  const closeRejectDialog = () => {
    setShowRejectDialog(false);
    setCurrentActionId(null);
  };

  // Submit rejection
  const submitRejection = () => {
    if (currentActionId) {
      respondToAction(currentActionId, "rejected", rejectionReason);
      closeRejectDialog();
    }
  };

  return (
    <div class="w-full">
      {/* Tab navigation */}
      <div class="border-b border-gray-200 mb-6">
        <nav class="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("dashboard")}
            class={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "dashboard"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Actions Dashboard
          </button>
          <button
            onClick={() => setActiveTab("create")}
            class={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "create"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Create Action Request
          </button>
        </nav>
      </div>

      {/* Error message */}
      {error && (
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Dashboard Tab */}
      {activeTab === "dashboard" && (
        <div>
          {/* Filters section */}
          <div class="bg-white p-4 rounded-lg shadow mb-6">
            <h2 class="text-lg font-semibold mb-4">Filters</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              {/* Status Filter */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  multiple
                  class="form-select block w-full border-gray-300 rounded-md shadow-sm h-24"
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e)}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              {/* Type Filter */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  multiple
                  class="form-select block w-full border-gray-300 rounded-md shadow-sm h-24"
                  value={filters.type}
                  onChange={(e) => handleFilterChange("type", e)}
                >
                  <option value="authentication">Authentication</option>
                  <option value="user_registration">User Registration</option>
                </select>
              </div>
              
              {/* Search */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  class="form-input block w-full border-gray-300 rounded-md shadow-sm"
                  placeholder="Search by email, name, etc."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e)}
                />
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

          {/* Actions table */}
          <div class="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg mb-4">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {actions.length === 0 ? (
                  <tr>
                    <td colSpan={7} class="px-6 py-4 text-center text-sm text-gray-500">
                      {loading ? "Loading..." : "No actions found"}
                    </td>
                  </tr>
                ) : (
                  actions.map(action => (
                    <tr key={action.id}>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {action.id.substring(0, 8)}...
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          action.type === "authentication"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {action.type === "authentication" ? "Authentication" : "User Registration"}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          action.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : action.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {action.status.charAt(0).toUpperCase() + action.status.slice(1)}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(action.createdAt)}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {action.user.email}
                        <div class="text-xs text-gray-400">
                          {action.user.firstName} {action.user.lastName}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {action.context.organization?.name || "-"}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {action.status === "pending" ? (
                          <div class="flex space-x-2">
                            <button
                              onClick={() => respondToAction(action.id, "approved")}
                              class="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openRejectDialog(action.id)}
                              class="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div>
                            <span class="text-xs text-gray-500">
                              {action.status.charAt(0).toUpperCase() + action.status.slice(1)} by{" "}
                              {action.approver?.email || "System"}
                            </span>
                            {action.reason && (
                              <div class="text-xs text-gray-400 mt-1">
                                Reason: {action.reason}
                              </div>
                            )}
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
                  Showing <span class="font-medium">{actions.length > 0 ? ((page - 1) * limit) + 1 : 0}</span> to{" "}
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
      )}

      {/* Create Request Tab */}
      {activeTab === "create" && (
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-lg font-semibold mb-4">Create Action Request</h2>
          
          <form onSubmit={createAction}>
            {/* Action Type */}
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Action Type
              </label>
              <select
                name="type"
                class="form-select block w-full border-gray-300 rounded-md shadow-sm"
                value={formData.type}
                onChange={handleFormChange}
                required
              >
                <option value="authentication">Authentication</option>
                <option value="user_registration">User Registration</option>
              </select>
            </div>
            
            {/* User Information */}
            <div class="mb-4">
              <h3 class="text-md font-medium mb-2">User Information</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    class="form-input block w-full border-gray-300 rounded-md shadow-sm"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    class="form-input block w-full border-gray-300 rounded-md shadow-sm"
                    value={formData.firstName}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    class="form-input block w-full border-gray-300 rounded-md shadow-sm"
                    value={formData.lastName}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Organization */}
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Organization (Optional)
              </label>
              <input
                type="text"
                name="organization"
                class="form-input block w-full border-gray-300 rounded-md shadow-sm"
                value={formData.organization}
                onChange={handleFormChange}
              />
            </div>
            
            {/* Metadata */}
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Metadata (JSON, Optional)
              </label>
              <textarea
                name="metadata"
                rows={4}
                class="form-textarea block w-full border-gray-300 rounded-md shadow-sm"
                placeholder='{"key": "value"}'
                value={formData.metadata}
                onChange={handleFormChange}
              ></textarea>
              <p class="mt-1 text-xs text-gray-500">
                Enter valid JSON to include additional metadata with the request
              </p>
            </div>
            
            {/* Submit button */}
            <div class="flex justify-end">
              <button
                type="submit"
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Action Request"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rejection Dialog */}
      {showRejectDialog && (
        <div class="fixed inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            
            {/* Dialog */}
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div class="sm:flex sm:items-start">
                  <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Reject Action Request
                    </h3>
                    <div class="mt-2">
                      <p class="text-sm text-gray-500">
                        Please provide a reason for rejecting this action request.
                      </p>
                      <textarea
                        class="mt-2 form-textarea block w-full border-gray-300 rounded-md shadow-sm"
                        rows={4}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason((e.target as HTMLTextAreaElement).value)}
                        placeholder="Enter rejection reason..."
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
              <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={submitRejection}
                >
                  Reject
                </button>
                <button
                  type="button"
                  class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={closeRejectDialog}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}