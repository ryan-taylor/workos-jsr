import { FreshContext } from "@workos/fresh";
import { redirect } from "$fresh/server.ts";

export default async function CallbackPage(req: Request, ctx: FreshContext) {
  const code = new URL(req.url).searchParams.get("code");
  if (!code) {
    return new Response("No code provided", { status: 400 });
  }

  try {
    const profile = await ctx.workos.sso.getProfileAndToken(code);
    await ctx.workos.setSession(profile);
    return redirect("/dashboard");
  } catch (error) {
    console.error("Authentication error:", error);
    return new Response("Authentication failed", { status: 500 });
  }
}
