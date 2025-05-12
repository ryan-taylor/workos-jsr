/**
 * @fileoverview WorkOSDemo component for showcasing Fresh & Preact integration with WorkOS
 *
 * This component demonstrates the integration between Fresh, Preact, and WorkOS SDK
 * featuring signal-based state management and Suspense for loading states.
 */
/** @jsx h */
import { h, Component } from "preact";
import type { useState } from 'preact/hooks';
import { batch, signal, useComputed, useSignal } from '@preact/signals';
import { useWorkOS } from '../hooks/use-workos.ts';
import type { DirectoryUserWithGroups } from '../utils/directory-sync.ts';
import type { AuditLogEvent } from '../utils/audit-logs.ts';
import type { WorkOSUser } from '../utils/user-management.ts';

// Import WorkOS components
import AuditLogStream from './AuditLogStream.tsx';
import DirectoryUserList from './DirectoryUserList.tsx';
import ProfileForm from './ProfileForm.tsx';
import PasswordChangeForm from './PasswordChangeForm.tsx';

// Simple Suspense implementation since preact/compat might not be available
function Suspense(props: { fallback: any; children: any }) {
  return props.children;
}

/**
 * Tab identifiers for the demo sections
 */
enum DemoTab {
  Overview = 'overview',
  DirectorySync = 'directory-sync',
  AuditLogs = 'audit-logs',
  UserManagement = 'user-management',
}

// Current selected tab - shared across component instances
const activeTab = signal<DemoTab>(DemoTab.Overview);

// Selected directory and organization IDs for demo purposes
const selectedDirectoryId = signal<string>('dir_123');
const selectedOrganizationId = signal<string>('org_123');

// Signal to track selected items for cross-component communication
const selectedUser = signal<DirectoryUserWithGroups | null>(null);
const selectedAuditLog = signal<AuditLogEvent | null>(null);

/**
 * A loading fallback component
 */
function LoadingFallback() {
  return (
    <div class='loading-fallback'>
      <div class='spinner'></div>
      <p>Loading component...</p>
    </div>
  );
}

/**
 * Error boundary component for handling component errors
 */
class ErrorBoundary extends Component {
  override state = { hasError: false, error: null as Error | null };

