/**
 * Wraps an async controller so a rejected promise reaches Express's error
 * handler instead of crashing the process with an unhandled rejection.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
