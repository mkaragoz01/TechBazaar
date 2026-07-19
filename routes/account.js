const express = require('express');
const router = express.Router();

const accountController = require('../controllers/account');
const { loginLimiter, registerLimiter, resetPasswordLimiter, newPasswordLimiter } = require('../middleware/authLimiter');

router.get('/api/auth/me', accountController.getMe);
router.post('/api/auth/login', loginLimiter, accountController.postLogin);
router.post('/api/auth/register', registerLimiter, accountController.postRegister);
router.post('/api/auth/reset-password', resetPasswordLimiter, accountController.postReset);
router.get('/api/auth/reset-password/:token', accountController.getNewPasswordToken);
router.post('/api/auth/new-password', newPasswordLimiter, accountController.postNewPassword);
router.post('/api/auth/logout', accountController.postLogout);

module.exports = router;
