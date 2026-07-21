const express = require("express")
const router = express.Router()

const adminController = require("../controllers/admin")
const productImportController = require("../controllers/productImport")
const logsController = require("../controllers/logs")
const categoryAttributesController = require("../controllers/categoryAttributes")
const productVariantsController = require("../controllers/productVariants")
const apiIsAdmin = require("../middleware/apiIsAdmin")
const upload = require("../middleware/upload")
const uploadExcel = require("../middleware/uploadExcel")
const validateObjectId = require("../middleware/validateObjectId")
const handleUploadError = require("../middleware/handleUploadError")

router.get('/api/admin/products', apiIsAdmin, adminController.getProducts)
router.post('/api/admin/products', apiIsAdmin, upload.single('imgUrl'), handleUploadError, adminController.postAddProduct)

// Must be registered before the /:productid route below, otherwise Express
// matches "export" as a productid and this never gets reached.
router.get('/api/admin/products/export', apiIsAdmin, productImportController.getExportProducts)
router.get('/api/admin/products/import/template', apiIsAdmin, productImportController.getImportTemplate)
router.post(
    '/api/admin/products/import/validate',
    apiIsAdmin,
    uploadExcel.single('file'),
    handleUploadError,
    productImportController.postValidateImport
)
router.post(
    '/api/admin/products/import/confirm',
    apiIsAdmin,
    uploadExcel.single('file'),
    handleUploadError,
    productImportController.postConfirmImport
)

router.get('/api/admin/products/:productid', apiIsAdmin, validateObjectId('productid'), adminController.getProduct)
router.put('/api/admin/products/:productid', apiIsAdmin, validateObjectId('productid'), upload.single('imgUrl'), handleUploadError, adminController.putEditProduct)
router.delete('/api/admin/products/:productid', apiIsAdmin, validateObjectId('productid'), adminController.deleteProduct)

router.get('/api/admin/products/:productid/variants', apiIsAdmin, validateObjectId('productid'), productVariantsController.getProductVariants)
router.post(
    '/api/admin/products/:productid/variants',
    apiIsAdmin,
    validateObjectId('productid'),
    upload.single('imgUrl'),
    handleUploadError,
    productVariantsController.postAddProductVariant
)
router.put(
    '/api/admin/products/:productid/variants/:variantid',
    apiIsAdmin,
    validateObjectId('productid'),
    validateObjectId('variantid'),
    upload.single('imgUrl'),
    handleUploadError,
    productVariantsController.putEditProductVariant
)
router.delete(
    '/api/admin/products/:productid/variants/:variantid',
    apiIsAdmin,
    validateObjectId('productid'),
    validateObjectId('variantid'),
    productVariantsController.deleteProductVariant
)

router.get('/api/admin/categories', apiIsAdmin, adminController.getCategories)
router.post('/api/admin/categories', apiIsAdmin, adminController.postAddCategory)
router.get('/api/admin/categories/:categoryid', apiIsAdmin, validateObjectId('categoryid'), adminController.getCategory)
router.put('/api/admin/categories/:categoryid', apiIsAdmin, validateObjectId('categoryid'), adminController.putEditCategory)
router.delete('/api/admin/categories/:categoryid', apiIsAdmin, validateObjectId('categoryid'), adminController.deleteCategory)

router.get('/api/admin/category-attributes', apiIsAdmin, categoryAttributesController.getCategoryAttributes)
router.post('/api/admin/category-attributes', apiIsAdmin, categoryAttributesController.postAddCategoryAttribute)
router.get('/api/admin/category-attributes/:attributeid', apiIsAdmin, validateObjectId('attributeid'), categoryAttributesController.getCategoryAttribute)
router.put('/api/admin/category-attributes/:attributeid', apiIsAdmin, validateObjectId('attributeid'), categoryAttributesController.putEditCategoryAttribute)
router.delete('/api/admin/category-attributes/:attributeid', apiIsAdmin, validateObjectId('attributeid'), categoryAttributesController.deleteCategoryAttribute)

router.get('/api/admin/brands', apiIsAdmin, adminController.getBrands)
router.post('/api/admin/brands', apiIsAdmin, adminController.postAddBrand)
router.get('/api/admin/brands/:brandid', apiIsAdmin, validateObjectId('brandid'), adminController.getBrand)
router.put('/api/admin/brands/:brandid', apiIsAdmin, validateObjectId('brandid'), adminController.putEditBrand)
router.delete('/api/admin/brands/:brandid', apiIsAdmin, validateObjectId('brandid'), adminController.deleteBrand)

router.get('/api/admin/dashboard', apiIsAdmin, adminController.getDashboard)

router.get('/api/admin/orders', apiIsAdmin, adminController.getOrders)
router.put('/api/admin/orders/:orderid/status', apiIsAdmin, validateObjectId('orderid'), adminController.putOrderStatus)

router.get('/api/admin/campaigns', apiIsAdmin, adminController.getCampaigns)
router.post('/api/admin/campaigns', apiIsAdmin, adminController.postAddCampaign)
router.get('/api/admin/campaigns/:campaignid', apiIsAdmin, validateObjectId('campaignid'), adminController.getCampaign)
router.put('/api/admin/campaigns/:campaignid', apiIsAdmin, validateObjectId('campaignid'), adminController.putEditCampaign)
router.delete('/api/admin/campaigns/:campaignid', apiIsAdmin, validateObjectId('campaignid'), adminController.deleteCampaign)

router.get('/api/admin/users', apiIsAdmin, adminController.getUsers)
router.get('/api/admin/users/export', apiIsAdmin, adminController.getUsersExport)
router.put('/api/admin/users/:userid/role', apiIsAdmin, validateObjectId('userid'), adminController.putUpdateUserRole)
router.delete('/api/admin/users/:userid', apiIsAdmin, validateObjectId('userid'), adminController.deleteUser)

router.get('/api/admin/roles', apiIsAdmin, adminController.getRoles)
router.post('/api/admin/roles', apiIsAdmin, adminController.postAddRole)
router.get('/api/admin/roles/:roleid', apiIsAdmin, validateObjectId('roleid'), adminController.getRole)
router.put('/api/admin/roles/:roleid', apiIsAdmin, validateObjectId('roleid'), adminController.putEditRole)
router.delete('/api/admin/roles/:roleid', apiIsAdmin, validateObjectId('roleid'), adminController.deleteRole)

// Must be registered before a future /:logid route (none exists yet, but
// keeping the convention consistent with products/export above).
router.get('/api/admin/logs/export', apiIsAdmin, logsController.getLogsExport)
router.get('/api/admin/logs', apiIsAdmin, logsController.getLogs)

module.exports = router;
