// Admin Portal Embed island - Interactive component for generating and embedding admin portal
import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { FunctionComponent } from "preact";
import { generatePortalLink, getIntentDisplayName, PortalBrandingOptions, GeneratePortalLinkIntent } from "../utils/portal.ts";

// Define props for the AdminPortalEmbed component
interface AdminPortalEmbedProps {
  initialOrganizationId?: string;
}

// AdminPortalEmbed island component for client-side interactivity
const AdminPortalEmbed: FunctionComponent<AdminPortalEmbedProps> = ({ initialOrganizationId = "" }) => {
  // Portal configuration state using signals
  const organizationId = useSignal(initialOrganizationId);
  const intent = useSignal<GeneratePortalLinkIntent>(GeneratePortalLinkIntent.SSO);
  const returnUrl = useSignal<string>("");
  const successUrl = useSignal<string>("");
  const portalLink = useSignal<string>("");
  const isGenerating = useSignal<boolean>(false);
  const showEmbed = useSignal<boolean>(false);
  const error = useSignal<string | null>(null);
  
  // Branding options
  const customBranding = useSignal<boolean>(false);
  const logo = useSignal<string>("");
  const primaryColor = useSignal<string>("#4F46E5");
  const headerText = useSignal<string>("Admin Portal");

  // Function to generate a new portal link
  const handleGenerateLink = async () => {
    if (!organizationId.value) {
      error.value = "Organization ID is required";
      return;
    }

    error.value = null;
    isGenerating.value = true;
    
    try {
      // Call the API to generate portal link
      const response = await fetch("/api/portal/generate-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: intent.value,
          organization: organizationId.value,
          returnUrl: returnUrl.value || undefined,
          successUrl: successUrl.value || undefined,
          branding: customBranding.value ? {
            logo: logo.value || undefined,
            primaryColor: primaryColor.value || undefined,
            headerText: headerText.value || undefined,
          } : undefined,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate link: ${response.status}`);
      }
      
      const data = await response.json();
      portalLink.value = data.link;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "An unknown error occurred";
      console.error("Error generating portal link:", err);
    } finally {
      isGenerating.value = false;
    }
  };

  // Copy link to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(portalLink.value);
      alert("Link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };
  
  // Toggle embed view
  const toggleEmbed = () => {
    showEmbed.value = !showEmbed.value;
  };

  return (
    <div class="space-y-6">
      {/* Configuration Panel */}
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Portal Configuration</h2>
        
        {/* Organization ID */}
        <div class="mb-4">
          <label for="organization-id" class="block text-sm font-medium text-gray-700 mb-1">
            Organization ID *
          </label>
          <input
            id="organization-id"
            type="text"
            value={organizationId.value}
            onInput={(e) => { organizationId.value = (e.target as HTMLInputElement).value }}
            placeholder="org_..."
            class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        
        {/* Intent Selection */}
        <div class="mb-4">
          <label for="intent" class="block text-sm font-medium text-gray-700 mb-1">
            Portal Intent
          </label>
          <select
            id="intent"
            value={intent.value}
            onChange={(e) => { intent.value = (e.target as HTMLSelectElement).value as GeneratePortalLinkIntent }}
            class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            {Object.values(GeneratePortalLinkIntent).map((intentValue) => (
              <option key={intentValue} value={intentValue}>
                {getIntentDisplayName(intentValue as GeneratePortalLinkIntent)}
              </option>
            ))}
          </select>
        </div>
        
        {/* URL Configuration */}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label for="return-url" class="block text-sm font-medium text-gray-700 mb-1">
              Return URL
            </label>
            <input
              id="return-url"
              type="url"
              value={returnUrl.value}
              onInput={(e) => { returnUrl.value = (e.target as HTMLInputElement).value }}
              placeholder="https://example.com/return"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label for="success-url" class="block text-sm font-medium text-gray-700 mb-1">
              Success URL
            </label>
            <input
              id="success-url"
              type="url"
              value={successUrl.value}
              onInput={(e) => { successUrl.value = (e.target as HTMLInputElement).value }}
              placeholder="https://example.com/success"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        
        {/* Branding Options */}
        <div class="mb-4">
          <div class="flex items-center mb-2">
            <input
              id="custom-branding"
              type="checkbox"
              checked={customBranding.value}
              onChange={() => { customBranding.value = !customBranding.value }}
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label for="custom-branding" class="ml-2 block text-sm font-medium text-gray-700">
              Enable Custom Branding
            </label>
          </div>
          
          {customBranding.value && (
            <div class="pl-6 space-y-3 mt-2 p-3 bg-gray-50 rounded-md">
              <div>
                <label for="logo-url" class="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL
                </label>
                <input
                  id="logo-url"
                  type="url"
                  value={logo.value}
                  onInput={(e) => { logo.value = (e.target as HTMLInputElement).value }}
                  placeholder="https://example.com/logo.png"
                  class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label for="primary-color" class="block text-sm font-medium text-gray-700 mb-1">
                  Primary Color
                </label>
                <div class="flex items-center">
                  <input
                    id="primary-color"
                    type="color"
                    value={primaryColor.value}
                    onChange={(e) => { primaryColor.value = (e.target as HTMLInputElement).value }}
                    class="h-8 w-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor.value}
                    onInput={(e) => { primaryColor.value = (e.target as HTMLInputElement).value }}
                    class="ml-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div>
                <label for="header-text" class="block text-sm font-medium text-gray-700 mb-1">
                  Header Text
                </label>
                <input
                  id="header-text"
                  type="text"
                  value={headerText.value}
                  onInput={(e) => { headerText.value = (e.target as HTMLInputElement).value }}
                  placeholder="Admin Portal"
                  class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Generate Button */}
        <button
          onClick={handleGenerateLink}
          disabled={isGenerating.value || !organizationId.value}
          class="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
        >
          {isGenerating.value ? (
            <>
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>Generate Portal Link</>
          )}
        </button>
        
        {/* Error Message */}
        {error.value && (
          <div class="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error.value}
          </div>
        )}
      </div>
      
      {/* Generated Link and Embed Section */}
      {portalLink.value && (
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Generated Portal Link</h2>
          
          {/* Link Display */}
          <div class="flex items-center">
            <input
              type="text"
              value={portalLink.value}
              readonly
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-600"
            />
            <button
              onClick={copyToClipboard}
              class="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
          </div>
          
          {/* Toggle Embed Button */}
          <div class="mt-4">
            <button
              onClick={toggleEmbed}
              class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {showEmbed.value ? "Hide Embed" : "Show Embedded Portal"}
            </button>
          </div>
          
          {/* Iframe Embed */}
          {showEmbed.value && (
            <div class="mt-6">
              <div class="border border-gray-300 rounded-md overflow-hidden bg-gray-50">
                <div class="bg-gray-100 border-b border-gray-300 px-4 py-2 flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-700">Admin Portal Preview</span>
                </div>
                <div class="p-4">
                  <iframe
                    src={portalLink.value}
                    frameBorder="0"
                    class="w-full rounded"
                    style="height: 600px;"
                    title="WorkOS Admin Portal"
                  ></iframe>
                </div>
              </div>
              
              {/* Embed Code */}
              <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Embed Code
                </label>
                <div class="relative">
                  <pre class="bg-gray-800 text-gray-100 p-3 rounded-md text-sm overflow-x-auto">
                    {`<iframe
  src="${portalLink.value}"
  frameborder="0"
  width="100%"
  height="600px"
  title="WorkOS Admin Portal"
></iframe>`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPortalEmbed;