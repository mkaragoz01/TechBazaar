const express = require("express")
const router = express.Router()

const adminController = require("../controllers/admin")

router.get('/add-product',adminController.getAddProducts)
router.post('/add-product',adminController.postAddProducts)

router.get('/products/:productid',adminController.getEditProducts)
router.post('/products',adminController.postEditProducts)

router.post('/delete-product',adminController.postDeleteProduct)

router.get('/products',adminController.getProducts)

router.get('/add-category',adminController.getAddCategory)
router.post('/add-category',adminController.postAddCategory)

router.get('/categories',adminController.getCategories)

router.get('/categories/:categoryid',adminController.getEditCategory)
router.post('/categories',adminController.postEditCategory)


module.exports = router;