// Import Deno standard testing library
import { assertEquals } from "@std/assert";

import {
  fetchMethod,
  fetchOnce,
  fetchURL,
  resetMockFetch,
} from "../common/utils/test-utils.ts.ts";
import { WorkOS } from "../workos.ts.ts";
import type { List } from "../common/interfaces/index.ts.ts";
import type {
  SecretDigest,
  SecretMetadata,
  SecretVersion,
  VaultSecret,
} from "./interfaces/index.ts.ts";
import { ConflictException } from "../common/exceptions/conflict.exception.ts.ts";

const workos = new WorkOS("sk_test_Sz3IQjepeSWaI4cMS4ms4sMuU");

// Setup function to reset mock fetch before each test
function setup() {
  resetMockFetch();
}

// Vault - createSecret creates secret
Deno.test("Vault - createSecret creates secret", async () => {
  setup();

  const secretName = "charger";
  fetchOnce({
    id: "s1",
    context: {
      type: "spore",
    },
    environment_id: "xxx",
    key_id: "k1",
    updated_at: "2029-03-17T04:37:46.748303Z",
    updated_by: {
      id: "key_xxx",
      name: "Local Test Key",
    },
    version_id: "v1",
  });

  const resource = await workos.vault.createSecret({
    name: secretName,
    context: { type: "spore" },
    value: "Full speed ahead",
  });

  assertEquals(fetchURL()?.includes(`/vault/v1/kv`), true);
  assertEquals(fetchMethod(), "POST");
  assertEquals(resource, {
    id: "s1",
    context: {
      type: "spore",
    },
    environmentId: "xxx",
    keyId: "k1",
    updatedAt: new Date(Date.parse("2029-03-17T04:37:46.748303Z")),
    updatedBy: {
      id: "key_xxx",
      name: "Local Test Key",
    },
    versionId: "v1",
  } as SecretMetadata);
});

// Vault - createSecret throws an error if secret exists
Deno.test("Vault - createSecret throws an error if secret exists", async () => {
  setup();

  const secretName = "charger";
  fetchOnce(
    {
      error: "Item already exists",
    },
    { status: 409 },
  );

  try {
    await workos.vault.createSecret({
      name: secretName,
      context: { type: "spore" },
      value: "Full speed ahead",
    });
    throw new Error("Expected to throw but did not");
  } catch (error) {
    assertEquals(error instanceof ConflictException, true);
  }

  assertEquals(fetchURL()?.includes(`/vault/v1/kv`), true);
  assertEquals(fetchMethod(), "POST");
});

// Vault - readSecret reads a secret by id
Deno.test("Vault - readSecret reads a secret by id", async () => {
  setup();

  const secretName = "lima";
  const secretId = "secret1";
  fetchOnce({
    id: secretId,
    metadata: {
      id: secretId,
      context: {
        emporer: "groove",
      },
      environment_id: "environment_d",
      key_id: "key1",
      updated_at: "2025-03-11T02:18:54.250931Z",
      updated_by: {
        id: "key_xxx",
        name: "Local Test Key",
      },
      version_id: "version1",
    },
    name: secretName,
    value: "Pull the lever Gronk",
  });

  const resource = await workos.vault.readSecret({
    id: secretId,
  });

  assertEquals(fetchURL()?.includes(`/vault/v1/kv/${secretId}`), true);
  assertEquals(fetchMethod(), "GET");
  assertEquals(resource, {
    id: secretId,
    metadata: {
      id: secretId,
      context: {
        emporer: "groove",
      },
      environmentId: "environment_d",
      keyId: "key1",
      updatedAt: new Date(Date.parse("2025-03-11T02:18:54.250931Z")),
      updatedBy: {
        id: "key_xxx",
        name: "Local Test Key",
      },
      versionId: "version1",
    },
    name: secretName,
    value: "Pull the lever Gronk",
  } as VaultSecret);
});

