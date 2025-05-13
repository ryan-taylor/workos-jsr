import { assertEquals } from "@std/assert";
import { WorkOS } from "../../workos.ts.ts";
import { WarrantOp } from "../interfaces/warrant.ts.ts";

Deno.test({
  name: "Pricing tiers example",
  ignore: true,
  async fn(t) {
    const workos = new WorkOS("API_KEY");

    await t.step("pricing tiers, features, and users example", async () => {
      // Create users
      const freeUser = await workos.fga.createResource({
        resource: { resourceType: "user" },
      });
      const paidUser = await workos.fga.createResource({
        resource: { resourceType: "user" },
      });

      // Create pricing tiers
      const freeTier = await workos.fga.createResource({
        resource: { resourceType: "pricing-tier", resourceId: "free" },
        meta: { name: "Free Tier" },
      });
      const paidTier = await workos.fga.createResource({
        resource: { resourceType: "pricing-tier", resourceId: "paid" },
      });

      // Create features
      const customFeature = await workos.fga.createResource({
        resource: { resourceType: "feature", resourceId: "custom-feature" },
        meta: { name: "Custom Feature" },
      });
      const feature1 = await workos.fga.createResource({
        resource: { resourceType: "feature", resourceId: "feature-1" },
      });
      const feature2 = await workos.fga.createResource({
        resource: { resourceType: "feature", resourceId: "feature-2" },
      });

      // Assign 'custom-feature' -> paid user
      let paidUserHasFeature = await workos.fga.check(
        {
          checks: [
            { resource: customFeature, relation: "member", subject: paidUser },
          ],
        },
        { warrantToken: "latest" },
      );
      assertEquals(paidUserHasFeature.isAuthorized(), false);

      let paidUserFeaturesList = await workos.fga.query(
        {
          q: `select feature where user:${paidUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: "latest" },
      );
      assertEquals(paidUserFeaturesList.data.length, 0);

      await workos.fga.writeWarrant({
        resource: customFeature,
        relation: "member",
        subject: paidUser,
      });

      paidUserHasFeature = await workos.fga.check(
        {
          checks: [
            { resource: customFeature, relation: "member", subject: paidUser },
          ],
        },
        { warrantToken: "latest" },
      );
      assertEquals(paidUserHasFeature.isAuthorized(), true);

      paidUserFeaturesList = await workos.fga.query(
        {
          q: `select feature where user:${paidUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: "latest" },
      );
      assertEquals(paidUserFeaturesList.data.length, 1);
      assertEquals(paidUserFeaturesList.data[0].resourceType, "feature");
      assertEquals(paidUserFeaturesList.data[0].resourceId, "custom-feature");
      assertEquals(paidUserFeaturesList.data[0].meta, {
        name: "Custom Feature",
      });

      await workos.fga.writeWarrant({
        op: WarrantOp.Delete,
        resource: customFeature,
        relation: "member",
        subject: paidUser,
      });

      paidUserHasFeature = await workos.fga.check(
        {
          checks: [
            { resource: customFeature, relation: "member", subject: paidUser },
          ],
        },
        { warrantToken: "latest" },
      );
      assertEquals(paidUserHasFeature.isAuthorized(), false);

      paidUserFeaturesList = await workos.fga.query(
        {
          q: `select feature where user:${paidUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: "latest" },
      );
      assertEquals(paidUserFeaturesList.data.length, 0);

      // Assign 'feature-1' -> 'free' tier -> free user
      let freeUserHasFeature = await workos.fga.check(
        {
          checks: [{
            resource: feature1,
            relation: "member",
            subject: freeUser,
          }],
        },
        { warrantToken: "latest" },
      );
      assertEquals(freeUserHasFeature.isAuthorized(), false);

      let freeUserFeaturesList = await workos.fga.query(
        {
          q: `select feature where user:${freeUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: "latest" },
      );
      assertEquals(freeUserFeaturesList.data.length, 0);

      let freeUserTiersList = await workos.fga.query(
        {
          q: `select pricing-tier where user:${freeUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: "latest" },
      );
      assertEquals(freeUserTiersList.data.length, 0);

      await workos.fga.writeWarrant({
        resource: feature1,
        relation: "member",
        subject: freeTier,
      });
      await workos.fga.writeWarrant({
        resource: freeTier,
        relation: "member",
        subject: freeUser,
      });

      freeUserHasFeature = await workos.fga.check(
        {
          checks: [{
            resource: feature1,
            relation: "member",
            subject: freeUser,
          }],
        },
        { warrantToken: "latest" },
      );
      assertEquals(freeUserHasFeature.isAuthorized(), true);

      freeUserFeaturesList = await workos.fga.query(
        {
          q: `select feature where user:${freeUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: "latest" },
      );
      assertEquals(freeUserFeaturesList.data.length, 1);
      assertEquals(freeUserFeaturesList.data[0].resourceType, "feature");
      assertEquals(freeUserFeaturesList.data[0].resourceId, "feature-1");
      assertEquals(freeUserFeaturesList.data[0].meta, undefined);

      freeUserTiersList = await workos.fga.query(
        {
          q: `select pricing-tier where user:${freeUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: "latest" },
      );
      assertEquals(freeUserTiersList.data.length, 1);
      assertEquals(freeUserTiersList.data[0].resourceType, "pricing-tier");
      assertEquals(freeUserTiersList.data[0].resourceId, "free");
      assertEquals(freeUserTiersList.data[0].meta, { name: "Free Tier" });

      await workos.fga.writeWarrant({
        op: WarrantOp.Delete,
        resource: feature1,
        relation: "member",
        subject: freeTier,
      });
      await workos.fga.writeWarrant({
        op: WarrantOp.Delete,
        resource: freeTier,
        relation: "member",
        subject: freeUser,
      });

      freeUserHasFeature = await workos.fga.check(
        {
          checks: [{
            resource: feature1,
            relation: "member",
            subject: freeUser,
          }],
        },
        { warrantToken: "latest" },
      );
      assertEquals(freeUserHasFeature.isAuthorized(), false);

      freeUserFeaturesList = await workos.fga.query(
        {
          q: `select feature where user:${freeUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: "latest" },
      );
      assertEquals(freeUserFeaturesList.data.length, 0);

      freeUserTiersList = await workos.fga.query(
        {
          q: `select pricing-tier where user:${freeUser.resourceId} is member`,
          limit: 10,
        },
        { warrantToken: "latest" },
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
  },
});
