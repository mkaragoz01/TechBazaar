const express = require("express")
const router = express.Router()

const checkoutController = require("../controllers/checkout")
const apiAuthentication = require("../middleware/apiAuthentication")

router.get('/api/addresses', apiAuthentication, checkoutController.getAddresses)
router.post('/api/addresses', apiAuthentication, checkoutController.postAddress)
router.delete('/api/addresses/:addressid', apiAuthentication, checkoutController.deleteAddress)

router.get('/api/payment-methods', apiAuthentication, checkoutController.getPaymentMethods)
router.post('/api/payment-methods', apiAuthentication, checkoutController.postPaymentMethod)
router.delete('/api/payment-methods/:paymentmethodid', apiAuthentication, checkoutController.deletePaymentMethod)

module.exports = router;
