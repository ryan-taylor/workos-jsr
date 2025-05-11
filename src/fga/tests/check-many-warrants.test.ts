import { assertEquals, assertNotEquals } from "std/assert/mod.ts";
import { WorkOS } from "../../workos.ts";
import { CheckOp } from "../interfaces/warrant.ts";

Deno.test({
  name: "Check many warrants",
  ignore: true,
  async fn(t) {
    const workos = new WorkOS("API_KEY");

    await t.step("check many warrants", async () => {
      const newUser = await workos.fga.createResource({
        resource: { resourceType: "user" },
      });
      const permission1 = await workos.fga.createResource({
        resource: { resourceType: "permission", resourceId: "perm1" },
        meta: { name: "Permission 1", description: "Permission 1" },
      });
      const permission2 = await workos.fga.createResource({
        resource: { resourceType: "permission", resourceId: "perm2" },
        meta: { name: "Permission 2", description: "Permission 2" },
      });

      const userHasPermissions = await workos.fga.check(
        {
          op: CheckOp.AnyOf,
          checks: [
            { resource: permission1, relation: "member", subject: newUser },
            { resource: permission2, relation: "member", subject: newUser },
          ],
        },
        { warrantToken: "latest" },
      );
      assertEquals(userHasPermissions.isAuthorized(), false);

      let warrantResponse = await workos.fga.writeWarrant({
        resource: permission1,
        relation: "member",
        subject: newUser,
      });
      assertNotEquals(warrantResponse.warrantToken, undefined);

      let userHasAtLeastOnePermission = await workos.fga.check(
        {
          op: CheckOp.AnyOf,
          checks: [
            { resource: permission1, relation: "member", subject: newUser },
            { resource: permission2, relation: "member", subject: newUser },
          ],
        },
        { warrantToken: "latest" },
      );
      assertEquals(userHasAtLeastOnePermission.isAuthorized(), true);

      let userHasAllPermissions = await workos.fga.check(
        {
          op: CheckOp.AllOf,
          checks: [
            { resource: permission1, relation: "member", subject: newUser },
            { resource: permission2, relation: "member", subject: newUser },
          ],
        },
        { warrantToken: "latest" },
      );
      assertEquals(userHasAllPermissions.isAuthorized(), false);

      // Clean up
      await workos.fga.deleteResource(newUser);
      await workos.fga.deleteResource(permission1);
      await workos.fga.deleteResource(permission2);
    });
  },
});
