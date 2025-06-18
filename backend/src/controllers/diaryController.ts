import { Request, Response } from 'express';
import { getDiaryRepository } from '../repositories/DiaryRepository';
import { getUserRepository } from '../repositories/UserRepository';

/**
 * Get all diaries for a specific user
 */
export const getUserDiaries = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId, 10);
    
    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    // Check if authenticated user is requesting their own diaries
    if (req.user && req.user.id !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const diaryRepository = getDiaryRepository();
    const diaries = await diaryRepository.findByUserId(userId);
    
    res.json({
      success: true,
      data: diaries
    });
  } catch (error) {
    console.error('Error fetching user diaries:', error);
    res.status(500).json({ error: 'Failed to fetch diaries' });
  }
};

/**
 * Get diary by ID
 */
export const getDiaryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    
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

    // Check if authenticated user owns this diary
    if (req.user && req.user.id !== diary.user.id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({
      success: true,
      data: diary
    });
  } catch (error) {
    console.error('Error fetching diary:', error);
    res.status(500).json({ error: 'Failed to fetch diary' });
  }
};

/**
 * Create new diary entry
 */
export const createDiary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, content, user_id } = req.body;

    // Validation
    if (!date || !content || !user_id) {
      res.status(400).json({ 
        error: 'Date, content, and user_id are required' 
      });
      return;
    }

    // Check if authenticated user is creating their own diary
    if (req.user && req.user.id !== user_id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Check if user exists
    const userRepository = getUserRepository();
    const user = await userRepository.findById(user_id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
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
    const existingDiary = await diaryRepository.findByUserIdAndDate(user_id, diaryDate);
    
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
      userId: user_id
    });

    res.status(201).json({
      success: true,
      message: 'Diary created successfully',
      data: newDiary
    });
  } catch (error) {
    console.error('Error creating diary:', error);
    res.status(500).json({ error: 'Failed to create diary' });
  }
};

/**
 * Update diary entry
 */
export const updateDiary = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const { date, content } = req.body;

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid diary ID' });
      return;
    }

    // Validation
    if (!date && !content) {
      res.status(400).json({ 
        error: 'At least one field (date or content) is required for update' 
      });
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

    const diaryRepository = getDiaryRepository();
    const updatedDiary = await diaryRepository.update(id, updateData);

    if (!updatedDiary) {
      res.status(404).json({ error: 'Diary not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Diary updated successfully',
      data: updatedDiary
    });
  } catch (error) {
    console.error('Error updating diary:', error);
    res.status(500).json({ error: 'Failed to update diary' });
  }
};

/**
 * Delete diary entry
 */
export const deleteDiary = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid diary ID' });
      return;
    }

    const diaryRepository = getDiaryRepository();
    const result = await diaryRepository.delete(id);

    if (!result) {
      res.status(404).json({ error: 'Diary not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Diary deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting diary:', error);
    res.status(500).json({ error: 'Failed to delete diary' });
  }
};

/**
 * Get diary for specific user and date
 */
export const getDiaryByUserAndDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const dateParam = req.params.date;

    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const date = new Date(dateParam);
    if (isNaN(date.getTime())) {
      res.status(400).json({ error: 'Invalid date format' });
      return;
    }

    const diaryRepository = getDiaryRepository();
    const diary = await diaryRepository.findByUserIdAndDate(userId, date);

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
    console.error('Error fetching diary by user and date:', error);
    res.status(500).json({ error: 'Failed to fetch diary' });
  }
};