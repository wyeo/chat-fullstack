/**
 * Standard API error response format
 * 
 * Used for:
 * - Consistent error handling across the application
 * - Frontend error display
 * - API documentation
 * 
 * All API errors follow this structure for predictability
 */
export interface ApiError {
  /** Human-readable error message */
  message: string;
  
  /** Technical error type/code (e.g., 'ValidationError', 'NotFound') */
  error?: string;
  
  /** HTTP status code (e.g., 400, 401, 404, 500) */
  statusCode?: number;
}