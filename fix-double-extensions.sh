#!/bin/bash

# Clean up any existing backup files
find src/user-management -name "*.ts-e" -delete

# Fix user-management.spec.ts
sed -i '' 's/from "\.\.\/common\/utils\/test-utils\.ts\.ts"/from "\.\.\/common\/utils\/test-utils\.ts"/g' src/user-management/user-management.spec.ts
sed -i '' 's/from "\.\.\/workos\.ts\.ts"/from "\.\.\/workos\.ts"/g' src/user-management/user-management.spec.ts

# Fix serializers that import from interfaces.ts.ts
for file in src/user-management/serializers/*.ts; do
  if grep -q "from \"\.\.\/interfaces\.ts\.ts\"" "$file"; then
    sed -i '' 's/from "\.\.\/interfaces\.ts\.ts"/from "\.\.\/interfaces\/index\.ts"/g' "$file"
  fi
done

# Fix serializers that import from specific serializer files
for file in src/user-management/serializers/*.ts; do
  if grep -q "\.serializer\.ts\.ts\"" "$file"; then
    sed -i '' 's/\.serializer\.ts\.ts"/\.serializer\.ts"/g' "$file"
  fi
done

# Fix interface file with double-extension import
sed -i '' 's/from "\.\.\/\.\.\/common\/interfaces\.ts\.ts"/from "\.\.\/\.\.\/common\/interfaces\.ts"/g' src/user-management/interfaces/list-auth-factors-options.interface.ts

# Fix role serializer with double-extension import
sed -i '' 's/from "\.\.\/\.\.\/roles\/interfaces\.ts\.ts"/from "\.\.\/\.\.\/roles\/interfaces\.ts"/g' src/user-management/serializers/role.serializer.ts

echo "Fixed double-extension imports in the user-management module"