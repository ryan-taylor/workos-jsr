import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import {
  isMetadataValue,
  isMetadataMap,
} from "../../../src/common/interfaces/metadata-guards.ts";
import type {
  MetadataValue,
  MetadataMap,
} from "../../../src/common/interfaces/metadata.interface.ts";

Deno.test("isMetadataValue - primitive values", () => {
  // Valid primitive values
  assertEquals(isMetadataValue("string value"), true, "String should be valid");
  assertEquals(isMetadataValue(42), true, "Number should be valid");
  assertEquals(isMetadataValue(0), true, "Zero should be valid");
  assertEquals(isMetadataValue(-10.5), true, "Negative decimal should be valid");
  assertEquals(isMetadataValue(true), true, "Boolean true should be valid");
  assertEquals(isMetadataValue(false), true, "Boolean false should be valid");
  
  // Invalid primitive values
  assertEquals(isMetadataValue(null), false, "Null should be invalid");
  assertEquals(isMetadataValue(undefined), false, "Undefined should be invalid");
  assertEquals(isMetadataValue(Symbol("test")), false, "Symbol should be invalid");
  assertEquals(isMetadataValue(() => {}), false, "Function should be invalid");
  assertEquals(isMetadataValue(BigInt(123)), false, "BigInt should be invalid");
});

Deno.test("isMetadataValue - arrays", () => {
  // Valid arrays
  assertEquals(isMetadataValue([]), true, "Empty array should be valid");
  assertEquals(isMetadataValue(["a", "b", "c"]), true, "String array should be valid");
  assertEquals(isMetadataValue([1, 2, 3]), true, "Number array should be valid");
  assertEquals(isMetadataValue([true, false]), true, "Boolean array should be valid");
  assertEquals(
    isMetadataValue(["a", 1, true]),
    true,
    "Mixed primitive array should be valid"
  );
  
  // Nested arrays
  assertEquals(
    isMetadataValue([["nested"], [1, 2], [true]]),
    true,
    "Array of arrays should be valid"
  );
  assertEquals(
    isMetadataValue([1, ["a", "b"], [["deeply", "nested"]]]),
    true,
    "Deeply nested arrays should be valid"
  );
  
  // Invalid arrays
  assertEquals(
    isMetadataValue([null]),
    false,
    "Array with null should be invalid"
  );
  assertEquals(
    isMetadataValue([undefined]),
    false,
    "Array with undefined should be invalid"
  );
  assertEquals(
    isMetadataValue([() => {}]),
    false,
    "Array with function should be invalid"
  );
  assertEquals(
    isMetadataValue([Symbol("test")]),
    false,
    "Array with symbol should be invalid"
  );
  assertEquals(
    isMetadataValue([1, "valid", null, "also-valid"]),
    false,
    "Array with some invalid items should be invalid"
  );
});

Deno.test("isMetadataValue - objects", () => {
  // Valid objects
  assertEquals(isMetadataValue({}), true, "Empty object should be valid");
  assertEquals(
    isMetadataValue({ key: "value" }),
    true,
    "Simple string object should be valid"
  );
  assertEquals(
    isMetadataValue({ key: 42 }),
    true,
    "Simple number object should be valid"
  );
  assertEquals(
    isMetadataValue({ key: true }),
    true,
    "Simple boolean object should be valid"
  );
  assertEquals(
    isMetadataValue({ str: "value", num: 42, bool: true }),
    true,
    "Mixed primitive object should be valid"
  );
  
  // Nested objects
  assertEquals(
    isMetadataValue({ nested: { key: "value" } }),
    true,
    "Nested object should be valid"
  );
  assertEquals(
    isMetadataValue({ 
      level1: { 
        level2: { 
          level3: "deep" 
        } 
      } 
    }),
    true,
    "Deeply nested object should be valid"
  );
  
  // Objects with arrays
  assertEquals(
    isMetadataValue({ array: [1, 2, 3] }),
    true,
    "Object with array should be valid"
  );
  assertEquals(
    isMetadataValue({ array: ["a", { nested: "value" }] }),
    true,
    "Object with array of mixed types should be valid"
  );
  
  // Invalid objects
  assertEquals(
    isMetadataValue({ key: null }),
    false,
    "Object with null value should be invalid"
  );
  assertEquals(
    isMetadataValue({ key: undefined }),
    false,
    "Object with undefined value should be invalid"
  );
  assertEquals(
    isMetadataValue({ key: () => {} }),
    false,
    "Object with function value should be invalid"
  );
  assertEquals(
    isMetadataValue({ key: Symbol("test") }),
    false,
    "Object with symbol value should be invalid"
  );
  assertEquals(
    isMetadataValue({ valid: "value", invalid: null }),
    false,
    "Object with some invalid values should be invalid"
  );
  assertEquals(
    isMetadataValue({ deeply: { nested: { invalid: undefined } } }),
    false,
    "Deeply nested object with invalid value should be invalid"
  );
});

