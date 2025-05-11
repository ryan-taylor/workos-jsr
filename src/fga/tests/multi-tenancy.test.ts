import { assertEquals } from "std/assert/mod.ts";
import { WorkOS } from "../../workos.ts";
import { WarrantOp } from "../interfaces/warrant.ts";

Deno.test({
  name: "Multi-tenancy example",
  ignore: true,
  async fn(t) {
    const workos = new WorkOS("API_KEY");

    await t.step("multi-tenancy example", async () => {
      // Create users
      const user1 = await workos.fga.createResource({
        resource: { resourceType: "user" },
      });
      const user2 = await workos.fga.createResource({
        resource: { resourceType: "user" },
      });

      // Create tenants
      const tenant1 = await workos.fga.createResource({
        resource: { resourceType: "tenant", resourceId: "tenant-1" },
        meta: { name: "Tenant 1" },
      });
      const tenant2 = await workos.fga.createResource({
        resource: { resourceType: "tenant", resourceId: "tenant-2" },
        meta: { name: "Tenant 2" },
      });

      let user1TenantsList = await workos.fga.query(
        {
          q: `select tenant where user:${user1.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: "latest" },
      );
      assertEquals(user1TenantsList.data.length, 0);
      let tenant1UsersList = await workos.fga.query(
        {
          q: `select member of type user for tenant:${tenant1.resourceId}`,
          limit: 10,
        },
        { warrantToken: "latest" },
      );
      assertEquals(tenant1UsersList.data.length, 0);

      // Assign user1 -> tenant1
      await workos.fga.writeWarrant({
        resource: tenant1,
        relation: "member",
        subject: user1,
      });

      user1TenantsList = await workos.fga.query(
        {
          q: `select tenant where user:${user1.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: "latest" },
      );
      assertEquals(user1TenantsList.data.length, 1);
      assertEquals(user1TenantsList.data[0].resourceType, "tenant");
      assertEquals(user1TenantsList.data[0].resourceId, "tenant-1");
      assertEquals(user1TenantsList.data[0].meta, { name: "Tenant 1" });

      tenant1UsersList = await workos.fga.query(
        {
          q: `select member of type user for tenant:${tenant1.resourceId}`,
          limit: 10,
        },
        { warrantToken: "latest" },
      );
      assertEquals(tenant1UsersList.data.length, 1);
      assertEquals(tenant1UsersList.data[0].resourceType, "user");
      assertEquals(tenant1UsersList.data[0].resourceId, user1.resourceId);
      assertEquals(tenant1UsersList.data[0].meta, undefined);

      // Remove user1 -> tenant1
      await workos.fga.writeWarrant({
        op: WarrantOp.Delete,
        resource: tenant1,
        relation: "member",
        subject: user1,
      });

      user1TenantsList = await workos.fga.query(
        {
          q: `select tenant where user:${user1.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: "latest" },
      );
      assertEquals(user1TenantsList.data.length, 0);
      tenant1UsersList = await workos.fga.query(
        {
          q: `select member of type user for tenant:${tenant1.resourceId}`,
          limit: 10,
        },
        { warrantToken: "latest" },
      );
      assertEquals(tenant1UsersList.data.length, 0);

      // Clean up
      await workos.fga.deleteResource(user1);
      await workos.fga.deleteResource(user2);
      await workos.fga.deleteResource(tenant1);
      await workos.fga.deleteResource(tenant2);
    });
  },
});
