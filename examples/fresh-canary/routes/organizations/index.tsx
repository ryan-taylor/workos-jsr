import { Head } from "$fresh/runtime.ts";
import OrganizationsList from "../../islands/OrganizationsList.tsx";

export default function OrganizationsPage() {
  return (
    <>
      <Head>
        <title>Organizations - WorkOS Demo</title>
      </Head>
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Organizations
          </h1>
          <p className="text-lg text-gray-600">
            Manage your organizations in the WorkOS platform.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            What are Organizations?
          </h2>
          <p className="mb-4">
            Organizations in WorkOS represent your customers' organizations.
            They are used for features like:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Single Sign-On (SSO)</li>
            <li>Directory Sync</li>
            <li>Multi-tenant applications</li>
            <li>User management within organizations</li>
          </ul>
          <p>
            Use the tools below to create and manage your organizations. Each
            organization can have domains associated with it to control which
            email domains can access your application.
          </p>
        </div>

        <OrganizationsList />
      </div>
    </>
  );
}
