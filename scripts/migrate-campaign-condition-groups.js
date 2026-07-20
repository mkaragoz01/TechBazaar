// One-off migration for the Faz D madde 11a "second pass": campaigns saved
// before this change have a flat `conditions` array (single implicit AND
// group). This script normalizes them to the current `conditionGroups`
// shape (`[{ conditions }]`) and removes the stale `conditions` field.
//
// Not required for correctness — utility/evaluateCampaign.js already treats
// a legacy `conditions` array as a single-group campaign at read time — but
// this cleans up the DB so every document matches the current schema and
// the admin UI's edit form works uniformly. Safe to re-run: documents that
// already have `conditionGroups` are left untouched.
//
// Usage: node scripts/migrate-campaign-condition-groups.js
const mongoose = require('mongoose');

const connectionString = process.env.MONGODB_URI || 'mongodb://localhost/node-app';

async function migrate() {
    await mongoose.connect(connectionString);
    const db = mongoose.connection.db;
    const collection = db.collection('campaigns');

    const legacyDocs = await collection.find({
        conditionGroups: { $exists: false },
        conditions: { $exists: true }
    }).toArray();

    console.log(`Found ${legacyDocs.length} campaign(s) with a legacy flat 'conditions' field.`);

    for (const doc of legacyDocs) {
        await collection.updateOne(
            { _id: doc._id },
            {
                $set: { conditionGroups: [{ conditions: doc.conditions }] },
                $unset: { conditions: '' }
            }
        );
        console.log(`Migrated "${doc.name}" (${doc._id})`);
    }

    console.log('Done.');
    await mongoose.disconnect();
}

migrate().catch((err) => {
    console.error(err);
    process.exit(1);
});
