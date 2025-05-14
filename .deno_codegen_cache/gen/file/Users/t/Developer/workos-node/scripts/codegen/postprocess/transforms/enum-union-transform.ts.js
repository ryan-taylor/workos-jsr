import { SyntaxKind } from "npm:ts-morph";
/**
 * Transform that converts enum declarations to union types
 * Example:
 *   enum StatusEnum { ACTIVE = "ACTIVE", DELETING = "DELETING" }
 * Becomes:
 *   export type Status = "ACTIVE" | "DELETING";
 */ export const enumUnionTransform = {
  async process(project, filePath) {
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
      const transformation = prepareEnumTransformation(enumDecl);
      if (transformation) {
        transformations.push(transformation);
        changesMade = true;
      }
    }
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
    return changesMade;
  },
};
/**
 * Prepare the transformation data for an enum
 * @param enumDecl The enum declaration to transform
 * @returns Transformation data if the enum should be transformed, null otherwise
 */ function prepareEnumTransformation(enumDecl) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvdC9EZXZlbG9wZXIvd29ya29zLW5vZGUvc2NyaXB0cy9jb2RlZ2VuL3Bvc3Rwcm9jZXNzL3RyYW5zZm9ybXMvZW51bS11bmlvbi10cmFuc2Zvcm0udHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUHJvamVjdCwgTm9kZSwgU3ludGF4S2luZCwgRW51bURlY2xhcmF0aW9uLCBTb3VyY2VGaWxlIH0gZnJvbSBcIm5wbTp0cy1tb3JwaFwiO1xuaW1wb3J0IHsgQ29kZVRyYW5zZm9ybSB9IGZyb20gXCIuLi9pbmRleC50c1wiO1xuXG4vKipcbiAqIFRyYW5zZm9ybSB0aGF0IGNvbnZlcnRzIGVudW0gZGVjbGFyYXRpb25zIHRvIHVuaW9uIHR5cGVzXG4gKiBFeGFtcGxlOlxuICogICBlbnVtIFN0YXR1c0VudW0geyBBQ1RJVkUgPSBcIkFDVElWRVwiLCBERUxFVElORyA9IFwiREVMRVRJTkdcIiB9XG4gKiBCZWNvbWVzOlxuICogICBleHBvcnQgdHlwZSBTdGF0dXMgPSBcIkFDVElWRVwiIHwgXCJERUxFVElOR1wiO1xuICovXG5leHBvcnQgY29uc3QgZW51bVVuaW9uVHJhbnNmb3JtOiBDb2RlVHJhbnNmb3JtID0ge1xuICBhc3luYyBwcm9jZXNzKHByb2plY3Q6IFByb2plY3QsIGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAvLyBHZXQgdGhlIHNvdXJjZSBmaWxlXG4gICAgY29uc3Qgc291cmNlRmlsZSA9IHByb2plY3QuZ2V0U291cmNlRmlsZShmaWxlUGF0aCk7XG4gICAgaWYgKCFzb3VyY2VGaWxlKSB7XG4gICAgICBjb25zb2xlLndhcm4oYEZpbGUgbm90IGZvdW5kOiAke2ZpbGVQYXRofWApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGxldCBjaGFuZ2VzTWFkZSA9IGZhbHNlO1xuICAgIFxuICAgIC8vIEZpbmQgYWxsIGVudW0gZGVjbGFyYXRpb25zXG4gICAgY29uc3QgZW51bURlY2xhcmF0aW9ucyA9IHNvdXJjZUZpbGUuZ2V0RGVzY2VuZGFudHNPZktpbmQoU3ludGF4S2luZC5FbnVtRGVjbGFyYXRpb24pO1xuICAgIFxuICAgIC8vIENyZWF0ZSBhIGxpc3Qgb2YgdHJhbnNmb3JtYXRpb25zIHRvIGFwcGx5XG4gICAgY29uc3QgdHJhbnNmb3JtYXRpb25zOiBBcnJheTx7XG4gICAgICBwb3NpdGlvbjogbnVtYmVyO1xuICAgICAgdHlwZURlY2xhcmF0aW9uOiBzdHJpbmc7XG4gICAgICBlbnVtVGV4dDogc3RyaW5nO1xuICAgIH0+ID0gW107XG4gICAgXG4gICAgLy8gRmlyc3QgY29sbGVjdCBhbGwgdGhlIHRyYW5zZm9ybWF0aW9ucyB3ZSBuZWVkIHRvIG1ha2VcbiAgICBmb3IgKGNvbnN0IGVudW1EZWNsIG9mIGVudW1EZWNsYXJhdGlvbnMpIHtcbiAgICAgIGNvbnN0IHRyYW5zZm9ybWF0aW9uID0gcHJlcGFyZUVudW1UcmFuc2Zvcm1hdGlvbihlbnVtRGVjbCk7XG4gICAgICBpZiAodHJhbnNmb3JtYXRpb24pIHtcbiAgICAgICAgdHJhbnNmb3JtYXRpb25zLnB1c2godHJhbnNmb3JtYXRpb24pO1xuICAgICAgICBjaGFuZ2VzTWFkZSA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIEFwcGx5IHRyYW5zZm9ybWF0aW9ucyBpbiByZXZlcnNlIG9yZGVyIHRvIHByZXNlcnZlIHBvc2l0aW9uc1xuICAgIHRyYW5zZm9ybWF0aW9ucy5zb3J0KChhLCBiKSA9PiBiLnBvc2l0aW9uIC0gYS5wb3NpdGlvbik7XG4gICAgXG4gICAgZm9yIChjb25zdCB7IHBvc2l0aW9uLCB0eXBlRGVjbGFyYXRpb24sIGVudW1UZXh0IH0gb2YgdHJhbnNmb3JtYXRpb25zKSB7XG4gICAgICAvLyBBZGQgdGhlIHR5cGUgZGVjbGFyYXRpb25cbiAgICAgIHNvdXJjZUZpbGUuaW5zZXJ0VGV4dChwb3NpdGlvbiwgdHlwZURlY2xhcmF0aW9uICsgXCJcXG5cXG5cIik7XG4gICAgICBcbiAgICAgIC8vIEZpbmQgdGhlIHRleHQgYW5kIHJlcGxhY2UgaXRcbiAgICAgIGNvbnN0IHRleHQgPSBzb3VyY2VGaWxlLmdldFRleHQoKTtcbiAgICAgIGNvbnN0IGVudW1JbmRleCA9IHRleHQuaW5kZXhPZihlbnVtVGV4dCwgcG9zaXRpb24pO1xuICAgICAgaWYgKGVudW1JbmRleCA+PSAwKSB7XG4gICAgICAgIHNvdXJjZUZpbGUucmVwbGFjZVRleHQoW2VudW1JbmRleCwgZW51bUluZGV4ICsgZW51bVRleHQubGVuZ3RoXSwgXCJcIik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNoYW5nZXNNYWRlO1xuICB9XG59O1xuXG4vKipcbiAqIFByZXBhcmUgdGhlIHRyYW5zZm9ybWF0aW9uIGRhdGEgZm9yIGFuIGVudW1cbiAqIEBwYXJhbSBlbnVtRGVjbCBUaGUgZW51bSBkZWNsYXJhdGlvbiB0byB0cmFuc2Zvcm1cbiAqIEByZXR1cm5zIFRyYW5zZm9ybWF0aW9uIGRhdGEgaWYgdGhlIGVudW0gc2hvdWxkIGJlIHRyYW5zZm9ybWVkLCBudWxsIG90aGVyd2lzZVxuICovXG5mdW5jdGlvbiBwcmVwYXJlRW51bVRyYW5zZm9ybWF0aW9uKGVudW1EZWNsOiBFbnVtRGVjbGFyYXRpb24pOiB7XG4gIHBvc2l0aW9uOiBudW1iZXI7XG4gIHR5cGVEZWNsYXJhdGlvbjogc3RyaW5nO1xuICBlbnVtVGV4dDogc3RyaW5nO1xufSB8IG51bGwge1xuICBjb25zdCBlbnVtTmFtZSA9IGVudW1EZWNsLmdldE5hbWUoKTtcbiAgXG4gIC8vIE9ubHkgdHJhbnNmb3JtIGVudW1zIHRoYXQgZW5kIHdpdGggXCJFbnVtXCJcbiAgaWYgKCFlbnVtTmFtZSB8fCAhZW51bU5hbWUuZW5kc1dpdGgoXCJFbnVtXCIpKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvLyBHZXQgdGhlIGZ1bGwgdGV4dCBvZiB0aGUgZW51bSBkZWNsYXJhdGlvblxuICBjb25zdCBlbnVtVGV4dCA9IGVudW1EZWNsLmdldFRleHQoKTtcbiAgXG4gIC8vIEV4dHJhY3QgdGhlIGJhc2UgbmFtZSAod2l0aG91dCBcIkVudW1cIilcbiAgY29uc3QgYmFzZU5hbWUgPSBlbnVtTmFtZS5yZXBsYWNlKC9FbnVtJC8sIFwiXCIpO1xuICBcbiAgLy8gR2V0IHRoZSBlbnVtIG1lbWJlcnMgYW5kIHRoZWlyIHZhbHVlc1xuICBjb25zdCBtZW1iZXJzID0gZW51bURlY2wuZ2V0TWVtYmVycygpO1xuICBjb25zdCB2YWx1ZXM6IHN0cmluZ1tdID0gW107XG4gIFxuICBmb3IgKGNvbnN0IG1lbWJlciBvZiBtZW1iZXJzKSB7XG4gICAgY29uc3QgaW5pdGlhbGl6ZXIgPSBtZW1iZXIuZ2V0SW5pdGlhbGl6ZXIoKTtcbiAgICBpZiAoaW5pdGlhbGl6ZXIpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5pdGlhbGl6ZXIuZ2V0VGV4dCgpO1xuICAgICAgLy8gT25seSBpbmNsdWRlIHN0cmluZyB2YWx1ZXNcbiAgICAgIGlmICh2YWx1ZS5zdGFydHNXaXRoKCdcIicpIHx8IHZhbHVlLnN0YXJ0c1dpdGgoXCInXCIpKSB7XG4gICAgICAgIHZhbHVlcy5wdXNoKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgXG4gIGlmICh2YWx1ZXMubGVuZ3RoID09PSAwKSB7XG4gICAgY29uc29sZS53YXJuKGBFbnVtICR7ZW51bU5hbWV9IGhhcyBubyBzdHJpbmcgdmFsdWVzLCBza2lwcGluZyB0cmFuc2Zvcm1hdGlvbmApO1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIFxuICAvLyBHZXQgbW9kaWZpZXJzIGZyb20gdGhlIGVudW0gZGVjbGFyYXRpb24gKGxpa2UgXCJleHBvcnRcIilcbiAgY29uc3QgbW9kaWZpZXJzID0gZW51bURlY2wuZ2V0TW9kaWZpZXJzKCkubWFwKG0gPT4gbS5nZXRUZXh0KCkpLmpvaW4oXCIgXCIpO1xuICBcbiAgLy8gQ3JlYXRlIHRoZSB1bmlvbiB0eXBlIGRlY2xhcmF0aW9uXG4gIGNvbnN0IHVuaW9uVHlwZSA9IHZhbHVlcy5qb2luKFwiIHwgXCIpO1xuICBjb25zdCB0eXBlRGVjbGFyYXRpb24gPSBgJHttb2RpZmllcnN9IHR5cGUgJHtiYXNlTmFtZX0gPSAke3VuaW9uVHlwZX07YDtcbiAgXG4gIC8vIEdldCB0aGUgcG9zaXRpb24gb2YgdGhlIGVudW0gZGVjbGFyYXRpb25cbiAgY29uc3QgcG9zaXRpb24gPSBlbnVtRGVjbC5nZXRTdGFydCgpO1xuICBcbiAgY29uc29sZS5sb2coYFByZXBhcmVkIHRyYW5zZm9ybWF0aW9uOiBlbnVtICR7ZW51bU5hbWV9IHRvIHVuaW9uIHR5cGUgJHtiYXNlTmFtZX1gKTtcbiAgXG4gIHJldHVybiB7XG4gICAgcG9zaXRpb24sXG4gICAgdHlwZURlY2xhcmF0aW9uLFxuICAgIGVudW1UZXh0LFxuICB9O1xufSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUF3QixVQUFVLFFBQXFDLGVBQWU7QUFHdEY7Ozs7OztDQU1DLEdBQ0QsT0FBTyxNQUFNLHFCQUFvQztFQUMvQyxNQUFNLFNBQVEsT0FBZ0IsRUFBRSxRQUFnQjtJQUM5QyxzQkFBc0I7SUFDdEIsTUFBTSxhQUFhLFFBQVEsYUFBYSxDQUFDO0lBQ3pDLElBQUksQ0FBQyxZQUFZO01BQ2YsUUFBUSxJQUFJLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVO01BQzFDLE9BQU87SUFDVDtJQUVBLElBQUksY0FBYztJQUVsQiw2QkFBNkI7SUFDN0IsTUFBTSxtQkFBbUIsV0FBVyxvQkFBb0IsQ0FBQyxXQUFXLGVBQWU7SUFFbkYsNENBQTRDO0lBQzVDLE1BQU0sa0JBSUQsRUFBRTtJQUVQLHdEQUF3RDtJQUN4RCxLQUFLLE1BQU0sWUFBWSxpQkFBa0I7TUFDdkMsTUFBTSxpQkFBaUIsMEJBQTBCO01BQ2pELElBQUksZ0JBQWdCO1FBQ2xCLGdCQUFnQixJQUFJLENBQUM7UUFDckIsY0FBYztNQUNoQjtJQUNGO0lBRUEsK0RBQStEO0lBQy9ELGdCQUFnQixJQUFJLENBQUMsQ0FBQyxHQUFHLElBQU0sRUFBRSxRQUFRLEdBQUcsRUFBRSxRQUFRO0lBRXRELEtBQUssTUFBTSxFQUFFLFFBQVEsRUFBRSxlQUFlLEVBQUUsUUFBUSxFQUFFLElBQUksZ0JBQWlCO01BQ3JFLDJCQUEyQjtNQUMzQixXQUFXLFVBQVUsQ0FBQyxVQUFVLGtCQUFrQjtNQUVsRCwrQkFBK0I7TUFDL0IsTUFBTSxPQUFPLFdBQVcsT0FBTztNQUMvQixNQUFNLFlBQVksS0FBSyxPQUFPLENBQUMsVUFBVTtNQUN6QyxJQUFJLGFBQWEsR0FBRztRQUNsQixXQUFXLFdBQVcsQ0FBQztVQUFDO1VBQVcsWUFBWSxTQUFTLE1BQU07U0FBQyxFQUFFO01BQ25FO0lBQ0Y7SUFFQSxPQUFPO0VBQ1Q7QUFDRixFQUFFO0FBRUY7Ozs7Q0FJQyxHQUNELFNBQVMsMEJBQTBCLFFBQXlCO0VBSzFELE1BQU0sV0FBVyxTQUFTLE9BQU87RUFFakMsNENBQTRDO0VBQzVDLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxRQUFRLENBQUMsU0FBUztJQUMzQyxPQUFPO0VBQ1Q7RUFFQSw0Q0FBNEM7RUFDNUMsTUFBTSxXQUFXLFNBQVMsT0FBTztFQUVqQyx5Q0FBeUM7RUFDekMsTUFBTSxXQUFXLFNBQVMsT0FBTyxDQUFDLFNBQVM7RUFFM0Msd0NBQXdDO0VBQ3hDLE1BQU0sVUFBVSxTQUFTLFVBQVU7RUFDbkMsTUFBTSxTQUFtQixFQUFFO0VBRTNCLEtBQUssTUFBTSxVQUFVLFFBQVM7SUFDNUIsTUFBTSxjQUFjLE9BQU8sY0FBYztJQUN6QyxJQUFJLGFBQWE7TUFDZixNQUFNLFFBQVEsWUFBWSxPQUFPO01BQ2pDLDZCQUE2QjtNQUM3QixJQUFJLE1BQU0sVUFBVSxDQUFDLFFBQVEsTUFBTSxVQUFVLENBQUMsTUFBTTtRQUNsRCxPQUFPLElBQUksQ0FBQztNQUNkO0lBQ0Y7RUFDRjtFQUVBLElBQUksT0FBTyxNQUFNLEtBQUssR0FBRztJQUN2QixRQUFRLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxTQUFTLDhDQUE4QyxDQUFDO0lBQzdFLE9BQU87RUFDVDtFQUVBLDBEQUEwRDtFQUMxRCxNQUFNLFlBQVksU0FBUyxZQUFZLEdBQUcsR0FBRyxDQUFDLENBQUEsSUFBSyxFQUFFLE9BQU8sSUFBSSxJQUFJLENBQUM7RUFFckUsb0NBQW9DO0VBQ3BDLE1BQU0sWUFBWSxPQUFPLElBQUksQ0FBQztFQUM5QixNQUFNLGtCQUFrQixHQUFHLFVBQVUsTUFBTSxFQUFFLFNBQVMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0VBRXZFLDJDQUEyQztFQUMzQyxNQUFNLFdBQVcsU0FBUyxRQUFRO0VBRWxDLFFBQVEsR0FBRyxDQUFDLENBQUMsOEJBQThCLEVBQUUsU0FBUyxlQUFlLEVBQUUsVUFBVTtFQUVqRixPQUFPO0lBQ0w7SUFDQTtJQUNBO0VBQ0Y7QUFDRiJ9
// denoCacheMetadata=3902898867281736480,1236650067724571093
