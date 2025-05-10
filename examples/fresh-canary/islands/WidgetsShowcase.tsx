// Widgets Showcase island - Interactive component for demonstrating WorkOS widgets
import { useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";

// Define the widget types we'll support
enum WidgetType {
  USERS_TABLE = "users-table",
  AUTH_FLOW = "auth-flow",
  PROFILE_EDITOR = "profile-editor",
  ORG_SWITCHER = "org-switcher"
}

// Define the widget themes
enum WidgetTheme {
  LIGHT = "light",
  DARK = "dark",
  SYSTEM = "system"
}

// Define the props for the WidgetsShowcase component
interface WidgetsShowcaseProps {
  initialOrganizationId?: string;
  initialUserId?: string;
}

export default function WidgetsShowcase({ 
  initialOrganizationId = "", 
  initialUserId = "" 
}: WidgetsShowcaseProps) {
  // Widget configuration state
  const [organizationId, setOrganizationId] = useState(initialOrganizationId);
  const [userId, setUserId] = useState(initialUserId);
  const [widgetType, setWidgetType] = useState<WidgetType>(WidgetType.USERS_TABLE);
  const [widgetTheme, setWidgetTheme] = useState<WidgetTheme>(WidgetTheme.LIGHT);
  const [customCss, setCustomCss] = useState<string>("");
  const [showCustomCss, setShowCustomCss] = useState<boolean>(false);
  const [widgetToken, setWidgetToken] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showEmbed, setShowEmbed] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WidgetType>(WidgetType.USERS_TABLE);
  const [customColors, setCustomColors] = useState<boolean>(false);
  const [primaryColor, setPrimaryColor] = useState<string>("#4F46E5");
  const [backgroundColor, setBackgroundColor] = useState<string>("#FFFFFF");
  const [textColor, setTextColor] = useState<string>("#1F2937");

  // Generate widget configuration and token
  const handleGenerateWidget = async () => {
    if (!organizationId) {
      setError("Organization ID is required");
      return;
    }

    if (!userId) {
      setError("User ID is required");
      return;
    }

    setError(null);
    setIsGenerating(true);
    
    try {
      // Call the API to generate widget configuration
      const response = await fetch("/api/widgets/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          userId,
          widgetType,
          theme: widgetTheme,
          customization: customColors ? {
            primaryColor,
            backgroundColor,
            textColor,
          } : undefined,
          customCss: showCustomCss ? customCss : undefined,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate widget configuration: ${response.status}`);
      }
      
      const data = await response.json();
      setWidgetToken(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error("Error generating widget configuration:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy code to clipboard
  const copyToClipboard = async (code: string) => {
    if (!IS_BROWSER) return;
    
    try {
      await navigator.clipboard.writeText(code);
      alert("Code copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };
  
  // Toggle embed preview
  const toggleEmbed = () => {
    setShowEmbed(!showEmbed);
  };

  // Switch between tabs
  const switchTab = (tab: WidgetType) => {
    setActiveTab(tab);
    setWidgetType(tab);
  };

  // Get the client-side embed code for the widget
  const getEmbedCode = (): string => {
    const baseCode = `<div id="workos-widget-container"></div>

<script src="https://cdn.workos.com/widget.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    WorkOS.createWidget({
      type: "${widgetType}",
      token: "${widgetToken}",
      container: document.getElementById('workos-widget-container'),
      options: {
        theme: "${widgetTheme}"${customColors ? `,
        colors: {
          primary: "${primaryColor}",
          background: "${backgroundColor}",
          text: "${textColor}"
        }` : ''}${showCustomCss && customCss ? `,
        customCss: \`${customCss}\`` : ''}
      }
    });
  });
</script>`;

    return baseCode;
  };

  // Get the server-side code for retrieving the token
  const getServerCode = (): string => {
    return `// Server-side code to get the widget token
import { WorkOS } from "@workos-inc/node";

const workos = new WorkOS(process.env.WORKOS_API_KEY);

// Get widget token
const token = await workos.widgets.getToken({
  organizationId: "${organizationId}",
  userId: "${userId}",
  scopes: ["widgets:${widgetType}:manage"]
});

