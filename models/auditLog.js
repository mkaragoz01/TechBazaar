const mongoose = require('mongoose')

// Deliberate admin actions (who did what, to what, before/after) — written
// explicitly by controllers/admin.js at the point of each action, not
// inferred from the route. Kept separate from ErrorLog (see models/errorLog.js):
// different shape, different volume, different write site, and the two are
// never queried together in one screen (the admin panel filters by one type
// at a time), so a shared discriminated schema would buy nothing.
const auditLogSchema = new mongoose.Schema({
    actor: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        name: String,
        email: String
    },
    action: {
        type: String,
        required: true
    },
    targetType: String,
    targetId: mongoose.Schema.Types.ObjectId,
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
}, { timestamps: true })

auditLogSchema.index({ createdAt: -1 })
auditLogSchema.index({ 'actor.id': 1 })

module.exports = mongoose.model('AuditLog', auditLogSchema)
