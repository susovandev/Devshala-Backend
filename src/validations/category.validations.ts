import { z } from 'zod';
import { objectIdSchema } from './user.validations.js';

export const categoryName = z
  .string({
    message: 'Category name is required',
  })
  .trim()
  .min(2, { message: 'Category name must be at least 2 characters long' })
  .max(50, { message: 'Category name must be at most 50 characters long' });

/**
 * Validate create category validation schema
 */
export const createCategorySchema = z.object({
  name: categoryName,
});

/**
 * Validate update category validation schema
 */
export const updateCategorySchema = z.object({
  name: categoryName,
});

/**
 * Validate category Id validation schema
 */
export const categoryIdParam = z.object({
  id: objectIdSchema,
});
