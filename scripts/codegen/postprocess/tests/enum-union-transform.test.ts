import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { Project } from "npm:ts-morph";
import { enumUnionTransform } from "../transforms/enum-union-transform.ts";

Deno.test("enumUnionTransform - should transform enum to union type", async () => {
  // Setup a test project
  const project = new Project({ useInMemoryFileSystem: true });
  
  // Create a test file with an enum
  const testFilePath = "/test.ts";
  project.createSourceFile(testFilePath, `
export enum StatusEnum {
  ACTIVE = "ACTIVE",
  DELETING = "DELETING",
}
`);
  
  // Apply the transform
  const result = await enumUnionTransform.process(project, testFilePath);
  
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
  
  // Check that union type was added
  assertEquals(
    transformedCode.includes('export type Status ='),
    true,
    "Union type should be added"
  );
  
  assertEquals(
    transformedCode.includes('"ACTIVE" | "DELETING"'),
    true,
    "Union type should include the correct values"
  );
});

Deno.test("enumUnionTransform - should ignore enums without 'Enum' suffix", async () => {
  // Setup a test project
  const project = new Project({ useInMemoryFileSystem: true });
  
  // Create a test file with a non-targeted enum
  const testFilePath = "/test-no-transform.ts";
  const sourceText = `
export enum Status {
  ACTIVE = "ACTIVE",
  DELETING = "DELETING",
}
`;
  project.createSourceFile(testFilePath, sourceText);
  
  // Apply the transform
  const result = await enumUnionTransform.process(project, testFilePath);
  
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
});

Deno.test("enumUnionTransform - should handle enums with non-string values", async () => {
  // Setup a test project
  const project = new Project({ useInMemoryFileSystem: true });
  
  // Create a test file with mixed value types
  const testFilePath = "/test-mixed-values.ts";
  project.createSourceFile(testFilePath, `
export enum MixedEnum {
  STRING = "string_value",
  NUMBER = 42,
}
`);
  
  // Apply the transform
  const result = await enumUnionTransform.process(project, testFilePath);
  
  // Save the changes
  await project.save();
  
  // Verify the transform was applied
  assertEquals(result, true, "Transform should report changes were made");
  
  // Get the transformed code
  const sourceFile = project.getSourceFile(testFilePath);
  const transformedCode = sourceFile?.getText() || "";
  
  // Check that enum was removed
  assertEquals(
    transformedCode.includes("enum MixedEnum"),
    false,
    "Enum declaration should be removed"
  );
  
  // Check that type declaration was added
  assertEquals(
    transformedCode.includes('export type Mixed ='),
    true,
    "Union type should be added"
  );
  
  // Check that only string values are included in the union
  assertEquals(
    transformedCode.includes('"string_value"'),
    true,
    "Union type should include string values"
  );
  
  // Number values should not be in the union
  assertEquals(
    !transformedCode.includes('42') || 
    (transformedCode.includes('42') && !transformedCode.includes('Mixed = ') && !transformedCode.includes('Mixed ="')),
    true,
    "Union type should not include number values in the type definition"
  );
});