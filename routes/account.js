const express = require('express');
const router = express.Router();

const accountController = require('../controllers/account');
const authLimiter = require('../middleware/authLimiter');

router.get('/api/auth/me', accountController.getMe);
router.post('/api/auth/login', authLimiter, accountController.postLogin);
router.post('/api/auth/register', authLimiter, accountController.postRegister);
router.post('/api/auth/reset-password', authLimiter, accountController.postReset);
router.get('/api/auth/reset-password/:token', accountController.getNewPasswordToken);
router.post('/api/auth/new-password', authLimiter, accountController.postNewPassword);
router.post('/api/auth/logout', accountController.postLogout);

module.exports = router;
