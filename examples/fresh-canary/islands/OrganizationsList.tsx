import { useEffect, useState } from 'preact/hooks';
import type { JSX } from 'preact';

interface Organization {
  id: string;
  name: string;
  allowProfilesOutsideOrganization: boolean;
  domains: {
    id: string;
    domain: string;
    state: string;
  }[];
  createdAt: string;
  updatedAt: string;
  externalId: string | null;
  metadata: Record<string, string>;
}

export default function OrganizationsList() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [perPage] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newOrg, setNewOrg] = useState({
    name: '',
    allowProfilesOutsideOrganization: false,
    externalId: '',
  });

  useEffect(() => {
    fetchOrganizations();
  }, [page, perPage, searchQuery]);

  async function fetchOrganizations() {
    setIsLoading(true);
    try {
      const url = new URL('/api/organizations/list', globalThis.location.origin);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('limit', perPage.toString());

      if (searchQuery) {
        url.searchParams.append('query', searchQuery);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Failed to fetch organizations: ${response.statusText}`);
      }

      const data = await response.json();
      setOrganizations(data.data || []);
      setTotalPages(Math.ceil((data.total || 0) / perPage));
    } catch (err) {
      setError('Failed to load organizations');
      console.error('Error fetching organizations:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateOrganization(e: JSX.TargetedEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const response = await fetch('/api/organizations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newOrg),
      });

      if (!response.ok) {
        throw new Error('Failed to create organization');
      }

      setShowCreateModal(false);
      setNewOrg({
        name: '',
        allowProfilesOutsideOrganization: false,
        externalId: '',
      });
      await fetchOrganizations();
    } catch (err) {
      setError('Failed to create organization');
      console.error('Error creating organization:', err);
    }
  }

  async function handleDeleteOrganization(id: string) {
    if (!confirm('Are you sure you want to delete this organization?')) {
      return;
    }

    try {
      const response = await fetch(`/api/organizations/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete organization');
      }

      await fetchOrganizations();
    } catch (err) {
      setError('Failed to delete organization');
      console.error('Error deleting organization:', err);
    }
  }

  function handleSearchChange(e: JSX.TargetedEvent<HTMLInputElement>) {
    setSearchQuery((e.target as HTMLInputElement).value);
    setPage(1); // Reset to first page on new search
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function handlePageChange(newPage: number) {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  }

  return (
    <div className='container mx-auto p-4'>
      {error && (
        <div className='bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6'>
          {error}
          <button
            onClick={() => setError(null)}
            className='float-right font-bold'
          >
            &times;
          </button>
        </div>
      )}

      <div className='mb-6 flex flex-col md:flex-row items-center justify-between gap-4'>
        <h1 className='text-2xl font-bold'>Organizations</h1>

        <div className='flex flex-col md:flex-row gap-4'>
          <div className='w-full md:w-auto'>
            <input
              type='text'
              placeholder='Search organizations...'
              value={searchQuery}
              onChange={handleSearchChange}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            />
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className='w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          >
            Create Organization
          </button>
        </div>
      </div>

      {/* Organizations Table */}
      <div className='bg-white rounded-lg shadow overflow-hidden'>
        {isLoading
          ? <div className='p-6 text-center text-gray-500'>Loading organizations...</div>
          : organizations.length === 0
          ? (
            <div className='p-6 text-center text-gray-500'>
              No organizations found. Create an organization to get started.
            </div>
          )
          : (
            <div>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Name
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Domains
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Created
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      External ID
                    </th>
                    <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {organizations.map((org) => (
                    <tr key={org.id}>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <a
                          href={`/organizations/${org.id}`}
                          className='text-blue-600 hover:text-blue-900 font-medium'
                        >
                          {org.name}
                        </a>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex flex-wrap gap-1'>
                          {org.domains && org.domains.length > 0
                            ? (
                              org.domains.slice(0, 2).map((domain) => (
                                <span
                                  key={domain.id}
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    domain.state === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {domain.domain}
                                </span>
                              ))
                            )
                            : <span className='text-gray-500 text-sm'>No domains</span>}
                          {org.domains && org.domains.length > 2 && (
                            <span className='text-gray-500 text-sm'>
                              +{org.domains.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {formatDate(org.createdAt)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {org.externalId || '-'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                        <a
                          href={`/organizations/${org.id}`}
                          className='text-indigo-600 hover:text-indigo-900 mr-4'
                        >
                          Edit
                        </a>
                        <button
                          onClick={() => handleDeleteOrganization(org.id)}
                          className='text-red-600 hover:text-red-900'
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className='px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between'>
                <div className='hidden sm:block'>
                  <p className='text-sm text-gray-700'>
                    Showing <span className='font-medium'>{Math.min((page - 1) * perPage + 1, organizations.length)}</span> to{' '}
                    <span className='font-medium'>{Math.min(page * perPage, organizations.length)}</span> of{' '}
                    <span className='font-medium'>{totalPages * perPage}</span> organizations
                  </p>
                </div>
                <div className='flex-1 flex justify-between sm:justify-end'>
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className='relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed mr-3'
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className='relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Create Organization Modal */}
      {showCreateModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-md'>
            <h2 className='text-xl font-bold mb-4'>Create Organization</h2>

            <form onSubmit={handleCreateOrganization}>
              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Name
                </label>
                <input
                  type='text'
                  value={newOrg.name}
                  onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => setNewOrg({ ...newOrg, name: (e.target as HTMLInputElement).value })}
                  required
                  className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                />
              </div>

              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  External ID (optional)
                </label>
                <input
                  type='text'
                  value={newOrg.externalId || ''}
                  onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => setNewOrg({ ...newOrg, externalId: (e.target as HTMLInputElement).value })}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                />
              </div>

              <div className='mb-4'>
                <label className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={newOrg.allowProfilesOutsideOrganization}
                    onChange={(e: JSX.TargetedEvent<HTMLInputElement>) =>
                      setNewOrg({ ...newOrg, allowProfilesOutsideOrganization: (e.target as HTMLInputElement).checked })}
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  />
                  <span className='ml-2 text-sm text-gray-700'>
                    Allow profiles outside organization
                  </span>
                </label>
              </div>

              <div className='flex justify-end gap-2 mt-6'>
                <button
                  type='button'
                  onClick={() => setShowCreateModal(false)}
                  className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
