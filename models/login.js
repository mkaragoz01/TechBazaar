const mongoose = require("mongoose");
const {isEmail} = require("validator");

const loginSchema = mongoose.Schema({

    email: {
        type: String,
        validate: [isEmail,"Lütfen geçerli bir email adresi giriniz!"]
    },
    password: {
        type: String,
        required: [true, 'Lütfen şifre giriniz!']
    }
})

module.exports = mongoose.model('Login',loginSchema);
