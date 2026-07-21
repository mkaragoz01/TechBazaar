const mongoose = require('mongoose')

// A lightweight, admin-manageable catalog of named roles (e.g. "admin",
// "customer", or a later marketing segment like "vip") — not a permissions
// matrix. `User.role` stores the role's `name` directly (not an ObjectId
// ref): roles here are expected to be rare/stable, and every admin-gate
// check only ever needs `isAdminRole`, so a populate on every request would
// buy nothing. `admin`/`customer` are seeded once (see
// scripts/seed-roles.js) and marked `protected` so they can't be deleted or
// renamed away from the system.
const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Rol adı zorunludur.'],
        unique: true,
        trim: true
    },
    isAdminRole: {
        type: Boolean,
        default: false
    },
    protected: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

module.exports = mongoose.model('Role', roleSchema)
