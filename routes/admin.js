const express = require("express")
const router = express.Router()

const adminController = require("../controllers/admin")
const apiIsAdmin = require("../middleware/apiIsAdmin")
const upload = require("../middleware/upload")

router.get('/api/admin/products', apiIsAdmin, adminController.getProducts)
router.post('/api/admin/products', apiIsAdmin, upload.single('imgUrl'), adminController.postAddProduct)
router.get('/api/admin/products/:productid', apiIsAdmin, adminController.getProduct)
router.put('/api/admin/products/:productid', apiIsAdmin, upload.single('imgUrl'), adminController.putEditProduct)
router.delete('/api/admin/products/:productid', apiIsAdmin, adminController.deleteProduct)

router.get('/api/admin/categories', apiIsAdmin, adminController.getCategories)
router.post('/api/admin/categories', apiIsAdmin, adminController.postAddCategory)
router.get('/api/admin/categories/:categoryid', apiIsAdmin, adminController.getCategory)
router.put('/api/admin/categories/:categoryid', apiIsAdmin, adminController.putEditCategory)
router.delete('/api/admin/categories/:categoryid', apiIsAdmin, adminController.deleteCategory)

router.get('/api/admin/dashboard', apiIsAdmin, adminController.getDashboard)

module.exports = router;
