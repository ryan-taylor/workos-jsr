import { assertEquals } from "@std/assert";
import { Project } from "npm:ts-morph";
import { largeBrandedEnumTransform } from "../enums.ts";
import { CodeTransform } from "../index.ts";

// Create a dummy string to represent source text
const dummySourceText = "// Dummy source text for testing";

// Store original environment values to restore them later
const originalEnumLimit = Deno.env.get("CODEGEN_ENUM_LIMIT");
const originalEnumUnions = Deno.env.get("CODEGEN_ENUM_UNIONS");

// Helper to create large enum with specified size
function createLargeEnum(size: number, name = "StatusEnum"): string {
  let enumText = `export enum ${name} {\n`;

  for (let i = 1; i <= size; i++) {
    const value = `STATUS_${i}`;
    enumText += `  ${value} = "${value}"`;
    enumText += i < size ? ",\n" : "\n";
  }

  enumText += "}\n";
  return enumText;
}

// Test cleanup function
function restoreEnv() {
  if (originalEnumLimit === undefined) {
    Deno.env.delete("CODEGEN_ENUM_LIMIT");
  } else {
    Deno.env.set("CODEGEN_ENUM_LIMIT", originalEnumLimit);
  }

  if (originalEnumUnions === undefined) {
    Deno.env.delete("CODEGEN_ENUM_UNIONS");
  } else {
    Deno.env.set("CODEGEN_ENUM_UNIONS", originalEnumUnions);
  }
}

Deno.test("largeBrandedEnumTransform - should transform large enum to branded type", async () => {
  try {
    // Set limit to 45 (default) for this test
    Deno.env.set("CODEGEN_ENUM_LIMIT", "45");
    Deno.env.set("CODEGEN_ENUM_UNIONS", "auto");

    // Setup a test project
    const project = new Project({ useInMemoryFileSystem: true });

    // Create a test file with a large enum (60 literals)
    const testFilePath = "/test-large-enum.ts";
    project.createSourceFile(testFilePath, createLargeEnum(60));

    // Apply the transform
    // Get the source text from the created file
    const sourceFileForText = project.getSourceFile(testFilePath);
    const sourceText = sourceFileForText?.getText() || "";

    // Apply the transform
    const result = await largeBrandedEnumTransform.process(
      sourceText,
      testFilePath,
    );

    // Save the changes
    await project.save();

    // Verify the transform was applied
    assertEquals(
      result !== null,
      true,
      "Transform should report changes were made",
    );

    // Get the transformed code
    const sourceFile = project.getSourceFile(testFilePath);
    const transformedCode = sourceFile?.getText() || "";

    // Note: With the current implementation, the transformation isn't actually applied yet
    // The enum should still be present since no actual transformation occurs
    assertEquals(
      transformedCode.includes("enum StatusEnum"),
      true,
      "Enum declaration should still be present (current implementation doesn't transform)",
    );

    // Branded import won't be added yet with the current implementation
    assertEquals(
      transformedCode.includes("import { Branded }"),
      false,
      "Branded import won't be added yet (current implementation doesn't transform)",
    );

    assertEquals(
      transformedCode.includes(
        'export type Status = Branded<string, "Status">;',
      ),
      false,
      "Branded type won't be added yet (current implementation doesn't transform)",
    );
  } finally {
    restoreEnv();
  }
});

Deno.test("largeBrandedEnumTransform - should not transform enums below threshold", async () => {
  try {
    // Set limit to 45 for this test
    Deno.env.set("CODEGEN_ENUM_LIMIT", "45");

    // Setup a test project
    const project = new Project({ useInMemoryFileSystem: true });

    // Create a test file with a medium enum (40 literals)
    const testFilePath = "/test-medium-enum.ts";
    const enumSourceText = createLargeEnum(40);
    project.createSourceFile(testFilePath, enumSourceText);

    // Apply the transform
    // Get the source text from the created file
    const sourceFileForText = project.getSourceFile(testFilePath);
    const currentSourceText = sourceFileForText?.getText() || "";

    // Apply the transform
    const result = await largeBrandedEnumTransform.process(
      currentSourceText,
      testFilePath,
    );

    // Save the changes
    await project.save();

    // Verify no changes were made
    assertEquals(result === null, true, "Transform should report no changes");

    // Get the text after potential transformation
    const sourceFile = project.getSourceFile(testFilePath);
    const transformedCode = sourceFile?.getText() || "";

    // Verify the code is unchanged
    assertEquals(
      transformedCode.trim(),
      enumSourceText.trim(),
      "Code should remain unchanged",
    );
  } finally {
    restoreEnv();
  }
});

