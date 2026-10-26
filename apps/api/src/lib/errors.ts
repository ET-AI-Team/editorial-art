/**
 * One error type for the whole service. `code` is from Appendix D of the plan; `message` is safe
 * to show to an editor. Provider text and stack traces never reach a response.
 */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string,
    readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static validation(details: unknown, message = 'Some fields are missing or invalid.') {
    return new ApiError('VALIDATION_ERROR', 400, message, details);
  }

  static notFound(message = 'Not found.') {
    return new ApiError('NOT_FOUND', 404, message);
  }

  static invalidState(message: string) {
    return new ApiError('INVALID_STATE', 409, message);
  }
}

/** A failure inside a pipeline stage that should be recorded with a code, not thrown to a client. */
export class StageError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly retryable: boolean
  ) {
    super(message);
    this.name = 'StageError';
  }
}
