/**
 * Sanitizes error messages to prevent exposing backend technology details
 * to end users. Converts Firebase-specific errors to generic user-friendly messages.
 */

export function sanitizeError(error: unknown): string {
  // Handle Error objects
  let errorMessage = '';
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = String((error as any).message);
  } else {
    return 'An error occurred. Please try again.';
  }

  // Check for Firebase error patterns
  const firebasePattern = /Firebase:\s*Error\s*\(([^)]+)\)/i;
  const match = errorMessage.match(firebasePattern);
  
  if (match) {
    const errorCode = match[1].toLowerCase();
    
    // Map Firebase auth error codes to user-friendly messages
    if (errorCode.startsWith('auth/')) {
      const authCode = errorCode.replace('auth/', '');
      
      switch (authCode) {
        case 'network-request-failed':
          return 'Network error. Please check your connection and try again.';
        case 'invalid-email':
          return 'Invalid email address.';
        case 'user-not-found':
          return 'No account found with this email.';
        case 'wrong-password':
          return 'Incorrect password.';
        case 'email-already-in-use':
          return 'An account with this email already exists.';
        case 'weak-password':
          return 'Password is too weak. Please use a stronger password.';
        case 'too-many-requests':
          return 'Too many attempts. Please try again later.';
        case 'invalid-credential':
          return 'Invalid email or password.';
        case 'user-disabled':
          return 'This account has been disabled.';
        case 'operation-not-allowed':
          return 'This operation is not allowed.';
        case 'requires-recent-login':
          return 'Please log in again to complete this action.';
        default:
          return 'Authentication error. Please try again.';
      }
    }
    
    // Map Firebase database error codes
    if (errorCode.startsWith('database/') || errorCode.includes('permission-denied')) {
      return 'Unable to access data. Please check your permissions.';
    }
    
    // Generic Firebase error
    return 'An error occurred. Please try again.';
  }
  
  // Check for other Firebase-related patterns
  if (errorMessage.toLowerCase().includes('firebase')) {
    return 'An error occurred. Please try again.';
  }
  
  // Check for network-related errors
  if (errorMessage.toLowerCase().includes('network') || 
      errorMessage.toLowerCase().includes('fetch') ||
      errorMessage.toLowerCase().includes('connection')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  // For non-Firebase errors, return a generic message
  // This prevents exposing any backend implementation details
  return 'An error occurred. Please try again.';
}
