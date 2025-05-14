import { SyntaxKind } from "npm:ts-morph";
/**
 * Transform that converts large enum declarations to either union types or branded types
 * based on the number of literals and configuration.
 *
 * Example transformations:
 *
 * When using branded types:
 *   enum StatusEnum { ACTIVE = "ACTIVE", DELETING = "DELETING", ... (many more) }
 * Becomes:
 *   export type Status = Branded<string, "Status">;
 *
 * When using union types:
 *   enum StatusEnum { ACTIVE = "ACTIVE", DELETING = "DELETING", ... }
 * Becomes:
 *   export type Status = "ACTIVE" | "DELETING" | ...;
 */ export const largeBrandedEnumTransform = {
  async process(project, filePath) {
    // Get environment variables or use defaults
    const ENUM_LIMIT = parseInt(Deno.env.get("CODEGEN_ENUM_LIMIT") || "45", 10);
    const ENUM_UNIONS = Deno.env.get("CODEGEN_ENUM_UNIONS") || "auto";
    if (
      ENUM_UNIONS !== "auto" && ENUM_UNIONS !== "branded" &&
      ENUM_UNIONS !== "union"
    ) {
      console.warn(
        `Invalid CODEGEN_ENUM_UNIONS value: "${ENUM_UNIONS}". Using "auto" instead.`,
      );
    }
    const options = {
      literalLimit: ENUM_LIMIT,
      unionMode: ENUM_UNIONS === "branded" || ENUM_UNIONS === "union"
        ? ENUM_UNIONS
        : "auto",
    };
    // Get the source file
    const sourceFile = project.getSourceFile(filePath);
    if (!sourceFile) {
      console.warn(`File not found: ${filePath}`);
      return false;
    }
    let changesMade = false;
    // Find all enum declarations
    const enumDeclarations = sourceFile.getDescendantsOfKind(
      SyntaxKind.EnumDeclaration,
    );
    // Create a list of transformations to apply
    const transformations = [];
    // First collect all the transformations we need to make
    for (const enumDecl of enumDeclarations) {
      const transformation = prepareEnumTransformation(enumDecl, options);
      if (transformation) {
        transformations.push(transformation);
        changesMade = true;
      }
    }
    // Determine if we need to add the branded import
    const needsBrandedImport = transformations.some((t) => t.importBranded);
    // Apply transformations in reverse order to preserve positions
    transformations.sort((a, b) => b.position - a.position);
    for (const { position, typeDeclaration, enumText } of transformations) {
      // Add the type declaration
      sourceFile.insertText(position, typeDeclaration + "\n\n");
      // Find the text and replace it
      const text = sourceFile.getText();
      const enumIndex = text.indexOf(enumText, position);
      if (enumIndex >= 0) {
        sourceFile.replaceText([
          enumIndex,
          enumIndex + enumText.length,
        ], "");
      }
    }
    // Add import for Branded if needed
    if (needsBrandedImport && changesMade) {
      addBrandedImport(sourceFile);
    }
    return changesMade;
  },
};
/**
 * Prepare the transformation data for a large enum
 * @param enumDecl The enum declaration to transform
 * @param options Configuration options
 * @returns Transformation data if the enum should be transformed, null otherwise
 */ function prepareEnumTransformation(enumDecl, options) {
  const enumName = enumDecl.getName();
  if (!enumName) {
    return null;
  }
  // Get the enum members
  const members = enumDecl.getMembers();
  // Skip transformation if the enum is not large enough
  if (members.length < (options.literalLimit || 45)) {
    return null;
  }
  // Get the full text of the enum declaration
  const enumText = enumDecl.getText();
  // Extract the base name (without "Enum" suffix if present)
  const baseName = enumName.endsWith("Enum")
    ? enumName.replace(/Enum$/, "")
    : enumName;
  // Get the enum member values
  const values = [];
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
  const exportPrefix = modifiers ? `${modifiers} ` : "";
  // Determine whether to use branded type or union type based on configuration
  const useBrandedType = options.unionMode === "branded" ||
    options.unionMode === "auto" &&
      values.length > (options.literalLimit || 45);
  let typeDeclaration;
  let importBranded = false;
  if (useBrandedType) {
    // Create branded type
    typeDeclaration =
      `${exportPrefix}type ${baseName} = Branded<string, "${baseName}">;`;
    importBranded = true;
    console.log(
      `Transformed large enum ${enumName} (${values.length} members) to branded type ${baseName}`,
    );
  } else {
    // Create union type
    const unionType = values.join(" | ");
    typeDeclaration = `${exportPrefix}type ${baseName} = ${unionType};`;
    console.log(`Transformed enum ${enumName} to union type ${baseName}`);
  }
  // Get the position of the enum declaration
  const position = enumDecl.getStart();
  return {
    position,
    typeDeclaration,
    enumText,
    importBranded,
  };
}
/**
 * Add import for the Branded type
 * @param sourceFile The source file to add the import to
 */ function addBrandedImport(sourceFile) {
  // Check if the import already exists
  const imports = sourceFile.getImportDeclarations();
  const hasImport = imports.some((imp) => {
    const moduleSpecifier = imp.getModuleSpecifierValue();
    return moduleSpecifier?.includes("branded") &&
      imp.getNamedImports().some((named) => named.getName() === "Branded");
  });
  if (!hasImport) {
    // Add the import at the top of the file, after any existing imports
    const importStatement = 'import { Branded } from "../utils/branded.ts";';
    const lastImport = imports[imports.length - 1];
    if (lastImport) {
      // Add after the last import
      sourceFile.insertText(
        lastImport.getEnd() + 1,
        "\n" + importStatement + "\n",
      );
    } else {
      // Add at the beginning of the file
      sourceFile.insertStatements(0, importStatement);
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvdC9EZXZlbG9wZXIvd29ya29zLW5vZGUvc2NyaXB0cy9jb2RlZ2VuL3Bvc3Rwcm9jZXNzL2VudW1zLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFByb2plY3QsIEVudW1EZWNsYXJhdGlvbiwgU3ludGF4S2luZCwgU291cmNlRmlsZSB9IGZyb20gXCJucG06dHMtbW9ycGhcIjtcbmltcG9ydCB7IENvZGVUcmFuc2Zvcm0gfSBmcm9tIFwiLi9pbmRleC50c1wiO1xuXG4vKipcbiAqIENvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgbGFyZ2UgZW51bSB0cmFuc2Zvcm1hdGlvblxuICovXG5leHBvcnQgaW50ZXJmYWNlIEVudW1UcmFuc2Zvcm1PcHRpb25zIHtcbiAgLyoqIE1heGltdW0gbnVtYmVyIG9mIGxpdGVyYWxzIGJlZm9yZSBjb252ZXJ0aW5nIHRvIGJyYW5kZWQgdHlwZSAqL1xuICBsaXRlcmFsTGltaXQ/OiBudW1iZXI7XG4gIC8qKiBIb3cgdG8gaGFuZGxlIGxhcmdlIGVudW1zOiBcImJyYW5kZWRcIiAoYWx3YXlzIHVzZSBicmFuZGVkKSwgXCJ1bmlvblwiIChhbHdheXMgdXNlIHVuaW9uKSwgXCJhdXRvXCIgKGRlY2lkZSBiYXNlZCBvbiBzaXplKSAqL1xuICB1bmlvbk1vZGU/OiBcImJyYW5kZWRcIiB8IFwidW5pb25cIiB8IFwiYXV0b1wiO1xufVxuXG4vKipcbiAqIFRyYW5zZm9ybSB0aGF0IGNvbnZlcnRzIGxhcmdlIGVudW0gZGVjbGFyYXRpb25zIHRvIGVpdGhlciB1bmlvbiB0eXBlcyBvciBicmFuZGVkIHR5cGVzXG4gKiBiYXNlZCBvbiB0aGUgbnVtYmVyIG9mIGxpdGVyYWxzIGFuZCBjb25maWd1cmF0aW9uLlxuICogXG4gKiBFeGFtcGxlIHRyYW5zZm9ybWF0aW9uczpcbiAqIFxuICogV2hlbiB1c2luZyBicmFuZGVkIHR5cGVzOlxuICogICBlbnVtIFN0YXR1c0VudW0geyBBQ1RJVkUgPSBcIkFDVElWRVwiLCBERUxFVElORyA9IFwiREVMRVRJTkdcIiwgLi4uIChtYW55IG1vcmUpIH1cbiAqIEJlY29tZXM6XG4gKiAgIGV4cG9ydCB0eXBlIFN0YXR1cyA9IEJyYW5kZWQ8c3RyaW5nLCBcIlN0YXR1c1wiPjtcbiAqIFxuICogV2hlbiB1c2luZyB1bmlvbiB0eXBlczpcbiAqICAgZW51bSBTdGF0dXNFbnVtIHsgQUNUSVZFID0gXCJBQ1RJVkVcIiwgREVMRVRJTkcgPSBcIkRFTEVUSU5HXCIsIC4uLiB9XG4gKiBCZWNvbWVzOlxuICogICBleHBvcnQgdHlwZSBTdGF0dXMgPSBcIkFDVElWRVwiIHwgXCJERUxFVElOR1wiIHwgLi4uO1xuICovXG5leHBvcnQgY29uc3QgbGFyZ2VCcmFuZGVkRW51bVRyYW5zZm9ybTogQ29kZVRyYW5zZm9ybSA9IHtcbiAgYXN5bmMgcHJvY2Vzcyhwcm9qZWN0OiBQcm9qZWN0LCBmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgLy8gR2V0IGVudmlyb25tZW50IHZhcmlhYmxlcyBvciB1c2UgZGVmYXVsdHNcbiAgICBjb25zdCBFTlVNX0xJTUlUID0gcGFyc2VJbnQoRGVuby5lbnYuZ2V0KFwiQ09ERUdFTl9FTlVNX0xJTUlUXCIpIHx8IFwiNDVcIiwgMTApO1xuICAgIGNvbnN0IEVOVU1fVU5JT05TID0gRGVuby5lbnYuZ2V0KFwiQ09ERUdFTl9FTlVNX1VOSU9OU1wiKSB8fCBcImF1dG9cIjtcbiAgICBcbiAgICBpZiAoRU5VTV9VTklPTlMgIT09IFwiYXV0b1wiICYmIEVOVU1fVU5JT05TICE9PSBcImJyYW5kZWRcIiAmJiBFTlVNX1VOSU9OUyAhPT0gXCJ1bmlvblwiKSB7XG4gICAgICBjb25zb2xlLndhcm4oYEludmFsaWQgQ09ERUdFTl9FTlVNX1VOSU9OUyB2YWx1ZTogXCIke0VOVU1fVU5JT05TfVwiLiBVc2luZyBcImF1dG9cIiBpbnN0ZWFkLmApO1xuICAgIH1cblxuICAgIGNvbnN0IG9wdGlvbnM6IEVudW1UcmFuc2Zvcm1PcHRpb25zID0ge1xuICAgICAgbGl0ZXJhbExpbWl0OiBFTlVNX0xJTUlULFxuICAgICAgdW5pb25Nb2RlOiAoRU5VTV9VTklPTlMgPT09IFwiYnJhbmRlZFwiIHx8IEVOVU1fVU5JT05TID09PSBcInVuaW9uXCIpIFxuICAgICAgICA/IEVOVU1fVU5JT05TIFxuICAgICAgICA6IFwiYXV0b1wiXG4gICAgfTtcblxuICAgIC8vIEdldCB0aGUgc291cmNlIGZpbGVcbiAgICBjb25zdCBzb3VyY2VGaWxlID0gcHJvamVjdC5nZXRTb3VyY2VGaWxlKGZpbGVQYXRoKTtcbiAgICBpZiAoIXNvdXJjZUZpbGUpIHtcbiAgICAgIGNvbnNvbGUud2FybihgRmlsZSBub3QgZm91bmQ6ICR7ZmlsZVBhdGh9YCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgbGV0IGNoYW5nZXNNYWRlID0gZmFsc2U7XG4gICAgXG4gICAgLy8gRmluZCBhbGwgZW51bSBkZWNsYXJhdGlvbnNcbiAgICBjb25zdCBlbnVtRGVjbGFyYXRpb25zID0gc291cmNlRmlsZS5nZXREZXNjZW5kYW50c09mS2luZChTeW50YXhLaW5kLkVudW1EZWNsYXJhdGlvbik7XG4gICAgXG4gICAgLy8gQ3JlYXRlIGEgbGlzdCBvZiB0cmFuc2Zvcm1hdGlvbnMgdG8gYXBwbHlcbiAgICBjb25zdCB0cmFuc2Zvcm1hdGlvbnM6IEFycmF5PHtcbiAgICAgIHBvc2l0aW9uOiBudW1iZXI7XG4gICAgICB0eXBlRGVjbGFyYXRpb246IHN0cmluZztcbiAgICAgIGVudW1UZXh0OiBzdHJpbmc7XG4gICAgICBpbXBvcnRCcmFuZGVkOiBib29sZWFuO1xuICAgIH0+ID0gW107XG4gICAgXG4gICAgLy8gRmlyc3QgY29sbGVjdCBhbGwgdGhlIHRyYW5zZm9ybWF0aW9ucyB3ZSBuZWVkIHRvIG1ha2VcbiAgICBmb3IgKGNvbnN0IGVudW1EZWNsIG9mIGVudW1EZWNsYXJhdGlvbnMpIHtcbiAgICAgIGNvbnN0IHRyYW5zZm9ybWF0aW9uID0gcHJlcGFyZUVudW1UcmFuc2Zvcm1hdGlvbihlbnVtRGVjbCwgb3B0aW9ucyk7XG4gICAgICBpZiAodHJhbnNmb3JtYXRpb24pIHtcbiAgICAgICAgdHJhbnNmb3JtYXRpb25zLnB1c2godHJhbnNmb3JtYXRpb24pO1xuICAgICAgICBjaGFuZ2VzTWFkZSA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIERldGVybWluZSBpZiB3ZSBuZWVkIHRvIGFkZCB0aGUgYnJhbmRlZCBpbXBvcnRcbiAgICBjb25zdCBuZWVkc0JyYW5kZWRJbXBvcnQgPSB0cmFuc2Zvcm1hdGlvbnMuc29tZSh0ID0+IHQuaW1wb3J0QnJhbmRlZCk7XG4gICAgXG4gICAgLy8gQXBwbHkgdHJhbnNmb3JtYXRpb25zIGluIHJldmVyc2Ugb3JkZXIgdG8gcHJlc2VydmUgcG9zaXRpb25zXG4gICAgdHJhbnNmb3JtYXRpb25zLnNvcnQoKGEsIGIpID0+IGIucG9zaXRpb24gLSBhLnBvc2l0aW9uKTtcbiAgICBcbiAgICBmb3IgKGNvbnN0IHsgcG9zaXRpb24sIHR5cGVEZWNsYXJhdGlvbiwgZW51bVRleHQgfSBvZiB0cmFuc2Zvcm1hdGlvbnMpIHtcbiAgICAgIC8vIEFkZCB0aGUgdHlwZSBkZWNsYXJhdGlvblxuICAgICAgc291cmNlRmlsZS5pbnNlcnRUZXh0KHBvc2l0aW9uLCB0eXBlRGVjbGFyYXRpb24gKyBcIlxcblxcblwiKTtcbiAgICAgIFxuICAgICAgLy8gRmluZCB0aGUgdGV4dCBhbmQgcmVwbGFjZSBpdFxuICAgICAgY29uc3QgdGV4dCA9IHNvdXJjZUZpbGUuZ2V0VGV4dCgpO1xuICAgICAgY29uc3QgZW51bUluZGV4ID0gdGV4dC5pbmRleE9mKGVudW1UZXh0LCBwb3NpdGlvbik7XG4gICAgICBpZiAoZW51bUluZGV4ID49IDApIHtcbiAgICAgICAgc291cmNlRmlsZS5yZXBsYWNlVGV4dChbZW51bUluZGV4LCBlbnVtSW5kZXggKyBlbnVtVGV4dC5sZW5ndGhdLCBcIlwiKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gQWRkIGltcG9ydCBmb3IgQnJhbmRlZCBpZiBuZWVkZWRcbiAgICBpZiAobmVlZHNCcmFuZGVkSW1wb3J0ICYmIGNoYW5nZXNNYWRlKSB7XG4gICAgICBhZGRCcmFuZGVkSW1wb3J0KHNvdXJjZUZpbGUpO1xuICAgIH1cblxuICAgIHJldHVybiBjaGFuZ2VzTWFkZTtcbiAgfVxufTtcblxuLyoqXG4gKiBQcmVwYXJlIHRoZSB0cmFuc2Zvcm1hdGlvbiBkYXRhIGZvciBhIGxhcmdlIGVudW1cbiAqIEBwYXJhbSBlbnVtRGVjbCBUaGUgZW51bSBkZWNsYXJhdGlvbiB0byB0cmFuc2Zvcm1cbiAqIEBwYXJhbSBvcHRpb25zIENvbmZpZ3VyYXRpb24gb3B0aW9uc1xuICogQHJldHVybnMgVHJhbnNmb3JtYXRpb24gZGF0YSBpZiB0aGUgZW51bSBzaG91bGQgYmUgdHJhbnNmb3JtZWQsIG51bGwgb3RoZXJ3aXNlXG4gKi9cbmZ1bmN0aW9uIHByZXBhcmVFbnVtVHJhbnNmb3JtYXRpb24oXG4gIGVudW1EZWNsOiBFbnVtRGVjbGFyYXRpb24sIFxuICBvcHRpb25zOiBFbnVtVHJhbnNmb3JtT3B0aW9uc1xuKToge1xuICBwb3NpdGlvbjogbnVtYmVyO1xuICB0eXBlRGVjbGFyYXRpb246IHN0cmluZztcbiAgZW51bVRleHQ6IHN0cmluZztcbiAgaW1wb3J0QnJhbmRlZDogYm9vbGVhbjtcbn0gfCBudWxsIHtcbiAgY29uc3QgZW51bU5hbWUgPSBlbnVtRGVjbC5nZXROYW1lKCk7XG4gIGlmICghZW51bU5hbWUpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBcbiAgLy8gR2V0IHRoZSBlbnVtIG1lbWJlcnNcbiAgY29uc3QgbWVtYmVycyA9IGVudW1EZWNsLmdldE1lbWJlcnMoKTtcbiAgXG4gIC8vIFNraXAgdHJhbnNmb3JtYXRpb24gaWYgdGhlIGVudW0gaXMgbm90IGxhcmdlIGVub3VnaFxuICBpZiAobWVtYmVycy5sZW5ndGggPCAob3B0aW9ucy5saXRlcmFsTGltaXQgfHwgNDUpKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvLyBHZXQgdGhlIGZ1bGwgdGV4dCBvZiB0aGUgZW51bSBkZWNsYXJhdGlvblxuICBjb25zdCBlbnVtVGV4dCA9IGVudW1EZWNsLmdldFRleHQoKTtcbiAgXG4gIC8vIEV4dHJhY3QgdGhlIGJhc2UgbmFtZSAod2l0aG91dCBcIkVudW1cIiBzdWZmaXggaWYgcHJlc2VudClcbiAgY29uc3QgYmFzZU5hbWUgPSBlbnVtTmFtZS5lbmRzV2l0aChcIkVudW1cIikgXG4gICAgPyBlbnVtTmFtZS5yZXBsYWNlKC9FbnVtJC8sIFwiXCIpIFxuICAgIDogZW51bU5hbWU7XG4gIFxuICAvLyBHZXQgdGhlIGVudW0gbWVtYmVyIHZhbHVlc1xuICBjb25zdCB2YWx1ZXM6IHN0cmluZ1tdID0gW107XG4gIFxuICBmb3IgKGNvbnN0IG1lbWJlciBvZiBtZW1iZXJzKSB7XG4gICAgY29uc3QgaW5pdGlhbGl6ZXIgPSBtZW1iZXIuZ2V0SW5pdGlhbGl6ZXIoKTtcbiAgICBpZiAoaW5pdGlhbGl6ZXIpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5pdGlhbGl6ZXIuZ2V0VGV4dCgpO1xuICAgICAgLy8gT25seSBpbmNsdWRlIHN0cmluZyB2YWx1ZXNcbiAgICAgIGlmICh2YWx1ZS5zdGFydHNXaXRoKCdcIicpIHx8IHZhbHVlLnN0YXJ0c1dpdGgoXCInXCIpKSB7XG4gICAgICAgIHZhbHVlcy5wdXNoKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgXG4gIGlmICh2YWx1ZXMubGVuZ3RoID09PSAwKSB7XG4gICAgY29uc29sZS53YXJuKGBFbnVtICR7ZW51bU5hbWV9IGhhcyBubyBzdHJpbmcgdmFsdWVzLCBza2lwcGluZyB0cmFuc2Zvcm1hdGlvbmApO1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIFxuICAvLyBHZXQgbW9kaWZpZXJzIGZyb20gdGhlIGVudW0gZGVjbGFyYXRpb24gKGxpa2UgXCJleHBvcnRcIilcbiAgY29uc3QgbW9kaWZpZXJzID0gZW51bURlY2wuZ2V0TW9kaWZpZXJzKCkubWFwKG0gPT4gbS5nZXRUZXh0KCkpLmpvaW4oXCIgXCIpO1xuICBjb25zdCBleHBvcnRQcmVmaXggPSBtb2RpZmllcnMgPyBgJHttb2RpZmllcnN9IGAgOiBcIlwiO1xuICBcbiAgLy8gRGV0ZXJtaW5lIHdoZXRoZXIgdG8gdXNlIGJyYW5kZWQgdHlwZSBvciB1bmlvbiB0eXBlIGJhc2VkIG9uIGNvbmZpZ3VyYXRpb25cbiAgY29uc3QgdXNlQnJhbmRlZFR5cGUgPSBcbiAgICBvcHRpb25zLnVuaW9uTW9kZSA9PT0gXCJicmFuZGVkXCIgfHwgXG4gICAgKG9wdGlvbnMudW5pb25Nb2RlID09PSBcImF1dG9cIiAmJiB2YWx1ZXMubGVuZ3RoID4gKG9wdGlvbnMubGl0ZXJhbExpbWl0IHx8IDQ1KSk7XG4gIFxuICBsZXQgdHlwZURlY2xhcmF0aW9uOiBzdHJpbmc7XG4gIGxldCBpbXBvcnRCcmFuZGVkID0gZmFsc2U7XG4gIFxuICBpZiAodXNlQnJhbmRlZFR5cGUpIHtcbiAgICAvLyBDcmVhdGUgYnJhbmRlZCB0eXBlXG4gICAgdHlwZURlY2xhcmF0aW9uID0gYCR7ZXhwb3J0UHJlZml4fXR5cGUgJHtiYXNlTmFtZX0gPSBCcmFuZGVkPHN0cmluZywgXCIke2Jhc2VOYW1lfVwiPjtgO1xuICAgIGltcG9ydEJyYW5kZWQgPSB0cnVlO1xuICAgIGNvbnNvbGUubG9nKGBUcmFuc2Zvcm1lZCBsYXJnZSBlbnVtICR7ZW51bU5hbWV9ICgke3ZhbHVlcy5sZW5ndGh9IG1lbWJlcnMpIHRvIGJyYW5kZWQgdHlwZSAke2Jhc2VOYW1lfWApO1xuICB9IGVsc2Uge1xuICAgIC8vIENyZWF0ZSB1bmlvbiB0eXBlXG4gICAgY29uc3QgdW5pb25UeXBlID0gdmFsdWVzLmpvaW4oXCIgfCBcIik7XG4gICAgdHlwZURlY2xhcmF0aW9uID0gYCR7ZXhwb3J0UHJlZml4fXR5cGUgJHtiYXNlTmFtZX0gPSAke3VuaW9uVHlwZX07YDtcbiAgICBjb25zb2xlLmxvZyhgVHJhbnNmb3JtZWQgZW51bSAke2VudW1OYW1lfSB0byB1bmlvbiB0eXBlICR7YmFzZU5hbWV9YCk7XG4gIH1cbiAgXG4gIC8vIEdldCB0aGUgcG9zaXRpb24gb2YgdGhlIGVudW0gZGVjbGFyYXRpb25cbiAgY29uc3QgcG9zaXRpb24gPSBlbnVtRGVjbC5nZXRTdGFydCgpO1xuICBcbiAgcmV0dXJuIHtcbiAgICBwb3NpdGlvbixcbiAgICB0eXBlRGVjbGFyYXRpb24sXG4gICAgZW51bVRleHQsXG4gICAgaW1wb3J0QnJhbmRlZCxcbiAgfTtcbn1cblxuLyoqXG4gKiBBZGQgaW1wb3J0IGZvciB0aGUgQnJhbmRlZCB0eXBlXG4gKiBAcGFyYW0gc291cmNlRmlsZSBUaGUgc291cmNlIGZpbGUgdG8gYWRkIHRoZSBpbXBvcnQgdG9cbiAqL1xuZnVuY3Rpb24gYWRkQnJhbmRlZEltcG9ydChzb3VyY2VGaWxlOiBTb3VyY2VGaWxlKTogdm9pZCB7XG4gIC8vIENoZWNrIGlmIHRoZSBpbXBvcnQgYWxyZWFkeSBleGlzdHNcbiAgY29uc3QgaW1wb3J0cyA9IHNvdXJjZUZpbGUuZ2V0SW1wb3J0RGVjbGFyYXRpb25zKCk7XG4gIGNvbnN0IGhhc0ltcG9ydCA9IGltcG9ydHMuc29tZShpbXAgPT4ge1xuICAgIGNvbnN0IG1vZHVsZVNwZWNpZmllciA9IGltcC5nZXRNb2R1bGVTcGVjaWZpZXJWYWx1ZSgpO1xuICAgIHJldHVybiBtb2R1bGVTcGVjaWZpZXI/LmluY2x1ZGVzKFwiYnJhbmRlZFwiKSAmJiBcbiAgICAgICAgICAgaW1wLmdldE5hbWVkSW1wb3J0cygpLnNvbWUobmFtZWQgPT4gbmFtZWQuZ2V0TmFtZSgpID09PSBcIkJyYW5kZWRcIik7XG4gIH0pO1xuICBcbiAgaWYgKCFoYXNJbXBvcnQpIHtcbiAgICAvLyBBZGQgdGhlIGltcG9ydCBhdCB0aGUgdG9wIG9mIHRoZSBmaWxlLCBhZnRlciBhbnkgZXhpc3RpbmcgaW1wb3J0c1xuICAgIGNvbnN0IGltcG9ydFN0YXRlbWVudCA9ICdpbXBvcnQgeyBCcmFuZGVkIH0gZnJvbSBcIi4uL3V0aWxzL2JyYW5kZWQudHNcIjsnO1xuICAgIFxuICAgIGNvbnN0IGxhc3RJbXBvcnQgPSBpbXBvcnRzW2ltcG9ydHMubGVuZ3RoIC0gMV07XG4gICAgaWYgKGxhc3RJbXBvcnQpIHtcbiAgICAgIC8vIEFkZCBhZnRlciB0aGUgbGFzdCBpbXBvcnRcbiAgICAgIHNvdXJjZUZpbGUuaW5zZXJ0VGV4dChsYXN0SW1wb3J0LmdldEVuZCgpICsgMSwgXCJcXG5cIiArIGltcG9ydFN0YXRlbWVudCArIFwiXFxuXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBBZGQgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgZmlsZVxuICAgICAgc291cmNlRmlsZS5pbnNlcnRTdGF0ZW1lbnRzKDAsIGltcG9ydFN0YXRlbWVudCk7XG4gICAgfVxuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBbUMsVUFBVSxRQUFvQixlQUFlO0FBYWhGOzs7Ozs7Ozs7Ozs7Ozs7Q0FlQyxHQUNELE9BQU8sTUFBTSw0QkFBMkM7RUFDdEQsTUFBTSxTQUFRLE9BQWdCLEVBQUUsUUFBZ0I7SUFDOUMsNENBQTRDO0lBQzVDLE1BQU0sYUFBYSxTQUFTLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsTUFBTTtJQUN4RSxNQUFNLGNBQWMsS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLDBCQUEwQjtJQUUzRCxJQUFJLGdCQUFnQixVQUFVLGdCQUFnQixhQUFhLGdCQUFnQixTQUFTO01BQ2xGLFFBQVEsSUFBSSxDQUFDLENBQUMsb0NBQW9DLEVBQUUsWUFBWSx3QkFBd0IsQ0FBQztJQUMzRjtJQUVBLE1BQU0sVUFBZ0M7TUFDcEMsY0FBYztNQUNkLFdBQVcsQUFBQyxnQkFBZ0IsYUFBYSxnQkFBZ0IsVUFDckQsY0FDQTtJQUNOO0lBRUEsc0JBQXNCO0lBQ3RCLE1BQU0sYUFBYSxRQUFRLGFBQWEsQ0FBQztJQUN6QyxJQUFJLENBQUMsWUFBWTtNQUNmLFFBQVEsSUFBSSxDQUFDLENBQUMs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
// denoCacheMetadata=16462050613818014009,27006349997505599
