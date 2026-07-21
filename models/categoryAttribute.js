const mongoose = require('mongoose')

// Admin-defined, category-scoped product attributes (e.g. "RAM", "Renk").
// One schema serves two roles, distinguished purely by `isVariantAxis`:
// a plain filterable spec (RAM: "8GB"/"16GB" shown as storefront checkbox
// filters) or a real purchasable variant dimension (Renk/Depolama — each
// combination of variant-axis values becomes its own ProductVariant with
// its own stock/sku/price). The admin decides per attribute; nothing here
// special-cases specific attribute names.
const categoryAttributeSchema = new mongoose.Schema({
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Özellik adı zorunludur.'],
        trim: true,
        minlength: [2, 'Özellik adı en az 2 karakter olmalıdır.'],
        maxlength: [60, 'Özellik adı en fazla 60 karakter olabilir.']
    },
    // 'select': admin tanımlı sabit seçenek listesi (checkbox filtre ve/veya
    // varyant ekseni olabilir). 'text': serbest, ürüne özel değer — sadece
    // bilgi amaçlı, filtrelenemez/varyant ekseni olamaz (aşağıdaki
    // validator'larla zorlanıyor).
    valueType: {
        type: String,
        enum: ['select', 'text'],
        default: 'select',
        required: true
    },
    options: {
        type: [String],
        validate: {
            validator: function (value) {
                return this.valueType !== 'select' || (Array.isArray(value) && value.length > 0);
            },
            message: 'Seçmeli özellikler için en az bir seçenek girmelisiniz.'
        }
    },
    // Opsiyonel, kozmetik gösterim son eki (örn. "GB", "inç") — filtrelemeyi
    // etkilemez, sadece görüntülemede kullanılır.
    unit: {
        type: String,
        trim: true
    },
    isVariantAxis: {
        type: Boolean,
        default: false,
        validate: {
            validator: function (value) {
                return !(value && this.valueType !== 'select');
            },
            message: 'Serbest metin özellikler varyant ekseni olamaz.'
        }
    },
    isFilterable: {
        type: Boolean,
        default: true,
        validate: {
            validator: function (value) {
                return !(value && this.valueType !== 'select');
            },
            message: 'Serbest metin özellikler filtrelenemez.'
        }
    },
    sortOrder: {
        type: Number,
        default: 0
    }
}, { timestamps: true })

categoryAttributeSchema.index({ category: 1 })
categoryAttributeSchema.index({ category: 1, name: 1 }, { unique: true })

module.exports = mongoose.model('CategoryAttribute', categoryAttributeSchema)
