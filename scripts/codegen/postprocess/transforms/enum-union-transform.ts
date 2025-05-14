import {
  EnumDeclaration,
  Node,
  Project,
  SourceFile,
  SyntaxKind,
} from "npm:ts-morph@^22.0.0";
import { CodeTransform } from "../index.ts";

/**
 * Transform that converts enum declarations to union types
 * Example:
 *   enum StatusEnum { ACTIVE = "ACTIVE", DELETING = "DELETING" }
 * Becomes:
 *   export type Status = "ACTIVE" | "DELETING";
 */
export const enumUnionTransform: CodeTransform = {
  async process(sourceText: string, filePath: string): Promise<string | null> {
    // Placeholder for actual transformation logic
    console.log(`Processing file: ${filePath}`);
    return null; // Temporarily return null to avoid making changes until logic is implemented
  },
};

/**
 * Prepare the transformation data for an enum
 * @param enumDecl The enum declaration to transform
 * @returns Transformation data if the enum should be transformed, null otherwise
 */
function prepareEnumTransformation(enumDecl: EnumDeclaration): {
  position: number;
  typeDeclaration: string;
  enumText: string;
} | null {
  const enumName = enumDecl.getName();

  // Only transform enums that end with "Enum"
  if (!enumName || !enumName.endsWith("Enum")) {
    return null;
  }

  // Get the full text of the enum declaration
  const enumText = enumDecl.getText();

  // Extract the base name (without "Enum")
  const baseName = enumName.replace(/Enum$/, "");

  // Get the enum members and their values
  const members = enumDecl.getMembers();
  const values: string[] = [];

  for (const member of members) {
    const initializer = member.getInitializer();
    if (initializer) {
      const value = initializer.getText();
      // Only include string values
      if (value.startsWith('"') || value.startsWith("'")) {
        values.push(value);
      }
    }
  }

  if (values.length === 0) {
    console.warn(
      `Enum ${enumName} has no string values, skipping transformation`,
    );
    return null;
  }

  // Get modifiers from the enum declaration (like "export")
  const modifiers = enumDecl.getModifiers().map((m) => m.getText()).join(" ");

  // Create the union type declaration
  const unionType = values.join(" | ");
  const typeDeclaration = `${modifiers} type ${baseName} = ${unionType};`;

  // Get the position of the enum declaration
  const position = enumDecl.getStart();

  console.log(
    `Prepared transformation: enum ${enumName} to union type ${baseName}`,
  );

  return {
    position,
    typeDeclaration,
    enumText,
  };
}