// Vault - listSecrets gets a paginated list of secrets
Deno.test("Vault - listSecrets gets a paginated list of secrets", async () => {
  setup();

  fetchOnce({
    data: [
      {
        id: "s1",
        name: "charger",
        updated_at: "2029-03-17T04:37:46.748303Z",
      },
    ],
    list_metadata: {
      after: null,
      before: "charger",
    },
  });

  const resource = await workos.vault.listSecrets();

  assertEquals(fetchURL()?.includes(`/vault/v1/kv`), true);
  assertEquals(fetchMethod(), "GET");
  assertEquals(resource, {
    object: "list",
    data: [
      {
        id: "s1",
        name: "charger",
        updatedAt: new Date(Date.parse("2029-03-17T04:37:46.748303Z")),
      },
    ],
    listMetadata: {
      after: undefined,
      before: "charger",
    },
  } as List<SecretDigest>);
});

// Vault - listSecretVersions gets a paginated list of secret versions
Deno.test("Vault - listSecretVersions gets a paginated list of secret versions", async () => {
  setup();

  fetchOnce({
    data: [
      {
        id: "raZUqoHteQkLihH6AG5bj6sYAqMcJS76",
        size: 270,
        etag: '"5147c963627323edcb15910ceea573bf"',
        created_at: "2029-03-17T15:51:57.000000Z",
        current_version: true,
      },
    ],
    list_metadata: {
      after: null,
      before: "raZUqoHteQkLihH6AG5bj6sYAqMcJS76",
    },
  });

  const resource = await workos.vault.listSecretVersions({ id: "secret1" });

  assertEquals(fetchURL()?.includes(`/vault/v1/kv/secret1/versions`), true);
  assertEquals(fetchMethod(), "GET");
  assertEquals(resource, [
    {
      createdAt: new Date(Date.parse("2029-03-17T15:51:57.000000Z")),
      currentVersion: true,
      id: "raZUqoHteQkLihH6AG5bj6sYAqMcJS76",
    },
  ] as SecretVersion[]);
});

// Vault - updateSecret updates secret
Deno.test("Vault - updateSecret updates secret", async () => {
  setup();

  const secretId = "s1";
  fetchOnce({
    id: secretId,
    name: "charger",
    metadata: {
      id: secretId,
      context: {
        type: "spore",
      },
      environment_id: "xxx",
      key_id: "k1",
      updated_at: "2029-03-17T04:37:46.748303Z",
      updated_by: {
        id: "key_xxx",
        name: "Local Test Key",
      },
      version_id: "v1",
    },
  });

  const resource = await workos.vault.updateSecret({
    id: secretId,
    value: "Full speed ahead",
  });

  assertEquals(fetchURL()?.includes(`/vault/v1/kv/${secretId}`), true);
  assertEquals(fetchMethod(), "PUT");
  assertEquals(resource, {
    id: secretId,
    name: "charger",
    metadata: {
      id: secretId,
      context: {
        type: "spore",
      },
      environmentId: "xxx",
      keyId: "k1",
      updatedAt: new Date(Date.parse("2029-03-17T04:37:46.748303Z")),
      updatedBy: {
        id: "key_xxx",
        name: "Local Test Key",
      },
      versionId: "v1",
    },
    value: undefined,
  } as VaultSecret);
});

// Vault - updateSecret throws an error if secret version check fails
Deno.test("Vault - updateSecret throws an error if secret version check fails", async () => {
  setup();

  fetchOnce(
    {
      error: "Item already exists",
    },
    { status: 409 },
  );

  try {
    await workos.vault.updateSecret({
      id: "secret1",
      value: "Full speed ahead",
      versionCheck: "notaversion",
    });
    throw new Error("Expected to throw but did not");
  } catch (error) {
    assertEquals(error instanceof ConflictException, true);
  }

  assertEquals(fetchURL()?.includes(`/vault/v1/kv/secret1`), true);
  assertEquals(fetchMethod(), "PUT");
});
