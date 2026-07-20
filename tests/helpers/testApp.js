const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const createApp = require('../../app');

// Each test file gets its own isolated in-memory MongoDB instance rather
// than sharing one via a global setup — slower to boot per-file, but avoids
// any cross-file state leakage and sidesteps the env-var-across-worker-
// processes problem that a single shared instance would introduce with
// Jest's parallel workers.
async function setupTestApp() {
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    const app = createApp(uri);
    return { app, mongoServer };
}

async function teardownTestApp(mongoServer) {
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
}

module.exports = { setupTestApp, teardownTestApp };
