import express, { Router } from 'express';
import * as diaryController from '../controllers/diaryController';
import { authenticateSession } from '../middlewares/auth';

const router: Router = express.Router();

// All diary routes require authentication
router.use(authenticateSession);

// Get all diaries for a user
router.get('/user/:userId', diaryController.getUserDiaries);

// Get diary by specific user and date
router.get('/user/:userId/date/:date', diaryController.getDiaryByUserAndDate);

// Get diary by ID
router.get('/:id', diaryController.getDiaryById);

// Create new diary
router.post('/', diaryController.createDiary);

// Update diary
router.put('/:id', diaryController.updateDiary);

// Delete diary
router.delete('/:id', diaryController.deleteDiary);

export default router;