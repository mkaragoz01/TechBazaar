const mongoose = require("mongoose");
const Product = require("./product");
const {isEmail} = require("validator");

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        validate: [isEmail,"Lütfen geçerli bir email adresi giriniz!"]
    },
    password: {
        type: String,
        required: true
    },
    resetToken: String,
    resetTokenExpiration: Date,
    isAdmin:{
        type: Boolean,
        default: false
    },
    cart: {
        items:[
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true
                }
            }
        ]
    }

})

userSchema.methods.addToCart = function(product) {
    const index = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString()
    })

    const updatedCartItems = [...this.cart.items]

    let itemQuantity = 1;
    
    
    if(index >= 0){
        itemQuantity = this.cart.items[index].quantity + 1;
        updatedCartItems[index].quantity = itemQuantity;
    }
    else{
        updatedCartItems.push({
            productId: product._id,
            quantity: itemQuantity
        })
    }

    this.cart = {
        items: updatedCartItems
    }

    return this.save()
}

userSchema.methods.getCart = function() {
    const ids = this.cart.items.map(i => i.productId);

    return Product
        .find({
            _id: {
                $in: ids
            }
        })
        .select("name price imgUrl")
        .then(products => {
            // Sepetteki geçersiz ürünleri temizle
            const validProductIds = products.map(p => p._id.toString());
            const hasInvalidItems = this.cart.items.some(item => 
                !validProductIds.includes(item.productId.toString())
            );

            if (hasInvalidItems) {
                this.cart.items = this.cart.items.filter(item =>
                    validProductIds.includes(item.productId.toString())
                );
                return this.save().then(() => products);
            }

            return products;
        })
        .then(products => {
            return products.map(p => {
                return {
                    _id: p._id,
                    imgUrl: p.imgUrl,
                    name: p.name,
                    price: p.price,
                    quantity: this.cart.items.find(i => {
                        return i.productId.toString() === p._id.toString()
                    }).quantity
                }
            })
        });
}

userSchema.methods.deleteCartItem = function(productid){
    const cartItems = this.cart.items.filter(item => {
        return item.productId.toString() !== productid.toString()
    })
    this.cart.items = cartItems;
    return this.save();
}

userSchema.methods.clearCart = function(){
    this.cart = { items: [] };
    return this.save()
}
module.exports = mongoose.model('User',userSchema);
