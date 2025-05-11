// Import Deno standard testing library
import { assertEquals } from '@std/assert';

import {
  fetchBody,
  fetchHeaders,
  fetchOnce,
  fetchSearchParams,
  fetchURL,
  type MockResponseData,
  resetMockFetch,
} from '../common/utils/test-utils.ts';

import { WorkOS } from '../workos.ts';
import { type ConnectionResponse, ConnectionType } from './interfaces/index.ts';
import type { ListResponse } from '../common/interfaces/index.ts';

// Test data setup
const connectionResponse: ConnectionResponse = {
  object: 'connection',
  id: 'conn_123',
  organization_id: 'org_123',
  name: 'Connection',
  connection_type: ConnectionType.OktaSAML,
  state: 'active',
  domains: [],
  created_at: '2023-07-17T20:07:20.055Z',
  updated_at: '2023-07-17T20:07:20.055Z',
};

// Setup function to reset mock fetch before each test
function setup() {
  resetMockFetch();
}

// SSO - listConnections with query parameters
Deno.test('SSO - listConnections with query parameters', async () => {
  setup();

  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');
  const listConnectionsResponse: ListResponse<ConnectionResponse> = {
    object: 'list',
    data: [connectionResponse],
    list_metadata: {},
  };

  // Cast to MockResponseData to satisfy type constraints
  fetchOnce(listConnectionsResponse as unknown as MockResponseData);

  await workos.sso.listConnections({
    connectionType: ConnectionType.OktaSAML,
    organizationId: 'org_123',
  });

  assertEquals(fetchSearchParams().connection_type, ConnectionType.OktaSAML);
  assertEquals(fetchSearchParams().organization_id, 'org_123');
});

// SSO - getAuthorizationUrl with default api hostname
Deno.test('SSO - getAuthorizationUrl with default api hostname', () => {
  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

  const url = workos.sso.getAuthorizationUrl({
    domain: 'lyft.com',
    clientId: 'proj_123',
    redirectUri: 'example.com/sso/workos/callback',
  });

  assertEquals(
    url,
    'https://api.workos.com/sso/authorize?client_id=proj_123&domain=lyft.com&' +
      'redirect_uri=example.com%2Fsso%2Fworkos%2Fcallback&response_type=code',
  );
});

// SSO - getAuthorizationUrl without domain or provider throws error
Deno.test('SSO - getAuthorizationUrl without domain or provider throws error', () => {
  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

  try {
    workos.sso.getAuthorizationUrl({
      clientId: 'proj_123',
      redirectUri: 'example.com/sso/workos/callback',
    });
    throw new Error('Expected to throw but did not');
  } catch (error: unknown) {
    if (error instanceof Error) {
      assertEquals(error.message, "Incomplete arguments. Need to specify either a 'connection', 'organization', 'domain', or 'provider'.");
    } else {
      throw new Error('Expected error to be an instance of Error');
    }
  }
});

// SSO - getAuthorizationUrl with provider
Deno.test('SSO - getAuthorizationUrl with provider', () => {
  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU', {
    apiHostname: 'api.workos.dev',
  });

  const url = workos.sso.getAuthorizationUrl({
    provider: 'Google',
    clientId: 'proj_123',
    redirectUri: 'example.com/sso/workos/callback',
  });

  assertEquals(
    url,
    'https://api.workos.dev/sso/authorize?client_id=proj_123&provider=Google&' +
      'redirect_uri=example.com%2Fsso%2Fworkos%2Fcallback&response_type=code',
  );
});

// SSO - getAuthorizationUrl with connection
Deno.test('SSO - getAuthorizationUrl with connection', () => {
  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU', {
    apiHostname: 'api.workos.dev',
  });

  const url = workos.sso.getAuthorizationUrl({
    connection: 'connection_123',
    clientId: 'proj_123',
    redirectUri: 'example.com/sso/workos/callback',
  });

  assertEquals(
    url,
    'https://api.workos.dev/sso/authorize?client_id=proj_123&connection=connection_123&' +
      'redirect_uri=example.com%2Fsso%2Fworkos%2Fcallback&response_type=code',
  );
});

