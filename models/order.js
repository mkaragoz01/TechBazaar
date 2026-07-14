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

const orderSchema = new mongoose.Schema({
    user:{
        userId: {
        type: mongoose.Types.ObjectId,
        require: true,
        ref: 'User'
        },
        name: {
            type: String,
            require: true
        },
        email: {
            type: String,
            require: true
        }
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered'],
        default: 'pending'
    },
    items: [
        {
            product: {
                type: orderItemProductSchema,
                require: true
            },
            quantity: {
                type: Number,
                require: true
            },
            date: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, { timestamps: true })

module.exports = mongoose.model('Order',orderSchema)