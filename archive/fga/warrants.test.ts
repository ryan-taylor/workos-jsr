import { assertEquals, assertNotEquals } from "@std/assert";
import { WorkOS } from "../../workos.ts";
import { WarrantOp } from "../interfaces/warrant.ts";

Deno.test({
  name: "Warrants",
  ignore: true,
  async fn(t) {
    const workos = new WorkOS("API_KEY");

    await t.step("warrants", async () => {
      const user1 = await workos.fga.createResource({
        resource: { resourceType: "user", resourceId: "userA" },
      });
      const user2 = await workos.fga.createResource({
        resource: { resourceType: "user", resourceId: "userB" },
      });
      const newPermission = await workos.fga.createResource({
        resource: { resourceType: "permission", resourceId: "perm1" },
        meta: { name: "Permission 1", description: "Permission 1" },
      });

      let userHasPermission = await workos.fga.check(
        {
          checks: [
            { resource: newPermission, relation: "member", subject: user1 },
          ],
        },
        { warrantToken: "latest" },
      );
      assertEquals(userHasPermission.isAuthorized(), false);

      const warrant1 = await workos.fga.writeWarrant({
        resource: newPermission,
        relation: "member",
        subject: user1,
      });
      assertNotEquals(warrant1.warrantToken, undefined);
      const warrant2 = await workos.fga.writeWarrant({
        resource: newPermission,
        relation: "member",
        subject: user2,
        policy: 'region == "us"',
      });
      assertNotEquals(warrant2.warrantToken, undefined);

      const warrants1 = await workos.fga.listWarrants(
        { limit: 1 },
        { warrantToken: "latest" },
      );
      assertEquals(warrants1.data.length, 1);
      assertEquals(warrants1.data[0].resourceType, "permission");
      assertEquals(warrants1.data[0].resourceId, "perm1");
      assertEquals(warrants1.data[0].relation, "member");
      assertEquals(warrants1.data[0].subject.resourceType, "user");
      assertEquals(warrants1.data[0].subject.resourceId, user2.resourceId);
      assertEquals(warrants1.data[0].policy, 'region == "us"');

      const warrants2 = await workos.fga.listWarrants(
        { limit: 1, after: warrants1.listMetadata.after },
        { warrantToken: "latest" },
      );
      assertEquals(warrants2.data.length, 1);
      assertEquals(warrants2.data[0].resourceType, "permission");
      assertEquals(warrants2.data[0].resourceId, "perm1");
      assertEquals(warrants2.data[0].relation, "member");
      assertEquals(warrants2.data[0].subject.resourceType, "user");
      assertEquals(warrants2.data[0].subject.resourceId, user1.resourceId);

      const warrants3 = await workos.fga.listWarrants(
        { subjectType: "user", subjectId: user1.resourceId },
        { warrantToken: "latest" },
      );
      assertEquals(warrants3.data.length, 1);
      assertEquals(warrants3.data[0].resourceType, "permission");
      assertEquals(warrants3.data[0].resourceId, "perm1");
      assertEquals(warrants3.data[0].relation, "member");
      assertEquals(warrants3.data[0].subject.resourceType, "user");
      assertEquals(warrants3.data[0].subject.resourceId, user1.resourceId);

      userHasPermission = await workos.fga.check(
        {
          checks: [
            { resource: newPermission, relation: "member", subject: user1 },
          ],
        },
        { warrantToken: "latest" },
      );
      assertEquals(userHasPermission.isAuthorized(), true);

      const query =
        `select permission where user:${user1.resourceId} is member`;
      const response = await workos.fga.query(
        { q: query },
        { warrantToken: "latest" },
      );
      assertEquals(response.data.length, 1);
      assertEquals(response.data[0].resourceType, "permission");
      assertEquals(response.data[0].resourceId, "perm1");
      assertEquals(response.data[0].relation, "member");

      await workos.fga.writeWarrant({
        op: WarrantOp.Delete,
        resource: newPermission,
        relation: "member",
        subject: user1,
      });

      userHasPermission = await workos.fga.check(
        {
          checks: [
            { resource: newPermission, relation: "member", subject: user1 },
          ],
        },
        { warrantToken: "latest" },
      );
      assertEquals(userHasPermission.isAuthorized(), false);

      // Clean up
      await workos.fga.deleteResource(user1);
      await workos.fga.deleteResource(user2);
      await workos.fga.deleteResource(newPermission);
    });
  },
});
