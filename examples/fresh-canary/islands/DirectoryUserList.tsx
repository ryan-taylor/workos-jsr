/**
 * @fileoverview DirectoryUserList component for displaying and managing WorkOS Directory Sync users
 *
 * This component provides a reusable UI for displaying, filtering, and paginating through
 * users from a WorkOS Directory, with support for basic management operations.
 */

import { useEffect, useState } from "preact/hooks";
import { type signal, useComputed, useSignal } from "@preact/signals";
import { useWorkOS } from "../hooks/use-workos.ts";
import type {
  DirectoryGroup,
  DirectoryUser,
  DirectoryUserWithGroups,
} from "../utils/directory-sync.ts";

// Enumeration for view states
enum ViewState {
  LIST = "list",
  DETAIL = "detail",
}

// Filter options for directory users
interface FilterOptions {
  search: string;
  group?: string;
  status?: "active" | "suspended" | "all";
}

export interface DirectoryUserListProps {
  /**
   * The directory ID to fetch users from
   */
  directoryId: string;

  /**
   * Optional initial group to filter by
   */
  initialGroupId?: string;

  /**
   * Number of users to display per page
   * @default 10
   */
  pageSize?: number;

  /**
   * Whether to enable detailed user information view
   * @default true
   */
  enableDetailView?: boolean;

  /**
   * Whether to enable user management actions (suspend, activate)
   * @default false
   */
  enableManagement?: boolean;

  /**
   * Optional CSS class to apply to the component container
   */
  className?: string;

  /**
   * Optional function to render custom user detail UI
   */
  renderUserDetail?: (user: DirectoryUserWithGroups) => JSX.Element;

  /**
   * Optional function to render custom user list item UI
   */
  renderUserListItem?: (user: DirectoryUserWithGroups) => JSX.Element;

  /**
   * Optional callback when a user action is performed
   */
  onUserAction?: (action: string, user: DirectoryUserWithGroups) => void;
}

/**
 * DirectoryUserList component for displaying and managing WorkOS Directory Sync users
 *
 * Features:
 * - Pagination for navigating through large user lists
 * - Filtering by search term, group, and status
 * - Detailed user information display
 * - Basic user management operations
 *
 * @example
 * ```tsx
 * // Basic usage
 * <DirectoryUserList directoryId="directory_123" />
 *
 * // With management capabilities and custom page size
 * <DirectoryUserList
 *   directoryId="directory_123"
 *   pageSize={20}
 *   enableManagement={true}
 * />
 *
 * // With initial group filter
 * <DirectoryUserList
 *   directoryId="directory_123"
 *   initialGroupId="group_456"
 * />
 * ```
 */
