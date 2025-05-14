import { verifyDomain } from "../../../utils/organization-domains.ts";

export const handler = {
  async POST(req: Request) {
    try {
      const body = await req.json();
      const { domainId } = body;

      if (!domainId) {
        return new Response(
          JSON.stringify({
            message: "Domain ID is required",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const verifiedDomain = await verifyDomain(domainId);

      return new Response(JSON.stringify(verifiedDomain), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error verifying domain:", error);
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
