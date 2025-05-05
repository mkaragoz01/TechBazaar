const mongoose = require('mongoose')

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255
    },
    price: {
        type: String,
        required: function() {
            return this.isActive;
        },
        min: 0,
        max: 100000
    },
    description: {
        String,
        minlength: 5
    },
    imgUrl: String,
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
    categories: [
            {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: false
            }
        ]
})

module.exports = mongoose.model('Product', productSchema)