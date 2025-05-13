import { assertEquals } from "@std/assert";
// @ts-ignore This test is ignored anyway so it's just for compiling
import { WorkOS } from "../../../mod.ts.ts";
import { WarrantOp } from "../interfaces/warrant.ts.ts";

Deno.test({
  name: "Multi-tenancy example",
  ignore: true,
  async fn(t) {
    // @ts-ignore: Using deprecated API
    const workos = new WorkOS("API_KEY");

    await t.step("multi-tenancy example", async () => {
      // Create users
      // @ts-ignore: Using deprecated API
      const user1 = await workos.fga.createResource({
        resource: { resourceType: "user" },
      });
      // @ts-ignore: Using deprecated API
      const user2 = await workos.fga.createResource({
        resource: { resourceType: "user" },
      });

      // Create tenants
      // @ts-ignore: Using deprecated API
      const tenant1 = await workos.fga.createResource({
        resource: { resourceType: "tenant", resourceId: "tenant-1" },
        meta: { name: "Tenant 1" },
      });
      // @ts-ignore: Using deprecated API
      const tenant2 = await workos.fga.createResource({
        resource: { resourceType: "tenant", resourceId: "tenant-2" },
        meta: { name: "Tenant 2" },
      });

      // @ts-ignore: Using deprecated API
      let user1TenantsList = await workos.fga.query(
        {
          q: `select tenant where user:${user1.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: "latest" },
      );
      assertEquals(user1TenantsList.data.length, 0);
      // @ts-ignore: Using deprecated API
      let tenant1UsersList = await workos.fga.query(
        {
          q: `select member of type user for tenant:${tenant1.resourceId}`,
          limit: 10,
        },
        { warrantToken: "latest" },
      );
      assertEquals(tenant1UsersList.data.length, 0);

      // Assign user1 -> tenant1
      // @ts-ignore: Using deprecated API
      await workos.fga.writeWarrant({
        resource: tenant1,
        relation: "member",
        subject: user1,
      });

      // @ts-ignore: Using deprecated API
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

      // @ts-ignore: Using deprecated API
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
      // @ts-ignore: Using deprecated API
      await workos.fga.writeWarrant({
        op: WarrantOp.Delete,
        resource: tenant1,
        relation: "member",
        subject: user1,
      });

      // @ts-ignore: Using deprecated API
      user1TenantsList = await workos.fga.query(
        {
          q: `select tenant where user:${user1.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: "latest" },
      );
      assertEquals(user1TenantsList.data.length, 0);
      // @ts-ignore: Using deprecated API
      tenant1UsersList = await workos.fga.query(
        {
          q: `select member of type user for tenant:${tenant1.resourceId}`,
          limit: 10,
        },
        { warrantToken: "latest" },
      );
      assertEquals(tenant1UsersList.data.length, 0);

      // Clean up
      // @ts-ignore: Using deprecated API
      await workos.fga.deleteResource(user1);
      // @ts-ignore: Using deprecated API
      await workos.fga.deleteResource(user2);
      // @ts-ignore: Using deprecated API
      await workos.fga.deleteResource(tenant1);
      // @ts-ignore: Using deprecated API
      await workos.fga.deleteResource(tenant2);
    });
  },
});
