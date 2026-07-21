const express = require('express')
const router = express.Router()

const shopController = require("../controllers/shop")
const apiAuthentication = require("../middleware/apiAuthentication")
const validateObjectId = require("../middleware/validateObjectId")

router.get('/api/categories', shopController.getCategoriesJson);
router.get('/api/categories/:categoryid/attributes', validateObjectId('categoryid'), shopController.getCategoryAttributes);
router.get('/api/brands', shopController.getBrandsJson);

router.get('/api/home', shopController.getIndex);
router.get('/api/products', shopController.getProducts);
// Must be registered before the /:productid route below, otherwise Express
// matches "search-suggestions" as a productid and this never gets reached.
router.get('/api/products/search-suggestions', shopController.getProductSearchSuggestions);
router.get('/api/products/:productid', validateObjectId('productid'), shopController.getProduct);

router.get('/api/cart', apiAuthentication, shopController.getCart);
router.get('/api/cart/count', apiAuthentication, shopController.getCartCount);
router.post('/api/cart', apiAuthentication, shopController.postCart);
router.put('/api/cart/item', apiAuthentication, shopController.putCartItemQuantity);
router.post('/api/cart/delete-item', apiAuthentication, shopController.postCartItemDelete);
router.post('/api/cart/apply-code', apiAuthentication, shopController.postApplyCampaignCode);
router.post('/api/cart/remove-code', apiAuthentication, shopController.postRemoveCampaignCode);

router.get('/api/orders', apiAuthentication, shopController.getOrders);
router.post('/api/orders', apiAuthentication, shopController.postOrder);

router.get('/api/filter/newest', shopController.getNewestProducts);
router.get('/api/filter/favorites', shopController.getFavoriteProducts);
router.get('/api/filter/premium', shopController.getPremiumProducts);

module.exports = router
