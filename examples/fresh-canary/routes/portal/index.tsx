// Admin Portal Demo Page
import { Head } from "$fresh/runtime.ts";
import { FunctionComponent } from "preact";
import AdminPortalEmbed from "../../islands/AdminPortalEmbed.tsx";
import { Handlers, PageProps } from "$fresh/server.ts";

export default function AdminPortalPage() {
  return (
    <>
      <Head>
        <title>WorkOS Admin Portal Demo | Fresh Canary</title>
      </Head>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Admin Portal</h1>
          <p class="text-lg text-gray-500">
            Provide a branded, self-service portal for your customers' end users
          </p>
        </div>

        {/* Introduction */}
        <div class="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div class="px-6 py-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">About Admin Portal</h2>
            <p class="text-gray-600 mb-4">
              The WorkOS Admin Portal allows your customers to provide their end users with a branded, 
              self-service portal for managing various aspects of their account - without you having to build 
              custom UI components. Your customers can manage their SSO, Directory Sync, audit logs, 
              and more all within a consistent interface.
            </p>
            <p class="text-gray-600">
              This demo showcases how to generate and embed an Admin Portal in your application. You can:
            </p>
            <ul class="list-disc pl-6 mt-2 text-gray-600 space-y-1">
              <li>Generate portal links with different permissions and scopes</li>
              <li>Customize the portal branding (logo, colors, text)</li>
              <li>Embed the portal directly in your application via an iframe</li>
              <li>Redirect users to the portal with proper authentication</li>
            </ul>
          </div>
        </div>

        {/* Common Use Cases */}
        <div class="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div class="px-6 py-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Common Use Cases</h2>
            
            <div class="space-y-6">
              <div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">User Management</h3>
                <p class="text-gray-600">
                  Allow organization administrators to manage their users - add new users, remove 
                  access for departing team members, or adjust permissions all in one place.
                </p>
              </div>
              
              <div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">SSO Configuration</h3>
                <p class="text-gray-600">
                  Provide a simple interface for your customers to set up and manage their Single Sign-On 
                  connections, eliminating the need for your engineering team to handle these requests.
                </p>
              </div>
              
              <div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Directory Sync Management</h3>
                <p class="text-gray-600">
                  Enable your customers to manage their directory connections, view sync status, 
                  and troubleshoot integration issues directly.
                </p>
              </div>
              
              <div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Audit Logs</h3>
                <p class="text-gray-600">
                  Give your customers visibility into authentication events, user activities, 
                  and administrative changes to meet compliance requirements.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Customization Options */}
        <div class="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div class="px-6 py-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Customization Options</h2>
            <p class="text-gray-600 mb-4">
              The Admin Portal is highly customizable to match your application's branding:
            </p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="border border-gray-200 rounded-md p-4">
                <h3 class="font-medium text-gray-900 mb-2">Brand Identity</h3>
                <ul class="list-disc pl-5 text-gray-600 space-y-1">
                  <li>Custom logo</li>
                  <li>Primary color scheme</li>
                  <li>Custom header text</li>
                </ul>
              </div>
              
              <div class="border border-gray-200 rounded-md p-4">
                <h3 class="font-medium text-gray-900 mb-2">Portal Intent</h3>
                <ul class="list-disc pl-5 text-gray-600 space-y-1">
                  <li>SSO configuration</li>
                  <li>Directory Sync management</li>
                  <li>Audit logs viewing</li>
                  <li>Domain verification</li>
                  <li>Log streams setup</li>
                  <li>Certificate renewal</li>
                </ul>
              </div>
              
              <div class="border border-gray-200 rounded-md p-4">
                <h3 class="font-medium text-gray-900 mb-2">URL Configuration</h3>
                <ul class="list-disc pl-5 text-gray-600 space-y-1">
                  <li>Return URL for navigation back to your app</li>
                  <li>Success URL for completed actions</li>
                </ul>
              </div>
              
              <div class="border border-gray-200 rounded-md p-4">
                <h3 class="font-medium text-gray-900 mb-2">Integration Options</h3>
                <ul class="list-disc pl-5 text-gray-600 space-y-1">
                  <li>Direct link to portal</li>
                  <li>Iframe embedding</li>
                  <li>Custom redirect flow</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Implementation Demo */}
        <div class="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div class="px-6 py-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Generate and Embed a Portal</h2>
            <p class="text-gray-600 mb-6">
              Use the form below to generate an Admin Portal link with your preferred configuration.
              You can then embed the portal directly in your application or redirect users to it.
            </p>
            
            {/* Portal Generator Island */}
            <AdminPortalEmbed />
          </div>
        </div>

        {/* Implementation Guide */}
        <div class="bg-white shadow rounded-lg overflow-hidden">
          <div class="px-6 py-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Implementation Guide</h2>
            <p class="text-gray-600 mb-4">
              Integrating the Admin Portal in your application is straightforward:
            </p>
            
            <div class="space-y-4">
              <div>
                <h3 class="font-medium text-gray-900 mb-1">1. Generate a Portal Link</h3>
                <div class="bg-gray-50 rounded-md p-4">
                  <pre class="text-sm text-gray-800 overflow-x-auto">
{`// Server-side code
import { workos } from './workos';

const portalLink = await workos.portal.generateLink({
  intent: 'sso', // or another intent
  organization: 'org_123',
  returnUrl: 'https://example.com/return',
});

// Response: { link: 'https://id.workos.com/portal/launch?...' }`}
                  </pre>
                </div>
              </div>
              
              <div>
                <h3 class="font-medium text-gray-900 mb-1">2. Embed or Redirect</h3>
                <p class="text-gray-600 mb-2">Option A: Embed in an iframe</p>
                <div class="bg-gray-50 rounded-md p-4">
                  <pre class="text-sm text-gray-800 overflow-x-auto">
{`<!-- Client-side HTML -->
<iframe 
  src="https://id.workos.com/portal/launch?..."
  width="100%" 
  height="600px"
  frameborder="0"
></iframe>`}
                  </pre>
                </div>
                
                <p class="text-gray-600 mt-4 mb-2">Option B: Redirect the user</p>
                <div class="bg-gray-50 rounded-md p-4">
                  <pre class="text-sm text-gray-800 overflow-x-auto">
{`// Client-side JavaScript
window.location.href = portalLink;`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}