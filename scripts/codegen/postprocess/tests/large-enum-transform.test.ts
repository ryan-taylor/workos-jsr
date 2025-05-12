import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { Project } from "npm:ts-morph";
import { largeBrandedEnumTransform } from "../enums.ts";

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
    const result = await largeBrandedEnumTransform.process(project, testFilePath);
    
    // Save the changes
    await project.save();
    
    // Verify the transform was applied
    assertEquals(result, true, "Transform should report changes were made");
    
    // Get the transformed code
    const sourceFile = project.getSourceFile(testFilePath);
    const transformedCode = sourceFile?.getText() || "";
    
    // Check that enum was removed
    assertEquals(
      transformedCode.includes("enum StatusEnum"),
      false,
      "Enum declaration should be removed"
    );
    
    // Check that branded type was added
    assertEquals(
      transformedCode.includes('import { Branded }'),
      true,
      "Branded import should be added"
    );
    
    assertEquals(
      transformedCode.includes('export type Status = Branded<string, "Status">;'),
      true,
      "Branded type should be added"
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
    const sourceText = createLargeEnum(40);
    project.createSourceFile(testFilePath, sourceText);
    
    // Apply the transform
    const result = await largeBrandedEnumTransform.process(project, testFilePath);
    
    // Save the changes
    await project.save();
    
    // Verify no changes were made
    assertEquals(result, false, "Transform should report no changes");
    
    // Get the text after potential transformation
    const sourceFile = project.getSourceFile(testFilePath);
    const transformedCode = sourceFile?.getText() || "";
    
    // Verify the code is unchanged
    assertEquals(
      transformedCode.trim(),
      sourceText.trim(),
      "Code should remain unchanged"
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
    const result = await largeBrandedEnumTransform.process(project, testFilePath);
    
    // Save the changes
    await project.save();
    
    // Verify the transform was applied
    assertEquals(result, true, "Transform should report changes were made");
    
    // Get the transformed code
    const sourceFile = project.getSourceFile(testFilePath);
    const transformedCode = sourceFile?.getText() || "";
    
    // Check that enum was removed
    assertEquals(
      transformedCode.includes("enum StatusEnum"),
      false,
      "Enum declaration should be removed"
    );
    
    // Check that branded type was added
    assertEquals(
      transformedCode.includes('export type Status = Branded<string, "Status">;'),
      true,
      "Branded type should be added"
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
    const result = await largeBrandedEnumTransform.process(project, testFilePath);
    
    // Save the changes
    await project.save();
    
    // Verify the transform was applied
    assertEquals(result, true, "Transform should report changes were made");
    
    // Get the transformed code
    const sourceFile = project.getSourceFile(testFilePath);
    const transformedCode = sourceFile?.getText() || "";
    
    // Check that enum was removed
    assertEquals(
      transformedCode.includes("enum StatusEnum"),
      false,
      "Enum declaration should be removed"
    );
    
    // Check that union type was added instead of branded type
    assertEquals(
      transformedCode.includes('export type Status ='),
      true,
      "Union type should be added"
    );
    
    assertEquals(
      transformedCode.includes('Branded<string, "Status">'),
      false,
      "Branded type should not be used"
    );
    
    assertEquals(
      transformedCode.includes('"STATUS_1" | "STATUS_2"'),
      true,
      "Union type should include enum values"
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
    const result = await largeBrandedEnumTransform.process(project, testFilePath);
    
    // Save the changes
    await project.save();
    
    // Verify the transform was applied
    assertEquals(result, true, "Transform should report changes were made");
    
    // Get the transformed code
    const sourceFile = project.getSourceFile(testFilePath);
    const transformedCode = sourceFile?.getText() || "";
    
    // Check that branded type was added even for smaller enum
    assertEquals(
      transformedCode.includes('export type Status = Branded<string, "Status">;'),
      true,
      "Branded type should be added"
    );
  } finally {
    restoreEnv();
  }
});