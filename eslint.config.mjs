import pluginJs from '@eslint/js';
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import typescriptEslintParser from '@typescript-eslint/parser';
import jest from 'eslint-plugin-jest';
import perfectionist from 'eslint-plugin-perfectionist';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*'],
  },
  perfectionist.configs['recommended-alphabetical'],
  pluginJs.configs.recommended,
  sonarjs.configs.recommended,
  {
    files: ['test/**', 'src/**/*.spec.ts'],
    ...jest.configs['flat/recommended'],
    ...jest.configs['flat/style'],
    rules: {
      ...jest.configs['flat/recommended'].rules,
      ...jest.configs['flat/style'].rules,
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        Express: 'readonly',
      },
      parser: typescriptEslintParser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslintPlugin,
      jest,
      prettier: eslintPluginPrettier,
    },

    ...typescriptEslintPlugin.configs.strictTypeChecked,
    ...typescriptEslintPlugin.configs.stylisticTypeChecked,

    rules: {
      ...typescriptEslintPlugin.configs.recommended.rules,
      ...eslintPluginPrettier.configs.recommended.rules,

      // Typescript-eslint rules
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'explicit' }],
      '@typescript-eslint/method-signature-style': 'error',
      '@typescript-eslint/no-empty-object-type': ['error', { allowObjectTypes: 'always' }],
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-invalid-void-type': 'off',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-useless-empty-export': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/sort-type-constituents': 'off',
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        { allowNullableBoolean: true, allowNullableObject: true, allowNullableString: true, allowNumber: false },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // Eslint rules
      'array-callback-return': 'error',
      'no-alert': 'error',
      'no-await-in-loop': 'error',
      'no-console': 'warn',
      'no-else-return': 'error',
      'no-empty-function': 'off',
      'no-inner-declarations': 'error',
      'no-lone-blocks': 'error',
      'no-lonely-if': 'error',
      'no-multi-assign': 'error',
      'no-multi-str': 'error',
      'no-new-wrappers': 'error',
      'no-param-reassign': ['error', { ignorePropertyModificationsFor: ['state'] }],
      'no-plusplus': 'error',

      'no-promise-executor-return': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              importNames: ['default'],
              message: 'do not use default React import',
              name: 'react',
            },
            {
              message: 'Please use src/components/rhf/DefaultForm.tsx',
              name: 'components/rhf/Form',
            },
            {
              importNames: ['FormTextEditorField'],
              message: 'Please use DataGrid from src/components/rhf/FormTextEditorField/index.tsx instead.',
              name: '@partstech/ui/forms',
            },
            {
              importNames: ['DataTable'],
              message: 'Please use DataGrid from src/components/DataGrid/index.tsx instead.',
              name: '@partstech/ui',
            },
          ],
        },
      ],
      'no-restricted-syntax': ['error', 'ForInStatement'],
      'no-return-assign': 'error',
      'no-self-compare': 'error',
      'no-undef-init': 'error',
      'no-underscore-dangle': ['error', { allow: ['_shop_host', '_supplier_host'] }],
      'no-unmodified-loop-condition': 'error',
      'no-unneeded-ternary': 'error',
      'no-unreachable-loop': 'error',
      'no-useless-assignment': 'error',
      'no-useless-computed-key': 'error',
      'no-useless-concat': 'error',
      'no-useless-rename': 'error',
      'no-useless-return': 'error',
      'no-void': 'error',
      'object-shorthand': 'error',

      // perfectionist
      'perfectionist/sort-imports': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'side-effect',
            'side-effect-style',
            'index',
            'object',
            ['external-type', 'builtin-type', 'internal-type', 'parent-type', 'sibling-type', 'index-type'],
            'unknown',
            'style',
          ],
          newlinesBetween: 'always',
          order: 'asc',
          type: 'alphabetical',
        },
      ],

      'perfectionist/sort-interfaces': [
        'error',
        {
          groupKind: 'required-first',
          order: 'asc',
          partitionByNewLine: true,
        },
      ],
      'perfectionist/sort-intersection-types': [
        'error',
        {
          groups: [
            'named',
            'object',
            'conditional',
            'function',
            'import',
            'intersection',
            'keyword',
            'literal',
            'operator',
            'tuple',
            'union',
            'nullish',
          ],
          order: 'asc',
        },
      ],
      'perfectionist/sort-object-types': [
        'error',
        {
          customGroups: { __typename: '__typename' },
          groupKind: 'required-first',
          groups: ['__typename', 'multiline', 'unknown'],
          order: 'asc',
          partitionByNewLine: true,
        },
      ],

      'perfectionist/sort-union-types': [
        'error',
        {
          groups: [
            'named',
            'object',
            'conditional',
            'function',
            'import',
            'intersection',
            'keyword',
            'literal',
            'operator',
            'tuple',
            'union',
            'nullish',
          ],
          order: 'asc',
        },
      ],
      'prefer-const': 'error',
      'prefer-object-spread': 'error',
      'prefer-template': 'error',

      // Sonarjs rules
      'sonarjs/array-constructor': 'error',
      'sonarjs/arrow-function-convention': ['error', { requireParameterParentheses: true }],
      'sonarjs/bool-param-default': 'error',
      'sonarjs/max-union-size': ['error', { threshold: 5 }],
      'sonarjs/no-duplicate-string': ['error', { ignoreStrings: 'application/json,flat/recommended' }],
      'sonarjs/no-unused-function-argument': 'error',
      'sonarjs/pseudo-random': 'off',

      yoda: 'error',
    },

    settings: {
      jest: {
        version: 'detect',
      },
      perfectionist: {
        partitionByComment: true,
        type: 'line-length',
      },
    },
  },
];