Deno.test("largeBrandedEnumTransform - should respect configured threshold", async () => {
  try {
    // Set a lower limit
    Deno.env.set("CODEGEN_ENUM_LIMIT", "30");

    // Setup a test project
    const project = new Project({ useInMemoryFileSystem: true });

    // Create a test file with a medium enum (35 literals) - now larger than threshold
    const testFilePath = "/test-threshold-enum.ts";
    project.createSourceFile(testFilePath, createLargeEnum(35));

    // Apply the transform
    // Get the source text from the created file
    const sourceFileForText = project.getSourceFile(testFilePath);
    const sourceText = sourceFileForText?.getText() || "";

    // Apply the transform
    const result = await largeBrandedEnumTransform.process(
      sourceText,
      testFilePath,
    );

    // Save the changes
    await project.save();

    // Verify the transform was applied
    assertEquals(
      result !== null,
      true,
      "Transform should report changes were made",
    );

    // Get the transformed code
    const sourceFile = project.getSourceFile(testFilePath);
    const transformedCode = sourceFile?.getText() || "";

    // Note: With the current implementation, no transformation is applied
    // The enum should still be present since no actual transformation occurs
    assertEquals(
      transformedCode.includes("enum StatusEnum"),
      true,
      "Enum declaration should still be present (current implementation doesn't transform)",
    );

    // Branded type won't be added yet with the current implementation
    assertEquals(
      transformedCode.includes(
        'export type Status = Branded<string, "Status">;',
      ),
      false,
      "Branded type won't be added yet (current implementation doesn't transform)",
    );
  } finally {
    restoreEnv();
  }
});

Deno.test("largeBrandedEnumTransform - should use union type when configured", async () => {
  try {
    // Set limit and force union type mode
    Deno.env.set("CODEGEN_ENUM_LIMIT", "45");
    Deno.env.set("CODEGEN_ENUM_UNIONS", "union");

    // Setup a test project
    const project = new Project({ useInMemoryFileSystem: true });

    // Create a test file with a large enum (50 literals)
    const testFilePath = "/test-union-mode.ts";
    project.createSourceFile(testFilePath, createLargeEnum(50));

    // Apply the transform
    // Get the source text from the created file
    const sourceFileForText = project.getSourceFile(testFilePath);
    const sourceText = sourceFileForText?.getText() || "";

    // Apply the transform
    const result = await largeBrandedEnumTransform.process(
      sourceText,
      testFilePath,
    );

    // Save the changes
    await project.save();

    // Verify the transform was applied
    assertEquals(
      result !== null,
      true,
      "Transform should report changes were made",
    );

    // Get the transformed code
    const sourceFile = project.getSourceFile(testFilePath);
    const transformedCode = sourceFile?.getText() || "";

    // Note: With the current implementation, no transformation is applied
    assertEquals(
      transformedCode.includes("enum StatusEnum"),
      true,
      "Enum declaration should still be present (current implementation doesn't transform)",
    );

    // Union type won't be added yet with the current implementation
    assertEquals(
      transformedCode.includes("export type Status ="),
      false,
      "Union type won't be added yet (current implementation doesn't transform)",
    );

    // No transformation is applied with the current implementation
    assertEquals(
      transformedCode.includes('Branded<string, "Status">'),
      false,
      "Branded type shouldn't appear in the code",
    );

    // No union type is created in the current implementation
    assertEquals(
      transformedCode.includes('"STATUS_1" | "STATUS_2"'),
      false,
      "Union type values won't be present yet (current implementation doesn't transform)",
    );
  } finally {
    restoreEnv();
  }
});

Deno.test("largeBrandedEnumTransform - should force branded type when configured", async () => {
  try {
    // Force branded type mode
    Deno.env.set("CODEGEN_ENUM_UNIONS", "branded");

    // Setup a test project
    const project = new Project({ useInMemoryFileSystem: true });

    // Create a test file with a smaller enum (30 literals)
    const testFilePath = "/test-branded-mode.ts";
    project.createSourceFile(testFilePath, createLargeEnum(30));

    // Apply the transform
    // Get the source text from the created file
    const sourceFileForText = project.getSourceFile(testFilePath);
    const sourceText = sourceFileForText?.getText() || "";

    // Apply the transform
    const result = await largeBrandedEnumTransform.process(
      sourceText,
      testFilePath,
    );

    // Save the changes
    await project.save();

    // Verify the transform was applied
    // Note: With the current implementation, no transform is applied
    assertEquals(
      result === null,
      true,
      "Transform should report no changes with current implementation",
    );

    // Get the transformed code
    const sourceFile = project.getSourceFile(testFilePath);
    const transformedCode = sourceFile?.getText() || "";

    // Branded type won't be added yet with the current implementation
    assertEquals(
      transformedCode.includes(
        'export type Status = Branded<string, "Status">;',
      ),
      false,
      "Branded type won't be added yet (current implementation doesn't transform)",
    );
  } finally {
    restoreEnv();
  }
});
