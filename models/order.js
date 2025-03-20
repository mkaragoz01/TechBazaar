const mongoose = require('mongoose')

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
    items: [
        {
            product: {
                type: Object,
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
})

module.exports = mongoose.model('Order',orderSchema)