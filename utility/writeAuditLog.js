const AuditLog = require('../models/auditLog')

// Called explicitly at the end of an admin mutation controller — never let a
// logging failure break the actual admin action that already succeeded.
async function writeAuditLog({ actor, action, targetType, targetId, before, after }) {
    try {
        await AuditLog.create({
            actor: { id: actor._id, name: actor.name, email: actor.email },
            action,
            targetType,
            targetId,
            before,
            after
        });
    } catch (err) {
        console.error('Audit log yazılamadı:', err);
    }
}

module.exports = writeAuditLog
