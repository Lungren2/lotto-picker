import { z } from "zod";
import { ValidationError } from "./errors.ts";

/**
 * Validates data against a Zod schema and returns the validated data
 * Throws ValidationError if validation fails
 */
export function validateData<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format Zod validation errors
      const formattedErrors = error.errors.map(err => ({
        path: err.path.join("."),
        message: err.message,
        code: err.code
      }));
      
      throw new ValidationError("Validation failed", formattedErrors);
    }
    throw error;
  }
}

/**
 * Generates a random alphanumeric code of specified length
 */
export function generateRandomCode(length: number): string {
  // Use characters that are unambiguous (no 0/O, 1/I/l confusion)
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  
  // Generate cryptographically secure random values
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  // Convert to characters
  for (let i = 0; i < length; i++) {
    const randomIndex = randomValues[i] % characters.length;
    result += characters.charAt(randomIndex);
  }
  
  return result;
}
