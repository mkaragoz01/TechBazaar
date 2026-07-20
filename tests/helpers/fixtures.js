const bcrypt = require('bcrypt');
const User = require('../../models/user');
const Category = require('../../models/category');
const Brand = require('../../models/brand');
const Product = require('../../models/product');

async function createUser({
    email = 'user@example.com',
    password = 'testpass123',
    name = 'Test User',
    isAdmin = false
} = {}) {
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, isAdmin, cart: { items: [] } });
    return { user, password };
}

function createCategory(name = 'Telefon') {
    return Category.create({ name });
}

function createBrand(name = 'TestMarka') {
    return Brand.create({ name });
}

function createProduct({
    name = 'Test Ürünü Adı',
    price = 10000,
    stock = 5,
    categories = [],
    userId,
    isActive = true,
    sku
} = {}) {
    return Product.create({
        name,
        price,
        stock,
        categories,
        userId,
        isActive,
        sku,
        description: 'Test açıklaması yeterli uzunlukta.'
    });
}

// Every mutating request needs this header (see middleware/requireApiClient.js).
const xhr = { 'X-Requested-With': 'XMLHttpRequest' };

module.exports = { createUser, createCategory, createBrand, createProduct, xhr };
