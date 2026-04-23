module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  plugins: ['vue', '@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'warn',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'no-empty': ['error', { allowEmptyCatch: true }],
    'vue/multi-word-component-names': 'off',
    'vue/no-v-html': 'warn',
    'vue/require-default-prop': 'off',
    'vue/require-explicit-emits': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    'prefer-const': 'warn',
    'no-var': 'error',
    'object-shorthand': 'warn',
    'quote-props': ['warn', 'as-needed'],
    'array-callback-return': 'error',
    'default-case': 'warn',
    'eqeqeq': ['error', 'always'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-return-await': 'error',
    'yoda': 'warn',
    'prefer-template': 'warn',
    'prefer-arrow-callback': 'warn',
    'prefer-rest-params': 'warn',
    'no-unused-expressions': ['error', {
      allowShortCircuit: true,
      allowTernary: true
    }]
  },
  overrides: [
    {
      files: ['*.vue'],
      rules: {
        'prettier/prettier': ['error', {
          parser: 'vue'
        }]
      }
    },
    {
      files: ['src/test/**/*.js'],
      env: {
        jest: true
      },
      rules: {
        'no-unused-vars': 'off'
      }
    }
  ]
}