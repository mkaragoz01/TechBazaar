module.exports = {
    testEnvironment: 'node',
    testPathIgnorePatterns: ['/node_modules/', '/web/'],
    // mongodb-memory-server has to download/boot a real mongod per test
    // file on a cold cache (CI runners, first local run) — the default
    // 5s timeout is too tight for that.
    testTimeout: 30000,
    // sanitize-html pulls in an ESM-only htmlparser2 build that Jest's
    // CJS module system can't load (see tests/mocks/sanitizeHtmlMock.js).
    moduleNameMapper: {
        '^sanitize-html$': '<rootDir>/tests/mocks/sanitizeHtmlMock.js',
        '^nodemailer$': '<rootDir>/tests/mocks/nodemailerMock.js',
    },
    // connect-mongodb-session opens its own MongoClient per app instance
    // and doesn't expose a way to close it from here, so it keeps Jest's
    // process alive after every test has already passed. forceExit is the
    // standard workaround for a session-store handle like this.
    forceExit: true,
};
