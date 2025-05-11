// Import Deno testing utilities
import {
  assertEquals,
  beforeEach,
  describe,
  expect,
  it,
} from "../../tests/deno-test-setup.ts";

import { 
  fetchBody, 
  fetchHeaders, 
  fetchOnce, 
  fetchSearchParams, 
  fetchURL, 
  resetMockFetch,
  type MockResponseData 
} from '../common/utils/test-utils.ts';

import { WorkOS } from '../workos.ts';
import { type ConnectionResponse, ConnectionType } from './interfaces/index.ts';
import type { ListResponse } from '../common/interfaces/index.ts';

describe('SSO', () => {
  beforeEach(() => {
    resetMockFetch();
  });

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

  describe('SSO', () => {
    describe('with options', () => {
      it('requests Connections with query parameters', async () => {
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

        expect(fetchSearchParams()).toMatchObject({
          connection_type: ConnectionType.OktaSAML,
          organization_id: 'org_123',
        });
      });
    });

    describe('getAuthorizationUrl', () => {
      describe('with no custom api hostname', () => {
        it('generates an authorize url with the default api hostname', () => {
          const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

          const url = workos.sso.getAuthorizationUrl({
            domain: 'lyft.com',
            clientId: 'proj_123',
            redirectUri: 'example.com/sso/workos/callback',
          });

          assertEquals(url, "https://api.workos.com/sso/authorize?client_id=proj_123&domain=lyft.com&redirect_uri=example.com%2Fsso%2Fworkos%2Fcallback&response_type=code");
        });
      });

      describe('with no domain or provider', () => {
        it('throws an error for incomplete arguments', () => {
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
      });

      describe('with a provider', () => {
        it('generates an authorize url with the provider', () => {
          const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU', {
            apiHostname: 'api.workos.dev',
          });

          const url = workos.sso.getAuthorizationUrl({
            provider: 'Google',
            clientId: 'proj_123',
            redirectUri: 'example.com/sso/workos/callback',
          });

          assertEquals(url, "https://api.workos.dev/sso/authorize?client_id=proj_123&provider=Google&redirect_uri=example.com%2Fsso%2Fworkos%2Fcallback&response_type=code");
        });
      });

      describe('with a connection', () => {
        it('generates an authorize url with the connection', () => {
          const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU', {
            apiHostname: 'api.workos.dev',
          });

          const url = workos.sso.getAuthorizationUrl({
            connection: 'connection_123',
            clientId: 'proj_123',
            redirectUri: 'example.com/sso/workos/callback',
          });

          assertEquals(url, "https://api.workos.dev/sso/authorize?client_id=proj_123&connection=connection_123&redirect_uri=example.com%2Fsso%2Fworkos%2Fcallback&response_type=code");
        });
      });

      describe('with an `organization`', () => {
        it('generates an authorization URL with the organization', () => {
          const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU', {
            apiHostname: 'api.workos.dev',
          });

          const url = workos.sso.getAuthorizationUrl({
            organization: 'organization_123',
            clientId: 'proj_123',
            redirectUri: 'example.com/sso/workos/callback',
          });

          assertEquals(url, "https://api.workos.dev/sso/authorize?client_id=proj_123&organization=organization_123&redirect_uri=example.com%2Fsso%2Fworkos%2Fcallback&response_type=code");
        });
      });

      describe('with a custom api hostname', () => {
        it('generates an authorize url with the custom api hostname', () => {
          const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU', {
            apiHostname: 'api.workos.dev',
          });

          const url = workos.sso.getAuthorizationUrl({
            domain: 'lyft.com',
            clientId: 'proj_123',
            redirectUri: 'example.com/sso/workos/callback',
          });

          assertEquals(url, "https://api.workos.dev/sso/authorize?client_id=proj_123&domain=lyft.com&redirect_uri=example.com%2Fsso%2Fworkos%2Fcallback&response_type=code");
        });
      });

      describe('with state', () => {
        it('generates an authorize url with the provided state', () => {
          const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

          const url = workos.sso.getAuthorizationUrl({
            domain: 'lyft.com',
            clientId: 'proj_123',
            redirectUri: 'example.com/sso/workos/callback',
            state: 'custom state',
          });

          assertEquals(url, "https://api.workos.com/sso/authorize?client_id=proj_123&domain=lyft.com&redirect_uri=example.com%2Fsso%2Fworkos%2Fcallback&response_type=code&state=custom+state");
        });
      });

      describe('with domainHint', () => {
        it('generates an authorize url with the provided domain hint', () => {
          const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

          const url = workos.sso.getAuthorizationUrl({
            domainHint: 'lyft.com',
            connection: 'connection_123',
            clientId: 'proj_123',
            redirectUri: 'example.com/sso/workos/callback',
            state: 'custom state',
          });

          assertEquals(url, "https://api.workos.com/sso/authorize?client_id=proj_123&connection=connection_123&domain_hint=lyft.com&redirect_uri=example.com%2Fsso%2Fworkos%2Fcallback&response_type=code&state=custom+state");
        });
      });

      describe('with loginHint', () => {
        it('generates an authorize url with the provided login hint', () => {
          const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

          const url = workos.sso.getAuthorizationUrl({
            loginHint: 'foo@workos.com',
            connection: 'connection_123',
            clientId: 'proj_123',
            redirectUri: 'example.com/sso/workos/callback',
            state: 'custom state',
          });

          assertEquals(url, "https://api.workos.com/sso/authorize?client_id=proj_123&connection=connection_123&login_hint=foo%40workos.com&redirect_uri=example.com%2Fsso%2Fworkos%2Fcallback&response_type=code&state=custom+state");
        });
      });
    });

    describe('getProfileAndToken', () => {
      describe('with all information provided', () => {
        it('sends a request to the WorkOS api for a profile', async () => {
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
      });

      describe('without a groups attribute', () => {
        it('sends a request to the WorkOS api for a profile', async () => {
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
      });
    });

    describe('getProfile', () => {
      it('calls the `/sso/profile` endpoint with the provided access token', async () => {
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
    });

    describe('deleteConnection', () => {
      it('sends request to delete a Connection', async () => {
        fetchOnce();

        const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

        await workos.sso.deleteConnection('conn_123');

        const url = fetchURL();
        assertEquals(url?.includes('/connections/conn_123'), true);
      });
    });

    describe('getConnection', () => {
      it(`requests a Connection`, async () => {
        // Cast to MockResponseData to satisfy type constraints
        fetchOnce(connectionResponse as unknown as MockResponseData);

        const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

        const subject = await workos.sso.getConnection('conn_123');

        const url = fetchURL();
        assertEquals(url?.includes('/connections/conn_123'), true);

        assertEquals(subject.connectionType, 'OktaSAML');
      });
    });

    describe('listConnections', () => {
      it(`requests a list of Connections`, async () => {
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
    });
  });
});
