import { useEffect, useState } from "preact/hooks";
import { JSX } from "preact";

interface Organization {
  id: string;
  name: string;
}

interface Domain {
  id: string;
  domain: string;
  organization_id: string;
  state: "unverified" | "verified";
}

export default function OrganizationDomainsManager() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [newDomain, setNewDomain] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    fetchDomains();
  }, [selectedOrgId]);

  async function fetchOrganizations() {
    try {
      const response = await fetch("/api/organization-domains/list");
      const data = await response.json();
      setOrganizations(data.data || []);
      
      if (data.data && data.data.length > 0) {
        setSelectedOrgId(data.data[0].id);
      }
    } catch (err) {
      setError("Failed to load organizations");
      console.error("Error fetching organizations:", err);
    }
  }

  async function fetchDomains() {
    setIsLoading(true);
    try {
      const url = selectedOrgId 
        ? `/api/organization-domains/list?organization_id=${selectedOrgId}` 
        : "/api/organization-domains/list";
      
      const response = await fetch(url);
      const data = await response.json();
      setDomains(data.data || []);
    } catch (err) {
      setError("Failed to load domains");
      console.error("Error fetching domains:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddDomain() {
    if (!newDomain || !selectedOrgId) return;
    
    try {
      const response = await fetch("/api/organization-domains/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain: newDomain,
          organizationId: selectedOrgId,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to add domain");
      }
      
      await fetchDomains();
      setNewDomain("");
    } catch (err) {
      setError("Failed to add domain");
      console.error("Error adding domain:", err);
    }
  }

  async function handleVerifyDomain(domainId: string) {
    try {
      const response = await fetch("/api/organization-domains/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domainId }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to verify domain");
      }
      
      await fetchDomains();
    } catch (err) {
      setError("Failed to verify domain");
      console.error("Error verifying domain:", err);
    }
  }

  async function handleDeleteDomain(domainId: string) {
    try {
      const response = await fetch(`/api/organization-domains/delete?id=${domainId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete domain");
      }
      
      await fetchDomains();
    } catch (err) {
      setError("Failed to delete domain");
      console.error("Error deleting domain:", err);
    }
  }

  function handleOrganizationChange(e: JSX.TargetedEvent<HTMLSelectElement>) {
    const value = (e.target as HTMLSelectElement).value;
    setSelectedOrgId(value);
  }

  function handleSearchChange(e: JSX.TargetedEvent<HTMLInputElement>) {
    setSearchQuery((e.target as HTMLInputElement).value);
  }

  const filteredDomains = domains.filter(domain => 
    domain.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right font-bold"
          >
            &times;
          </button>
        </div>
      )}

      <div className="mb-6 flex flex-col md:flex-row items-center gap-4">
        <div className="w-full md:w-1/3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Organization
          </label>
          <select
            value={selectedOrgId}
            onChange={handleOrganizationChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Organizations</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-1/3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Domains
          </label>
          <input
            type="text"
            placeholder="Search domains..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Add Domain</h2>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-2/3">
            <input
              type="text"
              placeholder="example.com"
              value={newDomain}
              onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => setNewDomain((e.target as HTMLInputElement).value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <button
            onClick={handleAddDomain}
            className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!newDomain || !selectedOrgId}
          >
            Add Domain
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-lg font-medium text-gray-900 p-6 border-b">
          Organization Domains
        </h2>
        
        {isLoading ? (
          <div className="p-6 text-center text-gray-500">Loading domains...</div>
        ) : filteredDomains.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No domains found. Add a domain to get started.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDomains.map((domain) => (
                <tr key={domain.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {domain.domain}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        domain.state === "verified"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {domain.state === "verified" ? "Verified" : "Unverified"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {domain.state !== "verified" && (
                      <button
                        onClick={() => handleVerifyDomain(domain.id)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Verify
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteDomain(domain.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}