// Then pass this token to your client-side code`;
  };

  return (
    <div class="space-y-6">
      {/* Tabs for Widget Types */}
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-6">
          {Object.values(WidgetType).map((type) => (
            <button
              onClick={() => switchTab(type)}
              class={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === type
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {type.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
            </button>
          ))}
        </nav>
      </div>

      {/* Configuration Panel */}
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Widget Configuration</h2>
        
        {/* Organization ID */}
        <div class="mb-4">
          <label htmlFor="organization-id" class="block text-sm font-medium text-gray-700 mb-1">
            Organization ID *
          </label>
          <input
            id="organization-id"
            type="text"
            value={organizationId}
            onInput={(e) => setOrganizationId((e.target as HTMLInputElement).value)}
            placeholder="org_..."
            class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        
        {/* User ID */}
        <div class="mb-4">
          <label htmlFor="user-id" class="block text-sm font-medium text-gray-700 mb-1">
            User ID *
          </label>
          <input
            id="user-id"
            type="text"
            value={userId}
            onInput={(e) => setUserId((e.target as HTMLInputElement).value)}
            placeholder="user_..."
            class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        
        {/* Theme Selection */}
        <div class="mb-4">
          <label htmlFor="theme" class="block text-sm font-medium text-gray-700 mb-1">
            Widget Theme
          </label>
          <select
            id="theme"
            value={widgetTheme}
            onChange={(e) => setWidgetTheme((e.target as HTMLSelectElement).value as WidgetTheme)}
            class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            {Object.values(WidgetTheme).map((theme) => (
              <option value={theme}>
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        {/* Custom Colors */}
        <div class="mb-4">
          <div class="flex items-center mb-2">
            <input
              id="custom-colors"
              type="checkbox"
              checked={customColors}
              onChange={() => setCustomColors(!customColors)}
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="custom-colors" class="ml-2 block text-sm font-medium text-gray-700">
              Enable Custom Colors
            </label>
          </div>
          
          {customColors && (
            <div class="pl-6 space-y-3 mt-2 p-3 bg-gray-50 rounded-md">
              <div>
                <label htmlFor="primary-color" class="block text-sm font-medium text-gray-700 mb-1">
                  Primary Color
                </label>
                <div class="flex items-center">
                  <input
                    id="primary-color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor((e.target as HTMLInputElement).value)}
                    class="h-8 w-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onInput={(e) => setPrimaryColor((e.target as HTMLInputElement).value)}
                    class="ml-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="background-color" class="block text-sm font-medium text-gray-700 mb-1">
                  Background Color
                </label>
                <div class="flex items-center">
                  <input
                    id="background-color"
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor((e.target as HTMLInputElement).value)}
                    class="h-8 w-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onInput={(e) => setBackgroundColor((e.target as HTMLInputElement).value)}
                    class="ml-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="text-color" class="block text-sm font-medium text-gray-700 mb-1">
                  Text Color
                </label>
                <div class="flex items-center">
                  <input
                    id="text-color"
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor((e.target as HTMLInputElement).value)}
                    class="h-8 w-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={textColor}
                    onInput={(e) => setTextColor((e.target as HTMLInputElement).value)}
                    class="ml-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Custom CSS */}
        <div class="mb-4">
          <div class="flex items-center mb-2">
            <input
              id="custom-css"
              type="checkbox"
              checked={showCustomCss}
              onChange={() => setShowCustomCss(!showCustomCss)}
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="custom-css" class="ml-2 block text-sm font-medium text-gray-700">
              Enable Custom CSS
            </label>
          </div>
          
          {showCustomCss && (
            <div class="mt-2">
              <textarea
                id="css-input"
                value={customCss}
                onInput={(e) => setCustomCss((e.target as HTMLTextAreaElement).value)}
                placeholder=".workos-widget-container { border-radius: 8px; }"
                rows={4}
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
              ></textarea>
            </div>
          )}
        </div>
        
        {/* Generate Button */}
        <button
          onClick={handleGenerateWidget}
          disabled={isGenerating || !organizationId || !userId}
          class="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
        >
          {isGenerating ? (
            <div>
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </div>
          ) : (
            <span>Generate Widget</span>
          )}
        </button>
        
        {/* Error Message */}
        {error && (
          <div class="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
      </div>
      
      {/* Generated Widget and Code Section */}
      {widgetToken && (
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Widget Preview and Code</h2>
          
          {/* Toggle Preview Button */}
          <div class="mb-4">
            <button
              onClick={toggleEmbed}
              class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {showEmbed ? "Hide Preview" : "Show Widget Preview"}
            </button>
          </div>
          
          {/* Widget Embed */}
          {showEmbed && (
            <div class="mb-6">
              <div class="border border-gray-300 rounded-md overflow-hidden bg-gray-50">
                <div class="bg-gray-100 border-b border-gray-300 px-4 py-2 flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-700">Widget Preview</span>
                </div>
                <div class="p-4" id="widget-preview-container">
                  {/* Widget will be rendered here with client-side script */}
                  <div id="workos-widget-container"></div>
                </div>
              </div>
              
              {/* Client-side render script */}
              {IS_BROWSER && (
                <script dangerouslySetInnerHTML={{ __html: `
                  // Load WorkOS Widget script
                  if (!document.getElementById('workos-widget-script')) {
                    const script = document.createElement('script');
                    script.id = 'workos-widget-script';
                    script.src = 'https://cdn.workos.com/widget.js';
                    script.async = true;
                    document.head.appendChild(script);
                    
                    script.onload = initWidget;
                  } else {
                    initWidget();
                  }
                  
                  function initWidget() {
                    // Clear any existing widget
                    const container = document.getElementById('workos-widget-container');
                    if (container) {
                      container.innerHTML = '';
                      
                      // Initialize the widget
                      if (window.WorkOS && '${widgetToken}') {
                        WorkOS.createWidget({
                          type: '${widgetType}',
                          token: '${widgetToken}',
                          container: container,
                          options: {
                            theme: '${widgetTheme}'
                            ${customColors ? `,
                            colors: {
                              primary: '${primaryColor}',
                              background: '${backgroundColor}',
                              text: '${textColor}'
                            }` : ''}
                            ${showCustomCss && customCss ? `,
                            customCss: \`${customCss}\`` : ''}
                          }
                        });
                      }
                    }
                  }
                `}} />
              )}
            </div>
          )}
          
          {/* Code Snippets Section */}
          <div class="space-y-4">
            <h3 class="text-md font-medium text-gray-800">Client-side Embed Code</h3>
            <div class="relative">
              <pre class="bg-gray-800 text-gray-100 p-3 rounded-md text-sm overflow-x-auto">
                {getEmbedCode()}
              </pre>
              <button
                onClick={() => copyToClipboard(getEmbedCode())}
                class="absolute top-2 right-2 p-1 rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                title="Copy to clipboard"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
            </div>
            
            <h3 class="text-md font-medium text-gray-800 mt-4">Server-side Token Code</h3>
            <div class="relative">
              <pre class="bg-gray-800 text-gray-100 p-3 rounded-md text-sm overflow-x-auto">
                {getServerCode()}
              </pre>
              <button
                onClick={() => copyToClipboard(getServerCode())}
                class="absolute top-2 right-2 p-1 rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                title="Copy to clipboard"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}