import express, { Router } from 'express';
import * as authController from '../controllers/authController';

const router: Router = express.Router();

router.post('/google/user', authController.createUserFromGoogle);
router.post('/validate', authController.validateSession);
router.post('/refresh', authController.refreshSession);
router.post('/signout', authController.signOut);

export default router;