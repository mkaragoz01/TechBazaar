const mongoose = require('mongoose')

// One document per purchasable combination of a product's variant-axis
// attributes (e.g. Renk=Kırmızı × Depolama=128GB). Purely additive — a
// product with no variants (the vast majority of the catalog) never
// touches this collection; `Product.hasVariants` stays false and
// `Product.stock`/`price`/`sku` remain authoritative.
const productVariantSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    sku: {
        type: String,
        trim: true,
        unique: true,
        sparse: true
    },
    attributes: {
        type: [
            {
                attribute: { type: mongoose.Schema.Types.ObjectId, ref: 'CategoryAttribute', required: true },
                value: { type: String, required: true }
            }
        ],
        validate: {
            validator: (value) => Array.isArray(value) && value.length > 0,
            message: 'Varyant en az bir özellik içermelidir.'
        },
        _id: false
    },
    // Mutlak kuruş — bir fark (delta) değil. Projenin price alanı zaten her
    // yerde mutlak değer; delta kendi işaret/yuvarlama kuralını gerektirir,
    // bunun için bir emsal yok. Boşsa üst ürünün fiyatına düşer.
    priceOverride: {
        type: Number,
        min: [0, 'Fiyat negatif olamaz.']
    },
    stock: {
        type: Number,
        default: 0,
        min: [0, 'Stok negatif olamaz.']
    },
    // Boşsa üst ürünün görseline düşer.
    imgUrl: String,
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true })

productVariantSchema.index({ product: 1 })

module.exports = mongoose.model('ProductVariant', productVariantSchema)
