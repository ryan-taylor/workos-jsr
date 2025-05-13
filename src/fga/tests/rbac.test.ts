import { assertEquals } from "std/assert/mod.ts";
import { WorkOS } from "../../workos.ts.ts";
import { WarrantOp } from "../interfaces/warrant.ts.ts";

Deno.test({
  name: "RBAC example",
  ignore: true,
  async fn(t) {
    const workos = new WorkOS("API_KEY");

    await t.step("RBAC example", async () => {
      // Create users
      const adminUser = await workos.fga.createResource({
        resource: { resourceType: "user" },
      });
      const viewerUser = await workos.fga.createResource({
        resource: { resourceType: "user" },
      });

      // Create roles
      const adminRole = await workos.fga.createResource({
        resource: { resourceType: "role", resourceId: "admin" },
        meta: { name: "Admin", description: "The admin role" },
      });
      const viewerRole = await workos.fga.createResource({
        resource: { resourceType: "role", resourceId: "viewer" },
        meta: { name: "Viewer", description: "The viewer role" },
      });

      // Create permissions
      const createPermission = await workos.fga.createResource({
        resource: { resourceType: "permission", resourceId: "create-report" },
        meta: {
          name: "Create Report",
          description: "Permission to create reports",
        },
      });
      const viewPermission = await workos.fga.createResource({
        resource: { resourceType: "permission", resourceId: "view-report" },
        meta: {
          name: "View Report",
          description: "Permission to view reports",
        },
      });

      let adminUserRolesList = await workos.fga.query(
        {
          q: `select role where user:${adminUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: "latest" },
      );
      let adminRolePermissionsList = await workos.fga.query(
        {
          q: `select permission where role:${adminRole.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: "latest" },
      );
      assertEquals(adminUserRolesList.data.length, 0);
      assertEquals(adminRolePermissionsList.data.length, 0);

      let adminUserHasPermission = await workos.fga.check(
        {
          checks: [
            {
              resource: createPermission,
              relation: "member",
              subject: adminUser,
            },
          ],
        },
        { warrantToken: "latest" },
      );
      assertEquals(adminUserHasPermission.isAuthorized(), false);

      // Assign 'create-report' -> admin role -> admin user
      await workos.fga.writeWarrant({
        resource: createPermission,
        relation: "member",
        subject: adminRole,
      });
      await workos.fga.writeWarrant({
        resource: adminRole,
        relation: "member",
        subject: adminUser,
      });

      adminUserHasPermission = await workos.fga.check(
        {
          checks: [
            {
              resource: createPermission,
              relation: "member",
              subject: adminUser,
            },
          ],
        },
        { warrantToken: "latest" },
      );
      assertEquals(adminUserHasPermission.isAuthorized(), true);

      adminUserRolesList = await workos.fga.query(
        {
          q: `select role where user:${adminUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: "latest" },
      );
      assertEquals(adminUserRolesList.data.length, 1);
      assertEquals(adminUserRolesList.data[0].resourceType, "role");
      assertEquals(adminUserRolesList.data[0].resourceId, "admin");
      assertEquals(adminUserRolesList.data[0].meta, {
        name: "Admin",
        description: "The admin role",
      });

      adminRolePermissionsList = await workos.fga.query(
        {
          q: `select permission where role:${adminRole.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: "latest" },
      );
      assertEquals(adminRolePermissionsList.data.length, 1);
      assertEquals(adminRolePermissionsList.data[0].resourceType, "permission");
      assertEquals(
        adminRolePermissionsList.data[0].resourceId,
        "create-report",
      );
      assertEquals(adminRolePermissionsList.data[0].meta, {
        name: "Create Report",
        description: "Permission to create reports",
      });

      await workos.fga.writeWarrant({
        op: WarrantOp.Delete,
        resource: createPermission,
        relation: "member",
        subject: adminRole,
      });
      await workos.fga.writeWarrant({
        op: WarrantOp.Delete,
        resource: adminRole,
        relation: "member",
        subject: adminUser,
      });

      adminUserHasPermission = await workos.fga.check(
        {
          checks: [
            {
              resource: createPermission,
              relation: "member",
              subject: adminUser,
            },
          ],
        },
        { warrantToken: "latest" },
      );
      assertEquals(adminUserHasPermission.isAuthorized(), false);

      adminUserRolesList = await workos.fga.query(
        {
          q: `select role where user:${adminUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: "latest" },
      );
      assertEquals(adminUserRolesList.data.length, 0);

      adminRolePermissionsList = await workos.fga.query(
        {
          q: `select permission where role:${adminRole.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: "latest" },
      );
      assertEquals(adminRolePermissionsList.data.length, 0);

      // Assign 'view-report' -> viewer user
      let viewerUserHasPermission = await workos.fga.check(
        {
          checks: [
            {
              resource: viewPermission,
              relation: "member",
              subject: viewerUser,
            },
          ],
        },
        { warrantToken: "latest" },
      );
      assertEquals(viewerUserHasPermission.isAuthorized(), false);

      let viewerUserPermissionsList = await workos.fga.query(
        {
          q: `select permission where user:${viewerUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: "latest" },
      );
      assertEquals(viewerUserPermissionsList.data.length, 0);

      await workos.fga.writeWarrant({
        resource: viewPermission,
        relation: "member",
        subject: viewerUser,
      });

      viewerUserHasPermission = await workos.fga.check(
        {
          checks: [
            {
              resource: viewPermission,
              relation: "member",
              subject: viewerUser,
            },
          ],
        },
        { warrantToken: "latest" },
      );
      assertEquals(viewerUserHasPermission.isAuthorized(), true);

      viewerUserPermissionsList = await workos.fga.query(
        {
          q: `select permission where user:${viewerUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: "latest" },
      );
      assertEquals(viewerUserPermissionsList.data.length, 1);
      assertEquals(
        viewerUserPermissionsList.data[0].resourceType,
        "permission",
      );
      assertEquals(viewerUserPermissionsList.data[0].resourceId, "view-report");
      assertEquals(viewerUserPermissionsList.data[0].meta, {
        name: "View Report",
        description: "Permission to view reports",
      });

      await workos.fga.writeWarrant({
        op: WarrantOp.Delete,
        resource: viewPermission,
        relation: "member",
        subject: viewerUser,
      });

      viewerUserHasPermission = await workos.fga.check(
        {
          checks: [
            {
              resource: viewPermission,
              relation: "member",
              subject: viewerUser,
            },
          ],
        },
        { warrantToken: "latest" },
      );
      assertEquals(viewerUserHasPermission.isAuthorized(), false);

      viewerUserPermissionsList = await workos.fga.query(
        {
          q: `select permission where user:${viewerUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: "latest" },
      );
      assertEquals(viewerUserPermissionsList.data.length, 0);

      // Clean up
      await workos.fga.deleteResource(adminUser);
      await workos.fga.deleteResource(viewerUser);
      await workos.fga.deleteResource(adminRole);
      await workos.fga.deleteResource(viewerRole);
      await workos.fga.deleteResource(createPermission);
      await workos.fga.deleteResource(viewPermission);
    });
  },
});
