// Main Webhooks Demo Page
// Shows how to receive and process webhooks from WorkOS

import { Head } from '$fresh/runtime.ts';
import WebhookEvents from '../../islands/WebhookEvents.tsx';
import type { Handlers, PageProps } from '$fresh/server.ts';
import { getWebhookEvents } from '../../utils/webhook-events.ts';
import type { WebhookEvent } from '../../utils/webhook-types.ts';

// Server-side handlers
export const handler: Handlers = {
  async GET(req, ctx) {
    // Get initial events data for server-side rendering
    const url = new URL(req.url);
    const eventType = url.searchParams.get('eventType') || undefined;
    const startTime = url.searchParams.get('startTime') || undefined;
    const endTime = url.searchParams.get('endTime') || undefined;

    const initialEvents = getWebhookEvents({
      eventType,
      startTime,
      endTime,
    });

    return ctx.render({ initialEvents });
  },
};

export default function WebhooksPage({ data }: PageProps<{ initialEvents: WebhookEvent[] }>) {
  return (
    <>
      <Head>
        <title>WorkOS Webhooks Demo</title>
      </Head>

      <div class='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div class='flex justify-between items-center mb-8'>
          <h1 class='text-3xl font-bold text-gray-900'>WorkOS Webhooks Listener Demo</h1>
        </div>

        <div class='prose prose-lg max-w-none mb-12'>
          <p>
            This demo showcases how to receive and process webhooks from WorkOS. Webhooks allow your application to receive real-time updates when
            events occur in WorkOS, such as user creation, authentication events, directory sync changes, and more.
          </p>

          <div class='bg-blue-50 border-l-4 border-blue-500 p-4 my-6'>
            <h3 class='text-blue-800 font-semibold'>What are WorkOS Webhooks?</h3>
            <p class='text-blue-700 mt-2'>
              WorkOS uses webhooks to notify your application when events happen in your WorkOS account. Instead of having to poll the WorkOS API,
              webhooks are pushed to your application in real-time, making your application more efficient and responsive.
            </p>
          </div>

          <h2 class='text-2xl font-bold mt-8 mb-4'>Setting Up Webhooks</h2>

          <ol class='list-decimal pl-6 space-y-4'>
            <li>
              <strong>Configure your webhook URL in the WorkOS Dashboard</strong>
              <p>
                Log in to your WorkOS Dashboard and navigate to the "Webhooks" section. Add the following URL as your webhook endpoint:
              </p>
              <pre class='bg-gray-100 p-4 rounded-md overflow-x-auto'>
                <code>{`https://your-application-domain.com/api/webhooks/listener`}</code>
              </pre>
            </li>

            <li>
              <strong>Set your WORKOS_WEBHOOK_SECRET environment variable</strong>
              <p>
                WorkOS will provide you with a webhook secret when you create a webhook endpoint. Add this secret to your environment variables:
              </p>
              <pre class='bg-gray-100 p-4 rounded-md overflow-x-auto'>
                <code>{`WORKOS_WEBHOOK_SECRET=your_webhook_secret_here`}</code>
              </pre>
            </li>

            <li>
              <strong>Deploy your application</strong>
              <p>
                For testing webhooks during development, you can use a service like ngrok to expose your local server to the internet with a temporary
                URL.
              </p>
            </li>
          </ol>

          <h2 class='text-2xl font-bold mt-8 mb-4'>Implementing Webhook Verification</h2>

          <p>
            It's crucial to verify that incoming webhooks are actually from WorkOS. WorkOS signs each webhook with a signature using your webhook
            secret.
          </p>

          <div class='bg-gray-100 p-4 rounded-md overflow-x-auto'>
            <pre>
              <code>{`// Example of webhook verification with WorkOS SDK
export async function POST(req: Request): Promise<Response> {
  try {
    const { webhooks } = initWebhooks();
    const payload = await req.json();
    const sigHeader = req.headers.get("workos-signature") || "";

    // Get webhook secret from environment variable
    const webhookSecret = Deno.env.get("WORKOS_WEBHOOK_SECRET");

    if (!webhookSecret) {
      console.error("WORKOS_WEBHOOK_SECRET environment variable not set");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    // Verify webhook signature and parse event
    const event = await webhooks.constructEvent({
      payload,
      sigHeader,
      secret: webhookSecret,
    });

    // Process the verified event...

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle signature verification failures
    console.error("Error handling webhook:", error);
    return new Response(
      JSON.stringify({ error: "Webhook verification failed" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}`}</code>
            </pre>
          </div>

          <h2 class='text-2xl font-bold mt-8 mb-4'>Supported Event Types</h2>

          <p>
            WorkOS provides webhooks for many event types across different product features. Here are some common event types:
          </p>

          <ul class='list-disc pl-6 space-y-2'>
            <li>
              <strong>Authentication Events:</strong> <code>authentication.succeeded</code>, <code>authentication.failed</code>
            </li>
            <li>
              <strong>User Management:</strong> <code>user.created</code>, <code>user.updated</code>, <code>user.deleted</code>
            </li>
            <li>
              <strong>Directory Sync:</strong> <code>dsync.user.created</code>, <code>dsync.group.updated</code>, etc.
            </li>
            <li>
              <strong>Organizations:</strong> <code>organization.created</code>, <code>organization.updated</code>
            </li>
            <li>
              <strong>SSO:</strong> <code>connection.activated</code>, <code>connection.deactivated</code>
            </li>
          </ul>

          <p class='mt-4'>
            For a complete list of event types, refer to the{' '}
            <a href='https://workos.com/docs/webhooks/events' class='text-blue-600 hover:underline'>WorkOS Webhooks documentation</a>.
          </p>
        </div>

        <h2 class='text-2xl font-bold mb-6'>Webhook Events Viewer</h2>

        <div class='bg-white rounded-lg p-6 shadow-sm mb-8'>
          <p class='mb-4'>
            The viewer below displays webhook events received by your application. Configure a webhook in your WorkOS Dashboard pointing to{' '}
            <code class='bg-gray-100 px-2 py-1 rounded'>/api/webhooks/listener</code> to start receiving events.
          </p>

          <WebhookEvents initialEvents={data.initialEvents} />
        </div>
      </div>
    </>
  );
}
