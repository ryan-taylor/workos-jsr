import { Project, EnumDeclaration, SyntaxKind, SourceFile } from "npm:ts-morph";
import { CodeTransform } from "./index.ts";

/**
 * Configuration options for large enum transformation
 */
export interface EnumTransformOptions {
  /** Maximum number of literals before converting to branded type */
  literalLimit?: number;
  /** How to handle large enums: "branded" (always use branded), "union" (always use union), "auto" (decide based on size) */
  unionMode?: "branded" | "union" | "auto";
}

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
 */
export const largeBrandedEnumTransform: CodeTransform = {
  async process(project: Project, filePath: string): Promise<boolean> {
    // Get environment variables or use defaults
    const ENUM_LIMIT = parseInt(Deno.env.get("CODEGEN_ENUM_LIMIT") || "45", 10);
    const ENUM_UNIONS = Deno.env.get("CODEGEN_ENUM_UNIONS") || "auto";
    
    if (ENUM_UNIONS !== "auto" && ENUM_UNIONS !== "branded" && ENUM_UNIONS !== "union") {
      console.warn(`Invalid CODEGEN_ENUM_UNIONS value: "${ENUM_UNIONS}". Using "auto" instead.`);
    }

    const options: EnumTransformOptions = {
      literalLimit: ENUM_LIMIT,
      unionMode: (ENUM_UNIONS === "branded" || ENUM_UNIONS === "union") 
        ? ENUM_UNIONS 
        : "auto"
    };

    // Get the source file
    const sourceFile = project.getSourceFile(filePath);
    if (!sourceFile) {
      console.warn(`File not found: ${filePath}`);
      return false;
    }

    let changesMade = false;
    
    // Find all enum declarations
    const enumDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.EnumDeclaration);
    
    // Create a list of transformations to apply
    const transformations: Array<{
      position: number;
      typeDeclaration: string;
      enumText: string;
      importBranded: boolean;
    }> = [];
    
    // First collect all the transformations we need to make
    for (const enumDecl of enumDeclarations) {
      const transformation = prepareEnumTransformation(enumDecl, options);
      if (transformation) {
        transformations.push(transformation);
        changesMade = true;
      }
    }
    
    // Determine if we need to add the branded import
    const needsBrandedImport = transformations.some(t => t.importBranded);
    
    // Apply transformations in reverse order to preserve positions
    transformations.sort((a, b) => b.position - a.position);
    
    for (const { position, typeDeclaration, enumText } of transformations) {
      // Add the type declaration
      sourceFile.insertText(position, typeDeclaration + "\n\n");
      
      // Find the text and replace it
      const text = sourceFile.getText();
      const enumIndex = text.indexOf(enumText, position);
      if (enumIndex >= 0) {
        sourceFile.replaceText([enumIndex, enumIndex + enumText.length], "");
      }
    }
    
    // Add import for Branded if needed
    if (needsBrandedImport && changesMade) {
      addBrandedImport(sourceFile);
    }

    return changesMade;
  }
};

/**
 * Prepare the transformation data for a large enum
 * @param enumDecl The enum declaration to transform
 * @param options Configuration options
 * @returns Transformation data if the enum should be transformed, null otherwise
 */
function prepareEnumTransformation(
  enumDecl: EnumDeclaration, 
  options: EnumTransformOptions
): {
  position: number;
  typeDeclaration: string;
  enumText: string;
  importBranded: boolean;
} | null {
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
    console.warn(`Enum ${enumName} has no string values, skipping transformation`);
    return null;
  }
  
  // Get modifiers from the enum declaration (like "export")
  const modifiers = enumDecl.getModifiers().map(m => m.getText()).join(" ");
  const exportPrefix = modifiers ? `${modifiers} ` : "";
  
  // Determine whether to use branded type or union type based on configuration
  const useBrandedType = 
    options.unionMode === "branded" || 
    (options.unionMode === "auto" && values.length > (options.literalLimit || 45));
  
  let typeDeclaration: string;
  let importBranded = false;
  
  if (useBrandedType) {
    // Create branded type
    typeDeclaration = `${exportPrefix}type ${baseName} = Branded<string, "${baseName}">;`;
    importBranded = true;
    console.log(`Transformed large enum ${enumName} (${values.length} members) to branded type ${baseName}`);
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
 */
function addBrandedImport(sourceFile: SourceFile): void {
  // Check if the import already exists
  const imports = sourceFile.getImportDeclarations();
  const hasImport = imports.some(imp => {
    const moduleSpecifier = imp.getModuleSpecifierValue();
    return moduleSpecifier?.includes("branded") && 
           imp.getNamedImports().some(named => named.getName() === "Branded");
  });
  
  if (!hasImport) {
    // Add the import at the top of the file, after any existing imports
    const importStatement = 'import { Branded } from "../utils/branded.ts";';
    
    const lastImport = imports[imports.length - 1];
    if (lastImport) {
      // Add after the last import
      sourceFile.insertText(lastImport.getEnd() + 1, "\n" + importStatement + "\n");
    } else {
      // Add at the beginning of the file
      sourceFile.insertStatements(0, importStatement);
    }
  }
}