Deno.test("isMetadataValue - complex mixed structures", () => {
  // Complex valid structure
  const complexValid = {
    string: "value",
    number: 42,
    boolean: true,
    array: [1, "two", false],
    nested: {
      object: { key: "value" },
      arrayOfObjects: [{ a: 1 }, { b: 2 }],
      objectWithArrays: { x: [1, 2], y: ["a", "b"] }
    }
  };
  assertEquals(
    isMetadataValue(complexValid),
    true,
    "Complex valid structure should be valid"
  );
  
  // Complex invalid structure
  const complexInvalid = {
    string: "value",
    number: 42,
    nested: {
      valid: true,
      invalid: null,
      deeplyNested: {
        stillValid: "yes",
        nowInvalid: undefined
      }
    }
  };
  assertEquals(
    isMetadataValue(complexInvalid),
    false,
    "Complex structure with invalid values should be invalid"
  );
});

Deno.test("isMetadataMap - valid maps", () => {
  // Valid metadata maps
  assertEquals(isMetadataMap({}), true, "Empty object should be valid");
  assertEquals(
    isMetadataMap({ key: "value" }),
    true,
    "Simple string map should be valid"
  );
  assertEquals(
    isMetadataMap({ key: 42 }),
    true,
    "Simple number map should be valid"
  );
  assertEquals(
    isMetadataMap({ key: true }),
    true,
    "Simple boolean map should be valid"
  );
  assertEquals(
    isMetadataMap({ key: [1, 2, 3] }),
    true,
    "Map with array should be valid"
  );
  assertEquals(
    isMetadataMap({ key: { nested: "value" } }),
    true,
    "Map with nested object should be valid"
  );
  
  // Complex valid map
  const complexMap = {
    string: "value",
    number: 42,
    boolean: true,
    array: [1, "two", false],
    nested: {
      object: { key: "value" },
      arrayOfObjects: [{ a: 1 }, { b: 2 }],
      mixedArray: [1, "two", { three: 3 }]
    }
  };
  assertEquals(
    isMetadataMap(complexMap),
    true,
    "Complex valid map should be valid"
  );
});

Deno.test("isMetadataMap - invalid maps", () => {
  // Non-object values
  assertEquals(isMetadataMap(null), false, "Null should be invalid");
  assertEquals(isMetadataMap(undefined), false, "Undefined should be invalid");
  assertEquals(isMetadataMap("string"), false, "String should be invalid");
  assertEquals(isMetadataMap(42), false, "Number should be invalid");
  assertEquals(isMetadataMap(true), false, "Boolean should be invalid");
  assertEquals(isMetadataMap([]), false, "Array should be invalid");
  assertEquals(isMetadataMap(() => {}), false, "Function should be invalid");
  
  // Objects with invalid values
  assertEquals(
    isMetadataMap({ key: null }),
    false,
    "Map with null value should be invalid"
  );
  assertEquals(
    isMetadataMap({ key: undefined }),
    false,
    "Map with undefined value should be invalid"
  );
  assertEquals(
    isMetadataMap({ key: () => {} }),
    false,
    "Map with function value should be invalid"
  );
  assertEquals(
    isMetadataMap({ key: Symbol("test") }),
    false,
    "Map with symbol value should be invalid"
  );
  
  // Mixed valid/invalid
  assertEquals(
    isMetadataMap({ valid: "value", invalid: null }),
    false,
    "Map with some invalid values should be invalid"
  );
  assertEquals(
    isMetadataMap({ 
      valid: "value", 
      nested: { 
        alsoValid: 42,
        butInvalid: undefined
      } 
    }),
    false,
    "Map with nested invalid values should be invalid"
  );
});

Deno.test("isMetadataMap - edge cases", () => {
  // Edge cases
  assertEquals(
    isMetadataMap(Object.create(null)),
    true,
    "Object with no prototype should be valid"
  );
  
  // Testing with constructed objects
  class TestClass {
    prop = "value";
  }
  assertEquals(
    isMetadataMap(new TestClass()),
    true,
    "Class instance with valid properties should be valid"
  );
  
  // Object with inherited properties
  const proto = { inheritedProp: "value" };
  const obj = Object.create(proto);
  obj.ownProp = "value";
  assertEquals(
    isMetadataMap(obj),
    true,
    "Object should only check own properties"
  );
});