import { listDomains } from "../../../utils/organization-domains.ts";

export const handler = {
  async GET(req: Request) {
    try {
      const url = new URL(req.url);
      const organizationId = url.searchParams.get("organization_id") ||
        undefined;

      const domains = await listDomains(organizationId);

      return new Response(JSON.stringify(domains), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error listing domains:", error);
      return new Response(
        JSON.stringify({
          message: error instanceof Error
            ? error.message
            : "An unknown error occurred",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
