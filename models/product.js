const mongoose = require('mongoose')

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Ürün adı zorunludur!'],
        minlength: [5, 'Ürün adı en az 5 karakter olmalıdır!'],
        maxlength: [255, 'Ürün adı en fazla 255 karakter olmalıdır!'],
    },
    price: {
        type: String,
        required: function() {
            return this.isActive;
        }
    },
    description: {
        type: String,
        minlength: [3,'Ürün açıklaması minimum 3 karakter içermelidir.']
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
    // tags: {
    //     type: Array,
    //     validate: {
    //         validator: function(v) {
    //             return v && v.length > 0;
    //         },
    //         message: 'Ürün en az bir etiket içermelidir!'
    //     }
    // },
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