const path = require('path');

// web/ is a separate Next.js/TS app with its own ESLint config
// (web/eslint.config.mjs) and its own working directory expectations, so it
// needs its own command rather than sharing the root `eslint --fix` — see
// eslint.config.js's `ignores` for why the two configs can't just be merged.
module.exports = {
    '**/*.js': (filenames) => {
        const backendFiles = filenames.filter((f) => !f.split(path.sep).includes('web'));
        if (backendFiles.length === 0) return [];
        return `eslint --fix ${backendFiles.map((f) => JSON.stringify(f)).join(' ')}`;
    },
    'web/**/*.{js,jsx,ts,tsx}': (filenames) => {
        // `npm --prefix web run` (unlike `npm --prefix web exec`) actually
        // runs the script with cwd = web/, which both resolves the file
        // paths correctly and — critically — uses web's own locally
        // installed ESLint (9.x) instead of the root project's (10.x),
        // which crashes on web's eslint-plugin-react config. ESLint's glob
        // matching also expects forward slashes even on Windows, where
        // path.relative() returns backslash-separated paths.
        const relativePaths = filenames.map((f) =>
            path.relative(path.join(__dirname, 'web'), f).split(path.sep).join('/')
        );
        return `npm --prefix web run lint -- --fix ${relativePaths.map((f) => JSON.stringify(f)).join(' ')}`;
    },
};
