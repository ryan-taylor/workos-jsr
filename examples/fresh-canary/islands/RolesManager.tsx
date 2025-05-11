// RolesManager island component - Manages roles and their permissions
import { useEffect, useState } from 'preact/hooks';
import type { JSX } from 'preact';

// Role interfaces
interface Role {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  permissions: string[];
  type: 'EnvironmentRole' | 'OrganizationRole';
  createdAt: string;
  updatedAt: string;
}

interface Permission {
  key: string;
  description: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

// Form state interfaces
interface RoleFormData {
  name: string;
  slug: string;
  description: string;
  permissions: string[];
}

interface RoleAssignmentData {
  userId: string;
  roleId: string;
}

// UI state
interface UIState {
  activeTab: 'roles' | 'assignment' | 'templates';
  searchTerm: string;
  editingRole: Role | null;
  viewingRoleId: string | null;
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isAssignModalOpen: boolean;
  selectedPermissions: string[];
  isLoading: boolean;
  errorMessage: string | null;
  successMessage: string | null;
}

export default function RolesManager() {
  // Data state
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<RoleFormData[]>([]);

  // Form state
  const [roleForm, setRoleForm] = useState<RoleFormData>({
    name: '',
    slug: '',
    description: '',
    permissions: [],
  });

  const [assignmentForm, setAssignmentForm] = useState<RoleAssignmentData>({
    userId: '',
    roleId: '',
  });

  // UI state
  const [uiState, setUIState] = useState<UIState>({
    activeTab: 'roles',
    searchTerm: '',
    editingRole: null,
    viewingRoleId: null,
    isCreateModalOpen: false,
    isEditModalOpen: false,
    isDeleteModalOpen: false,
    isAssignModalOpen: false,
    selectedPermissions: [],
    isLoading: false,
    errorMessage: null,
    successMessage: null,
  });

  // Fetch roles on component mount
  useEffect(() => {
    fetchRoles();
    fetchPermissions();
    fetchUsers();
    fetchTemplates();
  }, []);

  // API functions
  const fetchRoles = async () => {
    setUIState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await fetch('/api/roles/list');
      if (!response.ok) {
        throw new Error(`Failed to fetch roles: ${response.status}`);
      }
      const data = await response.json();
      setRoles(data.data || []);
    } catch (error) {
      setUIState((prev) => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to fetch roles',
      }));
    } finally {
      setUIState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const fetchPermissions = async () => {
    try {
      // In a real app, this would be an API call
      // For demo purposes, using hard-coded sample data
      const samplePermissions = [
        { key: 'read:all', description: 'Read access to all resources' },
        { key: 'write:all', description: 'Write access to all resources' },
        { key: 'delete:all', description: 'Delete access to all resources' },
        { key: 'read:own', description: 'Read access to own resources' },
        { key: 'write:own', description: 'Write access to own resources' },
        { key: 'delete:own', description: 'Delete access to own resources' },
        { key: 'manage:users', description: 'Manage user accounts' },
        { key: 'manage:roles', description: 'Manage roles and permissions' },
        { key: 'manage:billing', description: 'Manage billing and subscriptions' },
        { key: 'manage:settings', description: 'Manage application settings' },
      ];
      setPermissions(samplePermissions);
    } catch (error) {
      setUIState((prev) => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to fetch permissions',
      }));
    }
  };

  const fetchUsers = async () => {
    try {
      // In a real app, this would be an API call
      // For demo purposes, using hard-coded sample data
      const sampleUsers = [
        { id: 'user_01', name: 'Alice Smith', email: 'alice@example.com' },
        { id: 'user_02', name: 'Bob Johnson', email: 'bob@example.com' },
        { id: 'user_03', name: 'Carol Williams', email: 'carol@example.com' },
        { id: 'user_04', name: 'Dave Brown', email: 'dave@example.com' },
        { id: 'user_05', name: 'Eve Davis', email: 'eve@example.com' },
      ];
      setUsers(sampleUsers);
    } catch (error) {
      setUIState((prev) => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to fetch users',
      }));
    }
  };

  const fetchTemplates = async () => {
    try {
      // In a real app, this would be an API call
      // For demo purposes, using hard-coded sample data
      const sampleTemplates = [
        {
          name: 'Admin',
          slug: 'admin',
          description: 'Full access to all resources',
          permissions: ['read:all', 'write:all', 'delete:all', 'manage:users', 'manage:roles', 'manage:billing', 'manage:settings'],
        },
        {
          name: 'Manager',
          slug: 'manager',
          description: 'Manage team members and resources',
          permissions: ['read:all', 'write:all', 'delete:all', 'manage:users'],
        },
        {
          name: 'Member',
          slug: 'member',
          description: 'Standard user access',
          permissions: ['read:all', 'write:own', 'delete:own'],
        },
        {
          name: 'Viewer',
          slug: 'viewer',
          description: 'Read-only access',
          permissions: ['read:all'],
        },
      ];
      setTemplates(sampleTemplates);
    } catch (error) {
      setUIState((prev) => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to fetch templates',
      }));
    }
  };

  const createRole = async () => {
    setUIState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await fetch('/api/roles/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create role: ${response.status}`);
      }

      const newRole = await response.json();
      setRoles([...roles, newRole]);
      setUIState((prev) => ({
        ...prev,
        isCreateModalOpen: false,
        successMessage: `Role "${roleForm.name}" created successfully`,
      }));
      resetRoleForm();
      await fetchRoles();
    } catch (error) {
      setUIState((prev) => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to create role',
      }));
    } finally {
      setUIState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const updateRole = async () => {
    if (!uiState.editingRole) return;

    setUIState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await fetch(`/api/roles/update?id=${uiState.editingRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update role: ${response.status}`);
      }

      const updatedRole = await response.json();
      setRoles(roles.map((role) => role.id === updatedRole.id ? updatedRole : role));
      setUIState((prev) => ({
        ...prev,
        isEditModalOpen: false,
        successMessage: `Role "${roleForm.name}" updated successfully`,
      }));
      resetRoleForm();
      await fetchRoles();
    } catch (error) {
      setUIState((prev) => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to update role',
      }));
    } finally {
      setUIState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const deleteRole = async (roleId: string) => {
    setUIState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await fetch(`/api/roles/delete?id=${roleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete role: ${response.status}`);
      }

      setRoles(roles.filter((role) => role.id !== roleId));
      setUIState((prev) => ({
        ...prev,
        isDeleteModalOpen: false,
        successMessage: 'Role deleted successfully',
      }));
      await fetchRoles();
    } catch (error) {
      setUIState((prev) => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to delete role',
      }));
    } finally {
      setUIState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const assignRole = async () => {
    setUIState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await fetch('/api/roles/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignmentForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to assign role: ${response.status}`);
      }

      const result = await response.json();
      setUIState((prev) => ({
        ...prev,
        isAssignModalOpen: false,
        successMessage: 'Role assigned successfully',
      }));
      resetAssignmentForm();
    } catch (error) {
      setUIState((prev) => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to assign role',
      }));
    } finally {
      setUIState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const unassignRole = async (userId: string, roleId: string) => {
    setUIState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await fetch('/api/roles/unassign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, roleId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to unassign role: ${response.status}`);
      }

      const result = await response.json();
      setUIState((prev) => ({
        ...prev,
        successMessage: 'Role unassigned successfully',
      }));
    } catch (error) {
      setUIState((prev) => ({
        ...prev,
        errorMessage: error instanceof Error ? error.message : 'Failed to unassign role',
      }));
    } finally {
      setUIState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // UI helper functions
  const resetRoleForm = () => {
    setRoleForm({
      name: '',
      slug: '',
      description: '',
      permissions: [],
    });
  };

  const resetAssignmentForm = () => {
    setAssignmentForm({
      userId: '',
      roleId: '',
    });
  };

  const openCreateModal = () => {
    resetRoleForm();
    setUIState((prev) => ({ ...prev, isCreateModalOpen: true }));
  };

  const openEditModal = (role: Role) => {
    setRoleForm({
      name: role.name,
      slug: role.slug,
      description: role.description || '',
      permissions: role.permissions,
    });
    setUIState((prev) => ({ ...prev, isEditModalOpen: true, editingRole: role }));
  };

  const openDeleteModal = (role: Role) => {
    setUIState((prev) => ({ ...prev, isDeleteModalOpen: true, editingRole: role }));
  };

  const openAssignModal = () => {
    resetAssignmentForm();
    setUIState((prev) => ({ ...prev, isAssignModalOpen: true }));
  };

  const closeModals = () => {
    setUIState((prev) => ({
      ...prev,
      isCreateModalOpen: false,
      isEditModalOpen: false,
      isDeleteModalOpen: false,
      isAssignModalOpen: false,
      editingRole: null,
    }));
  };

  const handleRoleFormChange = (e: JSX.TargetedEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.currentTarget;
    setRoleForm({
      ...roleForm,
      [name]: value,
    });
  };

  const handlePermissionToggle = (permissionKey: string) => {
    setRoleForm((prev) => {
      if (prev.permissions.includes(permissionKey)) {
        return {
          ...prev,
          permissions: prev.permissions.filter((p) => p !== permissionKey),
        };
      } else {
        return {
          ...prev,
          permissions: [...prev.permissions, permissionKey],
        };
      }
    });
  };

  const handleAssignmentFormChange = (e: JSX.TargetedEvent<HTMLSelectElement>) => {
    const { name, value } = e.currentTarget;
    setAssignmentForm({
      ...assignmentForm,
      [name]: value,
    });
  };

  const generateSlug = () => {
    const slug = roleForm.name.toLowerCase().replace(/\s+/g, '-');
    setRoleForm((prev) => ({ ...prev, slug }));
  };

  const applyTemplate = (template: RoleFormData) => {
    setRoleForm(template);
  };

  const dismissMessage = () => {
    setUIState((prev) => ({ ...prev, errorMessage: null, successMessage: null }));
  };

  const toggleViewRole = (roleId: string | null) => {
    setUIState((prev) => ({
      ...prev,
      viewingRoleId: prev.viewingRoleId === roleId ? null : roleId,
    }));
  };

  // Filter roles based on search term
  const filteredRoles = uiState.searchTerm
    ? roles.filter((role) =>
      role.name.toLowerCase().includes(uiState.searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(uiState.searchTerm.toLowerCase()) ||
      role.slug.toLowerCase().includes(uiState.searchTerm.toLowerCase())
    )
    : roles;

  // Render component
  return (
    <div class='p-4'>
      {/* Tabs Navigation */}
      <div class='border-b border-gray-200 mb-4'>
        <nav class='-mb-px flex space-x-8'>
          <button
            onClick={() => setUIState((prev) => ({ ...prev, activeTab: 'roles' }))}
            class={`py-2 px-1 border-b-2 font-medium text-sm ${
              uiState.activeTab === 'roles'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Roles
          </button>
          <button
            onClick={() => setUIState((prev) => ({ ...prev, activeTab: 'assignment' }))}
            class={`py-2 px-1 border-b-2 font-medium text-sm ${
              uiState.activeTab === 'assignment'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Role Assignment
          </button>
          <button
            onClick={() => setUIState((prev) => ({ ...prev, activeTab: 'templates' }))}
            class={`py-2 px-1 border-b-2 font-medium text-sm ${
              uiState.activeTab === 'templates'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Templates
          </button>
        </nav>
      </div>

      {/* Status Messages */}
      {uiState.errorMessage && (
        <div class='mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative' role='alert'>
          <span class='block sm:inline'>{uiState.errorMessage}</span>
          <button
            class='absolute top-0 bottom-0 right-0 px-4 py-3'
            onClick={dismissMessage}
          >
            <span class='sr-only'>Dismiss</span>
            <span>&times;</span>
          </button>
        </div>
      )}

      {uiState.successMessage && (
        <div class='mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded relative' role='alert'>
          <span class='block sm:inline'>{uiState.successMessage}</span>
          <button
            class='absolute top-0 bottom-0 right-0 px-4 py-3'
            onClick={dismissMessage}
          >
            <span class='sr-only'>Dismiss</span>
            <span>&times;</span>
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {uiState.isLoading && (
        <div class='flex justify-center items-center py-4'>
          <div class='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500'></div>
        </div>
      )}

      {/* Roles Tab Content */}
      {uiState.activeTab === 'roles' && (
        <div>
          <div class='flex justify-between mb-4'>
            <div class='w-1/2'>
              <input
                type='text'
                placeholder='Search roles...'
                class='px-4 py-2 border rounded w-full'
                value={uiState.searchTerm}
                onChange={(e) => setUIState((prev) => ({ ...prev, searchTerm: (e.target as HTMLInputElement).value }))}
              />
            </div>
            <button
              onClick={openCreateModal}
              class='bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700'
            >
              Create Role
            </button>
          </div>

          <div class='overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg'>
            <table class='min-w-full divide-y divide-gray-300'>
              <thead class='bg-gray-50'>
                <tr>
                  <th scope='col' class='py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900'>Name</th>
                  <th scope='col' class='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'>Slug</th>
                  <th scope='col' class='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'>Description</th>
                  <th scope='col' class='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'>Permissions</th>
                  <th scope='col' class='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'>Actions</th>
                </tr>
              </thead>
              <tbody class='divide-y divide-gray-200 bg-white'>
                {filteredRoles.length === 0
                  ? (
                    <tr>
                      <td colSpan={5} class='py-4 pl-4 pr-3 text-sm text-center text-gray-500'>
                        No roles found.
                      </td>
                    </tr>
                  )
                  : (
                    filteredRoles.map((role) => (
                      <tr key={role.id}>
                        <td class='whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900'>
                          {role.name}
                        </td>
                        <td class='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>{role.slug}</td>
                        <td class='px-3 py-4 text-sm text-gray-500'>{role.description || '-'}</td>
                        <td class='px-3 py-4 text-sm text-gray-500'>
                          <div class='flex flex-wrap gap-1'>
                            {role.permissions.slice(0, 3).map((permission) => (
                              <span
                                key={permission}
                                class='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800'
                              >
                                {permission}
                              </span>
                            ))}
                            {role.permissions.length > 3 && (
                              <button
                                onClick={() => toggleViewRole(role.id)}
                                class='text-xs text-indigo-600 hover:text-indigo-900'
                              >
                                +{role.permissions.length - 3} more
                              </button>
                            )}
                          </div>

                          {/* Expanded permissions view */}
                          {uiState.viewingRoleId === role.id && (
                            <div class='mt-2 p-2 bg-gray-50 rounded'>
                              <h4 class='text-xs font-semibold mb-1'>All Permissions:</h4>
                              <div class='flex flex-wrap gap-1'>
                                {role.permissions.map((permission) => (
                                  <span
                                    key={permission}
                                    class='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800'
                                  >
                                    {permission}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>
                        <td class='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
                          <div class='flex space-x-2'>
                            <button
                              onClick={() => openEditModal(role)}
                              class='text-indigo-600 hover:text-indigo-900'
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => openDeleteModal(role)}
                              class='text-red-600 hover:text-red-900'
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Assignment Tab Content */}
      {uiState.activeTab === 'assignment' && (
        <div>
          <div class='flex justify-between mb-4'>
            <h2 class='text-lg font-semibold'>Role Assignments</h2>
            <button
              onClick={openAssignModal}
              class='bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700'
            >
              Assign Role
            </button>
          </div>

          <div class='mb-6 bg-white p-4 rounded shadow'>
            <h3 class='text-md font-medium mb-2'>Current Role Assignments</h3>
            <p class='text-sm text-gray-600 mb-4'>
              This table shows a simulated view of user role assignments. In a real application, this would display actual role assignments from the
              WorkOS API.
            </p>

            <div class='overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg'>
              <table class='min-w-full divide-y divide-gray-300'>
                <thead class='bg-gray-50'>
                  <tr>
                    <th scope='col' class='py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900'>User</th>
                    <th scope='col' class='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'>Email</th>
                    <th scope='col' class='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'>Assigned Roles</th>
                    <th scope='col' class='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'>Actions</th>
                  </tr>
                </thead>
                <tbody class='divide-y divide-gray-200 bg-white'>
                  {/* Sample assignments - In a real app this would be fetched from the API */}
                  <tr>
                    <td class='whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900'>Alice Smith</td>
                    <td class='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>alice@example.com</td>
                    <td class='px-3 py-4 text-sm text-gray-500'>
                      <div class='flex flex-wrap gap-1'>
                        <span class='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800'>
                          Admin
                        </span>
                      </div>
                    </td>
                    <td class='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
                      <button
                        onClick={() => unassignRole('user_01', 'role_01HXYZ123456789')}
                        class='text-red-600 hover:text-red-900'
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td class='whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900'>Bob Johnson</td>
                    <td class='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>bob@example.com</td>
                    <td class='px-3 py-4 text-sm text-gray-500'>
                      <div class='flex flex-wrap gap-1'>
                        <span class='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800'>
                          Member
                        </span>
                      </div>
                    </td>
                    <td class='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
                      <button
                        onClick={() => unassignRole('user_02', 'role_02HXYZ123456789')}
                        class='text-red-600 hover:text-red-900'
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td class='whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900'>Carol Williams</td>
                    <td class='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>carol@example.com</td>
                    <td class='px-3 py-4 text-sm text-gray-500'>
                      <div class='flex flex-wrap gap-1'>
                        <span class='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800'>
                          Viewer
                        </span>
                      </div>
                    </td>
                    <td class='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
                      <button
                        onClick={() => unassignRole('user_03', 'role_03HXYZ123456789')}
                        class='text-red-600 hover:text-red-900'
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab Content */}
      {uiState.activeTab === 'templates' && (
        <div>
          <div class='mb-4'>
            <h2 class='text-lg font-semibold mb-2'>Role Templates</h2>
            <p class='text-sm text-gray-600'>
              Use these pre-defined role templates as a starting point for creating new roles in your application.
            </p>
          </div>

          <div class='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {templates.map((template, index) => (
              <div key={index} class='border rounded p-4 bg-white shadow-sm'>
                <h3 class='font-medium text-lg mb-1'>{template.name}</h3>
                <p class='text-sm text-gray-500 mb-2'>{template.slug}</p>
                <p class='text-sm mb-3'>{template.description}</p>

                <div class='mb-3'>
                  <h4 class='text-sm font-medium mb-1'>Permissions:</h4>
                  <div class='flex flex-wrap gap-1'>
                    {template.permissions.map((permission) => (
                      <span
                        key={permission}
                        class='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800'
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>

                <div class='mt-2'>
                  <button
                    onClick={() => {
                      applyTemplate(template);
                      setUIState((prev) => ({ ...prev, activeTab: 'roles', isCreateModalOpen: true }));
                    }}
                    class='text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded hover:bg-indigo-100'
                  >
                    Use This Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Role Modal */}
      {uiState.isCreateModalOpen && (
        <div class='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50'>
          <div class='bg-white rounded-lg max-w-lg w-full overflow-hidden shadow-xl'>
            <div class='px-6 py-4 bg-gray-100 border-b'>
              <h3 class='text-lg font-medium text-gray-900'>Create New Role</h3>
            </div>

            <div class='p-6'>
              <div class='mb-4'>
                <label class='block text-sm font-medium text-gray-700 mb-1'>Name</label>
                <input
                  type='text'
                  name='name'
                  class='w-full px-3 py-2 border rounded'
                  value={roleForm.name}
                  onChange={handleRoleFormChange}
                  onBlur={generateSlug}
                />
              </div>

              <div class='mb-4'>
                <label class='block text-sm font-medium text-gray-700 mb-1'>Slug</label>
                <input
                  type='text'
                  name='slug'
                  class='w-full px-3 py-2 border rounded'
                  value={roleForm.slug}
                  onChange={handleRoleFormChange}
                />
              </div>

              <div class='mb-4'>
                <label class='block text-sm font-medium text-gray-700 mb-1'>Description</label>
                <textarea
                  name='description'
                  class='w-full px-3 py-2 border rounded'
                  value={roleForm.description}
                  onChange={handleRoleFormChange}
                />
              </div>

              <div class='mb-4'>
                <label class='block text-sm font-medium text-gray-700 mb-1'>Permissions</label>
                <div class='mt-2 space-y-2 max-h-48 overflow-y-auto border rounded p-2'>
                  {permissions.map((permission) => (
                    <div key={permission.key} class='flex items-start'>
                      <div class='flex items-center h-5'>
                        <input
                          id={`permission-${permission.key}`}
                          type='checkbox'
                          class='h-4 w-4 text-indigo-600 border-gray-300 rounded'
                          checked={roleForm.permissions.includes(permission.key)}
                          onChange={() => handlePermissionToggle(permission.key)}
                        />
                      </div>
                      <div class='ml-3 text-sm'>
                        <label for={`permission-${permission.key}`} class='font-medium text-gray-700'>
                          {permission.key}
                        </label>
                        <p class='text-gray-500'>{permission.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div class='px-6 py-4 bg-gray-50 flex justify-end space-x-2'>
              <button
                onClick={closeModals}
                class='px-4 py-2 border rounded text-sm font-medium text-gray-700 hover:bg-gray-100'
              >
                Cancel
              </button>
              <button
                onClick={createRole}
                class='px-4 py-2 bg-indigo-600 rounded text-sm font-medium text-white hover:bg-indigo-700'
                disabled={!roleForm.name || roleForm.permissions.length === 0}
              >
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {uiState.isEditModalOpen && (
        <div class='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50'>
          <div class='bg-white rounded-lg max-w-lg w-full overflow-hidden shadow-xl'>
            <div class='px-6 py-4 bg-gray-100 border-b'>
              <h3 class='text-lg font-medium text-gray-900'>Edit Role</h3>
            </div>

            <div class='p-6'>
              <div class='mb-4'>
                <label class='block text-sm font-medium text-gray-700 mb-1'>Name</label>
                <input
                  type='text'
                  name='name'
                  class='w-full px-3 py-2 border rounded'
                  value={roleForm.name}
                  onChange={handleRoleFormChange}
                />
              </div>

              <div class='mb-4'>
                <label class='block text-sm font-medium text-gray-700 mb-1'>Slug</label>
                <input
                  type='text'
                  name='slug'
                  class='w-full px-3 py-2 border rounded'
                  value={roleForm.slug}
                  onChange={handleRoleFormChange}
                />
              </div>

              <div class='mb-4'>
                <label class='block text-sm font-medium text-gray-700 mb-1'>Description</label>
                <textarea
                  name='description'
                  class='w-full px-3 py-2 border rounded'
                  value={roleForm.description}
                  onChange={handleRoleFormChange}
                />
              </div>

              <div class='mb-4'>
                <label class='block text-sm font-medium text-gray-700 mb-1'>Permissions</label>
                <div class='mt-2 space-y-2 max-h-48 overflow-y-auto border rounded p-2'>
                  {permissions.map((permission) => (
                    <div key={permission.key} class='flex items-start'>
                      <div class='flex items-center h-5'>
                        <input
                          id={`permission-edit-${permission.key}`}
                          type='checkbox'
                          class='h-4 w-4 text-indigo-600 border-gray-300 rounded'
                          checked={roleForm.permissions.includes(permission.key)}
                          onChange={() => handlePermissionToggle(permission.key)}
                        />
                      </div>
                      <div class='ml-3 text-sm'>
                        <label for={`permission-edit-${permission.key}`} class='font-medium text-gray-700'>
                          {permission.key}
                        </label>
                        <p class='text-gray-500'>{permission.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div class='px-6 py-4 bg-gray-50 flex justify-end space-x-2'>
              <button
                onClick={closeModals}
                class='px-4 py-2 border rounded text-sm font-medium text-gray-700 hover:bg-gray-100'
              >
                Cancel
              </button>
              <button
                onClick={updateRole}
                class='px-4 py-2 bg-indigo-600 rounded text-sm font-medium text-white hover:bg-indigo-700'
                disabled={!roleForm.name || roleForm.permissions.length === 0}
              >
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Role Confirmation Modal */}
      {uiState.isDeleteModalOpen && uiState.editingRole && (
        <div class='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50'>
          <div class='bg-white rounded-lg max-w-md w-full overflow-hidden shadow-xl'>
            <div class='px-6 py-4 bg-gray-100 border-b'>
              <h3 class='text-lg font-medium text-gray-900'>Confirm Deletion</h3>
            </div>

            <div class='p-6'>
              <p class='mb-4 text-gray-700'>
                Are you sure you want to delete the role "{uiState.editingRole.name}"? This action cannot be undone.
              </p>
            </div>

            <div class='px-6 py-4 bg-gray-50 flex justify-end space-x-2'>
              <button
                onClick={closeModals}
                class='px-4 py-2 border rounded text-sm font-medium text-gray-700 hover:bg-gray-100'
              >
                Cancel
              </button>
              <button
                onClick={() => deleteRole(uiState.editingRole!.id)}
                class='px-4 py-2 bg-red-600 rounded text-sm font-medium text-white hover:bg-red-700'
              >
                Delete Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {uiState.isAssignModalOpen && (
        <div class='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50'>
          <div class='bg-white rounded-lg max-w-md w-full overflow-hidden shadow-xl'>
            <div class='px-6 py-4 bg-gray-100 border-b'>
              <h3 class='text-lg font-medium text-gray-900'>Assign Role to User</h3>
            </div>

            <div class='p-6'>
              <div class='mb-4'>
                <label class='block text-sm font-medium text-gray-700 mb-1'>User</label>
                <select
                  name='userId'
                  class='w-full px-3 py-2 border rounded'
                  value={assignmentForm.userId}
                  onChange={handleAssignmentFormChange}
                >
                  <option value=''>Select a user</option>
                  {users.map((user) => <option key={user.id} value={user.id}>{user.name} ({user.email})</option>)}
                </select>
              </div>

              <div class='mb-4'>
                <label class='block text-sm font-medium text-gray-700 mb-1'>Role</label>
                <select
                  name='roleId'
                  class='w-full px-3 py-2 border rounded'
                  value={assignmentForm.roleId}
                  onChange={handleAssignmentFormChange}
                >
                  <option value=''>Select a role</option>
                  {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                </select>
              </div>
            </div>

            <div class='px-6 py-4 bg-gray-50 flex justify-end space-x-2'>
              <button
                onClick={closeModals}
                class='px-4 py-2 border rounded text-sm font-medium text-gray-700 hover:bg-gray-100'
              >
                Cancel
              </button>
              <button
                onClick={assignRole}
                class='px-4 py-2 bg-indigo-600 rounded text-sm font-medium text-white hover:bg-indigo-700'
                disabled={!assignmentForm.userId || !assignmentForm.roleId}
              >
                Assign Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
