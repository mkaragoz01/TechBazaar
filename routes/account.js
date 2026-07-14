const express = require('express');
const router = express.Router();

const accountController = require('../controllers/account');
const locals = require('../middleware/locals');
const authLimiter = require('../middleware/authLimiter');

router.get('/login', locals, accountController.getLogin);
router.post('/login', locals, authLimiter, accountController.postLogin);

router.get('/register', locals, accountController.getRegister);
router.post('/register', locals, authLimiter, accountController.postRegister);

router.get('/reset-password', locals, accountController.getReset);
router.post('/reset-password', locals, authLimiter, accountController.postReset);

router.get('/reset-password/:token', locals, accountController.getNewPassword);
router.post('/new-password', locals, authLimiter, accountController.postNewPassword);

router.get('/logout', locals, accountController.getLogout);
module.exports = router;