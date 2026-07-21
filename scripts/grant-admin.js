// Dev/test helper: there's no self-service admin promotion in this app (see
// PROJECT_ANALYSIS.md Faz F's "npm run seed" backlog item), so granting the
// first admin account requires setting isAdmin/role directly in MongoDB.
// This script does that for a single email address. Run scripts/seed-roles.js
// first if the 'admin' role doesn't exist yet.
//
// Usage: node scripts/grant-admin.js someone@example.com
const mongoose = require('mongoose');
const User = require('../models/user');

const connectionString = process.env.MONGODB_URI || 'mongodb://localhost/node-app';
const email = process.argv[2];

if (!email) {
    console.error('Usage: node scripts/grant-admin.js <email>');
    process.exit(1);
}

async function run() {
    await mongoose.connect(connectionString);
    const result = await User.updateOne({ email }, { $set: { isAdmin: true, role: 'admin' } });
    if (result.matchedCount === 0) {
        console.error(`No user found with email ${email}`);
    } else {
        console.log(`Granted admin to ${email}.`);
    }
    await mongoose.disconnect();
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
