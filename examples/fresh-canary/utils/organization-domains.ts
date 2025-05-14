import { WorkOS } from "../../../mod.ts";

// Initialize the WorkOS client
const apiKey = Deno.env.get("WORKOS_API_KEY");
if (apiKey === null) {
  throw new Error("Environment variable WORKOS_API_KEY is required");
}
const workos = new WorkOS(apiKey);

// List all domains for an organization
export async function listDomains(organizationId?: string) {
  try {
    // Construct the URL to fetch domains for an organization
    const path = organizationId
      ? `/organization_domains?organization_id=${organizationId}`
      : "/organization_domains";

    const { data } = await workos.get(path);
    return data;
  } catch (error) {
    console.error("Error listing domains:", error);
    throw error;
  }
}

// Add a domain to an organization
export async function addDomain(organizationId: string, domain: string) {
  try {
    const newDomain = await workos.organizationDomains.create({
      organizationId,
      domain,
    });
    return newDomain;
  } catch (error) {
    console.error("Error adding domain:", error);
    throw error;
  }
}

// Verify a domain
export async function verifyDomain(domainId: string) {
  try {
    const verifiedDomain = await workos.organizationDomains.verify(domainId);
    return verifiedDomain;
  } catch (error) {
    console.error("Error verifying domain:", error);
    throw error;
  }
}

// Delete a domain
export async function deleteDomain(domainId: string) {
  try {
    // Delete organization domain using the WorkOS API
    await workos.delete(`/organization_domains/${domainId}`);
    return true;
  } catch (error) {
    console.error("Error deleting domain:", error);
    throw error;
  }
}

// List all organizations
export async function listOrganizations() {
  try {
    const { data } = await workos.get("/organizations");
    return data;
  } catch (error) {
    console.error("Error listing organizations:", error);
    throw error;
  }
}
