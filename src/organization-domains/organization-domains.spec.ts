// Import Deno testing utilities
import {
  assertEquals,
  beforeEach,
  describe,
  it,
} from "../../tests/deno-test-setup.ts";

import { fetchBody, fetchOnce, fetchURL, resetMockFetch } from '../common/utils/test-utils.ts';
import { WorkOS } from '../workos.ts';
import getOrganizationDomainPending from './fixtures/get-organization-domain-pending.json' with { type: "json" };
import getOrganizationDomainVerified from './fixtures/get-organization-domain-verified.json' with { type: "json" };
import { OrganizationDomainState } from './interfaces/index.ts';

const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

// Main test suite
describe('OrganizationDomains', () => {
  // Reset fetch mocks before each test
  beforeEach(() => {
    resetMockFetch();
  });

  describe('get', () => {
    it('requests an Organization Domain', async () => {
      fetchOnce(getOrganizationDomainVerified);

      const subject = await workos.organizationDomains.get(
        'org_domain_01HCZRAP3TPQ0X0DKJHR32TATG',
      );

      const url = fetchURL();
      assertEquals(
        url?.includes('/organization_domains/org_domain_01HCZRAP3TPQ0X0DKJHR32TATG'),
        true,
        `URL ${url} should contain the organization domain ID`
      );
      assertEquals(subject.id, 'org_domain_01HCZRAP3TPQ0X0DKJHR32TATG');
      assertEquals(subject.domain, 'workos.com');
      assertEquals(subject.organizationId, 'org_01JR8C1EHCRPV4B4XP4W2B9X1M');
      assertEquals(subject.state, OrganizationDomainState.Verified);
      assertEquals(subject.verificationToken, null);
      assertEquals(subject.verificationStrategy, 'manual');
    });

    it('requests an Organization Domain', async () => {
      fetchOnce(getOrganizationDomainPending);

      const subject = await workos.organizationDomains.get(
        'org_domain_01HD50K7EPWCMNPGMKXKKE14XT',
      );

      const url = fetchURL();
      assertEquals(
        url?.includes('/organization_domains/org_domain_01HD50K7EPWCMNPGMKXKKE14XT'),
        true,
        `URL ${url} should contain the organization domain ID`
      );
      assertEquals(subject.id, 'org_domain_01HD50K7EPWCMNPGMKXKKE14XT');
      assertEquals(subject.domain, 'workos.com');
      assertEquals(subject.organizationId, 'org_01JR8C1EHCRPV4B4XP4W2B9X1M');
      assertEquals(subject.state, OrganizationDomainState.Pending);
      assertEquals(subject.verificationToken, 'F06PGMsZIO0shrveGWuGxgCj7');
      assertEquals(subject.verificationStrategy, 'dns');
    });
  });

  describe('verify', () => {
    it('start Organization Domain verification flow', async () => {
      fetchOnce(getOrganizationDomainPending);

      const subject = await workos.organizationDomains.verify(
        'org_domain_01HD50K7EPWCMNPGMKXKKE14XT',
      );

      const url = fetchURL();
      assertEquals(
        url?.includes('/organization_domains/org_domain_01HD50K7EPWCMNPGMKXKKE14XT/verify'),
        true,
        `URL ${url} should contain the organization domain verify endpoint`
      );
      assertEquals(subject.id, 'org_domain_01HD50K7EPWCMNPGMKXKKE14XT');
      assertEquals(subject.domain, 'workos.com');
      assertEquals(subject.organizationId, 'org_01JR8C1EHCRPV4B4XP4W2B9X1M');
      assertEquals(subject.state, OrganizationDomainState.Pending);
      assertEquals(subject.verificationToken, 'F06PGMsZIO0shrveGWuGxgCj7');
      assertEquals(subject.verificationStrategy, 'dns');
    });
  });

  describe('create', () => {
    it('creates an Organization Domain', async () => {
      fetchOnce(getOrganizationDomainPending);

      const subject = await workos.organizationDomains.create({
        organizationId: 'org_01EHT88Z8J8795GZNQ4ZP1J81T',
        domain: 'workos.com',
      });

      const url = fetchURL();
      assertEquals(
        url?.includes('/organization_domains'),
        true,
        `URL ${url} should contain the organization domains endpoint`
      );
      
      const body = fetchBody();
      assertEquals(body, {
        domain: 'workos.com',
        organization_id: 'org_01EHT88Z8J8795GZNQ4ZP1J81T',
      });

      assertEquals(subject.id, 'org_domain_01HD50K7EPWCMNPGMKXKKE14XT');
      assertEquals(subject.domain, 'workos.com');
      assertEquals(subject.organizationId, 'org_01JR8C1EHCRPV4B4XP4W2B9X1M');
      assertEquals(subject.state, OrganizationDomainState.Pending);
      assertEquals(subject.verificationToken, 'F06PGMsZIO0shrveGWuGxgCj7');
      assertEquals(subject.verificationStrategy, 'dns');
    });
  });
});
