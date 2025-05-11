// Import Deno standard testing library
import { assertEquals } from '@std/assert';

import { fetchBody, fetchOnce, fetchURL, resetMockFetch } from '../common/utils/test-utils.ts';
import { WorkOS } from '../workos.ts';
import getOrganizationDomainPending from './fixtures/get-organization-domain-pending.json' with { type: 'json' };
import getOrganizationDomainVerified from './fixtures/get-organization-domain-verified.json' with { type: 'json' };
import { OrganizationDomainState } from './interfaces/index.ts';

const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

// Setup function to reset mock fetch before each test
function setup() {
  resetMockFetch();
}

// OrganizationDomains - get
Deno.test('OrganizationDomains - requests a verified Organization Domain', async () => {
  setup();
  
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

Deno.test('OrganizationDomains - requests a pending Organization Domain', async () => {
  setup();
  
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

// OrganizationDomains - verify
Deno.test('OrganizationDomains - start Organization Domain verification flow', async () => {
  setup();
  
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

// OrganizationDomains - create
Deno.test('OrganizationDomains - creates an Organization Domain', async () => {
  setup();
  
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
