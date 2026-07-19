const mongoose = require("mongoose")

// Representative/mock payment methods only — the full card number and CVV
// are never persisted (see controllers/checkout.js), only the cardholder
// name, brand, last 4 digits and expiry, purely for display purposes.
const paymentMethodSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    cardHolderName: {
        type: String,
        required: true,
        trim: true
    },
    last4: {
        type: String,
        required: true,
        match: /^\d{4}$/
    },
    brand: {
        type: String,
        enum: ["Visa", "Mastercard", "Diğer"],
        default: "Diğer"
    },
    expiryMonth: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    expiryYear: {
        type: Number,
        required: true
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

paymentMethodSchema.index({ userId: 1 })

module.exports = mongoose.model("PaymentMethod", paymentMethodSchema)
