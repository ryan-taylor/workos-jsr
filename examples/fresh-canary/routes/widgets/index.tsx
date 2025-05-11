// Widgets demo page showcasing WorkOS pre-built UI components
import { Head } from '$fresh/runtime.ts';
import WidgetsShowcase from '../../islands/WidgetsShowcase.tsx';

export default function WidgetsPage() {
  return (
    <>
      <Head>
        <title>WorkOS Widgets Demo | WorkOS + Fresh</title>
        <meta
          name='description'
          content='Showcase of WorkOS pre-built UI components (Widgets) in a Fresh application'
        />
      </Head>

      <div class='max-w-screen-xl mx-auto px-4 py-8'>
        <div class='mb-10'>
          <h1 class='text-3xl font-bold text-gray-900 mb-4'>WorkOS Widgets Demo</h1>
          <p class='text-lg text-gray-600 max-w-3xl'>
            Embed WorkOS pre-built UI components directly into your application, saving development time and providing a consistent experience.
          </p>
        </div>

        <div class='grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12'>
          <div class='lg:col-span-2'>
            <div class='bg-white shadow rounded-lg overflow-hidden mb-8'>
              <div class='p-6'>
                <WidgetsShowcase />
              </div>
            </div>
          </div>

          <div class='space-y-6'>
            <div class='bg-white shadow rounded-lg p-6'>
              <h2 class='text-xl font-semibold text-gray-900 mb-4'>About WorkOS Widgets</h2>
              <div class='prose'>
                <p>
                  WorkOS Widgets are pre-built UI components that provide ready-made interfaces for common functionality:
                </p>
                <ul class='mt-4 space-y-2 list-disc list-inside'>
                  <li>
                    <strong>Users Table</strong> - Display and manage users in your application
                  </li>
                  <li>
                    <strong>Auth Flow</strong> - Complete authentication flow with SSO options
                  </li>
                  <li>
                    <strong>Profile Editor</strong> - Let users update their profile information
                  </li>
                  <li>
                    <strong>Org Switcher</strong> - Allow users to switch between organizations
                  </li>
                </ul>
              </div>
            </div>

            <div class='bg-white shadow rounded-lg p-6'>
              <h2 class='text-xl font-semibold text-gray-900 mb-4'>Integration Benefits</h2>
              <ul class='space-y-3'>
                <li class='flex items-start'>
                  <svg class='h-5 w-5 text-green-500 mt-0.5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5 13l4 4L19 7'></path>
                  </svg>
                  <span>Pre-built UI reduces development time</span>
                </li>
                <li class='flex items-start'>
                  <svg class='h-5 w-5 text-green-500 mt-0.5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5 13l4 4L19 7'></path>
                  </svg>
                  <span>Customizable appearance to match your brand</span>
                </li>
                <li class='flex items-start'>
                  <svg class='h-5 w-5 text-green-500 mt-0.5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5 13l4 4L19 7'></path>
                  </svg>
                  <span>Secure token-based authentication</span>
                </li>
                <li class='flex items-start'>
                  <svg class='h-5 w-5 text-green-500 mt-0.5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5 13l4 4L19 7'></path>
                  </svg>
                  <span>Responsive design works on all devices</span>
                </li>
                <li class='flex items-start'>
                  <svg class='h-5 w-5 text-green-500 mt-0.5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5 13l4 4L19 7'></path>
                  </svg>
                  <span>Automatic updates with new features</span>
                </li>
              </ul>
            </div>

            <div class='bg-white shadow rounded-lg p-6'>
              <h2 class='text-xl font-semibold text-gray-900 mb-4'>Implementation Steps</h2>
              <ol class='list-decimal list-inside space-y-2 text-gray-700'>
                <li>Get a widget token from the WorkOS API</li>
                <li>Include the WorkOS Widget JavaScript from CDN</li>
                <li>Initialize the widget with your token</li>
                <li>Customize appearance as needed</li>
              </ol>
              <p class='mt-4 text-sm text-gray-500'>
                See the demonstration and code samples on the left for detailed integration instructions.
              </p>
            </div>
          </div>
        </div>

        <div class='bg-indigo-50 rounded-xl p-8 mb-12'>
          <div class='max-w-3xl mx-auto text-center'>
            <h2 class='text-2xl font-bold text-indigo-700 mb-4'>Ready to add WorkOS Widgets to your app?</h2>
            <p class='text-indigo-600 mb-6'>
              Use the configurator above to generate customized code snippets or check out the complete documentation for more advanced integration
              options.
            </p>
            <div class='flex flex-wrap justify-center gap-4'>
              <a
                href='https://workos.com/docs/widgets'
                target='_blank'
                rel='noopener noreferrer'
                class='inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              >
                View Documentation
              </a>
              <a
                href='https://workos.com/blog/introducing-workos-widgets'
                target='_blank'
                rel='noopener noreferrer'
                class='inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
