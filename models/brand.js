const mongoose = require("mongoose")

const brandSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: String
})

module.exports = mongoose.model("Brand", brandSchema);
