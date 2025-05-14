import { addDomain } from "../../../utils/organization-domains.ts";

export const handler = {
  async POST(req: Request) {
    try {
      const body = await req.json();
      const { organizationId, domain } = body;

      if (!organizationId || !domain) {
        return new Response(
          JSON.stringify({
            message: "Organization ID and domain are required",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const newDomain = await addDomain(organizationId, domain);

      return new Response(JSON.stringify(newDomain), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error adding domain:", error);
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
