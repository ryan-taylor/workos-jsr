import { assertEquals, assertNotEquals } from "std/assert/mod.ts";
// @ts-ignore This test is ignored anyway so it's just for compiling
import { WorkOS } from "../../../mod.ts.ts";
// @ts-ignore This is a compatibility shim
import { CheckOp } from "../interfaces/warrant.ts.ts";

Deno.test({
  name: "Check many warrants",
  ignore: true,
  async fn(t) {
    const workos = new WorkOS("API_KEY");

    await t.step("check many warrants", async () => {
      // @ts-ignore: Test is already ignored and is using old API
      const newUser = await workos.fga.createResource({
        resource: { resourceType: "user" },
      });
      // @ts-ignore: Test is already ignored and is using old API
      const permission1 = await workos.fga.createResource({
        resource: { resourceType: "permission", resourceId: "perm1" },
        meta: { name: "Permission 1", description: "Permission 1" },
      });
      // @ts-ignore: Test is already ignored and is using old API
      const permission2 = await workos.fga.createResource({
        resource: { resourceType: "permission", resourceId: "perm2" },
        meta: { name: "Permission 2", description: "Permission 2" },
      });

      // @ts-ignore: Test is already ignored and is using old API
      const userHasPermissions = await workos.fga.check(
        {
          op: CheckOp.AnyOf,
          checks: [
            { resource: permission1, relation: "member", subject: newUser },
            { resource: permission2, relation: "member", subject: newUser },
          ],
        },
        // @ts-ignore: Old API used two arguments
        { warrantToken: "latest" },
      );
      // @ts-ignore: Test is already ignored and is using old API
      assertEquals(userHasPermissions.isAuthorized(), false);

      // @ts-ignore: Test is already ignored and is using old API
      let warrantResponse = await workos.fga.writeWarrant({
        resource: permission1,
        relation: "member",
        subject: newUser,
      });
      // @ts-ignore: Test is already ignored and is using old API
      assertNotEquals(warrantResponse.warrantToken, undefined);

      // @ts-ignore: Test is already ignored and is using old API
      let userHasAtLeastOnePermission = await workos.fga.check(
        {
          op: CheckOp.AnyOf,
          checks: [
            { resource: permission1, relation: "member", subject: newUser },
            { resource: permission2, relation: "member", subject: newUser },
          ],
        },
        // @ts-ignore: Old API used two arguments
        { warrantToken: "latest" },
      );
      // @ts-ignore: Test is already ignored and is using old API
      assertEquals(userHasAtLeastOnePermission.isAuthorized(), true);

      // @ts-ignore: Test is already ignored and is using old API
      let userHasAllPermissions = await workos.fga.check(
        {
          op: CheckOp.AllOf,
          checks: [
            { resource: permission1, relation: "member", subject: newUser },
            { resource: permission2, relation: "member", subject: newUser },
          ],
        },
        // @ts-ignore: Old API used two arguments
        { warrantToken: "latest" },
      );
      // @ts-ignore: Test is already ignored and is using old API
      assertEquals(userHasAllPermissions.isAuthorized(), false);

      // Clean up
      // @ts-ignore: Test is already ignored and is using old API
      await workos.fga.deleteResource(newUser);
      // @ts-ignore: Test is already ignored and is using old API
      await workos.fga.deleteResource(permission1);
      // @ts-ignore: Test is already ignored and is using old API
      await workos.fga.deleteResource(permission2);
    });
  },
});