// SSO - getAuthorizationUrl with organization
Deno.test('SSO - getAuthorizationUrl with organization', () => {
  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU', {
    apiHostname: 'api.workos.dev',
  });

  const url = workos.sso.getAuthorizationUrl({
    organization: 'organization_123',
    clientId: 'proj_123',
    redirectUri: 'example.com/sso/workos/callback',
  });

  assertEquals(
    url,
    'https://api.workos.dev/sso/authorize?client_id=proj_123&organization=organization_123&' +
      'redirect_uri=example.com%2Fsso%2Fworkos%2Fcallback&response_type=code',
  );
});

// SSO - getAuthorizationUrl with custom api hostname
Deno.test('SSO - getAuthorizationUrl with custom api hostname', () => {
  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU', {
    apiHostname: 'api.workos.dev',
  });

  const url = workos.sso.getAuthorizationUrl({
    domain: 'lyft.com',
    clientId: 'proj_123',
    redirectUri: 'example.com/sso/workos/callback',
  });

  assertEquals(
    url,
    'https://api.workos.dev/sso/authorize?client_id=proj_123&domain=lyft.com&' +
      'redirect_uri=example.com%2Fsso%2Fworkos%2Fcallback&response_type=code',
  );
});

// SSO - getAuthorizationUrl with state
Deno.test('SSO - getAuthorizationUrl with state', () => {
  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

  const url = workos.sso.getAuthorizationUrl({
    domain: 'lyft.com',
    clientId: 'proj_123',
    redirectUri: 'example.com/sso/workos/callback',
    state: 'custom state',
  });

  assertEquals(
    url,
    'https://api.workos.com/sso/authorize?client_id=proj_123&domain=lyft.com&' +
      'redirect_uri=example.com%2Fsso%2Fworkos%2Fcallback&response_type=code&state=custom+state',
  );
});

// SSO - getAuthorizationUrl with domainHint
Deno.test('SSO - getAuthorizationUrl with domainHint', () => {
  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

  const url = workos.sso.getAuthorizationUrl({
    domainHint: 'lyft.com',
    connection: 'connection_123',
    clientId: 'proj_123',
    redirectUri: 'example.com/sso/workos/callback',
    state: 'custom state',
  });

  const expectedUrl = 'https://api.workos.com/sso/authorize?client_id=proj_123&connection=connection_123&' +
    'domain_hint=lyft.com&redirect_uri=example.com%2Fsso%2Fworkos%2Fcallback&response_type=code&' +
    'state=custom+state';

  assertEquals(url, expectedUrl);
});

// SSO - getAuthorizationUrl with loginHint
Deno.test('SSO - getAuthorizationUrl with loginHint', () => {
  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

  const url = workos.sso.getAuthorizationUrl({
    loginHint: 'foo@workos.com',
    connection: 'connection_123',
    clientId: 'proj_123',
    redirectUri: 'example.com/sso/workos/callback',
    state: 'custom state',
  });

  const expectedUrl = 'https://api.workos.com/sso/authorize?client_id=proj_123&connection=connection_123&' +
    'login_hint=foo%40workos.com&redirect_uri=example.com%2Fsso%2Fworkos%2Fcallback&response_type=code&' +
    'state=custom+state';

  assertEquals(url, expectedUrl);
});

// SSO - getProfileAndToken with all information provided
Deno.test('SSO - getProfileAndToken with all information provided', async () => {
  setup();

  fetchOnce({
    access_token: '01DMEK0J53CVMC32CK5SE0KZ8Q',
    profile: {
      id: 'prof_123',
      idp_id: '123',
      organization_id: 'org_123',
      connection_id: 'conn_123',
      connection_type: 'OktaSAML',
      email: 'foo@test.com',
      first_name: 'foo',
      last_name: 'bar',
      role: {
        slug: 'admin',
      },
      groups: ['Admins', 'Developers'],
      raw_attributes: {
        email: 'foo@test.com',
        first_name: 'foo',
        last_name: 'bar',
        groups: ['Admins', 'Developers'],
        license: 'professional',
      },
      custom_attributes: {
        license: 'professional',
      },
    },
  });

  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');
  const { accessToken, profile } = await workos.sso.getProfileAndToken({
    code: 'authorization_code',
    clientId: 'proj_123',
  });

  // Check that fetch was called with correct body
  assertEquals(fetchBody(), {
    client_id: 'proj_123',
    client_secret: 'sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU',
    grant_type: 'authorization_code',
    code: 'authorization_code',
  });

  // Check headers
  const headers = fetchHeaders();
  assertEquals(headers?.['Authorization'], 'Bearer sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');
  assertEquals(headers?.['Content-Type'], 'application/x-www-form-urlencoded;charset=utf-8');

  // Check response data
  assertEquals(accessToken, '01DMEK0J53CVMC32CK5SE0KZ8Q');
  assertEquals(profile.id, 'prof_123');
  assertEquals(profile.connectionId, 'conn_123');
  assertEquals(profile.connectionType, 'OktaSAML');
  assertEquals(profile.email, 'foo@test.com');
  assertEquals(profile.firstName, 'foo');
  assertEquals(profile.lastName, 'bar');
  assertEquals(profile.groups, ['Admins', 'Developers']);
  assertEquals(profile.customAttributes.license, 'professional');
});

