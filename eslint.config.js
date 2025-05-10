import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      'node_modules/**',
      'lib/**',
      'coverage/**',
      '.sailplane/**',
      '_reference/**'
    ]
  },
  {
    files: ['**/*.{js,ts}'],
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
        // Node.js globals
        process: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'writable',
        require: 'readonly',
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      // ESLint base rules
      'quotes': ['error', 'single', { 'avoidEscape': true, 'allowTemplateLiterals': true }],
      'jsx-quotes': ['error', 'prefer-double'],
      'semi': ['error', 'always'],
      'arrow-parens': ['error', 'as-needed'],
      'max-len': ['error', { 'code': 150 }],
      'no-restricted-exports': ['error', { 'restrictDefaultExports': { 'direct': true } }],
      
      // TypeScript-specific rules
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/member-ordering': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-shadow': 'off',
      
      // Import and sorting rules
      'sort-keys': 'off',
      'sort-imports': 'off'
    }
  },
  {
    files: ['**/*.{js,ts}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules
    }
  }
];