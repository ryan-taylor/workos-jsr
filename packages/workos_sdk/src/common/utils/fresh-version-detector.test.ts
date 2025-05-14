import { assertStrictEquals } from "jsr:@std/assert@^1";
import { describe, it, beforeEach, afterEach } from "jsr:@std/testing/bdd@^1";
import { detectFreshVersion, isFresh2 } from "./fresh-version-detector.ts";

describe("Fresh Version Detector", () => {
  // Store original environment values
  const originalEnv = Object.assign({}, Deno.env.toObject());

  // Clean up environment variables after each test
  afterEach(() => {
    // Restore original environment
    // Get all environment variables and delete them
    Object.keys(Deno.env.toObject()).forEach(key => {
      Deno.env.delete(key);
    });
    // Set back the original values
    for (const [key, value] of Object.entries(originalEnv)) {
      Deno.env.set(key, value);
    }
  });

  describe("detectFreshVersion", () => {
    it("should detect Fresh 2.x when WORKOS_FRESH_V2=true", () => {
      Deno.env.set("WORKOS_FRESH_V2", "true");
      assertStrictEquals(detectFreshVersion(), "2.x");
    });

    it("should detect Fresh 1.x when WORKOS_FRESH_V2=false", () => {
      Deno.env.set("WORKOS_FRESH_V2", "false");
      assertStrictEquals(detectFreshVersion(), "1.x");
    });

    it("should fall back to Fresh 1.x when no detection method works", () => {
      // Make sure the env var is not set
      Deno.env.delete("WORKOS_FRESH_V2");
      
      // Since we're in a test environment and not in an actual Fresh app,
      // the structure detection should fail, returning the default value
      assertStrictEquals(detectFreshVersion(), "1.x");
    });
  });

  describe("isFresh2", () => {
    it("should return true when Fresh 2.x is detected", () => {
      Deno.env.set("WORKOS_FRESH_V2", "true");
      assertStrictEquals(isFresh2(), true);
    });

    it("should return false when Fresh 1.x is detected", () => {
      Deno.env.set("WORKOS_FRESH_V2", "false");
      assertStrictEquals(isFresh2(), false);
    });
  });
});