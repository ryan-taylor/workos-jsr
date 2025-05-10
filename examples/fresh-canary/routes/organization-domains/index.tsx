import { Head } from "$fresh/runtime.ts";
import OrganizationDomainsManager from "../../islands/OrganizationDomainsManager.tsx";

export default function OrganizationDomainsPage() {
  return (
    <>
      <Head>
        <title>Organization Domains Management | WorkOS</title>
      </Head>
      <div className="container mx-auto p-4 max-w-screen-xl">
        <h1 className="text-3xl font-bold mb-2">Organization Domains</h1>
        <p className="text-gray-600 mb-8">
          Manage domain verification for your organizations. Organization Domains allows you to 
          associate specific domains with your organizations in WorkOS.
        </p>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">About Domain Management</h2>
          <p className="mb-4">
            Domain verification is a way for organizations to prove ownership of a domain. 
            This is useful for several features:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>Domain-based Organization Assignment:</strong> Automatically assign users to 
              the correct organization based on their email domain.
            </li>
            <li>
              <strong>Security:</strong> Ensure only legitimate users from verified domains can access 
              your application when using SSO or other authentication methods.
            </li>
            <li>
              <strong>User Management:</strong> Automatic organization assignment for users who sign up 
              with email addresses from verified domains.
            </li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Domain Verification Process</h2>
          <p className="mb-4">
            When you add a new domain to an organization, it starts in an unverified state. 
            To verify domain ownership, follow these steps:
          </p>
          <ol className="list-decimal pl-6 mb-4 space-y-2">
            <li>
              <strong>Add the domain</strong> to the organization using the form below.
            </li>
            <li>
              <strong>Add a DNS TXT record</strong> to the domain's DNS settings. WorkOS will provide 
              the specific record value.
            </li>
            <li>
              <strong>Click the "Verify" button</strong> after adding the DNS record. WorkOS will check 
              for the presence of the TXT record.
            </li>
            <li>
              Once verified, the domain will be <strong>marked as verified</strong> and can be used for 
              domain-based features.
            </li>
          </ol>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> DNS changes may take up to 48 hours to propagate fully across the internet. 
              If verification fails initially, wait and try again later.
            </p>
          </div>
        </div>

        <OrganizationDomainsManager />
      </div>
    </>
  );
}