// Import Deno testing utilities
import {
  assertEquals,
  beforeEach,
  describe,
  it,
} from "../../tests/deno-test-setup.ts";

import { fetchBody, fetchOnce, resetMockFetch } from '../common/utils/test-utils.ts';
import { WorkOS } from '../workos.ts';
import generateLinkInvalid from './fixtures/generate-link-invalid.json' with { type: "json" };
import generateLink from './fixtures/generate-link.json' with { type: "json" };
import { GeneratePortalLinkIntent } from './interfaces/generate-portal-link-intent.interface.ts';

const workos = new WorkOS('sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU');

// Main test suite
describe('Portal', () => {
  // Reset fetch mocks before each test
  beforeEach(() => {
    resetMockFetch();
  });

  describe('generateLink', () => {
    describe('with a valid organization', () => {
      describe('with the sso intent', () => {
        it('returns an Admin Portal link', async () => {
          fetchOnce(generateLink, { status: 201 });

          const { link } = await workos.portal.generateLink({
            intent: GeneratePortalLinkIntent.SSO,
            organization: 'org_01EHQMYV6MBK39QC5PZXHY59C3',
            returnUrl: 'https://www.example.com',
          });

          assertEquals(fetchBody(), {
            intent: GeneratePortalLinkIntent.SSO,
            organization: 'org_01EHQMYV6MBK39QC5PZXHY59C3',
            return_url: 'https://www.example.com',
          });
          assertEquals(link, 'https://id.workos.com/portal/launch?secret=secret');
        });
      });

      describe('with the domain_verification intent', () => {
        it('returns an Admin Portal link', async () => {
          fetchOnce(generateLink, { status: 201 });

          const { link } = await workos.portal.generateLink({
            intent: GeneratePortalLinkIntent.DomainVerification,
            organization: 'org_01EHQMYV6MBK39QC5PZXHY59C3',
            returnUrl: 'https://www.example.com',
          });

          assertEquals(fetchBody(), {
            intent: GeneratePortalLinkIntent.DomainVerification,
            organization: 'org_01EHQMYV6MBK39QC5PZXHY59C3',
            return_url: 'https://www.example.com',
          });
          assertEquals(link, 'https://id.workos.com/portal/launch?secret=secret');
        });
      });

      describe('with the dsync intent', () => {
        it('returns an Admin Portal link', async () => {
          fetchOnce(generateLink, { status: 201 });

          const { link } = await workos.portal.generateLink({
            intent: GeneratePortalLinkIntent.DSync,
            organization: 'org_01EHQMYV6MBK39QC5PZXHY59C3',
            returnUrl: 'https://www.example.com',
          });

          assertEquals(fetchBody(), {
            intent: GeneratePortalLinkIntent.DSync,
            organization: 'org_01EHQMYV6MBK39QC5PZXHY59C3',
            return_url: 'https://www.example.com',
          });
          assertEquals(link, 'https://id.workos.com/portal/launch?secret=secret');
        });
      });

      describe('with the `audit_logs` intent', () => {
        it('returns an Admin Portal link', async () => {
          fetchOnce(generateLink, { status: 201 });

          const { link } = await workos.portal.generateLink({
            intent: GeneratePortalLinkIntent.AuditLogs,
            organization: 'org_01EHQMYV6MBK39QC5PZXHY59C3',
            returnUrl: 'https://www.example.com',
          });

          assertEquals(fetchBody(), {
            intent: GeneratePortalLinkIntent.AuditLogs,
            organization: 'org_01EHQMYV6MBK39QC5PZXHY59C3',
            return_url: 'https://www.example.com',
          });
          assertEquals(link, 'https://id.workos.com/portal/launch?secret=secret');
        });
      });

      describe('with the `log_streams` intent', () => {
        it('returns an Admin Portal link', async () => {
          fetchOnce(generateLink, { status: 201 });

          const { link } = await workos.portal.generateLink({
            intent: GeneratePortalLinkIntent.LogStreams,
            organization: 'org_01EHQMYV6MBK39QC5PZXHY59C3',
            returnUrl: 'https://www.example.com',
          });

          assertEquals(fetchBody(), {
            intent: GeneratePortalLinkIntent.LogStreams,
            organization: 'org_01EHQMYV6MBK39QC5PZXHY59C3',
            return_url: 'https://www.example.com',
          });
          assertEquals(link, 'https://id.workos.com/portal/launch?secret=secret');
        });
      });
      
      describe('with the `certificate_renewal` intent', () => {
        it('returns an Admin Portal link', async () => {
          fetchOnce(generateLink, { status: 201 });

          const { link } = await workos.portal.generateLink({
            intent: GeneratePortalLinkIntent.CertificateRenewal,
            organization: 'org_01EHQMYV6MBK39QC5PZXHY59C3',
            returnUrl: 'https://www.example.com',
          });

          assertEquals(fetchBody(), {
            intent: GeneratePortalLinkIntent.CertificateRenewal,
            organization: 'org_01EHQMYV6MBK39QC5PZXHY59C3',
            return_url: 'https://www.example.com',
          });
          assertEquals(link, 'https://id.workos.com/portal/launch?secret=secret');
        });
      });
    });

    describe('with an invalid organization', () => {
      it('throws an error', async () => {
        fetchOnce(generateLinkInvalid, {
          status: 400,
          headers: { 'X-Request-ID': 'a-request-id' },
        });

        try {
          await workos.portal.generateLink({
            intent: GeneratePortalLinkIntent.SSO,
            organization: 'bogus-id',
            returnUrl: 'https://www.example.com',
          });
          throw new Error('Expected to throw but did not');
        } catch (error) {
          const err = error as Error;
          assertEquals(err instanceof Error, true);
          assertEquals(err.message.includes('Could not find an organization with the id, bogus-id.'), true);
        }
        
        assertEquals(fetchBody(), {
          intent: GeneratePortalLinkIntent.SSO,
          organization: 'bogus-id',
          return_url: 'https://www.example.com',
        });
      });
    });
  });
});
