import { assertEquals, assertNotEquals } from "std/assert/mod.ts";
// @ts-ignore This test is ignored anyway so it's just for compiling
import { WorkOS } from "../../../mod.ts.ts";

Deno.test({
  name: "CRUD resources",
  ignore: true,
  async fn(t) {
    // @ts-ignore: Using deprecated API
    const workos = new WorkOS("API_KEY");

    await t.step("CRUD resources", async () => {
      // @ts-ignore: Using deprecated API
      const resource1 = await workos.fga.createResource({
        resource: { resourceType: "document" },
      });
      assertEquals(resource1.resourceType, "document");
      assertNotEquals(resource1.resourceId, undefined);
      assertEquals(resource1.meta, undefined);

      // @ts-ignore: Using deprecated API
      let resource2 = await workos.fga.createResource({
        resource: { resourceType: "folder", resourceId: "planning" },
      });
      // @ts-ignore: Using deprecated API
      let refetchedResource = await workos.fga.getResource(resource2);
      assertEquals(refetchedResource.resourceType, resource2.resourceType);
      assertEquals(refetchedResource.resourceId, resource2.resourceId);
      assertEquals(refetchedResource.meta, resource2.meta);

      // @ts-ignore: Using deprecated API
      resource2 = await workos.fga.updateResource({
        resource: { resourceType: "folder", resourceId: "planning" },
        meta: { description: "Second document" },
      });
      // @ts-ignore: Using deprecated API
      refetchedResource = await workos.fga.getResource(resource2);
      assertEquals(refetchedResource.resourceType, resource2.resourceType);
      assertEquals(refetchedResource.resourceId, resource2.resourceId);
      assertEquals(refetchedResource.meta, resource2.meta);

      // @ts-ignore: Using deprecated API
      let resourcesList = await workos.fga.listResources({ limit: 10 });
      assertEquals(resourcesList.data.length, 2);
      assertEquals(resourcesList.data[0].resourceType, resource2.resourceType);
      assertEquals(resourcesList.data[0].resourceId, resource2.resourceId);
      assertEquals(resourcesList.data[1].resourceType, resource1.resourceType);
      assertEquals(resourcesList.data[1].resourceId, resource1.resourceId);

      // @ts-ignore: Using deprecated API
      resourcesList = await workos.fga.listResources({
        limit: 10,
        search: "planning",
      });
      assertEquals(resourcesList.data.length, 1);
      assertEquals(resourcesList.data[0].resourceType, resource2.resourceType);
      assertEquals(resourcesList.data[0].resourceId, resource2.resourceId);

      // @ts-ignore: Using deprecated API
      await workos.fga.deleteResource(resource1);
      // @ts-ignore: Using deprecated API
      await workos.fga.deleteResource(resource2);
      // @ts-ignore: Using deprecated API
      resourcesList = await workos.fga.listResources({ limit: 10 });
      assertEquals(resourcesList.data.length, 0);
    });
  },
});
