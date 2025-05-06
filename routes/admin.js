const express = require("express")
const router = express.Router()

const adminController = require("../controllers/admin")
const isAdmin = require("../middleware/isAdmin")
const locals = require("../middleware/locals")

router.get('/add-product', locals, isAdmin, adminController.getAddProducts)
router.post('/add-product',isAdmin, locals, adminController.postAddProducts)
router.get('/products/:productid',isAdmin, locals, adminController.getEditProducts)
router.post('/products',isAdmin, locals, adminController.postEditProducts)
router.post('/delete-product',isAdmin, locals, adminController.postDeleteProduct)
router.get('/products',isAdmin, locals, adminController.getProducts)

router.get('/add-category',isAdmin, locals, adminController.getAddCategory)
router.post('/add-category',isAdmin, locals, adminController.postAddCategory)
router.get('/categories',isAdmin, locals, adminController.getCategories)
router.get('/categories/:categoryid',isAdmin, locals, adminController.getEditCategory)
router.post('/categories',isAdmin, locals, adminController.postEditCategory)
router.post('/delete-category',isAdmin, locals, adminController.postDeleteCategory)


module.exports = router;