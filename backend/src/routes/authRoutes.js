const express = require('express');
const router = express.Router();
const { handleGoogleSignIn, handleCallback } = require('../controllers/authController');

router.get('/signin/google', handleGoogleSignIn);
router.get('/callback', handleCallback);

module.exports = router;