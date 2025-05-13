import { assertEquals, assertRejects } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import { WorkOS } from "../workos.ts.ts";
import { fetchOnce, fetchURL } from '../../tests_deno/utils/test-utils.ts.ts';
import tokenFixture from "./fixtures/token.json.ts" with { type: "json" };
import getTokenErrorFixture from "./fixtures/get-token-error.json.ts" with {
  type: "json",
};

describe("Widgets", () => {
  const workos = new WorkOS("sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU", {
    apiHostname: "api.workos.test",
    clientId: "proj_123",
  });

  describe("getToken", () => {
    it("sends a Get Token request", async () => {
      fetchOnce(tokenFixture);
      const token = await workos.widgets.getToken({
        organizationId: "org_123",
        userId: "user_123",
        scopes: ["widgets:users-table:manage"],
      });
      assertEquals(fetchURL().includes("/widgets/token"), true);
      assertEquals(token, "this.is.a.token");
    });

    it("returns an error if the API returns an error", async () => {
      fetchOnce(getTokenErrorFixture, { status: 404 });
      await assertRejects(
        () =>
          workos.widgets.getToken({
            organizationId: "org_123",
            userId: "user_123",
            scopes: ["widgets:users-table:manage"],
          }),
        Error,
        "User not found 'user_123'",
      );
    });
  });
});
