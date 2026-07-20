const mongoose = require('mongoose')

// MVP scope (see PROJECT_ANALYSIS.md Faz D madde 11/11a): a single implicit
// AND group — every condition must match for the campaign to apply. The
// OR-of-ANDs layer (multiple condition groups) and the productName/contains
// condition type are deliberately deferred to a follow-up pass, per the
// documented phased rollout.
const conditionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['product', 'user', 'cartTotal'],
        required: true
    },
    // Only meaningful for type: 'product'.
    field: {
        type: String,
        enum: ['sku', 'category', 'brand']
    },
    operator: {
        type: String,
        enum: ['in', 'gte', 'lte'],
        required: true
    },
    // 'in' operator (product sku/category/brand values, or user ids/emails).
    values: [String],
    // gte/lte operator (cartTotal, in kuruş).
    value: Number
}, { _id: false })

const campaignSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Kampanya adı zorunludur.'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    // Optional: when set, the campaign only applies if the customer enters
    // this code at checkout. When absent, it applies automatically to every
    // cart whose conditions match.
    code: {
        type: String,
        trim: true,
        uppercase: true,
        unique: true,
        sparse: true
    },
    conditions: {
        type: [conditionSchema],
        validate: {
            validator: (value) => Array.isArray(value) && value.length > 0,
            message: 'En az bir koşul girmelisiniz.'
        }
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true,
        min: [0, 'İndirim değeri negatif olamaz.']
    },
    // 'matchingItems': indirim yalnızca koşulları tetikleyen ürünlere uygulanır.
    // 'cartTotal': indirim sepetin toplamına uygulanır (ürün bağımsız).
    appliesTo: {
        type: String,
        enum: ['matchingItems', 'cartTotal'],
        required: true,
        default: 'cartTotal'
    },
    startDate: Date,
    endDate: {
        type: Date,
        validate: {
            // Nothing previously stopped saving an impossible range (end
            // before start) — the campaign would then silently never match,
            // with no error to explain why.
            validator: function (value) {
                if (!value || !this.startDate) return true;
                return value >= this.startDate;
            },
            message: 'Bitiş tarihi başlangıç tarihinden önce olamaz.'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true })

campaignSchema.index({ isActive: 1 })

module.exports = mongoose.model('Campaign', campaignSchema)
