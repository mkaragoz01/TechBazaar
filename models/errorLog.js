const mongoose = require('mongoose')

// Written from the single global error handler in app.js — the one choke
// point every unhandled request error already passes through. See
// models/auditLog.js for why this is a separate model rather than a shared
// discriminator with it.
const errorLogSchema = new mongoose.Schema({
    message: String,
    stack: String,
    method: String,
    path: String,
    statusCode: Number,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true })

errorLogSchema.index({ createdAt: -1 })

module.exports = mongoose.model('ErrorLog', errorLogSchema)
