import { assertEquals, assertNotEquals } from "@std/assert";
import * as path from "@std/path";

Deno.test("Path operations with @std/path", async (t) => {
  await t.step("normalize path", () => {
    const unnormalizedPath = "src//../src/common/./crypto";
    const normalizedPath = path.normalize(unnormalizedPath);
    assertEquals(normalizedPath, "src/common/crypto");
  });

  await t.step("join paths", () => {
    const joined = path.join("src", "common", "crypto");
    assertEquals(joined, "src/common/crypto");

    const joinedWithTrailingSlash = path.join("src/", "common/", "crypto");
    assertEquals(joinedWithTrailingSlash, "src/common/crypto");
  });

  await t.step("resolve paths", () => {
    // resolve works like cd in a shell
    const resolved = path.resolve("src", "common", "..", "common", "crypto");
    
    // Ensure it ends with the expected path segment
    assertTrue(resolved.endsWith("src/common/crypto"));
    
    // Should be an absolute path
    assertTrue(path.isAbsolute(resolved));
  });

  await t.step("basename operations", () => {
    const filePath = "/Users/t/Developer/workos-node/src/common/crypto/web-crypto-provider.ts";
    const basename = path.basename(filePath);
    assertEquals(basename, "web-crypto-provider.ts");
    
    const basenameWithoutExt = path.basename(filePath, ".ts");
    assertEquals(basenameWithoutExt, "web-crypto-provider");
  });

  await t.step("dirname operations", () => {
    const filePath = "/Users/t/Developer/workos-node/src/common/crypto/web-crypto-provider.ts";
    const dirname = path.dirname(filePath);
    assertEquals(dirname, "/Users/t/Developer/workos-node/src/common/crypto");
  });

  await t.step("extname operations", () => {
    const filePath = "web-crypto-provider.ts";
    const extname = path.extname(filePath);
    assertEquals(extname, ".ts");
    
    const noExtPath = "README";
    const noExt = path.extname(noExtPath);
    assertEquals(noExt, "");
  });

  await t.step("isAbsolute operations", () => {
    assertTrue(path.isAbsolute("/Users/t/Developer"));
    assertFalse(path.isAbsolute("src/common"));
  });

  await t.step("relative path operations", () => {
    const from = "/Users/t/Developer/workos-node/src";
    const to = "/Users/t/Developer/workos-node/src/common/crypto";
    const relativePath = path.relative(from, to);
    assertEquals(relativePath, "common/crypto");
  });

  await t.step("parse path", () => {
    const filePath = "/Users/t/Developer/workos-node/src/common/crypto/web-crypto-provider.ts";
    const parsed = path.parse(filePath);
    
    assertEquals(parsed.root, "/");
    assertEquals(parsed.dir, "/Users/t/Developer/workos-node/src/common/crypto");
    assertEquals(parsed.base, "web-crypto-provider.ts");
    assertEquals(parsed.ext, ".ts");
    assertEquals(parsed.name, "web-crypto-provider");
  });

  await t.step("format path", () => {
    const pathObj = {
      root: "/",
      dir: "/Users/t/Developer/workos-node/src/common/crypto",
      base: "web-crypto-provider.ts",
      ext: ".ts",
      name: "web-crypto-provider",
    };
    
    const formatted = path.format(pathObj);
    assertEquals(formatted, "/Users/t/Developer/workos-node/src/common/crypto/web-crypto-provider.ts");
  });

  await t.step("cross-platform path handling", () => {
    // Test that Windows-style paths are handled correctly on any platform
    const windowsPath = "C:\\Users\\t\\Developer\\workos-node\\src\\common\\crypto";
    const normalizedPath = path.normalize(windowsPath);
    
    // The actual result will depend on the platform, but it should be a valid path
    assertNotEquals(normalizedPath, "");
  });
});

// Helper assertion functions
function assertTrue(condition: boolean): void {
  assertEquals(condition, true);
}

function assertFalse(condition: boolean): void {
  assertEquals(condition, false);
}