// Import standard Deno assertions
import { assertEquals } from 'https://deno.land/std/assert/mod.ts';

import { fetchOnce, fetchSearchParams, resetMockFetch } from '../common/utils/test-utils.ts';
import type { DsyncUserUpdatedEvent, DsyncUserUpdatedEventResponse, Event, EventResponse } from '../common/interfaces/event.interface.ts';
import { WorkOS } from '../workos.ts';
import { ConnectionType } from '../sso/interfaces/index.ts';

// Define common test data
const event: Event = {
  id: 'event_01234ABCD',
  createdAt: '2020-05-06 04:21:48.649164',
  event: 'connection.activated',
  data: {
    object: 'connection',
    id: 'conn_01234ABCD',
    organizationId: 'org_1234',
    name: 'Connection',
    type: ConnectionType.OktaSAML,
    connectionType: ConnectionType.OktaSAML,
    state: 'active',
    domains: [],
    createdAt: '2020-05-06 04:21:48.649164',
    updatedAt: '2020-05-06 04:21:48.649164',
  },
};

const eventResponse: EventResponse = {
  id: 'event_01234ABCD',
  created_at: '2020-05-06 04:21:48.649164',
  event: 'connection.activated',
  data: {
    object: 'connection',
    id: 'conn_01234ABCD',
    organization_id: 'org_1234',
    name: 'Connection',
    connection_type: ConnectionType.OktaSAML,
    state: 'active',
    domains: [],
    created_at: '2020-05-06 04:21:48.649164',
    updated_at: '2020-05-06 04:21:48.649164',
  },
};

// Define directory user events for specific tests
const directoryUserUpdated: DsyncUserUpdatedEvent = {
  id: 'event_01234ABCD',
  createdAt: '2020-05-06 04:21:48.649164',
  event: 'dsync.user.updated',
  data: {
    object: 'directory_user',
    id: 'directory_user_456',
    customAttributes: {
      custom: true,
    },
    directoryId: 'dir_123',
    organizationId: 'org_123',
    email: 'jonsnow@workos.com',
    emails: [
      {
        primary: true,
        type: 'type',
        value: 'jonsnow@workos.com',
      },
    ],
    firstName: 'Jon',
    idpId: 'idp_foo',
    lastName: 'Snow',
    jobTitle: 'Knight of the Watch',
    rawAttributes: {},
    state: 'active',
    username: 'jonsnow',
    role: { slug: 'super_admin' },
    previousAttributes: {
      role: { slug: 'member' },
    },
    createdAt: '2021-10-27 15:21:50.640959',
    updatedAt: '2021-12-13 12:15:45.531847',
  },
};

const directoryUserUpdatedResponse: DsyncUserUpdatedEventResponse = {
  id: 'event_01234ABCD',
  created_at: '2020-05-06 04:21:48.649164',
  event: 'dsync.user.updated',
  data: {
    object: 'directory_user',
    id: 'directory_user_456',
    custom_attributes: {
      custom: true,
    },
    directory_id: 'dir_123',
    organization_id: 'org_123',
    email: 'jonsnow@workos.com',
    emails: [
      {
        primary: true,
        type: 'type',
        value: 'jonsnow@workos.com',
      },
    ],
    first_name: 'Jon',
    idp_id: 'idp_foo',
    last_name: 'Snow',
    job_title: 'Knight of the Watch',
    raw_attributes: {},
    state: 'active',
    username: 'jonsnow',
    role: { slug: 'super_admin' },
    previous_attributes: {
      role: { slug: 'member' },
    },
    created_at: '2021-10-27 15:21:50.640959',
    updated_at: '2021-12-13 12:15:45.531847',
  },
};

// Helper function for setup
function setupTest() {
  resetMockFetch();
  return new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');
}

Deno.test('Events - listEvents with options requests Events with query parameters', async () => {
  const workos = setupTest();
  
  const eventsResponse = {
    object: 'list',
    data: [eventResponse],
    list_metadata: {},
  };

  fetchOnce(JSON.stringify(eventsResponse));

  const list = await workos.events.listEvents({
    events: ['connection.activated'],
    rangeStart: '2020-05-04',
    rangeEnd: '2020-05-07',
  });

  const params = fetchSearchParams();
  assertEquals(params.events, 'connection.activated');
  assertEquals(params.range_start, '2020-05-04');
  assertEquals(params.range_end, '2020-05-07');

  assertEquals(list, {
    object: 'list',
    data: [event],
    listMetadata: {},
  });
});

Deno.test('Events - listEvents with a valid event name', async () => {
  const workos = setupTest();
  
  const eventsListResponse = {
    object: 'list',
    data: [eventResponse],
    list_metadata: {},
  };
  
  fetchOnce(JSON.stringify(eventsListResponse));

  const list = await workos.events.listEvents({
    events: ['connection.activated'],
  });

  assertEquals(list, {
    object: 'list',
    data: [event],
    listMetadata: {},
  });
});

Deno.test('Events - listEvents with a valid organization id', async () => {
  const workos = setupTest();
  
  const eventsListResponse = {
    object: 'list',
    data: [eventResponse],
    list_metadata: {},
  };
  
  fetchOnce(JSON.stringify(eventsListResponse));

  const list = await workos.events.listEvents({
    events: ['connection.activated'],
    organizationId: 'org_1234',
  });

  assertEquals(list, {
    object: 'list',
    data: [event],
    listMetadata: {},
  });
});

Deno.test('Events - directory user updated events with a role returns the role', async () => {
  const workos = setupTest();
  
  const directoryUserEventsListResponse = {
    object: 'list',
    data: [directoryUserUpdatedResponse],
    list_metadata: {},
  };
  
  fetchOnce(JSON.stringify(directoryUserEventsListResponse));

  const list = await workos.events.listEvents({
    events: ['dsync.user.updated'],
  });

  assertEquals(list, {
    object: 'list',
    data: [directoryUserUpdated],
    listMetadata: {},
  });
});