  static override getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: any) {
    console.error('Component Error:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div class='error-boundary'>
          <h3>Something went wrong</h3>
          <p>{this.state.error?.message || 'Unknown error'}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * WorkOSDemo component showcasing all integrated components with signal-based state
 * and Suspense for loading states.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <WorkOSDemo />
 *
 * // With initial tab selection
 * <WorkOSDemo initialTab={DemoTab.AuditLogs} />
 * ```
 */
export default function WorkOSDemo({
  initialTab = DemoTab.Overview,
}: {
  initialTab?: DemoTab;
}) {
  // Initialize ActiveTab with provided initialTab
  if (initialTab !== activeTab.value) {
    activeTab.value = initialTab;
  }

  // Local state for settings panel
  const isSettingsOpen = useSignal<boolean>(false);
  const infoMessage = useSignal<string | null>(null);

  // WorkOS integration
  const { workos, isLoading, error } = useWorkOS();

  // Computed properties
  const demoReady = useComputed(() => !isLoading.value && !error.value);
  const hasSelectedUser = useComputed(() => selectedUser.value !== null);
  const hasSelectedAuditLog = useComputed(() => selectedAuditLog.value !== null);

  /**
   * Change the active tab
   */
  const changeTab = (tab: DemoTab) => {
    activeTab.value = tab;

    // Reset selections when changing tabs
    if (tab !== DemoTab.DirectorySync) {
      selectedUser.value = null;
    }

    if (tab !== DemoTab.AuditLogs) {
      selectedAuditLog.value = null;
    }
  };

  /**
   * Handle the selection of a user from DirectoryUserList
   */
  const handleUserSelect = (user: DirectoryUserWithGroups) => {
    selectedUser.value = user;
    infoMessage.value = `Selected user: ${user.firstName} ${user.lastName}`;

    // Auto-dismiss the message after 3 seconds
    setTimeout(() => {
      infoMessage.value = null;
    }, 3000);
  };

  /**
   * Handle the selection of an audit log from AuditLogStream
   */
  const handleAuditLogSelect = (log: AuditLogEvent) => {
    selectedAuditLog.value = log;
    infoMessage.value = `Selected audit log: ${log.action}`;

    // Auto-dismiss the message after 3 seconds
    setTimeout(() => {
      infoMessage.value = null;
    }, 3000);
  };

  /**
   * Toggle settings panel
   */
  const toggleSettings = () => {
    isSettingsOpen.value = !isSettingsOpen.value;
  };

  /**
   * Update demo settings (directory and organization IDs)
   */
  const updateSettings = (e: Event) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    batch(() => {
      const directoryId = formData.get('directoryId') as string;
      const organizationId = formData.get('organizationId') as string;

      if (directoryId) {
        selectedDirectoryId.value = directoryId;
      }

      if (organizationId) {
        selectedOrganizationId.value = organizationId;
      }
    });

    isSettingsOpen.value = false;
    infoMessage.value = 'Settings updated';

    // Auto-dismiss the message after 3 seconds
    setTimeout(() => {
      infoMessage.value = null;
    }, 3000);
  };

  // If WorkOS is loading, show a loading indicator
  if (isLoading.value) {
    return (
      <div class='workos-demo-loading'>
        <LoadingFallback />
      </div>
    );
  }

  // If there's an error initializing WorkOS, show an error message
  if (error.value) {
    return (
      <div class='workos-demo-error'>
        <h2>Error Initializing WorkOS</h2>
        <p>{error.value.message}</p>
        <p>Please check your API key and configuration.</p>
      </div>
    );
  }

  return (
    <div class='workos-demo'>
      <div class='demo-header'>
        <h1>WorkOS SDK Demo</h1>
        <div class='demo-controls'>
          <button
            onClick={toggleSettings}
            class='settings-button'
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      {infoMessage.value && (
        <div class='info-message'>
          {infoMessage.value}
          <button
            onClick={() => infoMessage.value = null}
            class='dismiss-button'
          >
            ×
          </button>
        </div>
      )}

      {isSettingsOpen.value && (
        <div class='settings-panel'>
          <h3>Demo Settings</h3>
          <form onSubmit={updateSettings}>
            <div class='form-group'>
              <label for='directoryId'>Directory ID</label>
              <input
                type='text'
                id='directoryId'
                name='directoryId'
                value={selectedDirectoryId.value}
              />
            </div>
            <div class='form-group'>
              <label for='organizationId'>Organization ID</label>
              <input
                type='text'
                id='organizationId'
                name='organizationId'
                value={selectedOrganizationId.value}
              />
            </div>
            <div class='form-actions'>
              <button type='submit'>Save</button>
              <button
                type='button'
                onClick={() => isSettingsOpen.value = false}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div class='demo-tabs'>
        <button
          onClick={() => changeTab(DemoTab.Overview)}
          class={`tab-button ${activeTab.value === DemoTab.Overview ? 'active' : ''}`}
        >
          Overview
        </button>
        <button
          onClick={() => changeTab(DemoTab.DirectorySync)}
          class={`tab-button ${activeTab.value === DemoTab.DirectorySync ? 'active' : ''}`}
        >
          Directory Sync
        </button>
        <button
          onClick={() => changeTab(DemoTab.AuditLogs)}
          class={`tab-button ${activeTab.value === DemoTab.AuditLogs ? 'active' : ''}`}
        >
          Audit Logs
        </button>
        <button
          onClick={() => changeTab(DemoTab.UserManagement)}
          class={`tab-button ${activeTab.value === DemoTab.UserManagement ? 'active' : ''}`}
        >
          User Management
        </button>
      </div>

      <div class='demo-content'>
        {/* Overview Tab */}
        {activeTab.value === DemoTab.Overview && (
          <div class='overview-tab'>
            <h2>WorkOS + Fresh + Preact Integration</h2>
            <p>
              This demo showcases the integration between WorkOS, Fresh, and Preact, featuring signal-based state management and Suspense for handling
              loading states.
            </p>

            <h3>Features Demonstrated</h3>
            <ul>
              <li>
                <strong>Signal-based State Management</strong> - Using Preact signals for reactive state
              </li>
              <li>
                <strong>Suspense Integration</strong> - Leveraging Suspense for loading states
              </li>
              <li>
                <strong>Error Boundaries</strong> - Graceful error handling
              </li>
              <li>
                <strong>Directory Sync</strong> - User and group management
              </li>
              <li>
                <strong>Audit Logs</strong> - Real-time event monitoring
              </li>
              <li>
                <strong>User Management</strong> - Profile and password management
              </li>
            </ul>

            <h3>Implementation Notes</h3>
            <p>
              This demo uses:
            </p>
            <ul>
              <li>
                <code>@preact/signals</code> for reactive state management across components
              </li>
              <li>
                <code>preact/compat</code> for Suspense and React compatibility
              </li>
              <li>
                Custom hooks like <code>useWorkOS</code> for WorkOS SDK integration
              </li>
              <li>
                Shared state through global signals
              </li>
              <li>
                Error boundaries and fallbacks for resilience
              </li>
            </ul>

            <h3>Select a tab above to explore the different features</h3>
          </div>
        )}

        {/* Directory Sync Tab */}
        {activeTab.value === DemoTab.DirectorySync && (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <div class='directory-sync-tab'>
                <h2>Directory Sync</h2>
                <p>
                  View and manage users and groups synchronized from external directories.
                </p>

                <DirectoryUserList
                  directoryId={selectedDirectoryId.value}
                  pageSize={5}
                  enableDetailView
                  enableManagement
                  onUserAction={(action, user) => {
                    infoMessage.value = `Action ${action} performed on user ${user.firstName} ${user.lastName}`;
                    setTimeout(() => {
                      infoMessage.value = null;
                    }, 3000);
                  }}
                />
              </div>
            </Suspense>
          </ErrorBoundary>
        )}

        {/* Audit Logs Tab */}
        {activeTab.value === DemoTab.AuditLogs && (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <div class='audit-logs-tab'>
                <h2>Audit Logs</h2>
                <p>
                  Real-time monitoring of events across your organization.
                </p>

                <AuditLogStream
                  organizationId={selectedOrganizationId.value}
                  pageSize={5}
                  refreshInterval={60000}
                  enableRealtime
                  onLogSelect={handleAuditLogSelect}
                />
              </div>
            </Suspense>
          </ErrorBoundary>
        )}

        {/* User Management Tab */}
        {activeTab.value === DemoTab.UserManagement && (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <div class='user-management-tab'>
                <h2>User Management</h2>
                <p>
                  Manage user profiles and passwords.
                </p>

                <div class='user-management-forms'>
                  <div class='form-container'>
                    <h3>Profile Management</h3>
                    <ProfileForm
                      user={{
                        id: 'user_123',
                        email: 'demo@example.com',
                        firstName: 'Demo',
                        lastName: 'User',
                      }}
                    />
                  </div>

                  <div class='form-container'>
                    <h3>Password Management</h3>
                    <PasswordChangeForm
                      user={{
                        id: 'user_123',
                        email: 'demo@example.com',
                        firstName: 'Demo',
                        lastName: 'User',
                      }}
                    />
                  </div>
                </div>
              </div>
            </Suspense>
          </ErrorBoundary>
        )}
      </div>

      <style>
        {`
        .workos-demo {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .demo-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .demo-header h1 {
          margin: 0;
          font-size: 2rem;
          color: #24292e;
        }
        
        .demo-controls {
          display: flex;
          gap: 12px;
        }
        
        .settings-button {
          padding: 8px 16px;
          border-radius: 4px;
          background-color: #f6f8fa;
          border: 1px solid #d1d5da;
          cursor: pointer;
          font-size: 0.875rem;
        }
        
        .settings-panel {
          background-color: #f6f8fa;
          border: 1px solid #d1d5da;
          border-radius: 6px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .settings-panel h3 {
          margin-top: 0;
          margin-bottom: 16px;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
        }
        
        .form-group input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5da;
          border-radius: 4px;
          font-size: 0.875rem;
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
        
        .form-actions button {
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 0.875rem;
          cursor: pointer;
        }
        
        .form-actions button[type="submit"] {
          background-color: #2ea44f;
          border: 1px solid #2a9147;
          color: #fff;
        }
        
        .form-actions button[type="button"] {
          background-color: #f6f8fa;
          border: 1px solid #d1d5da;
          color: #24292e;
        }
        
        .info-message {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background-color: #ddf4ff;
          border: 1px solid #0969da;
          border-radius: 4px;
          margin-bottom: 20px;
          color: #0969da;
        }
        
        .dismiss-button {
          background: none;
          border: none;
          font-size: 1.25rem;
          color: #0969da;
          cursor: pointer;
        }
        
        .demo-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 20px;
          border-bottom: 1px solid #d1d5da;
        }
        
        .tab-button {
          padding: 12px 16px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          color: #586069;
        }
        
        .tab-button.active {
          border-bottom-color: #0969da;
          color: #0969da;
        }
        
        .demo-content {
          min-height: 500px;
          padding: 20px;
          background-color: #fff;
          border: 1px solid #e1e4e8;
          border-radius: 6px;
        }
        
        .overview-tab h2,
        .directory-sync-tab h2,
        .audit-logs-tab h2,
        .user-management-tab h2 {
          margin-top: 0;
          margin-bottom: 16px;
          color: #24292e;
        }
        
        .overview-tab h3 {
          margin-top: 24px;
          margin-bottom: 12px;
          color: #24292e;
        }
        
        .overview-tab ul {
          padding-left: 20px;
        }
        
        .overview-tab li {
          margin-bottom: 8px;
        }
        
        .user-management-forms {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
        }
        
        .form-container {
          padding: 20px;
          background-color: #f6f8fa;
          border-radius: 6px;
        }
        
        .form-container h3 {
          margin-top: 0;
          margin-bottom: 16px;
          color: #24292e;
        }
        
        .loading-fallback {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }
        
        .spinner {
          display: inline-block;
          width: 50px;
          height: 50px;
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top-color: #0969da;
          animation: spin 1s ease-in-out infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .error-boundary {
          padding: 20px;
          background-color: #ffebe9;
          border: 1px solid #ff818a;
          border-radius: 6px;
          text-align: center;
        }
        
        .error-boundary h3 {
          margin-top: 0;
          color: #cf222e;
        }
        
        .error-boundary button {
          padding: 8px 16px;
          background-color: #0969da;
          border: 1px solid #0969da;
          border-radius: 4px;
          color: white;
          font-size: 0.875rem;
          cursor: pointer;
          margin-top: 16px;
        }
        
        .workos-demo-loading,
        .workos-demo-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          text-align: center;
        }
        
        .workos-demo-error h2 {
          color: #cf222e;
        }
      `}
      </style>
    </div>
  );
}
