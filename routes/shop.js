const express = require('express')
const router = express.Router()

const shopController = require("../controllers/shop")
const apiAuthentication = require("../middleware/apiAuthentication")

router.get('/api/categories', shopController.getCategoriesJson);
router.get('/api/brands', shopController.getBrandsJson);

router.get('/api/home', shopController.getIndex);
router.get('/api/products', shopController.getProducts);
router.get('/api/products/:productid', shopController.getProduct);

router.get('/api/cart', apiAuthentication, shopController.getCart);
router.post('/api/cart', apiAuthentication, shopController.postCart);
router.post('/api/cart/delete-item', apiAuthentication, shopController.postCartItemDelete);

router.get('/api/orders', apiAuthentication, shopController.getOrders);
router.post('/api/orders', apiAuthentication, shopController.postOrder);

router.get('/api/filter/newest', shopController.getNewestProducts);
router.get('/api/filter/favorites', shopController.getFavoriteProducts);
router.get('/api/filter/premium', shopController.getPremiumProducts);

module.exports = router
