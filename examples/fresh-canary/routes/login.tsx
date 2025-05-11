import { FreshContext } from "@workos/fresh/mod.ts";

export default function LoginPage(req: Request, ctx: FreshContext) {
  const loginUrl = ctx.workos.sso.getAuthorizationURL({
    provider: "google",
    redirectUri: new URL("/callback", req.url).toString(),
  });

  return (
    <div class="p-4">
      <h1 class="text-2xl font-bold">Login</h1>
      <a href={loginUrl} class="text-blue-500 hover:underline">
        Login with Google
      </a>
    </div>
  );
}
