// @ts-check
const tseslint = require('typescript-eslint')
const eslintConfigPrettier = require('eslint-config-prettier')

module.exports = tseslint.config(
  // ─── Ignored paths ────────────────────────────────────────────────────────
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/*.js'],
  },

  // ─── Base: TypeScript recommended rules ───────────────────────────────────
  ...tseslint.configs.recommended,

  // ─── Type-aware linting ───────────────────────────────────────────────────
  // Enables rules that need type information (e.g. no-floating-promises).
  // `projectService` auto-discovers each microservice's tsconfig.json.
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
  },

  // ─── Prettier: disables formatting rules that conflict with Prettier ───────
  eslintConfigPrettier,

  // ─── Custom rules ─────────────────────────────────────────────────────────
  // Add or remove rules here. Severity: 'error' | 'warn' | 'off'
  {
    rules: {
      // Discourage `any` — use `warn` to allow gradual migration
      '@typescript-eslint/no-explicit-any': 'warn',

      // Allow unused vars prefixed with `_` (e.g. `_event`, `_req`)
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      // Enforce explicit return types on exported functions
      '@typescript-eslint/explicit-module-boundary-types': 'warn',

      // Disallow floating promises (common async bug in Express handlers)
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
)
