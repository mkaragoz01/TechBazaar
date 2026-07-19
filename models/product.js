const mongoose = require('mongoose')

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Ürün adı zorunludur!'],
        minlength: [5, 'Ürün adı en az 5 karakter olmalıdır!'],
        maxlength: [255, 'Ürün adı en fazla 255 karakter olmalıdır!'],
    },
    price: {
        type: Number,
        required: [function() {
            return this.isActive;
        }, 'Fiyat alanı aktif ürünler için zorunludur.'],
        min: [0, 'Fiyat negatif olamaz.']
    },
    description: {
        type: String,
        minlength: [3,'Ürün açıklaması minimum 3 karakter içermelidir.']
    },
    imgUrl: String,
    stock: {
        type: Number,
        default: 0,
        min: [0, 'Stok negatif olamaz.']
    },
    sku: {
        type: String,
        trim: true,
        unique: true,
        sparse: true
    },
    isNewArrival: {
        type: Boolean,
        default: false
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        default: Date.now
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    isActive: Boolean,
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand"
    },
    categories: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Category"
            }
        ],
        // required:true on the array element only validates elements that
        // exist — it never rejected an empty array. Validating the array
        // itself is what actually enforces "at least one category."
        validate: {
            validator: (value) => Array.isArray(value) && value.length > 0,
            message: 'Ürün kategorisi girmek zorunludur!'
        }
    }
})

productSchema.index({ name: 'text', description: 'text' }, { default_language: 'turkish' })
productSchema.index({ categories: 1 })
productSchema.index({ userId: 1 })
productSchema.index({ isActive: 1 })
productSchema.index({ brand: 1 })
productSchema.index({ isNewArrival: 1 })
productSchema.index({ isFeatured: 1 })

module.exports = mongoose.model('Product', productSchema)