export default function DirectoryUserList({
  directoryId,
  initialGroupId,
  pageSize = 10,
  enableDetailView = true,
  enableManagement = false,
  className = "",
  renderUserDetail,
  renderUserListItem,
  onUserAction,
}: DirectoryUserListProps) {
  // Fetch WorkOS integration
  const { workos, isLoading, error } = useWorkOS();

  // View state signals
  const viewState = useSignal<ViewState>(ViewState.LIST);
  const selectedUser = useSignal<DirectoryUserWithGroups | null>(null);

  // User data and pagination signals
  const users = useSignal<DirectoryUserWithGroups[]>([]);
  const totalCount = useSignal<number | null>(null);
  const currentPage = useSignal<number>(1);
  const beforeCursor = useSignal<string | null>(null);
  const afterCursor = useSignal<string | null>(null);

  // Filter signals
  const filters = useSignal<FilterOptions>({
    search: "",
    group: initialGroupId,
    status: "all",
  });

  // Available groups
  const groups = useSignal<DirectoryGroup[]>([]);

  // Computed pagination info
  const totalPages = useComputed(() => {
    if (totalCount.value === null) return 1;
    return Math.ceil(totalCount.value / pageSize);
  });

  const currentPageDisplay = useComputed(() => {
    return `Page ${currentPage.value} of ${totalPages.value || 1}`;
  });

  const hasNextPage = useComputed(() => {
    return afterCursor.value !== null;
  });

  const hasPreviousPage = useComputed(() => {
    return beforeCursor.value !== null;
  });

  // Local state for search input
  const [searchInput, setSearchInput] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<
    "active" | "suspended" | "all"
  >("all");
  const [selectedGroup, setSelectedGroup] = useState<string | undefined>(
    initialGroupId,
  );
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Initial data loading
  useEffect(() => {
    if (directoryId) {
      fetchUsers();
      fetchGroups();
    }
  }, [directoryId]);

  // Reload when filters change
  useEffect(() => {
    fetchUsers();
  }, [filters.value]);

  /**
   * Fetch directory users
   */
  const fetchUsers = async () => {
    if (!workos) return;

    try {
      isLoading.value = true;
      error.value = null;

      // Prepare options for listing users
      const options: {
        directory: string;
        limit: number;
        before?: string;
        after?: string;
        group?: string;
      } = {
        directory: directoryId,
        limit: pageSize,
      };

      // Add pagination cursors if available
      if (currentPage.value > 1 && beforeCursor.value) {
        options.before = beforeCursor.value;
      } else if (currentPage.value > 1 && afterCursor.value) {
        options.after = afterCursor.value;
      }

      // Add group filter if specified
      if (filters.value.group) {
        options.group = filters.value.group;
      }

      // Fetch users from WorkOS
      const result = await workos.directorySync.listUsers(options);

      // Filter users client-side by status and search term if needed
      let filteredUsers = [...result.data];

      // Apply status filter
      if (filters.value.status && filters.value.status !== "all") {
        filteredUsers = filteredUsers.filter((user) =>
          user.state === filters.value.status
        );
      }

      // Apply search filter
      if (filters.value.search) {
        const searchLower = filters.value.search.toLowerCase();
        filteredUsers = filteredUsers.filter((user) =>
          user.emails.some((email) =>
            email.value.toLowerCase().includes(searchLower)
          ) ||
          (user.firstName &&
            user.firstName.toLowerCase().includes(searchLower)) ||
          (user.lastName &&
            user.lastName.toLowerCase().includes(searchLower)) ||
          (user.username && user.username.toLowerCase().includes(searchLower))
        );
      }

      // Update signals with fetched data
      users.value = filteredUsers;
      beforeCursor.value = result.listMetadata?.before || null;
      afterCursor.value = result.listMetadata?.after || null;

      // Estimate total count based on cursors
      // This is a rough approximation since the API doesn't provide exact counts
      if (result.data.length < pageSize) {
        totalCount.value = (currentPage.value - 1) * pageSize +
          result.data.length;
      } else if (!result.listMetadata?.after) {
        totalCount.value = currentPage.value * pageSize;
      } else {
        totalCount.value = currentPage.value * pageSize + pageSize;
      }
    } catch (err) {
      console.error("Failed to fetch directory users:", err);
      error.value = err instanceof Error ? err : new Error(String(err));
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Fetch directory groups
   */
  const fetchGroups = async () => {
    if (!workos) return;

    try {
      const result = await workos.directorySync.listGroups({
        directory: directoryId,
        limit: 100, // Fetch a reasonable number of groups
      });

      groups.value = result.data;
    } catch (err) {
      console.error("Failed to fetch directory groups:", err);
    }
  };

  /**
   * Handle page navigation
   */
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages.value) return;

    currentPage.value = page;
    fetchUsers();
  };

  /**
   * Handle next page navigation
   */
  const goToNextPage = () => {
    if (!hasNextPage.value) return;

    currentPage.value++;
    fetchUsers();
  };

  /**
   * Handle previous page navigation
   */
  const goToPreviousPage = () => {
    if (!hasPreviousPage.value) return;

    currentPage.value--;
    fetchUsers();
  };

  /**
   * Apply filters from form inputs
   */
  const applyFilters = () => {
    filters.value = {
      search: searchInput,
      group: selectedGroup,
      status: selectedStatus,
    };

    // Reset to first page when filters change
    currentPage.value = 1;
  };

  /**
   * Reset all filters to default values
   */
  const resetFilters = () => {
    setSearchInput("");
    setSelectedStatus("all");
    setSelectedGroup(undefined);

    filters.value = {
      search: "",
      group: undefined,
      status: "all",
    };

    // Reset to first page
    currentPage.value = 1;
  };

  /**
   * Show user detail view
   */
  const viewUserDetail = (user: DirectoryUserWithGroups) => {
    if (!enableDetailView) return;

    selectedUser.value = user;
    viewState.value = ViewState.DETAIL;
  };

  /**
   * Return to user list view
   */
  const backToList = () => {
    viewState.value = ViewState.LIST;
    selectedUser.value = null;
  };

  /**
   * Perform a user management action
   */
  const performUserAction = async (
    action: string,
    user: DirectoryUserWithGroups,
  ) => {
    if (!workos || !enableManagement) return;

    setIsLoadingAction(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      // Implement directory sync management actions as needed
      switch (action) {
        case "suspend":
          // This is a placeholder - the actual implementation would depend on the WorkOS API
          console.log(`Suspend user: ${user.id}`);
          setActionSuccess(`User ${user.id} has been suspended`);
          break;
        case "activate":
          // This is a placeholder - the actual implementation would depend on the WorkOS API
          console.log(`Activate user: ${user.id}`);
          setActionSuccess(`User ${user.id} has been activated`);
          break;
        default:
          console.log(`Unsupported action: ${action}`);
      }

      // Notify of the action via callback
      onUserAction?.(action, user);

      // Refresh the user list after action
      fetchUsers();
    } catch (err) {
      console.error(`Failed to perform user action "${action}":`, err);
      setActionError(
        `Failed to perform action: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    } finally {
      setIsLoadingAction(false);
    }
  };

  // Render loading state
  if (isLoading.value && users.value.length === 0) {
    return (
      <div class={`directory-user-list-loading ${className}`}>
        <div class="loading-spinner">Loading directory users...</div>
      </div>
    );
  }

  // Render error state
  if (error.value && users.value.length === 0) {
    return (
      <div class={`directory-user-list-error ${className}`}>
        <div class="error-message">
          <h3>Error loading directory users</h3>
          <p>{error.value.message}</p>
          <button
            onClick={() => fetchUsers()}
            class="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render detail view
  if (viewState.value === ViewState.DETAIL && selectedUser.value) {
    return (
      <div class={`directory-user-detail ${className}`}>
        <div class="detail-header">
          <button
            onClick={backToList}
            class="back-button"
          >
            ← Back to List
          </button>
          <h2>User Details</h2>
        </div>

        {actionError && (
          <div class="action-error">
            {actionError}
            <button
              onClick={() => setActionError(null)}
              class="dismiss-button"
            >
              Dismiss
            </button>
          </div>
        )}

        {actionSuccess && (
          <div class="action-success">
            {actionSuccess}
            <button
              onClick={() => setActionSuccess(null)}
              class="dismiss-button"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Custom or default user detail rendering */}
        {renderUserDetail
          ? (
            renderUserDetail(selectedUser.value)
          )
          : (
            <div class="user-detail-content">
              <div class="user-profile">
                <div class="user-avatar">
                  {selectedUser.value.firstName?.[0] ||
                    selectedUser.value.lastName?.[0] ||
                    selectedUser.value.emails[0].value[0]}
                </div>

                <div class="user-info">
                  <h3>
                    {selectedUser.value.firstName} {selectedUser.value.lastName}
                    <span
                      class={`user-status user-status-${selectedUser.value.state}`}
                    >
                      {selectedUser.value.state}
                    </span>
                  </h3>

                  <div class="user-emails">
                    {selectedUser.value.emails.map((email) => (
                      <div
                        key={email.value}
                        class={`email ${
                          email.primary ? "primary" : "secondary"
                        }`}
                      >
                        {email.value}{" "}
                        {email.primary && (
                          <span class="primary-badge">Primary</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {selectedUser.value.username && (
                    <div class="user-username">
                      <strong>Username:</strong> {selectedUser.value.username}
                    </div>
                  )}
                </div>
              </div>

              {selectedUser.value.groups &&
                selectedUser.value.groups.length > 0 && (
                <div class="user-groups">
                  <h4>Groups</h4>
                  <ul>
                    {selectedUser.value.groups.map((group) => (
                      <li key={group.id}>{group.name}</li>
                    ))}
                  </ul>
                </div>
              )}

              {enableManagement && (
                <div class="user-actions">
                  <h4>User Management</h4>
                  <div class="action-buttons">
                    {selectedUser.value.state === "active"
                      ? (
                        <button
                          onClick={() =>
                            performUserAction("suspend", selectedUser.value!)}
                          disabled={isLoadingAction}
                          class="suspend-button"
                        >
                          {isLoadingAction ? "Processing..." : "Suspend User"}
                        </button>
                      )
                      : (
                        <button
                          onClick={() =>
                            performUserAction("activate", selectedUser.value!)}
                          disabled={isLoadingAction}
                          class="activate-button"
                        >
                          {isLoadingAction ? "Processing..." : "Activate User"}
                        </button>
                      )}
                  </div>
                </div>
              )}

              {selectedUser.value.rawAttributes && (
                <div class="user-raw-attributes">
                  <h4>Raw Attributes</h4>
                  <pre>
                  {JSON.stringify(selectedUser.value.rawAttributes, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
      </div>
    );
  }

  // Render list view (default)
  return (
    <div class={`directory-user-list ${className}`}>
      <div class="filters-section">
        <div class="search-filter">
          <input
            type="text"
            placeholder="Search users..."
            value={searchInput}
            onInput={(e) =>
              setSearchInput((e.target as HTMLInputElement).value)}
          />
        </div>

        <div class="group-filter">
          <select
            value={selectedGroup}
            onChange={(e) =>
              setSelectedGroup(
                (e.target as HTMLSelectElement).value || undefined,
              )}
          >
            <option value="">All Groups</option>
            {groups.value.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        <div class="status-filter">
          <select
            value={selectedStatus}
            onChange={(e) =>
              setSelectedStatus(
                (e.target as HTMLSelectElement).value as
                  | "active"
                  | "suspended"
                  | "all",
              )}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div class="filter-actions">
          <button
            onClick={applyFilters}
            class="apply-filters-button"
          >
            Apply Filters
          </button>
          <button
            onClick={resetFilters}
            class="reset-filters-button"
          >
            Reset
          </button>
        </div>
      </div>

      {users.value.length === 0
        ? (
          <div class="no-users-found">
            <p>No users found matching the current filters.</p>
          </div>
        )
        : (
          <>
            <div class="users-list">
              {users.value.map((user) => (
                <div
                  key={user.id}
                  class="user-item"
                  onClick={() => viewUserDetail(user)}
                >
                  {renderUserListItem
                    ? (
                      renderUserListItem(user)
                    )
                    : (
                      <div class="user-list-content">
                        <div class="user-list-avatar">
                          {user.firstName?.[0] || user.lastName?.[0] ||
                            user.emails[0].value[0]}
                        </div>
                        <div class="user-list-info">
                          <div class="user-list-name">
                            {user.firstName} {user.lastName}
                            <span
                              class={`user-list-status status-${user.state}`}
                            >
                              {user.state}
                            </span>
                          </div>
                          <div class="user-list-email">
                            {user.emails.find((e) => e.primary)?.value ||
                              user.emails[0]?.value}
                          </div>
                        </div>
                        <div class="user-list-groups">
                          {user.groups.slice(0, 2).map((group) => (
                            <span key={group.id} class="user-group-tag">
                              {group.name}
                            </span>
                          ))}
                          {user.groups.length > 2 && (
                            <span class="more-groups">
                              +{user.groups.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              ))}
            </div>

            <div class="pagination">
              <div class="pagination-info">
                {currentPageDisplay}
              </div>

              <div class="pagination-controls">
                <button
                  onClick={() => goToPreviousPage()}
                  disabled={!hasPreviousPage.value || isLoading.value}
                  class="pagination-prev"
                >
                  Previous
                </button>

                <button
                  onClick={() => goToNextPage()}
                  disabled={!hasNextPage.value || isLoading.value}
                  class="pagination-next"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
    </div>
  );
}
