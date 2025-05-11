import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      'node_modules/**',
      'lib/**',
      'coverage/**',
      '.sailplane/**',
      '_reference/**',
      'dist/**',
      'cov/**'
    ]
  },
  {
    files: ['**/*.{js,ts,jsx,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        // Deno & Node.js globals - more permissive during transition
        process: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'writable',
        require: 'readonly',
        Deno: 'readonly',
        globalThis: 'readonly',
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      // ESLint base rules - relaxed to warnings during transition
      'quotes': ['warn', 'single', { 'avoidEscape': true, 'allowTemplateLiterals': true }],
      'jsx-quotes': ['warn', 'prefer-double'],
      'semi': ['warn', 'always'],
      'arrow-parens': ['warn', 'as-needed'],
      'max-len': ['warn', { 'code': 150 }],
      'no-restricted-exports': ['warn', { 'restrictDefaultExports': { 'direct': true } }],
      
      // TypeScript-specific rules
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/member-ordering': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-shadow': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      
      // Import and sorting rules
      'sort-keys': 'off',
      'sort-imports': 'off',
      
      // Relaxed rules for Deno compatibility
      'no-undef': 'off', // Deno doesn't need this with TypeScript
      'import/extensions': 'off', // Deno requires extensions
      'import/no-unresolved': 'off', // Different resolution in Deno
    }
  },
  {
    files: ['**/*.{js,ts}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off'
    }
  }
];