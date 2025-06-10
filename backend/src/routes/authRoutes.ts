import express, { Router } from 'express';
import { createUserFromGoogle } from '../controllers/authController';

const router: Router = express.Router();

router.post('/google/user', createUserFromGoogle);

export default router;