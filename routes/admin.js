const express = require("express")
const router = express.Router()

const isAuthenticated = require("../middleware/authentication")
const csrf = require("../middleware/csrf")
const adminController = require("../controllers/admin")

router.get('/add-product', csrf, isAuthenticated, adminController.getAddProducts)
router.post('/add-product',isAuthenticated, csrf, adminController.postAddProducts)
router.get('/products/:productid',isAuthenticated, csrf, adminController.getEditProducts)
router.post('/products',isAuthenticated, csrf, adminController.postEditProducts)
router.post('/delete-product',isAuthenticated, csrf, adminController.postDeleteProduct)
router.get('/products',isAuthenticated, csrf, adminController.getProducts)

router.get('/add-category',isAuthenticated, csrf, adminController.getAddCategory)
router.post('/add-category',isAuthenticated, csrf, adminController.postAddCategory)
router.get('/categories',isAuthenticated, csrf, adminController.getCategories)
router.get('/categories/:categoryid',isAuthenticated, csrf, adminController.getEditCategory)
router.post('/categories',isAuthenticated, csrf, adminController.postEditCategory)
router.post('/delete-category',isAuthenticated, csrf, adminController.postDeleteCategory)


module.exports = router;