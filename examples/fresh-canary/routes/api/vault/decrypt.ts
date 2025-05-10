import { WorkOS } from "../../../../../src/workos.ts";
import { Handlers } from "$fresh/server.ts";

const apiKey = Deno.env.get("WORKOS_API_KEY") || "";
const workos = new WorkOS(apiKey);

export const handler: Handlers = {
  async POST(req) {
    try {
      const body = await req.json();
      const { encryptedData } = body;
      
      if (!encryptedData) {
        return new Response(JSON.stringify({ 
          error: "Missing required field: encryptedData" 
        }), { 
          status: 400, 
          headers: { "Content-Type": "application/json" } 
        });
      }

      const decryptedData = await workos.vault.decrypt(encryptedData);

      return new Response(JSON.stringify({ 
        decryptedData 
      }), { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      });
    } catch (error: unknown) {
      console.error("Decryption error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to decrypt data";
      return new Response(JSON.stringify({ 
        error: errorMessage 
      }), { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      });
    }
  },
};