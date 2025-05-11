// Import Deno testing utilities
import {
  assertEquals,
  beforeEach,
  describe,
  it,
} from "../../tests/deno-test-setup.ts";

import { fetchBody, fetchHeaders, fetchOnce, fetchSearchParams, fetchURL, resetMockFetch } from '../common/utils/test-utils.ts';
import { WorkOS } from '../workos.ts';
import clearStripeCustomerId from './fixtures/clear-stripe-customer-id.json' with { type: "json" };
import createOrganizationInvalid from './fixtures/create-organization-invalid.json' with { type: "json" };
import createOrganization from './fixtures/create-organization.json' with { type: "json" };
import getOrganization from './fixtures/get-organization.json' with { type: "json" };
import listOrganizationsFixture from './fixtures/list-organizations.json' with { type: "json" };
import listOrganizationRolesFixture from './fixtures/list-organization-roles.json' with { type: "json" };
import updateOrganization from './fixtures/update-organization.json' with { type: "json" };
import setStripeCustomerId from './fixtures/set-stripe-customer-id.json' with { type: "json" };
import setStripeCustomerIdDisabled from './fixtures/set-stripe-customer-id-disabled.json' with { type: "json" };
import { DomainDataState } from './interfaces/index.ts';

const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

// Main test suite
describe('Organizations', () => {
  // Reset fetch mocks before each test
  beforeEach(() => {
    resetMockFetch();
  });

  describe('listOrganizations', () => {
    describe('without any options', () => {
      it('returns organizations and metadata', async () => {
        fetchOnce(listOrganizationsFixture);

        const { data, listMetadata } = await workos.organizations.listOrganizations();

        assertEquals(fetchSearchParams(), {
          order: 'desc',
        });
        
        const url = fetchURL();
        assertEquals(url?.includes('/organizations'), true);

        assertEquals(data.length, 7);

        assertEquals(listMetadata, {
          after: null,
          before: 'before-id',
        });
      });
    });

    describe('with the domain option', () => {
      it('forms the proper request to the API', async () => {
        fetchOnce(listOrganizationsFixture);

        const { data } = await workos.organizations.listOrganizations({
          domains: ['example.com', 'example2.com'],
        });

        assertEquals(fetchSearchParams(), {
          domains: 'example.com,example2.com',
          order: 'desc',
        });

        const url = fetchURL();
        assertEquals(url?.includes('/organizations'), true);

        assertEquals(data.length, 7);
      });
    });

    describe('with the before option', () => {
      it('forms the proper request to the API', async () => {
        fetchOnce(listOrganizationsFixture);

        const { data } = await workos.organizations.listOrganizations({
          before: 'before-id',
        });

        assertEquals(fetchSearchParams(), {
          before: 'before-id',
          order: 'desc',
        });

        const url = fetchURL();
        assertEquals(url?.includes('/organizations'), true);

        assertEquals(data.length, 7);
      });
    });

    describe('with the after option', () => {
      it('forms the proper request to the API', async () => {
        fetchOnce(listOrganizationsFixture);

        const { data } = await workos.organizations.listOrganizations({
          after: 'after-id',
        });

        assertEquals(fetchSearchParams(), {
          after: 'after-id',
          order: 'desc',
        });

        const url = fetchURL();
        assertEquals(url?.includes('/organizations'), true);

        assertEquals(data.length, 7);
      });
    });

    describe('with the limit option', () => {
      it('forms the proper request to the API', async () => {
        fetchOnce(listOrganizationsFixture);

        const { data } = await workos.organizations.listOrganizations({
          limit: 10,
        });

        assertEquals(fetchSearchParams(), {
          limit: '10',
          order: 'desc',
        });

        const url = fetchURL();
        assertEquals(url?.includes('/organizations'), true);

        assertEquals(data.length, 7);
      });
    });
  });

  describe('createOrganization', () => {
    describe('with an idempotency key', () => {
      it('includes an idempotency key with request', async () => {
        fetchOnce(createOrganization, { status: 201 });

        await workos.organizations.createOrganization(
          {
            domains: ['example.com'],
            name: 'Test Organization',
          },
          {
            idempotencyKey: 'the-idempotency-key',
          },
        );

        const headers = fetchHeaders();
        assertEquals(headers?.['Idempotency-Key'], 'the-idempotency-key');
        
        assertEquals(fetchBody(), {
          domains: ['example.com'],
          name: 'Test Organization',
        });
      });
    });

    describe('with a valid payload', () => {
      describe('with `domains`', () => {
        it('creates an organization', async () => {
          fetchOnce(createOrganization, { status: 201 });

          const subject = await workos.organizations.createOrganization({
            domains: ['example.com'],
            name: 'Test Organization',
          });

          assertEquals(fetchBody(), {
            domains: ['example.com'],
            name: 'Test Organization',
          });
          assertEquals(subject.id, 'org_01EHT88Z8J8795GZNQ4ZP1J81T');
          assertEquals(subject.name, 'Test Organization');
          assertEquals(subject.domains.length, 1);
        });
      });

      describe('with `domain_data`', () => {
        it('creates an organization', async () => {
          fetchOnce(createOrganization, { status: 201 });

          const subject = await workos.organizations.createOrganization({
            domainData: [
              { domain: 'example.com', state: DomainDataState.Verified },
            ],
            name: 'Test Organization',
          });

          assertEquals(fetchBody(), {
            domain_data: [{ domain: 'example.com', state: 'verified' }],
            name: 'Test Organization',
          });
          assertEquals(subject.id, 'org_01EHT88Z8J8795GZNQ4ZP1J81T');
          assertEquals(subject.name, 'Test Organization');
          assertEquals(subject.domains.length, 1);
        });
      });

      it('adds metadata to the request', async () => {
        fetchOnce(createOrganization, { status: 201 });

        await workos.organizations.createOrganization({
          name: 'My organization',
          metadata: { key: 'value' },
        });

        const body = fetchBody() as Record<string, unknown>;
        assertEquals(body.metadata, { key: 'value' });
      });
    });

    describe('with an invalid payload', () => {
      it('returns an error', async () => {
        fetchOnce(createOrganizationInvalid, {
          status: 409,
          headers: { 'X-Request-ID': 'a-request-id' },
        });

        try {
          await workos.organizations.createOrganization({
            domains: ['example.com'],
            name: 'Test Organization',
          });
          throw new Error('Expected to throw but did not');
        } catch (error) {
          const err = error as Error;
          assertEquals(err instanceof Error, true);
          assertEquals(err.message.includes('An Organization with the domain example.com already exists.'), true);
        }
        
        assertEquals(fetchBody(), {
          domains: ['example.com'],
          name: 'Test Organization',
        });
      });
    });
  });

  describe('getOrganization', () => {
    it(`requests an Organization`, async () => {
      fetchOnce(getOrganization);
      const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

      const subject = await workos.organizations.getOrganization(
        'org_01EHT88Z8J8795GZNQ4ZP1J81T',
      );

      const url = fetchURL();
      assertEquals(url?.includes('/organizations/org_01EHT88Z8J8795GZNQ4ZP1J81T'), true);
      
      assertEquals(subject.id, 'org_01EHT88Z8J8795GZNQ4ZP1J81T');
      assertEquals(subject.name, 'Test Organization 3');
      assertEquals(subject.allowProfilesOutsideOrganization, false);
      assertEquals(subject.domains, [
        {
          object: 'organization_domain',
          id: 'org_domain_01EHT88Z8WZEFWYPM6EC9BX2R8',
          domain: 'example.com',
          state: 'verified',
          verificationStrategy: 'dns',
          verificationToken: 'xB8SeACdKJQP9DP4CahU4YuQZ',
        },
      ]);
    });
  });

  describe('getOrganizationByExternalId', () => {
    it('sends request', async () => {
      const externalId = 'user_external_id';
      const apiResponse = {
        ...getOrganization,
        external_id: externalId,
      };
      fetchOnce(apiResponse);

      const organization = await workos.organizations.getOrganizationByExternalId(externalId);

      const url = fetchURL();
      assertEquals(url?.includes(`/organizations/external_id/${externalId}`), true);
      
      assertEquals(organization.id, apiResponse.id);
      assertEquals(organization.externalId, apiResponse.external_id);
    });
  });

  describe('deleteOrganization', () => {
    it('sends request to delete an Organization', async () => {
      fetchOnce();
      const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

      await workos.organizations.deleteOrganization(
        'org_01EHT88Z8J8795GZNQ4ZP1J81T',
      );

      const url = fetchURL();
      assertEquals(url?.includes('/organizations/org_01EHT88Z8J8795GZNQ4ZP1J81T'), true);
    });
  });

  describe('updateOrganization', () => {
    describe('with a valid payload', () => {
      describe('with `domains', () => {
        it('updates an organization', async () => {
          fetchOnce(updateOrganization, { status: 201 });

          const subject = await workos.organizations.updateOrganization({
            organization: 'org_01EHT88Z8J8795GZNQ4ZP1J81T',
            domains: ['example.com'],
            name: 'Test Organization 2',
          });

          assertEquals(fetchBody(), {
            domains: ['example.com'],
            name: 'Test Organization 2',
          });
          assertEquals(subject.id, 'org_01EHT88Z8J8795GZNQ4ZP1J81T');
          assertEquals(subject.name, 'Test Organization 2');
          assertEquals(subject.domains.length, 1);
        });
      });

      describe('with `domain_data`', () => {
        it('updates an organization', async () => {
          fetchOnce(updateOrganization, { status: 201 });

          const subject = await workos.organizations.updateOrganization({
            organization: 'org_01EHT88Z8J8795GZNQ4ZP1J81T',
            domainData: [
              { domain: 'example.com', state: DomainDataState.Verified },
            ],
          });

          assertEquals(fetchBody(), {
            domain_data: [{ domain: 'example.com', state: 'verified' }],
          });
          assertEquals(subject.id, 'org_01EHT88Z8J8795GZNQ4ZP1J81T');
          assertEquals(subject.name, 'Test Organization 2');
          assertEquals(subject.domains.length, 1);
        });
      });

      it('adds metadata to the request', async () => {
        fetchOnce(updateOrganization, { status: 201 });

        await workos.organizations.updateOrganization({
          organization: 'org_01EHT88Z8J8795GZNQ4ZP1J81T',
          metadata: { key: 'value' },
        });

        assertEquals(fetchBody(), {
          metadata: { key: 'value' },
        });
      });
    });

    describe('when given `stripeCustomerId`', () => {
      it("updates the organization's Stripe customer ID", async () => {
        fetchOnce(setStripeCustomerId);

        const subject = await workos.organizations.updateOrganization({
          organization: 'org_01EHT88Z8J8795GZNQ4ZP1J81T',
          stripeCustomerId: 'cus_MX8J9nfK4lP2Yw',
        });

        const body = fetchBody() as Record<string, unknown>;
        assertEquals(body.stripe_customer_id, 'cus_MX8J9nfK4lP2Yw');

        assertEquals(subject.stripeCustomerId, 'cus_MX8J9nfK4lP2Yw');
      });

      it("clears the organization's Stripe customer ID with a `null` value", async () => {
        fetchOnce(clearStripeCustomerId);

        const subject = await workos.organizations.updateOrganization({
          organization: 'org_01EHT88Z8J8795GZNQ4ZP1J81T',
          stripeCustomerId: null,
        });

        assertEquals(fetchBody(), {
          stripe_customer_id: null,
        });

        assertEquals(subject.stripeCustomerId, undefined);
      });

      describe('when the feature is not enabled', () => {
        it('returns an error', async () => {
          fetchOnce(setStripeCustomerIdDisabled, { status: 422 });

          try {
            await workos.organizations.updateOrganization({
              organization: 'org_01EHT88Z8J8795GZNQ4ZP1J81T',
              stripeCustomerId: 'cus_MX8J9nfK4lP2Yw',
            });
            throw new Error('Expected to throw but did not');
          } catch (error) {
            const err = error as Error;
            assertEquals(err instanceof Error, true);
            assertEquals(err.message.includes('stripe_customer_id is not enabled for this environment'), true);
          }

          assertEquals(fetchBody(), {
            stripe_customer_id: 'cus_MX8J9nfK4lP2Yw',
          });
        });
      });
    });
  });

  describe('listOrganizationRoles', () => {
    it('returns roles for the organization', async () => {
      fetchOnce(listOrganizationRolesFixture);

      const { data, object } = await workos.organizations.listOrganizationRoles(
        {
          organizationId: 'org_01EHT88Z8J8795GZNQ4ZP1J81T',
        },
      );

      const url = fetchURL();
      assertEquals(url?.includes('/organizations/org_01EHT88Z8J8795GZNQ4ZP1J81T/roles'), true);

      assertEquals(object, 'list');
      assertEquals(data.length, 3);
      assertEquals(data, [
        {
          object: 'role',
          id: 'role_01EHQMYV6MBK39QC5PZXHY59C5',
          name: 'Admin',
          slug: 'admin',
          description: null,
          permissions: ['posts:create', 'posts:delete'],
          type: 'EnvironmentRole',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          object: 'role',
          id: 'role_01EHQMYV6MBK39QC5PZXHY59C3',
          name: 'Member',
          slug: 'member',
          description: null,
          permissions: [],
          type: 'EnvironmentRole',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          object: 'role',
          id: 'role_01EHQMYV6MBK39QC5PZXHY59C3',
          name: 'OrganizationMember',
          slug: 'org-member',
          description: null,
          permissions: ['posts:read'],
          type: 'OrganizationRole',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
    });
  });
});
