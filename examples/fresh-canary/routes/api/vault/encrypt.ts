import { WorkOS } from "../../../../../src/workos.ts";
import { Handlers } from "$fresh/server.ts";

const apiKey = Deno.env.get("WORKOS_API_KEY") || "";
const workos = new WorkOS(apiKey);

export const handler: Handlers = {
  async POST(req) {
    try {
      const body = await req.json();
      const { data } = body;
      
      if (!data) {
        return new Response(JSON.stringify({ 
          error: "Missing required field: data" 
        }), { 
          status: 400, 
          headers: { "Content-Type": "application/json" } 
        });
      }

      // A simple context for demonstration purposes
      const context = { 
        application: "demo",
        environment: "development" 
      };

      const encryptedData = await workos.vault.encrypt(
        data,
        context
      );

      return new Response(JSON.stringify({ 
        encryptedData 
      }), { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      });
    } catch (error: unknown) {
      console.error("Encryption error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to encrypt data";
      return new Response(JSON.stringify({ 
        error: errorMessage 
      }), { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      });
    }
  },
};