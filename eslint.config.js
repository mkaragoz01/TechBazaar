const js = require('@eslint/js');
const globals = require('globals');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
            },
        },
        rules: {
            'no-unused-vars': ['warn', { args: 'none' }],
        },
    },
    eslintConfigPrettier,
    {
        // web/ is a separate Next.js/TypeScript app with its own ESLint
        // config (web/eslint.config.mjs) — running the root JS config
        // against it pulls in React/TSX files it isn't set up to parse.
        ignores: ['node_modules/**', 'public/**', 'web/**'],
    },
];
