import { z } from 'zod';

/**
 * Reusable validators
 */
const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid MongoDB ID' });

/**
 * Validate Create Blog Schema
 */
export const createBlogSchema = z.object({
  title: z
    .string({
      message: 'Blog title is required',
    })
    .trim()
    .min(10, { message: 'Title must be at least 10 characters long' })
    .max(150, { message: 'Title must be at most 150 characters long' }),

  excerpt: z
    .string({
      message: 'Excerpt is required',
    })
    .trim()
    .min(50, { message: 'Excerpt must be at least 50 characters long' })
    .max(800, { message: 'Excerpt must be at most 500 characters long' }),

  content: z
    .string({
      message: 'Content is required',
    })
    .trim()
    .min(300, { message: 'Content must be at least 300 characters long' }),

  categories: z
    .array(mongoIdSchema, {
      message: 'Categories are required',
    })
    .min(1, { message: 'At least one category is required' })
    .max(10, { message: 'You can select up to 10 categories only' }),

  tags: z
    .string({
      message: 'Tags are required',
    })
    .trim()
    .refine(
      (value) => {
        const tags = value.split(',').map((t) => t.trim());
        return tags.length >= 1 && tags.length <= 10;
      },
      { message: 'Tags must contain between 1 and 10 values' },
    ),
});

/**
 * Validate update Blog Schema
 */
export const updateBlogSchema = z
  .object({
    title: z
      .string({
        message: 'Title must be a string',
      })
      .trim()
      .min(10, { message: 'Title must be at least 10 characters long' })
      .max(150, { message: 'Title must be at most 150 characters long' })
      .optional(),

    excerpt: z
      .string({
        message: 'Excerpt must be a string',
      })
      .trim()
      .min(50, { message: 'Excerpt must be at least 50 characters long' })
      .max(500, { message: 'Excerpt must be at most 500 characters long' })
      .optional(),

    content: z
      .string({
        message: 'Content must be a string',
      })
      .trim()
      .min(300, { message: 'Content must be at least 300 characters long' })
      .optional(),

    categories: z
      .array(mongoIdSchema)
      .min(1, { message: 'At least one category is required' })
      .max(10, { message: 'You can select up to 10 categories only' })
      .optional(),

    tags: z
      .string({
        message: 'Tags must be a string',
      })
      .trim()
      .refine(
        (value) => {
          const tags = value.split(',').map((t) => t.trim());
          return tags.length >= 1 && tags.length <= 10;
        },
        { message: 'Tags must contain between 1 and 10 values' },
      )
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update the blog',
  });

/**
 * Validate blog Id Schema
 */

export const blogIdParam = z.object({
  id: mongoIdSchema,
});
