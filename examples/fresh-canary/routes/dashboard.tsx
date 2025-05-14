/** @jsx h */
import { h } from "preact";
import { FreshContext } from "@workos/fresh";

export default async function DashboardPage(_req: Request, ctx: FreshContext) {
  const session = await ctx.workos.getSession();
  if (!session) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/login" },
    });
  }

  return (
    <div class="p-4">
      <h1 class="text-2xl font-bold">Dashboard</h1>
      <p>Welcome, {session.profile.email}</p>
      <form method="post" action="/logout">
        <button type="submit" class="text-red-500 hover:underline">
          Logout
        </button>
      </form>
    </div>
  );
}
