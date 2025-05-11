// Directory Sync List island - Interactive component for displaying directory connections
import { useComputed, useSignal } from '@preact/signals';
import type { useEffect } from 'preact/hooks';
import type { FunctionComponent } from 'preact';
import type { Directory } from '../utils/directory-sync.ts';

// Define props for the DirectorySyncList component
interface DirectorySyncListProps {
  initialDirectories: Array<{
    id: string;
    name: string;
    domain: string;
    state: string;
    type: string;
    createdAt: string;
    formattedDate: string;
  }>;
}

// Type for a directory entry
type DirectoryEntry = {
  id: string;
  name: string;
  domain: string;
  state: string;
  type: string;
  createdAt: string;
  formattedDate: string;
};

// DirectorySyncList island component for client-side interactivity
const DirectorySyncList: FunctionComponent<DirectorySyncListProps> = ({ initialDirectories }) => {
  // State using signals
  const directories = useSignal(initialDirectories);
  const isLoading = useSignal(false);
  const error = useSignal<string | null>(null);
  const searchTerm = useSignal('');
  const sortField = useSignal<'name' | 'domain' | 'state' | 'type' | 'createdAt'>('name');
  const sortDirection = useSignal<'asc' | 'desc'>('asc');

  // Computed value for filtered and sorted directories
  const filteredDirectories = useComputed(() => {
    let result = [...directories.value];

    // Apply search filter if set
    if (searchTerm.value) {
      const term = searchTerm.value.toLowerCase();
      result = result.filter((dir) =>
        dir.name.toLowerCase().includes(term) ||
        dir.domain.toLowerCase().includes(term) ||
        dir.type.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      const field = sortField.value;

      // Special handling for date fields
      if (field === 'createdAt') {
        const dateA = new Date(a[field]).getTime();
        const dateB = new Date(b[field]).getTime();
        return sortDirection.value === 'asc' ? dateA - dateB : dateB - dateA;
      }

      // String comparison for other fields
      const valueA = a[field];
      const valueB = b[field];

      if (valueA < valueB) return sortDirection.value === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection.value === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  });

  // Function to toggle sort direction
  const toggleSort = (field: 'name' | 'domain' | 'state' | 'type' | 'createdAt') => {
    if (sortField.value === field) {
      // Toggle direction if same field
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    } else {
      // Set new field and default to ascending
      sortField.value = field;
      sortDirection.value = 'asc';
    }
  };

  // Function to fetch directories from API
  const fetchDirectories = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch('/api/directory-sync/list-directories');

      if (!response.ok) {
        throw new Error(`Failed to fetch directories: ${response.status}`);
      }

      const data = await response.json();
      directories.value = data.directories;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error fetching directories:', err);
    } finally {
      isLoading.value = false;
    }
  };

  // Function to get status badge class based on directory state
  const getStatusBadgeClass = (state: string) => {
    switch (state) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'validating':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Sort indicator component
  const SortIndicator = ({ field }: { field: 'name' | 'domain' | 'state' | 'type' | 'createdAt' }) => {
    if (sortField.value !== field) return null;

    return (
      <span class='ml-1'>
        {sortDirection.value === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div>
      {/* Search and filter controls */}
      <div class='mb-4 flex flex-wrap items-center justify-between'>
        <div class='w-full md:w-auto mb-2 md:mb-0'>
          <div class='relative'>
            <input
              type='text'
              placeholder='Search directories...'
              value={searchTerm.value}
              onInput={(e) => {
                searchTerm.value = (e.target as HTMLInputElement).value;
              }}
              class='pl-10 pr-4 py-2 border rounded-lg w-full md:w-64'
            />
            <svg
              class='absolute left-3 top-2.5 h-5 w-5 text-gray-400'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                stroke-linecap='round'
                stroke-linejoin='round'
                stroke-width='2'
                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
              />
            </svg>
          </div>
        </div>

        <button
          onClick={fetchDirectories}
          disabled={isLoading.value}
          class='bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center transition'
        >
          {isLoading.value
            ? (
              <>
                <svg class='animate-spin -ml-1 mr-2 h-4 w-4 text-white' fill='none' viewBox='0 0 24 24'>
                  <circle
                    class='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    stroke-width='4'
                  >
                  </circle>
                  <path
                    class='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  >
                  </path>
                </svg>
                Refreshing...
              </>
            )
            : (
              <>
                <svg
                  class='-ml-1 mr-2 h-4 w-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    stroke-linecap='round'
                    stroke-linejoin='round'
                    stroke-width='2'
                    d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                  />
                </svg>
                Refresh
              </>
            )}
        </button>
      </div>

      {/* Error message */}
      {error.value && (
        <div class='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
          {error.value}
        </div>
      )}

      {/* Directory table */}
      <div class='overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg'>
        <table class='min-w-full divide-y divide-gray-300'>
          <thead class='bg-gray-50'>
            <tr>
              <th
                scope='col'
                class='py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 cursor-pointer'
                onClick={() => toggleSort('name')}
              >
                Name <SortIndicator field='name' />
              </th>
              <th
                scope='col'
                class='px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer'
                onClick={() => toggleSort('domain')}
              >
                Domain <SortIndicator field='domain' />
              </th>
              <th
                scope='col'
                class='px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer'
                onClick={() => toggleSort('type')}
              >
                Type <SortIndicator field='type' />
              </th>
              <th
                scope='col'
                class='px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer'
                onClick={() => toggleSort('state')}
              >
                Status <SortIndicator field='state' />
              </th>
              <th
                scope='col'
                class='px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer'
                onClick={() => toggleSort('createdAt')}
              >
                Created <SortIndicator field='createdAt' />
              </th>
              <th scope='col' class='relative py-3.5 pl-3 pr-4 sm:pr-6'>
                <span class='sr-only'>Actions</span>
              </th>
            </tr>
          </thead>
          <tbody class='divide-y divide-gray-200 bg-white'>
            {filteredDirectories.value.length === 0
              ? (
                <tr>
                  <td colSpan={6} class='py-4 pl-4 pr-3 text-sm text-center text-gray-500'>
                    {directories.value.length === 0
                      ? 'No directories found. Connect a directory in your WorkOS Dashboard.'
                      : 'No directories match your search criteria.'}
                  </td>
                </tr>
              )
              : (
                filteredDirectories.value.map((directory) => (
                  <tr key={directory.id} class='hover:bg-gray-50 transition-colors'>
                    <td class='whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900'>
                      {directory.name}
                    </td>
                    <td class='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
                      {directory.domain}
                    </td>
                    <td class='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
                      {directory.type}
                    </td>
                    <td class='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
                      <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(directory.state)}`}>
                        {directory.state}
                      </span>
                    </td>
                    <td class='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
                      {directory.formattedDate || new Date(directory.createdAt).toLocaleString()}
                    </td>
                    <td class='relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium'>
                      <a
                        href={`/directory-sync/users?directory=${directory.id}`}
                        class='text-indigo-600 hover:text-indigo-900 mr-4'
                      >
                        Users
                      </a>
                      <a
                        href={`/directory-sync/groups?directory=${directory.id}`}
                        class='text-indigo-600 hover:text-indigo-900'
                      >
                        Groups
                      </a>
                    </td>
                  </tr>
                ))
              )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DirectorySyncList;
