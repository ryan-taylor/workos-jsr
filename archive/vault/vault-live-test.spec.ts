/**
 * ARCHIVED FILE - DO NOT USE
 * 
 * This file was archived for the following reasons:
 * - Uses a hardcoded API_KEY (violating secrets management guidelines)
 * - Has incorrect import paths with duplicate `.ts.ts` extensions
 * - Requires live network dependency
 * - Is superseded by mocked tests
 */

import { WorkOS } from "../workos.ts.ts";
import { crypto } from "@std/crypto";
import { NotFoundException } from "../index.worker.ts.ts";
import { ConflictException } from "../common/exceptions/conflict.exception.ts.ts";
import { assertEquals, assertRejects, assertThrows } from "@std/assert";

Deno.test({
  name: "Vault Live Test",
  ignore: true, // Equivalent to Jest's describe.skip
  async fn(t) {
    let workos: WorkOS;
    const objectPrefix: string = crypto.randomUUID();

    workos = new WorkOS("API_KEY");

    await t.step("cleanup after each test", async () => {
      let listLimit = 0;
      let before: string | undefined;

      do {
        const allObjects = await workos.vault.listObjects({ after: before });

        for (const object of allObjects.data) {
          if (object.name.startsWith(objectPrefix)) {
            await workos.vault.deleteObject({ id: object.id });
          }
        }
        before = allObjects.listMetadata.before;
        listLimit++;
      } while (listLimit < 100 && before !== undefined);
    });

    await t.step("Creates objects", async () => {
      const objectName = `${objectPrefix}-lima`;
      const newObject = await workos.vault.createObject({
        name: objectName,
        value: "Huacaya 27.7 micron",
        context: { fiber: "Alpalca" },
      });

      // Verify object metadata
      assertEquals(typeof newObject.id, "string");
      assertEquals(newObject.context, { fiber: "Alpalca" });
      assertEquals(typeof newObject.environmentId, "string");
      assertEquals(typeof newObject.keyId, "string");
      assertEquals(newObject.updatedAt instanceof Date, true);
      assertEquals(typeof newObject.updatedBy.id, "string");
      assertEquals(typeof newObject.updatedBy.name, "string");
      assertEquals(typeof newObject.versionId, "string");

      const objectValue = await workos.vault.readObject({ id: newObject.id });
      assertEquals(objectValue.id, newObject.id);
      assertEquals(objectValue.name, objectName);
      assertEquals(objectValue.value, "Huacaya 27.7 micron");
      assertEquals(objectValue.metadata.id, newObject.id);
    });

    await t.step("Fails to create objects with the same name", async () => {
      const objectName = `${objectPrefix}-lima`;
      await workos.vault.createObject({
        name: objectName,
        value: "Huacaya 27.7 micron",
        context: { fiber: "Alpalca" },
      });

      await assertRejects(
        () =>
          workos.vault.createObject({
            name: objectName,
            value: "Huacaya 27.7 micron",
            context: { fiber: "Alpalca" },
          }),
        ConflictException,
      );
    });

    await t.step("Updates objects", async () => {
      const objectName = `${objectPrefix}-cusco`;
      const newObject = await workos.vault.createObject({
        name: objectName,
        value: "Tapada 20-30 micron",
        context: { fiber: "Alpalca" },
      });

      const updatedObject = await workos.vault.updateObject({
        id: newObject.id,
        value: "Ccara 30-40 micron",
      });

      assertEquals(updatedObject.id, newObject.id);
      assertEquals(updatedObject.name, objectName);
      assertEquals(updatedObject.value, undefined);
      assertEquals(updatedObject.metadata.context, { fiber: "Alpalca" });

      const objectValue = await workos.vault.readObject({ id: newObject.id });
      assertEquals(objectValue.id, newObject.id);
      assertEquals(objectValue.name, objectName);
      assertEquals(objectValue.value, "Ccara 30-40 micron");
    });

    await t.step(
      "Fails to update objects with wrong version check",
      async () => {
        const objectName = `${objectPrefix}-cusco`;
        const newObject = await workos.vault.createObject({
          name: objectName,
          value: "Tapada 20-30 micron",
          context: { fiber: "Alpalca" },
        });

        await workos.vault.updateObject({
          id: newObject.id,
          value: "Ccara 30-40 micron",
        });

        await assertRejects(
          () =>
            workos.vault.updateObject({
              id: newObject.id,
              value: "Ccara 30-40 micron",
              versionCheck: newObject.versionId,
            }),
          ConflictException,
        );
      },
    );

    await t.step("Deletes objects", async () => {
      const objectName = `${objectPrefix}-machu`;
      const newObject = await workos.vault.createObject({
        name: objectName,
        value: "Tapada 20-30 micron",
        context: { fiber: "Alpalca" },
      });

      await workos.vault.deleteObject({ id: newObject.id });

      await assertRejects(
        () => workos.vault.readObject({ id: newObject.id }),
        NotFoundException,
      );
    });

    await t.step("Describes objects", async () => {
      const objectName = `${crypto.randomUUID()}-trujillo`;
      const newObject = await workos.vault.createObject({
        name: objectName,
        value: "Qiviut 11-13 micron",
        context: { fiber: "Musk Ox" },
      });

      const objectDescription = await workos.vault.describeObject({
        id: newObject.id,
      });

      assertEquals(objectDescription.id, newObject.id);
      assertEquals(objectDescription.name, objectName);
      assertEquals(objectDescription.metadata.context, { fiber: "Musk Ox" });
      assertEquals(objectDescription.value, undefined);
    });

    await t.step("Lists objects with pagination", async () => {
      const objectNames = [];
      const numObjects = 6;
      const listPrefix = `${objectPrefix}-${crypto.randomUUID()}`;

      for (let i = 0; i < numObjects; i++) {
        const objectName = `${listPrefix}-${i}`;
        await workos.vault.createObject({
          name: objectName,
          value: "Qiviut 11-13 micron",
          context: { fiber: "Musk Ox" },
        });
        objectNames.push(objectName);
      }

      const allObjectNames: string[] = [];
      let before: string | undefined;

      do {
        const list = await workos.vault.listObjects({
          limit: 2,
          after: before,
        });

        for (const object of list.data) {
          if (object.name.startsWith(listPrefix)) {
            allObjectNames.push(object.name);
          }
        }
        before = list.listMetadata.before;
      } while (before !== undefined);

      const missingObjects = objectNames.filter(
        (name) => !allObjectNames.includes(name),
      );

      assertEquals(allObjectNames.length, numObjects);
      assertEquals(missingObjects, []);
    });

    await t.step("Lists object versions", async () => {
      const objectName = `${objectPrefix}-arequipa`;
      const newObject = await workos.vault.createObject({
        name: objectName,
        value: "Tapada 20-30 micron",
        context: { fiber: "Alpalca" },
      });

      const updatedObject = await workos.vault.updateObject({
        id: newObject.id,
        value: "Ccara 30-40 micron",
      });

      const versions = await workos.vault.listObjectVersions({
        id: newObject.id,
      });

      assertEquals(versions.length, 2);

      const currentVersion = versions.find((v) => v.currentVersion);
      assertEquals(currentVersion?.id, updatedObject.metadata.versionId);

      const firstVersion = versions.find((v) => v.id === newObject.versionId);
      assertEquals(firstVersion?.currentVersion, false);
    });

    await t.step("encrypts and decrypts data", async () => {
      const superObject = "hot water freezes faster than cold water";
      const keyContext = {
        everything: "everywhere",
      };
      const encrypted = await workos.vault.encrypt(superObject, keyContext);
      const decrypted = await workos.vault.decrypt(encrypted);
      assertEquals(decrypted, superObject);
    });

    await t.step("authenticates additional data", async () => {
      const data = "hot water freezes faster than cold water";
      const keyContext = { everything: "everywhere" };
      const aad = "seq1";
      const encrypted = await workos.vault.encrypt(data, keyContext, aad);
      const decrypted = await workos.vault.decrypt(encrypted, aad);
      assertEquals(decrypted, data);
    });

    await t.step("fails with invalid AD", async () => {
      const data = "hot water freezes faster than cold water";
      const keyContext = { everything: "everywhere" };
      const aad = "seq1";
      const encrypted = await workos.vault.encrypt(data, keyContext, aad);
      await assertRejects(
        () => workos.vault.decrypt(encrypted),
        Error,
        "unable to authenticate data",
      );
    });
  },
});