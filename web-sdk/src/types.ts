/**
 * Wespoke SDK TypeScript Type Definitions
 */

import { ConnectionState, ConnectionQuality } from 'livekit-client';

/**
 * SDK Configuration Options
 */
export interface WespokeConfig {
  /**
   * Your Wespoke API key (pk_live_xxx or pk_test_xxx)
   */
  apiKey: string;

  /**
   * API endpoint URL
   * @default 'https://api.wespoke.com.tr'
   */
  apiUrl?: string;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;

  /**
   * Maximum connection retry attempts
   * @default 3
   */
  maxRetryAttempts?: number;

  /**
   * Retry delay in milliseconds
   * @default 2000
   */
  retryDelay?: number;
}

/**
 * Call Options
 */
export interface CallOptions {
  /**
   * Optional metadata to attach to the call
   */
  metadata?: {
    /** Customer user ID for tracking */
    userId?: string;
    /** Session ID for analytics */
    sessionId?: string;
    /** Custom data object */
    customData?: Record<string, any>;
  };
}

/**
 * Chat Session Response
 */
export interface ChatSessionResponse {
  success: boolean;
  data: {
    chatId: string;
    assistant: {
      id: string;
      name: string;
      version: number;
    };
    startedAt: Date;
  };
}

/**
 * Call State
 */
export enum CallState {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

/**
 * Message Role
 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

/**
 * Conversation Message
 */
export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  isComplete?: boolean;
  isFirstChunk?: boolean;
  isStreaming?: boolean;
}

/**
 * Transcription Event
 */
export interface TranscriptionEvent {
  text: string;
  transcriptionId: string;
  isFinal: boolean;
  timestamp: number;
  sequence: number;
  isStreaming: boolean;
}

/**
 * Tool Event Type
 */
export type ToolEventType = 'start' | 'complete' | 'failed' | 'delayed';

/**
 * Tool Event
 */
export interface ToolEvent {
  type: ToolEventType;
  toolName: string;
  toolType: string;
  timestamp: number;
  toolDetails: {
    configuration?: any;
    parameters?: any;
    functionCall?: any;
    result?: any;
    context?: any;
    executionTime?: number;
    error?: string;
    [key: string]: any;
  };
}

/**
 * Call Metrics
 */
export interface CallMetrics {
  duration?: number;
  latency?: number;
  connectionQuality?: ConnectionQuality;
  [key: string]: any;
}

/**
 * Call Ending Event
 */
export interface CallEndingEvent {
  reason: string;
  message: string;
  timestamp: number;
}

/**
 * Knowledge Base Used Event
 */
export interface KnowledgeUsedEvent {
  sources: string[];
  timestamp: number;
}

/**
 * SDK Events Map
 */
export interface WespokeEvents {
  /** Call state changed */
  stateChange: CallState;

  /** Successfully connected to call */
  connected: void;

  /** Disconnected from call */
  disconnected: string | undefined;

  /** Connection is reconnecting */
  reconnecting: void;

  /** Successfully reconnected */
  reconnected: void;

  /** Connection state changed */
  connectionStateChanged: ConnectionState;

  /** Connection quality changed */
  connectionQualityChanged: ConnectionQuality;

  /** Error occurred */
  error: Error;

  /** Conversation message received */
  message: ConversationMessage;

  /** Transcription event */
  transcription: TranscriptionEvent;

  /** Assistant speaking state changed */
  assistantSpeaking: boolean;

  /** Microphone muted state changed */
  microphoneMuted: boolean;

  /** Tool execution event */
  toolEvent: ToolEvent;

  /** Knowledge base sources used */
  knowledgeUsed: KnowledgeUsedEvent;

  /** Call metrics updated */
  metrics: CallMetrics;

  /** User interrupted the assistant (barge-in) */
  bargeIn: any;

  /** Call is ending */
  callEnding: CallEndingEvent;
}

/**
 * Token Response from API
 */
export interface TokenResponse {
  success: boolean;
  data: {
    callId: string;
    token: string;
    url: string;
    roomName: string;
    assistant: {
      id: string;
      name: string;
      version: number;
    };
    rateLimit: {
      remaining: number;
      limit: number;
      resetAt: string | null;
    };
  };
}

/**
 * API Error Response
 */
export interface APIErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
  };
}