// SSO - getProfileAndToken without groups attribute
Deno.test('SSO - getProfileAndToken without groups attribute', async () => {
  setup();

  fetchOnce({
    access_token: '01DMEK0J53CVMC32CK5SE0KZ8Q',
    profile: {
      id: 'prof_123',
      idp_id: '123',
      organization_id: 'org_123',
      connection_id: 'conn_123',
      connection_type: 'OktaSAML',
      email: 'foo@test.com',
      first_name: 'foo',
      last_name: 'bar',
      role: {
        slug: 'admin',
      },
      raw_attributes: {
        email: 'foo@test.com',
        first_name: 'foo',
        last_name: 'bar',
      },
      custom_attributes: {},
    },
  });

  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');
  const { accessToken, profile } = await workos.sso.getProfileAndToken({
    code: 'authorization_code',
    clientId: 'proj_123',
  });

  // Check that fetch was called with correct body
  assertEquals(fetchBody(), {
    client_id: 'proj_123',
    client_secret: 'sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU',
    grant_type: 'authorization_code',
    code: 'authorization_code',
  });

  // Check headers
  const headers = fetchHeaders();
  assertEquals(headers?.['Authorization'], 'Bearer sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');
  assertEquals(headers?.['Content-Type'], 'application/x-www-form-urlencoded;charset=utf-8');

  // Check response data
  assertEquals(accessToken, '01DMEK0J53CVMC32CK5SE0KZ8Q');
  assertEquals(profile.id, 'prof_123');
  assertEquals(profile.groups, undefined);
});

// SSO - getProfile
Deno.test('SSO - getProfile calls the profile endpoint with access token', async () => {
  setup();

  fetchOnce({
    id: 'prof_123',
    idp_id: '123',
    organization_id: 'org_123',
    connection_id: 'conn_123',
    connection_type: 'OktaSAML',
    email: 'foo@test.com',
    first_name: 'foo',
    last_name: 'bar',
    role: {
      slug: 'admin',
    },
    groups: ['Admins', 'Developers'],
    raw_attributes: {
      email: 'foo@test.com',
      first_name: 'foo',
      last_name: 'bar',
      groups: ['Admins', 'Developers'],
    },
    custom_attributes: {},
  });

  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');
  const profile = await workos.sso.getProfile({
    accessToken: 'access_token',
  });

  // Check headers
  const headers = fetchHeaders();
  assertEquals(headers?.['Authorization'], 'Bearer access_token');

  assertEquals(profile.id, 'prof_123');
});

// SSO - deleteConnection
Deno.test('SSO - deleteConnection sends request to delete a Connection', async () => {
  setup();

  fetchOnce();

  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

  await workos.sso.deleteConnection('conn_123');

  const url = fetchURL();
  assertEquals(url?.includes('/connections/conn_123'), true);
});

// SSO - getConnection
Deno.test('SSO - getConnection requests a Connection', async () => {
  setup();

  // Cast to MockResponseData to satisfy type constraints
  fetchOnce(connectionResponse as unknown as MockResponseData);

  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

  const subject = await workos.sso.getConnection('conn_123');

  const url = fetchURL();
  assertEquals(url?.includes('/connections/conn_123'), true);

  assertEquals(subject.connectionType, 'OktaSAML');
});

// SSO - listConnections
Deno.test('SSO - listConnections requests a list of Connections', async () => {
  setup();

  fetchOnce({
    data: [connectionResponse],
    list_metadata: {},
  });

  const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

  const subject = await workos.sso.listConnections({
    organizationId: 'org_1234',
  });

  const url = fetchURL();
  assertEquals(url?.includes('/connections'), true);

  assertEquals(subject.data.length, 1);
});
