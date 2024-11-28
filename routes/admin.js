const express = require("express")
const router = express.Router()

const adminController = require("../controllers/admin")

router.get('/add-product',adminController.getAddProducts)
router.post('/add-product',adminController.postAddProducts)

router.get('/products/:productid',adminController.getEditProducts)
router.post('/products',adminController.postEditProducts)

router.post('/delete-product',adminController.postDeleteProduct)

router.get('/products',adminController.getProducts)



// hem get hem post için farklı işlemler yapabilirsin.
// post ve get usenin alternatifidir.
module.exports = router;