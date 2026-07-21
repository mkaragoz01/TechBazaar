const mongoose = require('mongoose')

const orderItemProductSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    imgUrl: String
})

// A denormalized snapshot — same reasoning as orderItemProductSchema above:
// order history must stay accurate even if the variant is later edited or
// deleted.
const orderItemVariantSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant'
    },
    sku: String,
    label: String // e.g. "Renk: Kırmızı, Depolama: 128GB"
}, { _id: false })

const orderSchema = new mongoose.Schema({
    user:{
        userId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'User'
        },
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        }
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered'],
        default: 'pending'
    },
    shippingAddress: {
        title: String,
        fullName: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        district: {
            type: String,
            required: true
        },
        addressLine: {
            type: String,
            required: true
        },
        postalCode: String
    },
    paymentDisplay: {
        type: String,
        required: true
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    campaignName: String,
    items: [
        {
            product: {
                type: orderItemProductSchema,
                required: true
            },
            variant: orderItemVariantSchema,
            quantity: {
                type: Number,
                required: true
            },
            date: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, { timestamps: true })

module.exports = mongoose.model('Order',orderSchema)