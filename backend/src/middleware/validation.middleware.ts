import { Request, Response, NextFunction } from 'express';

export const validateRegister = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }

  next();
};

export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  next();
};

export const validateCompleteLesson = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { score, correctCount, totalQuestions, heartsLost } = req.body;

  if (score === undefined || correctCount === undefined || totalQuestions === undefined) {
    res.status(400).json({
      success: false,
      error: 'score, correctCount, and totalQuestions are required',
    });
    return;
  }

  if (typeof score !== 'number' || score < 0 || score > 100) {
    res.status(400).json({
      success: false,
      error: 'score must be a number between 0 and 100',
    });
    return;
  }

  if (typeof correctCount !== 'number' || correctCount < 0) {
    res.status(400).json({
      success: false,
      error: 'correctCount must be a non-negative number',
    });
    return;
  }

  if (typeof totalQuestions !== 'number' || totalQuestions <= 0) {
    res.status(400).json({
      success: false,
      error: 'totalQuestions must be a positive number',
    });
    return;
  }

  if (correctCount > totalQuestions) {
    res.status(400).json({
      success: false,
      error: 'correctCount cannot exceed totalQuestions',
    });
    return;
  }

  if (heartsLost !== undefined && (typeof heartsLost !== 'number' || heartsLost < 0)) {
    res.status(400).json({
      success: false,
      error: 'heartsLost must be a non-negative number',
    });
    return;
  }

  next();
};

export const validateReflection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { answerText, selectedOptionEn, selectedOptionSi } = req.body;

  if (!answerText && !selectedOptionEn && !selectedOptionSi) {
    res.status(400).json({
      success: false,
      error: 'At least one of answerText, selectedOptionEn, or selectedOptionSi is required',
    });
    return;
  }

  if (answerText && typeof answerText !== 'string') {
    res.status(400).json({
      success: false,
      error: 'answerText must be a string',
    });
    return;
  }

  if (selectedOptionEn && typeof selectedOptionEn !== 'string') {
    res.status(400).json({
      success: false,
      error: 'selectedOptionEn must be a string',
    });
    return;
  }

  if (selectedOptionSi && typeof selectedOptionSi !== 'string') {
    res.status(400).json({
      success: false,
      error: 'selectedOptionSi must be a string',
    });
    return;
  }

  next();
};

export const validateUserUpdate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { languagePreference, dailyGoalXP, name, timezone } = req.body;

  if (languagePreference !== undefined && !['en', 'si'].includes(languagePreference)) {
    res.status(400).json({
      success: false,
      error: 'languagePreference must be "en" or "si"',
    });
    return;
  }

  if (dailyGoalXP !== undefined && ![10, 20, 30, 50].includes(dailyGoalXP)) {
    res.status(400).json({
      success: false,
      error: 'dailyGoalXP must be 10, 20, 30, or 50',
    });
    return;
  }

  if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    res.status(400).json({
      success: false,
      error: 'name must be a non-empty string',
    });
    return;
  }

  if (timezone !== undefined && typeof timezone !== 'string') {
    res.status(400).json({
      success: false,
      error: 'timezone must be a string',
    });
    return;
  }

  next();
};

