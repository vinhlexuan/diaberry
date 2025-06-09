import express, { Router } from 'express';
import { handleGoogleSignIn, handleCallback } from '../controllers/authController';

const router: Router = express.Router();

router.get('/signin/google', handleGoogleSignIn);
router.get('/callback', handleCallback);

export default router;