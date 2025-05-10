import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import EventsStream from "../../islands/EventsStream.tsx";
import { workos } from "../../utils/workos.ts";
import { requireAuth } from "../../utils/user-management.ts";
import { Event } from "../../../../src/common/interfaces/event.interface.ts";

// Define common event types for the demo
const COMMON_EVENT_TYPES = [
  "authentication.email_verification_succeeded",
  "authentication.magic_auth_failed",
  "authentication.magic_auth_succeeded",
  "authentication.mfa_succeeded",
  "authentication.oauth_failed",
  "authentication.oauth_succeeded",
  "authentication.password_failed",
  "authentication.password_succeeded",
  "authentication.sso_failed",
  "authentication.sso_succeeded",
  "connection.activated",
  "connection.deactivated",
  "dsync.activated",
  "dsync.deactivated",
  "dsync.group.created",
  "dsync.group.updated",
  "dsync.group.deleted",
  "dsync.user.created",
  "dsync.user.updated",
  "dsync.user.deleted",
  "email_verification.created",
  "invitation.created",
  "magic_auth.created",
  "password_reset.created",
  "password_reset.succeeded",
  "user.created",
  "user.updated",
  "user.deleted",
  "organization_membership.created",
  "organization_membership.deleted",
  "organization_membership.updated",
  "organization.created",
  "organization.updated",
  "organization.deleted",
  "role.created",
  "role.deleted",
  "role.updated",
  "session.created",
  "organization_domain.verified"
];

interface EventsPageData {
  events: Event[];
  eventTypes: string[];
}

export const handler: Handlers<EventsPageData> = {
  async GET(req, ctx) {
    // Ensure user is authenticated
    const authResponse = await requireAuth(req);
    if (authResponse) return authResponse;

    try {
      // Fetch initial events
      const events = await workos.events.listEvents({
        limit: 20, // Initial load with more events
      });

      return ctx.render({
        events: events.data,
        eventTypes: COMMON_EVENT_TYPES,
      });
    } catch (error) {
      console.error("Error fetching events:", error);
      // Still render the page, but with empty data
      return ctx.render({
        events: [],
        eventTypes: COMMON_EVENT_TYPES,
      });
    }
  },
};

export default function EventsPage({ data }: PageProps<EventsPageData>) {
  const { events, eventTypes } = data;

  return (
    <>
      <Head>
        <title>WorkOS Events Demo</title>
      </Head>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-4">WorkOS Events</h1>
          <div class="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div class="px-4 py-5 sm:px-6">
              <h2 class="text-lg leading-6 font-medium text-gray-900">
                Real-time Activity Stream
              </h2>
              <p class="mt-1 max-w-2xl text-sm text-gray-500">
                Monitor and analyze events in your WorkOS-powered application.
              </p>
            </div>
            <div class="border-t border-gray-200 px-4 py-5 sm:px-6">
              <div class="prose max-w-none">
                <p>
                  WorkOS Events provide a comprehensive audit trail of activities in your application. 
                  Use this dashboard to monitor events in real-time or search through historical events.
                </p>
                <h3>Features:</h3>
                <ul>
                  <li>Real-time event monitoring with live updates</li>
                  <li>Filtering by event type, time range, and actors</li>
                  <li>Detailed event information in an expandable format</li>
                  <li>Visual timeline and event type indicators</li>
                  <li>"Follow" mode for automatic scrolling to new events</li>
                </ul>
                <p>
                  Each event includes metadata that provides context about what happened, 
                  who performed the action, when it occurred, and other relevant details.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Render the EventsStream island component */}
        <EventsStream 
          initialEvents={events} 
          eventTypes={eventTypes} 
        />
      </div>
    </>
  );
}