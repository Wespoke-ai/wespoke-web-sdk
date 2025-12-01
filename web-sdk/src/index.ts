/**
 * Wespoke Web SDK
 * Official JavaScript SDK for embedding Wespoke AI voice assistants
 *
 * @packageDocumentation
 */

export { Wespoke } from './Wespoke';
export { EventEmitter } from './EventEmitter';

// Export types
export type {
  WespokeConfig,
  CallOptions,
  ConversationMessage,
  TranscriptionEvent,
  ToolEvent,
  CallMetrics,
  CallEndingEvent,
  WespokeEvents,
  TokenResponse,
  APIErrorResponse,
  MessageRole,
  ToolEventType
} from './types';

export { CallState } from './types';

// Export errors
export {
  WespokeError,
  AuthenticationError,
  InsufficientCreditsError,
  RateLimitError,
  ConnectionError,
  ConfigurationError,
  AssistantNotFoundError,
  MediaDevicesError,
  APIError,
  parseAPIError
} from './errors';

// Re-export LiveKit types that users might need
export type { ConnectionState, ConnectionQuality } from 'livekit-client';
