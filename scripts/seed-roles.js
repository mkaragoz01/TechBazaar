// One-off setup for the role system (Faz H.2): creates the two built-in,
// non-deletable roles and backfills `role` on any existing user documents
// that predate this field (based on their current `isAdmin` value, so no
// admin silently loses their access). Safe to re-run — built-in roles are
// upserted by name, and backfill only touches users missing `role`.
//
// Usage: node scripts/seed-roles.js
const mongoose = require('mongoose');
const Role = require('../models/role');
const User = require('../models/user');

const connectionString = process.env.MONGODB_URI || 'mongodb://localhost/node-app';

const BUILT_IN_ROLES = [
    { name: 'admin', isAdminRole: true, protected: true },
    { name: 'customer', isAdminRole: false, protected: true }
];

async function run() {
    await mongoose.connect(connectionString);

    for (const role of BUILT_IN_ROLES) {
        await Role.updateOne({ name: role.name }, { $set: role }, { upsert: true });
        console.log(`Rol hazır: ${role.name}`);
    }

    const adminBackfill = await User.updateMany(
        { role: { $exists: false }, isAdmin: true },
        { $set: { role: 'admin' } }
    );
    const customerBackfill = await User.updateMany(
        { role: { $exists: false }, isAdmin: { $ne: true } },
        { $set: { role: 'customer' } }
    );
    console.log(`${adminBackfill.modifiedCount} kullanıcı 'admin' rolüne, ${customerBackfill.modifiedCount} kullanıcı 'customer' rolüne taşındı.`);

    await mongoose.disconnect();
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
