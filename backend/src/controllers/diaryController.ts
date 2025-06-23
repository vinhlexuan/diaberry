import { Request, Response } from 'express';
import { getDiaryRepository } from '../repositories/diaryRepository';
import { requireAuthFromRequest } from '../middlewares/auth';

/**
 * Get all diaries for authenticated user
 */
export const getUserDiaries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user } = requireAuthFromRequest(req);
    
    const diaryRepository = getDiaryRepository();
    const diaries = await diaryRepository.findByUserId(user.id);
    
    res.json({
      success: true,
      data: diaries
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    console.error('Error fetching user diaries:', error);
    res.status(500).json({ error: 'Failed to fetch diaries' });
  }
};

/**
 * Get diary by ID
 */
export const getDiaryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user } = requireAuthFromRequest(req);
    
    const idParam = req.params.id;
    if (!idParam) {
      res.status(400).json({ error: 'Diary ID is required' });
      return;
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid diary ID' });
      return;
    }

    const diaryRepository = getDiaryRepository();
    const diary = await diaryRepository.findById(id);

    if (!diary) {
      res.status(404).json({ error: 'Diary not found' });
      return;
    }

    // Check ownership
    if (diary.user.id !== user.id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({
      success: true,
      data: diary
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    console.error('Error fetching diary:', error);
    res.status(500).json({ error: 'Failed to fetch diary' });
  }
};

/**
 * Create new diary entry
 */
export const createDiary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user } = requireAuthFromRequest(req);
    
    const { date, content } = req.body;

    // Validation
    if (!date || !content) {
      res.status(400).json({ 
        error: 'Date and content are required' 
      });
      return;
    }

    // Parse date
    const diaryDate = new Date(date);
    if (isNaN(diaryDate.getTime())) {
      res.status(400).json({ error: 'Invalid date format' });
      return;
    }

    // Check if diary already exists for this user and date
    const diaryRepository = getDiaryRepository();
    const existingDiary = await diaryRepository.findByUserIdAndDate(user.id, diaryDate);
    
    if (existingDiary) {
      res.status(409).json({ 
        error: 'Diary entry already exists for this date',
        existing_diary: existingDiary
      });
      return;
    }

    // Create diary
    const newDiary = await diaryRepository.create({
      date: diaryDate,
      content: content.trim(),
      userId: user.id
    });

    res.status(201).json({
      success: true,
      message: 'Diary created successfully',
      data: newDiary
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    console.error('Error creating diary:', error);
    res.status(500).json({ error: 'Failed to create diary' });
  }
};

/**
 * Update diary entry
 */
export const updateDiary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user } = requireAuthFromRequest(req);
    
    const idParam = req.params.id;
    if (!idParam) {
      res.status(400).json({ error: 'Diary ID is required' });
      return;
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid diary ID' });
      return;
    }

    const { date, content } = req.body;

    // Validation
    if (!date && !content) {
      res.status(400).json({ 
        error: 'At least one field (date or content) is required for update' 
      });
      return;
    }

    const diaryRepository = getDiaryRepository();
    
    // Check if diary exists and user owns it
    const existingDiary = await diaryRepository.findById(id);
    if (!existingDiary) {
      res.status(404).json({ error: 'Diary not found' });
      return;
    }

    if (existingDiary.user.id !== user.id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const updateData: any = {};
    
    if (date) {
      const diaryDate = new Date(date);
      if (isNaN(diaryDate.getTime())) {
        res.status(400).json({ error: 'Invalid date format' });
        return;
      }
      updateData.date = diaryDate;
    }
    
    if (content) {
      updateData.content = content.trim();
    }

    const updatedDiary = await diaryRepository.update(id, updateData);

    res.json({
      success: true,
      message: 'Diary updated successfully',
      data: updatedDiary
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    console.error('Error updating diary:', error);
    res.status(500).json({ error: 'Failed to update diary' });
  }
};

/**
 * Delete diary entry
 */
export const deleteDiary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user } = requireAuthFromRequest(req);
    
    const idParam = req.params.id;
    if (!idParam) {
      res.status(400).json({ error: 'Diary ID is required' });
      return;
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid diary ID' });
      return;
    }

    const diaryRepository = getDiaryRepository();
    
    // Check if diary exists and user owns it
    const existingDiary = await diaryRepository.findById(id);
    if (!existingDiary) {
      res.status(404).json({ error: 'Diary not found' });
      return;
    }

    if (existingDiary.user.id !== user.id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    await diaryRepository.delete(id);

    res.json({
      success: true,
      message: 'Diary deleted successfully'
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    console.error('Error deleting diary:', error);
    res.status(500).json({ error: 'Failed to delete diary' });
  }
};

/**
 * Get diary for specific date
 */
export const getDiaryByUserAndDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user } = requireAuthFromRequest(req);
    
    const dateParam = req.params.date;
    if (!dateParam) {
      res.status(400).json({ error: 'Date parameter is required' });
      return;
    }

    const date = new Date(dateParam);
    if (isNaN(date.getTime())) {
      res.status(400).json({ error: 'Invalid date format' });
      return;
    }

    const diaryRepository = getDiaryRepository();
    const diary = await diaryRepository.findByUserIdAndDate(user.id, date);

    if (!diary) {
      res.status(404).json({ 
        success: false,
        message: 'No diary entry found for this date' 
      });
      return;
    }

    res.json({
      success: true,
      data: diary
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    console.error('Error fetching diary by user and date:', error);
    res.status(500).json({ error: 'Failed to fetch diary' });
  }
};