import { AppError, ApiError, FirebaseError, ValidationError, ValidationResult } from '../types';

// Error handling utilities
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as ApiError).message === 'string'
  );
}

export function isFirebaseError(error: unknown): error is FirebaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as FirebaseError).code === 'string' &&
    typeof (error as FirebaseError).message === 'string'
  );
}

export function isValidationError(error: unknown): error is ValidationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'field' in error &&
    'message' in error &&
    typeof (error as ValidationError).field === 'string' &&
    typeof (error as ValidationError).message === 'string'
  );
}

export function createApiError(message: string, status?: number, code?: string): ApiError {
  return {
    message,
    status,
    code
  };
}

export function createFirebaseError(code: string, message: string, stack?: string): FirebaseError {
  return {
    code,
    message,
    stack
  };
}

export function createValidationError(field: string, message: string): ValidationError {
  return {
    field,
    message
  };
}

export function handleError(error: unknown): AppError {
  if (isApiError(error)) {
    return error;
  }
  
  if (isFirebaseError(error)) {
    return error;
  }
  
  if (isValidationError(error)) {
    return error;
  }
  
  // Handle unknown errors
  if (error instanceof Error) {
    return createApiError(error.message);
  }
  
  return createApiError('An unknown error occurred');
}

// Validation utilities
export function validateMessage(message: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!message || typeof message !== 'object') {
    errors.push(createValidationError('message', 'Message must be an object'));
    return { isValid: false, errors };
  }
  
  const messageObj = message as Record<string, unknown>;
  
  if (!messageObj.role || !['user', 'assistant', 'system'].includes(messageObj.role as string)) {
    errors.push(createValidationError('role', 'Message must have a valid role'));
  }
  
  if (!messageObj.content || typeof messageObj.content !== 'string') {
    errors.push(createValidationError('content', 'Message must have content'));
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateChatSession(session: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!session || typeof session !== 'object') {
    errors.push(createValidationError('session', 'Session must be an object'));
    return { isValid: false, errors };
  }
  
  const sessionObj = session as Record<string, unknown>;
  
  if (!sessionObj.id || typeof sessionObj.id !== 'string') {
    errors.push(createValidationError('id', 'Session must have an ID'));
  }
  
  if (!sessionObj.title || typeof sessionObj.title !== 'string') {
    errors.push(createValidationError('title', 'Session must have a title'));
  }
  
  if (!Array.isArray(sessionObj.messages)) {
    errors.push(createValidationError('messages', 'Session must have messages array'));
  } else {
    (sessionObj.messages as unknown[]).forEach((message: unknown, index: number) => {
      const messageValidation = validateMessage(message);
      if (!messageValidation.isValid) {
        messageValidation.errors.forEach(error => {
          errors.push(createValidationError(`messages[${index}].${error.field}`, error.message));
        });
      }
    });
  }
  
  if (!sessionObj.createdAt || !(sessionObj.createdAt instanceof Date)) {
    errors.push(createValidationError('createdAt', 'Session must have a valid creation date'));
  }
  
  if (!sessionObj.updatedAt || !(sessionObj.updatedAt instanceof Date)) {
    errors.push(createValidationError('updatedAt', 'Session must have a valid update date'));
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateUserPreferences(prefs: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!prefs || typeof prefs !== 'object') {
    errors.push(createValidationError('preferences', 'Preferences must be an object'));
    return { isValid: false, errors };
  }
  
  const prefsObj = prefs as Record<string, unknown>;
  
  if (prefsObj.userName !== undefined && typeof prefsObj.userName !== 'string') {
    errors.push(createValidationError('userName', 'User name must be a string'));
  }
  
  if (prefsObj.userInterests !== undefined && typeof prefsObj.userInterests !== 'string') {
    errors.push(createValidationError('userInterests', 'User interests must be a string'));
  }
  
  if (prefsObj.answerStyle !== undefined && !['friendly', 'formal', 'concise', 'detailed'].includes(prefsObj.answerStyle as string)) {
    errors.push(createValidationError('answerStyle', 'Answer style must be a valid option'));
  }
  
  if (prefsObj.customPersonality !== undefined && typeof prefsObj.customPersonality !== 'string') {
    errors.push(createValidationError('customPersonality', 'Custom personality must be a string'));
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Error message formatting
export function formatErrorMessage(error: AppError): string {
  if (isApiError(error)) {
    return error.message;
  }
  
  if (isFirebaseError(error)) {
    return `Firebase Error (${error.code}): ${error.message}`;
  }
  
  if (isValidationError(error)) {
    return `${error.field}: ${error.message}`;
  }
  
  return 'An unknown error occurred';
}

// Retry utilities
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
}

// Timeout utilities
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
} 