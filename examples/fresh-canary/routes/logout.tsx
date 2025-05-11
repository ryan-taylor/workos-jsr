import { FreshContext } from "@workos/fresh/mod.ts";
import { redirect } from "@fresh/runtime.ts";

export async function POST(_req: Request, ctx: FreshContext) {
  await ctx.workos.clearSession();
  return redirect("/login");
}
