/**
 * Base error class for all Wespoke SDK errors
 */
export class WespokeError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly details?: any;

  constructor(message: string, code: string, statusCode?: number, details?: any) {
    super(message);
    this.name = 'WespokeError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Authentication error (invalid API key, domain not whitelisted, etc.)
 */
export class AuthenticationError extends WespokeError {
  constructor(message: string, details?: any) {
    super(message, 'AUTHENTICATION_ERROR', 403, details);
    this.name = 'AuthenticationError';
  }
}

/**
 * Insufficient credits error
 */
export class InsufficientCreditsError extends WespokeError {
  constructor(message: string = 'Insufficient credits to start call', details?: any) {
    super(message, 'INSUFFICIENT_CREDITS', 402, details);
    this.name = 'InsufficientCreditsError';
  }
}

/**
 * Rate limit exceeded error
 */
export class RateLimitError extends WespokeError {
  public readonly retryAfter?: number;
  public readonly resetAt?: string;

  constructor(message: string, retryAfter?: number, resetAt?: string, details?: any) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, details);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.resetAt = resetAt;
  }
}

/**
 * Connection error (network issues, WebRTC failures, etc.)
 */
export class ConnectionError extends WespokeError {
  constructor(message: string, details?: any) {
    super(message, 'CONNECTION_ERROR', undefined, details);
    this.name = 'ConnectionError';
  }
}

/**
 * Invalid configuration error
 */
export class ConfigurationError extends WespokeError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIGURATION_ERROR', undefined, details);
    this.name = 'ConfigurationError';
  }
}

/**
 * Assistant not found error
 */
export class AssistantNotFoundError extends WespokeError {
  constructor(assistantId: string) {
    super(
      `Assistant not found: ${assistantId}`,
      'ASSISTANT_NOT_FOUND',
      404,
      { assistantId }
    );
    this.name = 'AssistantNotFoundError';
  }
}

/**
 * Media devices error (microphone access denied, etc.)
 */
export class MediaDevicesError extends WespokeError {
  constructor(message: string, details?: any) {
    super(message, 'MEDIA_DEVICES_ERROR', undefined, details);
    this.name = 'MediaDevicesError';
  }
}

/**
 * API request error
 */
export class APIError extends WespokeError {
  constructor(message: string, code: string, statusCode?: number, details?: any) {
    super(message, code, statusCode, details);
    this.name = 'APIError';
  }
}

/**
 * Parse API error response and throw appropriate error
 */
export function parseAPIError(response: any, statusCode?: number): WespokeError {
  const errorMessage = response?.error?.message || 'Unknown API error';
  const errorCode = response?.error?.code || 'UNKNOWN_ERROR';

  switch (statusCode) {
    case 401:
    case 403:
      return new AuthenticationError(errorMessage, response);

    case 402:
      return new InsufficientCreditsError(errorMessage, response);

    case 404:
      return new AssistantNotFoundError(errorMessage);

    case 429:
      return new RateLimitError(
        errorMessage,
        response?.error?.retryAfter,
        response?.error?.resetAt,
        response
      );

    default:
      return new APIError(errorMessage, errorCode, statusCode, response);
  }
}
