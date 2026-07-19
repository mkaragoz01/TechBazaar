const express = require("express")
const router = express.Router()

const adminController = require("../controllers/admin")
const productImportController = require("../controllers/productImport")
const apiIsAdmin = require("../middleware/apiIsAdmin")
const upload = require("../middleware/upload")
const uploadExcel = require("../middleware/uploadExcel")

router.get('/api/admin/products', apiIsAdmin, adminController.getProducts)
router.post('/api/admin/products', apiIsAdmin, upload.single('imgUrl'), adminController.postAddProduct)

// Must be registered before the /:productid route below, otherwise Express
// matches "export" as a productid and this never gets reached.
router.get('/api/admin/products/export', apiIsAdmin, productImportController.getExportProducts)
router.get('/api/admin/products/import/template', apiIsAdmin, productImportController.getImportTemplate)
router.post(
    '/api/admin/products/import/validate',
    apiIsAdmin,
    uploadExcel.single('file'),
    productImportController.handleUploadError,
    productImportController.postValidateImport
)
router.post(
    '/api/admin/products/import/confirm',
    apiIsAdmin,
    uploadExcel.single('file'),
    productImportController.handleUploadError,
    productImportController.postConfirmImport
)

router.get('/api/admin/products/:productid', apiIsAdmin, adminController.getProduct)
router.put('/api/admin/products/:productid', apiIsAdmin, upload.single('imgUrl'), adminController.putEditProduct)
router.delete('/api/admin/products/:productid', apiIsAdmin, adminController.deleteProduct)

router.get('/api/admin/categories', apiIsAdmin, adminController.getCategories)
router.post('/api/admin/categories', apiIsAdmin, adminController.postAddCategory)
router.get('/api/admin/categories/:categoryid', apiIsAdmin, adminController.getCategory)
router.put('/api/admin/categories/:categoryid', apiIsAdmin, adminController.putEditCategory)
router.delete('/api/admin/categories/:categoryid', apiIsAdmin, adminController.deleteCategory)

router.get('/api/admin/brands', apiIsAdmin, adminController.getBrands)
router.post('/api/admin/brands', apiIsAdmin, adminController.postAddBrand)
router.get('/api/admin/brands/:brandid', apiIsAdmin, adminController.getBrand)
router.put('/api/admin/brands/:brandid', apiIsAdmin, adminController.putEditBrand)
router.delete('/api/admin/brands/:brandid', apiIsAdmin, adminController.deleteBrand)

router.get('/api/admin/dashboard', apiIsAdmin, adminController.getDashboard)

router.get('/api/admin/orders', apiIsAdmin, adminController.getOrders)
router.put('/api/admin/orders/:orderid/status', apiIsAdmin, adminController.putOrderStatus)

module.exports = router;
