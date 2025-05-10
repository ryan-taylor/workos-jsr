import { useEffect, useState } from "preact/hooks";
import { JSX } from "preact";

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

interface Member {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  joinedAt: string;
}

// Simulated members data as this is for UI demonstration
const MOCK_MEMBERS: Member[] = [
  {
    id: "usr_01ABCD",
    email: "john.doe@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "Admin",
    joinedAt: "2023-01-15T12:00:00Z"
  },
  {
    id: "usr_02EFGH",
    email: "jane.smith@example.com",
    firstName: "Jane",
    lastName: "Smith",
    role: "Member",
    joinedAt: "2023-02-20T14:30:00Z"
  }
];

export default function OrganizationDetail({ id }: { id: string }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("settings");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<Partial<Organization>>({});
  const [newDomain, setNewDomain] = useState<string>("");
  const [newMetadataKey, setNewMetadataKey] = useState<string>("");
  const [newMetadataValue, setNewMetadataValue] = useState<string>("");
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);
  const [members] = useState<Member[]>(MOCK_MEMBERS);

  useEffect(() => {
    if (id) {
      fetchOrganization();
    }
  }, [id]);

  async function fetchOrganization() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/organizations/get?id=${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch organization: ${response.statusText}`);
      }
      
      const data = await response.json();
      setOrganization(data);
      setEditForm(data);
    } catch (err) {
      setError("Failed to load organization details");
      console.error("Error fetching organization:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateOrganization(e: JSX.TargetedEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!organization) return;
    
    try {
      const response = await fetch("/api/organizations/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: organization.id,
          ...editForm
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update organization");
      }
      
      const updatedOrg = await response.json();
      setOrganization(updatedOrg);
      setIsEditing(false);
    } catch (err) {
      setError("Failed to update organization");
      console.error("Error updating organization:", err);
    }
  }

  async function handleAddDomain(e: JSX.TargetedEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!organization || !newDomain) return;
    
    try {
      const response = await fetch("/api/organization-domains/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain: newDomain,
          organizationId: organization.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to add domain");
      }
      
      await fetchOrganization();
      setNewDomain("");
    } catch (err) {
      setError("Failed to add domain");
      console.error("Error adding domain:", err);
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
      
      await fetchOrganization();
    } catch (err) {
      setError("Failed to delete domain");
      console.error("Error deleting domain:", err);
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
      
      await fetchOrganization();
    } catch (err) {
      setError("Failed to verify domain");
      console.error("Error verifying domain:", err);
    }
  }

  function handleAddMetadata(e: JSX.TargetedEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newMetadataKey || !newMetadataValue) return;
    
    setEditForm({
      ...editForm,
      metadata: {
        ...editForm.metadata,
        [newMetadataKey]: newMetadataValue
      }
    });
    
    setNewMetadataKey("");
    setNewMetadataValue("");
  }

  function handleRemoveMetadata(key: string) {
    const newMetadata = { ...editForm.metadata };
    delete newMetadata[key];
    
    setEditForm({
      ...editForm,
      metadata: newMetadata
    });
  }

  function handleLogoUpload(e: JSX.TargetedEvent<HTMLInputElement>) {
    const target = e.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;
    
    const file = target.files[0];
    const reader = new FileReader();
    
    reader.onloadend = () => {
      setUploadedLogo(reader.result as string);
    };
    
    reader.readAsDataURL(file);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (isLoading) {
    return <div className="p-6 text-center text-gray-500">Loading organization details...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
        {error}
        <button
          onClick={() => setError(null)}
          className="float-right font-bold"
        >
          &times;
        </button>
      </div>
    );
  }

  if (!organization) {
    return <div className="p-6 text-center text-gray-500">Organization not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
            {uploadedLogo ? (
              <img 
                src={uploadedLogo} 
                alt={organization.name} 
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-gray-500">
                {organization.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{organization.name}</h1>
            <p className="text-gray-500">ID: {organization.id}</p>
          </div>
        </div>
        
        <div>
          <a
            href="/organizations"
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mr-2"
          >
            Back to List
          </a>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Edit Organization
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-4 border-b">
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-3 py-2 font-medium text-sm ${
              activeTab === "settings"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab("domains")}
            className={`px-3 py-2 font-medium text-sm ${
              activeTab === "domains"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Domains
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`px-3 py-2 font-medium text-sm ${
              activeTab === "members"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Members
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="p-6">
            {isEditing ? (
              <form onSubmit={handleUpdateOrganization}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name || ""}
                    onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => 
                      setEditForm({...editForm, name: (e.target as HTMLInputElement).value})
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    External ID
                  </label>
                  <input
                    type="text"
                    value={editForm.externalId || ""}
                    onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => 
                      setEditForm({...editForm, externalId: (e.target as HTMLInputElement).value})
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editForm.allowProfilesOutsideOrganization || false}
                      onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => 
                        setEditForm({...editForm, allowProfilesOutsideOrganization: (e.target as HTMLInputElement).checked})
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Allow profiles outside organization
                    </span>
                  </label>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Logo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {uploadedLogo && (
                    <div className="mt-2">
                      <img 
                        src={uploadedLogo} 
                        alt="Uploaded logo preview" 
                        className="h-20 w-20 object-cover rounded"
                      />
                    </div>
                  )}
                </div>
                
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Metadata</h3>
                  
                  {Object.keys(editForm.metadata || {}).length > 0 ? (
                    <div className="mb-4 overflow-hidden border border-gray-200 rounded-md">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Key
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Value
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Object.entries(editForm.metadata || {}).map(([key, value]) => (
                            <tr key={key}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                {key}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                {value}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMetadata(key)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-4">No metadata added yet.</p>
                  )}
                  
                  <form onSubmit={handleAddMetadata} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Key"
                        value={newMetadataKey}
                        onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => 
                          setNewMetadataKey((e.target as HTMLInputElement).value)
                        }
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Value"
                        value={newMetadataValue}
                        onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => 
                          setNewMetadataValue((e.target as HTMLInputElement).value)
                        }
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <button
                        type="submit"
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                        Add Metadata
                      </button>
                    </div>
                  </form>
                </div>
                
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm(organization);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{organization.name}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">External ID</dt>
                    <dd className="mt-1 text-sm text-gray-900">{organization.externalId || "-"}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Allow Profiles Outside Organization</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {organization.allowProfilesOutsideOrganization ? "Yes" : "No"}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created At</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(organization.createdAt)}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Updated At</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(organization.updatedAt)}</dd>
                  </div>
                </dl>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Metadata</h3>
                  {Object.keys(organization.metadata || {}).length > 0 ? (
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                      {Object.entries(organization.metadata || {}).map(([key, value]) => (
                        <div key={key}>
                          <dt className="text-sm font-medium text-gray-500">{key}</dt>
                          <dd className="mt-1 text-sm text-gray-900">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-sm text-gray-500">No metadata added yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Domains Tab */}
        {activeTab === "domains" && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Domain</h3>
              <form onSubmit={handleAddDomain} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="example.com"
                    value={newDomain}
                    onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => 
                      setNewDomain((e.target as HTMLInputElement).value)
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Add Domain
                </button>
              </form>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Domains</h3>
            
            {organization.domains && organization.domains.length > 0 ? (
              <div className="overflow-hidden border border-gray-200 rounded-md">
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
                    {organization.domains.map((domain) => (
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
              </div>
            ) : (
              <p className="text-sm text-gray-500">No domains added yet.</p>
            )}
          </div>
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
          <div className="p-6">
            <div className="mb-6 flex justify-end">
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Invite Member
              </button>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Members</h3>
            
            {members.length > 0 ? (
              <div className="overflow-hidden border border-gray-200 rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {members.map((member) => (
                      <tr key={member.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {member.firstName} {member.lastName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {member.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              member.role === "Admin"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(member.joinedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-4">
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No members in this organization yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}