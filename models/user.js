const mongoose = require("mongoose");
const Product = require("./product");
const ProductVariant = require("./productVariant");
const {isEmail} = require("validator");

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
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
    // Kept in sync with the assigned Role's `isAdminRole` (see
    // controllers/admin.js's user-role update) — every admin gate still
    // only ever checks this one boolean, `role` just carries the richer
    // named-segment meaning (see models/role.js).
    role: {
        type: String,
        default: 'customer'
    },
    cart: {
        items:[
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true
                },
                // Absent for a non-variant product. A cart line is keyed by
                // BOTH fields together — "Kırmızı/128GB" and "Mavi/128GB"
                // are different lines even though productId is the same.
                variantId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "ProductVariant"
                },
                quantity: {
                    type: Number,
                    required: true
                }
            }
        ]
    }

}, { timestamps: true })

function sameOptionalId(a, b) {
    const aStr = a ? a.toString() : null;
    const bStr = b ? b.toString() : null;
    return aStr === bStr;
}

function findCartItemIndex(items, productId, variantId) {
    return items.findIndex(cp =>
        cp.productId.toString() === productId.toString() && sameOptionalId(cp.variantId, variantId)
    );
}

userSchema.methods.addToCart = function(product, addQuantity = 1, variantId = undefined) {
    const index = findCartItemIndex(this.cart.items, product._id, variantId);

    const updatedCartItems = [...this.cart.items]

    let itemQuantity = addQuantity;


    if(index >= 0){
        itemQuantity = this.cart.items[index].quantity + addQuantity;
        updatedCartItems[index].quantity = itemQuantity;
    }
    else{
        updatedCartItems.push({
            productId: product._id,
            variantId,
            quantity: itemQuantity
        })
    }

    this.cart = {
        items: updatedCartItems
    }

    return this.save()
}

// Sets (not increments) a cart line's quantity — used by the +/- stepper
// and the manual number input on the cart page. quantity<=0 removes the
// line, matching deleteCartItem's own behavior for consistency.
userSchema.methods.setCartItemQuantity = function(productId, quantity, variantId = undefined) {
    if (quantity <= 0) {
        return this.deleteCartItem(productId, variantId);
    }

    const index = findCartItemIndex(this.cart.items, productId, variantId);
    if (index < 0) {
        return this.save();
    }

    this.cart.items[index].quantity = quantity;
    return this.save();
}

userSchema.methods.getCart = function() {
    const productIds = this.cart.items.map(i => i.productId);
    const variantIds = this.cart.items.filter(i => i.variantId).map(i => i.variantId);

    return Promise.all([
        Product.find({ _id: { $in: productIds } })
            .select("name price imgUrl sku categories brand stock hasVariants")
            .lean(),
        variantIds.length > 0
            ? ProductVariant.find({ _id: { $in: variantIds } })
                .populate('attributes.attribute')
                .lean()
            : Promise.resolve([])
    ]).then(([products, variants]) => {
        // Sepetteki geçersiz ürünleri temizle (silinmiş ürün, veya artık var
        // olmayan varyant).
        const validProductIds = products.map(p => p._id.toString());
        const validVariantIds = variants.map(v => v._id.toString());
        const hasInvalidItems = this.cart.items.some(item =>
            !validProductIds.includes(item.productId.toString()) ||
            (item.variantId && !validVariantIds.includes(item.variantId.toString()))
        );

        if (hasInvalidItems) {
            this.cart.items = this.cart.items.filter(item =>
                validProductIds.includes(item.productId.toString()) &&
                (!item.variantId || validVariantIds.includes(item.variantId.toString()))
            );
            return this.save().then(() => ({ products, variants }));
        }

        return { products, variants };
    }).then(({ products, variants }) => {
        const variantsById = new Map(variants.map(v => [v._id.toString(), v]));

        return this.cart.items.map(item => {
            const product = products.find(p => p._id.toString() === item.productId.toString());
            const variant = item.variantId ? variantsById.get(item.variantId.toString()) : undefined;

            const variantLabel = variant
                ? variant.attributes.map(a => `${a.attribute.name}: ${a.value}`).join(', ')
                : undefined;

            return {
                _id: product._id,
                variantId: variant ? variant._id : undefined,
                variantLabel,
                imgUrl: variant?.imgUrl ?? product.imgUrl,
                name: product.name,
                price: variant?.priceOverride ?? product.price,
                sku: variant?.sku ?? product.sku,
                categories: product.categories,
                brand: product.brand,
                stock: variant ? variant.stock : product.stock,
                quantity: item.quantity
            };
        });
    });
}

userSchema.methods.deleteCartItem = function(productid, variantId = undefined){
    this.cart.items = this.cart.items.filter(item =>
        !(item.productId.toString() === productid.toString() && sameOptionalId(item.variantId, variantId))
    );
    return this.save();
}

userSchema.methods.clearCart = function(){
    this.cart = { items: [] };
    return this.save()
}
module.exports = mongoose.model('User',userSchema);
