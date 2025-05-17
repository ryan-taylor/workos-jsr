// deno-lint-ignore-file no-unused-vars
import { assertEquals, assertNotEquals } from "@std/assert";
import {
  adaptListMetadata,
  deserializeEvent,
  deserializeList,
  serialize,
  serializeBoolean,
  serializeDate,
  serializeEvent,
  serializeList,
} from "../../packages/workos_sdk/mod.ts";

/**
 * Core serialization tests
 * Tests for the common serialization utilities used throughout the SDK
 */
Deno.test("Common Serializers - serialize handles primitive types", () => {
  assertEquals(serialize("test"), "test");
  assertEquals(serialize(123), 123);
  assertEquals(serialize(true), true);
  assertEquals(serialize(null), null);
  assertEquals(serialize(undefined), undefined);
});

Deno.test("Common Serializers - serialize handles Date objects", () => {
  const date = new Date("2023-05-12T12:00:00Z");
  assertEquals(serialize(date), "2023-05-12T12:00:00.000Z");
});

Deno.test("Common Serializers - serialize handles arrays", () => {
  const array = [1, "test", true, new Date("2023-05-12T12:00:00Z")];
  const serialized = serialize<unknown[]>(array);
  assertEquals(serialized[0], 1);
  assertEquals(serialized[1], "test");
  assertEquals(serialized[2], true);
  assertEquals(serialized[3], "2023-05-12T12:00:00.000Z");
});

Deno.test("Common Serializers - serialize handles nested objects", () => {
  const obj = {
    str: "test",
    num: 123,
    bool: true,
    date: new Date("2023-05-12T12:00:00Z"),
    nested: {
      arr: [1, 2, 3],
      date: new Date("2023-05-12T12:00:00Z"),
    },
  };

  const serialized = serialize<Record<string, unknown>>(obj);
  assertEquals(serialized.str, "test");
  assertEquals(serialized.num, 123);
  assertEquals(serialized.bool, true);
  assertEquals(serialized.date, "2023-05-12T12:00:00.000Z");
  assertEquals((serialized.nested as Record<string, unknown>).arr, [1, 2, 3]);
  assertEquals(
    (serialized.nested as Record<string, unknown>).date,
    "2023-05-12T12:00:00.000Z",
  );
});

Deno.test("Common Serializers - adaptListMetadata correctly formats metadata", () => {
  const metadata = {
    before: "before_token",
    after: "after_token",
  };

  const adapted = adaptListMetadata(metadata) as Record<string, unknown>;
  assertEquals(adapted.before, "before_token");
  assertEquals(adapted.after, "after_token");
});

Deno.test("Common Serializers - adaptListMetadata handles null values", () => {
  const metadata = {
    before: null,
    after: null,
  };
  const adapted = adaptListMetadata(metadata) as Record<string, unknown>;
  assertEquals(adapted.before, null);
  assertEquals(adapted.after, null);
  assertEquals(adapted.after, null);
});
Deno.test("Common Serializers - serializeList formats list responses", () => {
  const data = [
    { id: "1", name: "Item 1" },
    { id: "2", name: "Item 2" },
  ];

  // Identity serializer for testing
  const identitySerializer = (item: unknown) => item;

  const serialized = serializeList(data, identitySerializer);
  assertEquals(Array.isArray(serialized.data), true);
  // Since we're using an identity serializer, the output should match the input
  assertEquals(serialized.data[0], data[0]);
  assertEquals(serialized.data[1], data[1]);
});

Deno.test("Common Serializers - deserializeList handles server list format", () => {
  const serverResponse = {
    object: "list",
    data: [
      { id: "1", name: "Item 1" },
      { id: "2", name: "Item 2" },
    ],
    list_metadata: {
      before: "before_token",
      after: "after_token",
    },
  };

  // Identity deserializer for testing
  const identityDeserializer = (item: unknown) => item;

  const deserialized = deserializeList(serverResponse, identityDeserializer);
  assertEquals(deserialized.data.length, 2);
  assertEquals((deserialized.data[0] as Record<string, unknown>).id, "1");
  assertEquals(
    (deserialized.data[0] as Record<string, unknown>).name,
    "Item 1",
  );
  assertEquals(deserialized.listMetadata.before, "before_token");
  assertEquals(deserialized.listMetadata.after, "after_token");
});

Deno.test("Common Serializers - serializeEvent formats event data", () => {
  const event = {
    id: "evt_123",
    event: "user.created",
    data: { user_id: "user_123" },
    created_at: new Date("2023-05-12T12:00:00Z"),
  };

  const serialized = serializeEvent(event);
  assertEquals(serialized.id, "evt_123");
  assertEquals(serialized.event, "user.created");
  assertEquals(serialized.data.user_id, "user_123");
  assertEquals(serialized.created_at, "2023-05-12T12:00:00.000Z");
});

Deno.test("Common Serializers - deserializeEvent handles server event format", () => {
  const serverEvent = {
    id: "evt_123",
    event: "user.created",
    data: { user_id: "user_123" },
    created_at: "2023-05-12T12:00:00Z",
  };

  const deserialized = deserializeEvent(serverEvent);
  assertEquals(deserialized.id, "evt_123");
  assertEquals(deserialized.event, "user.created");
  assertEquals(deserialized.data.user_id, "user_123");

  // Check created_at value
  assertEquals(deserialized.created_at, "2023-05-12T12:00:00Z");
});

Deno.test("Common Serializers - serializeDate handles string dates", () => {
  const dateStr = "2023-05-12T12:00:00Z";
  const result = serializeDate(dateStr);
  assertEquals(result instanceof Date, true);
  assertEquals(result?.toISOString(), "2023-05-12T12:00:00.000Z");
});

Deno.test("Common Serializers - serializeDate handles different string formats", () => {
  const result = serializeDate("2023-05-12");
  assertEquals(result instanceof Date, true);
});

Deno.test("Common Serializers - serializeDate handles null", () => {
  const result = serializeDate(null);
  assertEquals(result, null);
});

Deno.test("Common Serializers - serializeBoolean handles boolean values", () => {
  assertEquals(serializeBoolean(true), true);
  assertEquals(serializeBoolean(false), false);
});

Deno.test("Common Serializers - serializeBoolean handles truthy strings", () => {
  assertEquals(serializeBoolean("true"), true);
  assertEquals(serializeBoolean("t"), true);
  assertEquals(serializeBoolean("yes"), true);
  assertEquals(serializeBoolean("y"), true);
  assertEquals(serializeBoolean("1"), true);
});

Deno.test("Common Serializers - serializeBoolean handles falsy strings", () => {
  assertEquals(serializeBoolean("false"), false);
  assertEquals(serializeBoolean("f"), false);
  assertEquals(serializeBoolean("no"), false);
  assertEquals(serializeBoolean("n"), false);
  assertEquals(serializeBoolean("0"), false);
});

Deno.test("Common Serializers - serializeBoolean handles non-boolean values", () => {
  assertEquals(serializeBoolean(null), false);
  assertEquals(serializeBoolean(undefined), false);
  assertEquals(serializeBoolean(""), false);
  assertEquals(serializeBoolean("random string"), false);
  assertEquals(serializeBoolean(0), false);
  assertEquals(serializeBoolean(1), true);
});
