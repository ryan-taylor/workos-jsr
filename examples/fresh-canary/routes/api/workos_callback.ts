import { WorkOS } from "@ryantaylor/workos";

const workos = new WorkOS(Deno.env.get("WORKOS_API_KEY"));

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")!;
  const profile = await workos.sso.getProfile(code);
  return Response.json(profile);
}
