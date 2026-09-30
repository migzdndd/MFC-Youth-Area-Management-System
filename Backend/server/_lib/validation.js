import { z } from 'zod';
import { sendJson } from './http.js';

/**
 * Standardized Request Validator
 * 
 * What it does:
 * Takes a Zod schema and a request object, then validates the body or query.
 * If validation fails, it automatically sends a detailed 400 error response.
 * 
 * Backup plan if it breaks:
 * If the schema itself is invalid, it catches the error and returns a 500 server error.
 */
export async function validateRequest(req, res, schema, source = 'body') {
  const dataToValidate = source === 'body' ? req.body : req.query;
  
  const result = schema.safeParse(dataToValidate);
  
  if (!result.success) {
    // Format Zod errors into a user-friendly array of messages
    const errors = result.error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message
    }));
    
    return sendJson(res, 400, {
      ok: false,
      error: 'Invalid request data.',
      details: errors
    });
  }
  
  return {
    ok: true,
    data: result.data
  };
}

/**
 * Common Zod Fragments
 * Reusable validation rules to keep schemas DRY.
 */
export const CommonSchema = {
  email: z.string().trim().toLowerCase().email('A valid email address is required.'),
  name: z.string().trim().min(1, 'This field is required.').max(100, 'Too long (max 100 chars).'),
  optionalText: z.string().trim().max(1000).optional().nullable(),
  uuid: z.string().uuid('Invalid ID format.'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD).').optional().nullable(),
};
