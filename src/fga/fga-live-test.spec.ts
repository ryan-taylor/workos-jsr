import { assertEquals, assertNotEquals } from "std/assert/mod.ts";
import { WorkOS } from '../workos.ts';
import { CheckOp, ResourceOp, WarrantOp } from './interfaces.ts';

Deno.test({
  name: "FGA Live Test",
  ignore: true, // Equivalent to Jest's describe.skip
  async fn(t) {
    const workos = new WorkOS('API_KEY');

    await t.step("CRUD resources", async () => {
      const resource1 = await workos.fga.createResource({
        resource: { resourceType: 'document' },
      });
      assertEquals(resource1.resourceType, 'document');
      assertNotEquals(resource1.resourceId, undefined);
      assertEquals(resource1.meta, undefined);

      let resource2 = await workos.fga.createResource({
        resource: { resourceType: 'folder', resourceId: 'planning' },
      });
      let refetchedResource = await workos.fga.getResource(resource2);
      assertEquals(refetchedResource.resourceType, resource2.resourceType);
      assertEquals(refetchedResource.resourceId, resource2.resourceId);
      assertEquals(refetchedResource.meta, resource2.meta);

      resource2 = await workos.fga.updateResource({
        resource: { resourceType: 'folder', resourceId: 'planning' },
        meta: { description: 'Second document' },
      });
      refetchedResource = await workos.fga.getResource(resource2);
      assertEquals(refetchedResource.resourceType, resource2.resourceType);
      assertEquals(refetchedResource.resourceId, resource2.resourceId);
      assertEquals(refetchedResource.meta, resource2.meta);

      let resourcesList = await workos.fga.listResources({ limit: 10 });
      assertEquals(resourcesList.data.length, 2);
      assertEquals(resourcesList.data[0].resourceType, resource2.resourceType);
      assertEquals(resourcesList.data[0].resourceId, resource2.resourceId);
      assertEquals(resourcesList.data[1].resourceType, resource1.resourceType);
      assertEquals(resourcesList.data[1].resourceId, resource1.resourceId);

      resourcesList = await workos.fga.listResources({
        limit: 10,
        search: 'planning',
      });
      assertEquals(resourcesList.data.length, 1);
      assertEquals(resourcesList.data[0].resourceType, resource2.resourceType);
      assertEquals(resourcesList.data[0].resourceId, resource2.resourceId);

      await workos.fga.deleteResource(resource1);
      await workos.fga.deleteResource(resource2);
      resourcesList = await workos.fga.listResources({ limit: 10 });
      assertEquals(resourcesList.data.length, 0);
    });

    await t.step("multi-tenancy example", async () => {
      // Create users
      const user1 = await workos.fga.createResource({
        resource: { resourceType: 'user' },
      });
      const user2 = await workos.fga.createResource({
        resource: { resourceType: 'user' },
      });

      // Create tenants
      const tenant1 = await workos.fga.createResource({
        resource: { resourceType: 'tenant', resourceId: 'tenant-1' },
        meta: { name: 'Tenant 1' },
      });
      const tenant2 = await workos.fga.createResource({
        resource: { resourceType: 'tenant', resourceId: 'tenant-2' },
        meta: { name: 'Tenant 2' },
      });

      let user1TenantsList = await workos.fga.query(
        {
          q: `select tenant where user:${user1.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: 'latest' },
      );
      assertEquals(user1TenantsList.data.length, 0);
      let tenant1UsersList = await workos.fga.query(
        {
          q: `select member of type user for tenant:${tenant1.resourceId}`,
          limit: 10,
        },
        { warrantToken: 'latest' },
      );
      assertEquals(tenant1UsersList.data.length, 0);

      // Assign user1 -> tenant1
      await workos.fga.writeWarrant({
        resource: tenant1,
        relation: 'member',
        subject: user1,
      });

      user1TenantsList = await workos.fga.query(
        {
          q: `select tenant where user:${user1.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: 'latest' },
      );
      assertEquals(user1TenantsList.data.length, 1);
      assertEquals(user1TenantsList.data[0].resourceType, 'tenant');
      assertEquals(user1TenantsList.data[0].resourceId, 'tenant-1');
      assertEquals(user1TenantsList.data[0].meta, { name: 'Tenant 1' });

      tenant1UsersList = await workos.fga.query(
        {
          q: `select member of type user for tenant:${tenant1.resourceId}`,
          limit: 10,
        },
        { warrantToken: 'latest' },
      );
      assertEquals(tenant1UsersList.data.length, 1);
      assertEquals(tenant1UsersList.data[0].resourceType, 'user');
      assertEquals(tenant1UsersList.data[0].resourceId, user1.resourceId);
      assertEquals(tenant1UsersList.data[0].meta, undefined);

      // Remove user1 -> tenant1
      await workos.fga.writeWarrant({
        op: WarrantOp.Delete,
        resource: tenant1,
        relation: 'member',
        subject: user1,
      });

      user1TenantsList = await workos.fga.query(
        {
          q: `select tenant where user:${user1.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: 'latest' },
      );
      assertEquals(user1TenantsList.data.length, 0);
      tenant1UsersList = await workos.fga.query(
        {
          q: `select member of type user for tenant:${tenant1.resourceId}`,
          limit: 10,
        },
        { warrantToken: 'latest' },
      );
      assertEquals(tenant1UsersList.data.length, 0);

      // Clean up
      await workos.fga.deleteResource(user1);
      await workos.fga.deleteResource(user2);
      await workos.fga.deleteResource(tenant1);
      await workos.fga.deleteResource(tenant2);
    });

    await t.step("RBAC example", async () => {
      // Create users
      const adminUser = await workos.fga.createResource({
        resource: { resourceType: 'user' },
      });
      const viewerUser = await workos.fga.createResource({
        resource: { resourceType: 'user' },
      });

      // Create roles
      const adminRole = await workos.fga.createResource({
        resource: { resourceType: 'role', resourceId: 'admin' },
        meta: { name: 'Admin', description: 'The admin role' },
      });
      const viewerRole = await workos.fga.createResource({
        resource: { resourceType: 'role', resourceId: 'viewer' },
        meta: { name: 'Viewer', description: 'The viewer role' },
      });

      // Create permissions
      const createPermission = await workos.fga.createResource({
        resource: { resourceType: 'permission', resourceId: 'create-report' },
        meta: {
          name: 'Create Report',
          description: 'Permission to create reports',
        },
      });
      const viewPermission = await workos.fga.createResource({
        resource: { resourceType: 'permission', resourceId: 'view-report' },
        meta: { name: 'View Report', description: 'Permission to view reports' },
      });

      let adminUserRolesList = await workos.fga.query(
        {
          q: `select role where user:${adminUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: 'latest' },
      );
      let adminRolePermissionsList = await workos.fga.query(
        {
          q: `select permission where role:${adminRole.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: 'latest' },
      );
      assertEquals(adminUserRolesList.data.length, 0);
      assertEquals(adminRolePermissionsList.data.length, 0);

      let adminUserHasPermission = await workos.fga.check(
        {
          checks: [
            {
              resource: createPermission,
              relation: 'member',
              subject: adminUser,
            },
          ],
        },
        { warrantToken: 'latest' },
      );
      assertEquals(adminUserHasPermission.isAuthorized(), false);

      // Assign 'create-report' -> admin role -> admin user
      await workos.fga.writeWarrant({
        resource: createPermission,
        relation: 'member',
        subject: adminRole,
      });
      await workos.fga.writeWarrant({
        resource: adminRole,
        relation: 'member',
        subject: adminUser,
      });

      adminUserHasPermission = await workos.fga.check(
        {
          checks: [
            {
              resource: createPermission,
              relation: 'member',
              subject: adminUser,
            },
          ],
        },
        { warrantToken: 'latest' },
      );
      assertEquals(adminUserHasPermission.isAuthorized(), true);

      adminUserRolesList = await workos.fga.query(
        {
          q: `select role where user:${adminUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: 'latest' },
      );
      assertEquals(adminUserRolesList.data.length, 1);
      assertEquals(adminUserRolesList.data[0].resourceType, 'role');
      assertEquals(adminUserRolesList.data[0].resourceId, 'admin');
      assertEquals(adminUserRolesList.data[0].meta, {
        name: 'Admin',
        description: 'The admin role',
      });

      adminRolePermissionsList = await workos.fga.query(
        {
          q: `select permission where role:${adminRole.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: 'latest' },
      );
      assertEquals(adminRolePermissionsList.data.length, 1);
      assertEquals(adminRolePermissionsList.data[0].resourceType, 'permission');
      assertEquals(adminRolePermissionsList.data[0].resourceId, 'create-report');
      assertEquals(adminRolePermissionsList.data[0].meta, {
        name: 'Create Report',
        description: 'Permission to create reports',
      });

      await workos.fga.writeWarrant({
        op: WarrantOp.Delete,
        resource: createPermission,
        relation: 'member',
        subject: adminRole,
      });
      await workos.fga.writeWarrant({
        op: WarrantOp.Delete,
        resource: adminRole,
        relation: 'member',
        subject: adminUser,
      });

      adminUserHasPermission = await workos.fga.check(
        {
          checks: [
            {
              resource: createPermission,
              relation: 'member',
              subject: adminUser,
            },
          ],
        },
        { warrantToken: 'latest' },
      );
      assertEquals(adminUserHasPermission.isAuthorized(), false);

      adminUserRolesList = await workos.fga.query(
        {
          q: `select role where user:${adminUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: 'latest' },
      );
      assertEquals(adminUserRolesList.data.length, 0);

      adminRolePermissionsList = await workos.fga.query(
        {
          q: `select permission where role:${adminRole.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: 'latest' },
      );
      assertEquals(adminRolePermissionsList.data.length, 0);

      // Assign 'view-report' -> viewer user
      let viewerUserHasPermission = await workos.fga.check(
        {
          checks: [
            { resource: viewPermission, relation: 'member', subject: viewerUser },
          ],
        },
        { warrantToken: 'latest' },
      );
      assertEquals(viewerUserHasPermission.isAuthorized(), false);

      let viewerUserPermissionsList = await workos.fga.query(
        {
          q: `select permission where user:${viewerUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: 'latest' },
      );
      assertEquals(viewerUserPermissionsList.data.length, 0);

      await workos.fga.writeWarrant({
        resource: viewPermission,
        relation: 'member',
        subject: viewerUser,
      });

      viewerUserHasPermission = await workos.fga.check(
        {
          checks: [
            { resource: viewPermission, relation: 'member', subject: viewerUser },
          ],
        },
        { warrantToken: 'latest' },
      );
      assertEquals(viewerUserHasPermission.isAuthorized(), true);

      viewerUserPermissionsList = await workos.fga.query(
        {
          q: `select permission where user:${viewerUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: 'latest' },
      );
      assertEquals(viewerUserPermissionsList.data.length, 1);
      assertEquals(viewerUserPermissionsList.data[0].resourceType, 'permission');
      assertEquals(viewerUserPermissionsList.data[0].resourceId, 'view-report');
      assertEquals(viewerUserPermissionsList.data[0].meta, {
        name: 'View Report',
        description: 'Permission to view reports',
      });

      await workos.fga.writeWarrant({
        op: WarrantOp.Delete,
        resource: viewPermission,
        relation: 'member',
        subject: viewerUser,
      });

      viewerUserHasPermission = await workos.fga.check(
        {
          checks: [
            { resource: viewPermission, relation: 'member', subject: viewerUser },
          ],
        },
        { warrantToken: 'latest' },
      );
      assertEquals(viewerUserHasPermission.isAuthorized(), false);

      viewerUserPermissionsList = await workos.fga.query(
        {
          q: `select permission where user:${viewerUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: 'latest' },
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

    await t.step("pricing tiers, features, and users example", async () => {
      // Create users
      const freeUser = await workos.fga.createResource({
        resource: { resourceType: 'user' },
      });
      const paidUser = await workos.fga.createResource({
        resource: { resourceType: 'user' },
      });

      // Create pricing tiers
      const freeTier = await workos.fga.createResource({
        resource: { resourceType: 'pricing-tier', resourceId: 'free' },
        meta: { name: 'Free Tier' },
      });
      const paidTier = await workos.fga.createResource({
        resource: { resourceType: 'pricing-tier', resourceId: 'paid' },
      });

      // Create features
      const customFeature = await workos.fga.createResource({
        resource: { resourceType: 'feature', resourceId: 'custom-feature' },
        meta: { name: 'Custom Feature' },
      });
      const feature1 = await workos.fga.createResource({
        resource: { resourceType: 'feature', resourceId: 'feature-1' },
      });
      const feature2 = await workos.fga.createResource({
        resource: { resourceType: 'feature', resourceId: 'feature-2' },
      });

      // Assign 'custom-feature' -> paid user
      let paidUserHasFeature = await workos.fga.check(
        {
          checks: [
            { resource: customFeature, relation: 'member', subject: paidUser },
          ],
        },
        { warrantToken: 'latest' },
      );
      assertEquals(paidUserHasFeature.isAuthorized(), false);

      let paidUserFeaturesList = await workos.fga.query(
        {
          q: `select feature where user:${paidUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: 'latest' },
      );
      assertEquals(paidUserFeaturesList.data.length, 0);

      await workos.fga.writeWarrant({
        resource: customFeature,
        relation: 'member',
        subject: paidUser,
      });

      paidUserHasFeature = await workos.fga.check(
        {
          checks: [
            { resource: customFeature, relation: 'member', subject: paidUser },
          ],
        },
        { warrantToken: 'latest' },
      );
      assertEquals(paidUserHasFeature.isAuthorized(), true);

      paidUserFeaturesList = await workos.fga.query(
        {
          q: `select feature where user:${paidUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: 'latest' },
      );
      assertEquals(paidUserFeaturesList.data.length, 1);
      assertEquals(paidUserFeaturesList.data[0].resourceType, 'feature');
      assertEquals(paidUserFeaturesList.data[0].resourceId, 'custom-feature');
      assertEquals(paidUserFeaturesList.data[0].meta, {
        name: 'Custom Feature',
      });

      await workos.fga.writeWarrant({
        op: WarrantOp.Delete,
        resource: customFeature,
        relation: 'member',
        subject: paidUser,
      });

      paidUserHasFeature = await workos.fga.check(
        {
          checks: [
            { resource: customFeature, relation: 'member', subject: paidUser },
          ],
        },
        { warrantToken: 'latest' },
      );
      assertEquals(paidUserHasFeature.isAuthorized(), false);

      paidUserFeaturesList = await workos.fga.query(
        {
          q: `select feature where user:${paidUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: 'latest' },
      );
      assertEquals(paidUserFeaturesList.data.length, 0);

      // Assign 'feature-1' -> 'free' tier -> free user
      let freeUserHasFeature = await workos.fga.check(
        {
          checks: [{ resource: feature1, relation: 'member', subject: freeUser }],
        },
        { warrantToken: 'latest' },
      );
      assertEquals(freeUserHasFeature.isAuthorized(), false);

      let freeUserFeaturesList = await workos.fga.query(
        {
          q: `select feature where user:${freeUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: 'latest' },
      );
      assertEquals(freeUserFeaturesList.data.length, 0);

      let freeUserTiersList = await workos.fga.query(
        {
          q: `select pricing-tier where user:${freeUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: 'latest' },
      );
      assertEquals(freeUserTiersList.data.length, 0);

      await workos.fga.writeWarrant({
        resource: feature1,
        relation: 'member',
        subject: freeTier,
      });
      await workos.fga.writeWarrant({
        resource: freeTier,
        relation: 'member',
        subject: freeUser,
      });

      freeUserHasFeature = await workos.fga.check(
        {
          checks: [{ resource: feature1, relation: 'member', subject: freeUser }],
        },
        { warrantToken: 'latest' },
      );
      assertEquals(freeUserHasFeature.isAuthorized(), true);

      freeUserFeaturesList = await workos.fga.query(
        {
          q: `select feature where user:${freeUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: 'latest' },
      );
      assertEquals(freeUserFeaturesList.data.length, 1);
      assertEquals(freeUserFeaturesList.data[0].resourceType, 'feature');
      assertEquals(freeUserFeaturesList.data[0].resourceId, 'feature-1');
      assertEquals(freeUserFeaturesList.data[0].meta, undefined);

      freeUserTiersList = await workos.fga.query(
        {
          q: `select pricing-tier where user:${freeUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: 'latest' },
      );
      assertEquals(freeUserTiersList.data.length, 1);
      assertEquals(freeUserTiersList.data[0].resourceType, 'pricing-tier');
      assertEquals(freeUserTiersList.data[0].resourceId, 'free');
      assertEquals(freeUserTiersList.data[0].meta, { name: 'Free Tier' });

      await workos.fga.writeWarrant({
        op: WarrantOp.Delete,
        resource: feature1,
        relation: 'member',
        subject: freeTier,
      });
      await workos.fga.writeWarrant({
        op: WarrantOp.Delete,
        resource: freeTier,
        relation: 'member',
        subject: freeUser,
      });

      freeUserHasFeature = await workos.fga.check(
        {
          checks: [{ resource: feature1, relation: 'member', subject: freeUser }],
        },
        { warrantToken: 'latest' },
      );
      assertEquals(freeUserHasFeature.isAuthorized(), false);

      freeUserFeaturesList = await workos.fga.query(
        {
          q: `select feature where user:${freeUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: 'latest' },
      );
      assertEquals(freeUserFeaturesList.data.length, 0);

      freeUserTiersList = await workos.fga.query(
        {
          q: `select pricing-tier where user:${freeUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: 'latest' },
      );
      assertEquals(freeUserTiersList.data.length, 0);

      // Clean up
      await workos.fga.deleteResource(freeUser);
      await workos.fga.deleteResource(paidUser);
      await workos.fga.deleteResource(freeTier);
      await workos.fga.deleteResource(paidTier);
      await workos.fga.deleteResource(customFeature);
      await workos.fga.deleteResource(feature1);
      await workos.fga.deleteResource(feature2);
    });

    await t.step("warrants", async () => {
      const user1 = await workos.fga.createResource({
        resource: { resourceType: 'user', resourceId: 'userA' },
      });
      const user2 = await workos.fga.createResource({
        resource: { resourceType: 'user', resourceId: 'userB' },
      });
      const newPermission = await workos.fga.createResource({
        resource: { resourceType: 'permission', resourceId: 'perm1' },
        meta: { name: 'Permission 1', description: 'Permission 1' },
      });

      let userHasPermission = await workos.fga.check(
        {
          checks: [
            { resource: newPermission, relation: 'member', subject: user1 },
          ],
        },
        { warrantToken: 'latest' },
      );
      assertEquals(userHasPermission.isAuthorized(), false);

      const warrant1 = await workos.fga.writeWarrant({
        resource: newPermission,
        relation: 'member',
        subject: user1,
      });
      assertNotEquals(warrant1.warrantToken, undefined);
      const warrant2 = await workos.fga.writeWarrant({
        resource: newPermission,
        relation: 'member',
        subject: user2,
        policy: 'region == "us"',
      });
      assertNotEquals(warrant2.warrantToken, undefined);

      const warrants1 = await workos.fga.listWarrants(
        { limit: 1 },
        { warrantToken: 'latest' },
      );
      assertEquals(warrants1.data.length, 1);
      assertEquals(warrants1.data[0].resourceType, 'permission');
      assertEquals(warrants1.data[0].resourceId, 'perm1');
      assertEquals(warrants1.data[0].relation, 'member');
      assertEquals(warrants1.data[0].subject.resourceType, 'user');
      assertEquals(warrants1.data[0].subject.resourceId, user2.resourceId);
      assertEquals(warrants1.data[0].policy, 'region == "us"');

      const warrants2 = await workos.fga.listWarrants(
        { limit: 1, after: warrants1.listMetadata.after },
        { warrantToken: 'latest' },
      );
      assertEquals(warrants2.data.length, 1);
      assertEquals(warrants2.data[0].resourceType, 'permission');
      assertEquals(warrants2.data[0].resourceId, 'perm1');
      assertEquals(warrants2.data[0].relation, 'member');
      assertEquals(warrants2.data[0].subject.resourceType, 'user');
      assertEquals(warrants2.data[0].subject.resourceId, user1.resourceId);

      const warrants3 = await workos.fga.listWarrants(
        { subjectType: 'user', subjectId: user1.resourceId },
        { warrantToken: 'latest' },
      );
      assertEquals(warrants3.data.length, 1);
      assertEquals(warrants3.data[0].resourceType, 'permission');
      assertEquals(warrants3.data[0].resourceId, 'perm1');
      assertEquals(warrants3.data[0].relation, 'member');
      assertEquals(warrants3.data[0].subject.resourceType, 'user');
      assertEquals(warrants3.data[0].subject.resourceId, user1.resourceId);

      userHasPermission = await workos.fga.check(
        {
          checks: [
            { resource: newPermission, relation: 'member', subject: user1 },
          ],
        },
        { warrantToken: 'latest' },
      );
      assertEquals(userHasPermission.isAuthorized(), true);

      const query = `select permission where user:${user1.resourceId} is member`;
      const response = await workos.fga.query(
        { q: query },
        { warrantToken: 'latest' },
      );
      assertEquals(response.data.length, 1);
      assertEquals(response.data[0].resourceType, 'permission');
      assertEquals(response.data[0].resourceId, 'perm1');
      assertEquals(response.data[0].relation, 'member');

      await workos.fga.writeWarrant({
        op: WarrantOp.Delete,
        resource: newPermission,
        relation: 'member',
        subject: user1,
      });

      userHasPermission = await workos.fga.check(
        {
          checks: [
            { resource: newPermission, relation: 'member', subject: user1 },
          ],
        },
        { warrantToken: 'latest' },
      );
      assertEquals(userHasPermission.isAuthorized(), false);

      // Clean up
      await workos.fga.deleteResource(user1);
      await workos.fga.deleteResource(user2);
      await workos.fga.deleteResource(newPermission);
    });

    await t.step("check many warrants", async () => {
      const newUser = await workos.fga.createResource({
        resource: { resourceType: 'user' },
      });
      const permission1 = await workos.fga.createResource({
        resource: { resourceType: 'permission', resourceId: 'perm1' },
        meta: { name: 'Permission 1', description: 'Permission 1' },
      });
      const permission2 = await workos.fga.createResource({
        resource: { resourceType: 'permission', resourceId: 'perm2' },
        meta: { name: 'Permission 2', description: 'Permission 2' },
      });

      const userHasPermissions = await workos.fga.check(
        {
          op: CheckOp.AnyOf,
          checks: [
            { resource: permission1, relation: 'member', subject: newUser },
            { resource: permission2, relation: 'member', subject: newUser },
          ],
        },
        { warrantToken: 'latest' },
      );
      assertEquals(userHasPermissions.isAuthorized(), false);

      let warrantResponse = await workos.fga.writeWarrant({
        resource: permission1,
        relation: 'member',
        subject: newUser,
      });
      assertNotEquals(warrantResponse.warrantToken, undefined);

      let userHasAtLeastOnePermission = await workos.fga.check(
        {
          op: CheckOp.AnyOf,
          checks: [
            { resource: permission1, relation: 'member', subject: newUser },
            { resource: permission2, relation: 'member', subject: newUser },
          ],
        },
        { warrantToken: 'latest' },
      );
      assertEquals(userHasAtLeastOnePermission.isAuthorized(), true);

      let userHasAllPermissions = await workos.fga.check(
        {
          op: CheckOp.AllOf,
          checks: [
            { resource: permission1, relation: 'member', subject: newUser },
            { resource: permission2, relation: 'member', subject: newUser },
          ],
