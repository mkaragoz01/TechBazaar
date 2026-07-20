const mongoose = require('mongoose')

// Second pass (see PROJECT_ANALYSIS.md Faz D madde 11/11a): conditions are
// grouped as OR-of-ANDs — a campaign applies if ANY conditionGroup matches,
// and a group matches only if ALL of its conditions match. This is the same
// disjunctive-normal-form pattern real coupon systems (e.g. WooCommerce)
// use: any boolean expression can be written this way, while the admin UI
// stays a flat two-level list ("add group" + "add condition inside a
// group") instead of an arbitrary rule tree.
const conditionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['product', 'productName', 'user', 'cartTotal'],
        required: true
    },
    // Only meaningful for type: 'product'.
    field: {
        type: String,
        enum: ['sku', 'category', 'brand']
    },
    operator: {
        type: String,
        enum: ['in', 'gte', 'lte', 'contains'],
        required: true
    },
    // 'in' operator (product sku/category/brand values, or user ids/emails).
    values: [String],
    // gte/lte operator (cartTotal, in kuruş).
    value: Number,
    // 'contains' operator (productName — matches against the product name).
    text: String
}, { _id: false })

const conditionGroupSchema = new mongoose.Schema({
    conditions: {
        type: [conditionSchema],
        validate: {
            validator: (value) => Array.isArray(value) && value.length > 0,
            message: 'Her grupta en az bir koşul olmalıdır.'
        }
    }
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
    // Gruplardan HERHANGİ BİRİ tamamen sağlanırsa kampanya uygulanır (VEYA);
    // bir grubun İÇİNDEKİ tüm koşullar sağlanmalıdır (VE). Bu alandan önceki
    // sürümde düz bir `conditions` dizisi vardı (tek örtük VE grubu);
    // `utility/evaluateCampaign.js` eski belgeleri okurken bunu tek elemanlı
    // bir grup gibi ele alarak geriye uyumluluğu koruyor.
    conditionGroups: {
        type: [conditionGroupSchema],
        validate: {
            validator: (value) => Array.isArray(value) && value.length > 0,
            message: 'En az bir koşul grubu girmelisiniz.'
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
