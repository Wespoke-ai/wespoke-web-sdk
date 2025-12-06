/**
 * Type definitions for Wespoke Web Widget
 */

import type { AssistantOverrides } from '@wespoke/web-sdk';

// Re-export AssistantOverrides from SDK for convenience
export type { AssistantOverrides } from '@wespoke/web-sdk';

/**
 * Widget position on the page
 */
export type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

/**
 * Widget theme
 */
export type WidgetTheme = 'light' | 'dark' | 'auto';

/**
 * Widget size
 */
export type WidgetSize = 'compact' | 'medium' | 'full';

/**
 * Border radius style
 */
export type BorderRadius = 'none' | 'small' | 'medium' | 'large';

/**
 * Widget mode
 */
export type WidgetMode = 'voice' | 'chat' | 'hybrid';

/**
 * Locale/Language
 */
export type WidgetLocale = 'tr' | 'en';

/**
 * Widget state
 */
export type WidgetState = 'idle' | 'connecting' | 'connected' | 'minimized';

/**
 * Message role
 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

/**
 * Message interface
 */
export interface WidgetMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

/**
 * Widget configuration
 */
export interface WespokeWidgetConfig {
  /** Required: Web embedding API key (pk_live_xxx or pk_test_xxx) */
  apiKey: string;

  /** Required: Assistant ID to connect to */
  assistantId: string;

  /** Optional: API URL (default: 'https://api.wespoke.ai') */
  apiUrl?: string;

  /** Optional: Widget position (default: 'bottom-right') */
  position?: WidgetPosition;

  /** Optional: Theme (default: 'dark') */
  theme?: WidgetTheme;

  /** Optional: Primary brand color (hex) (default: '#4d8e8c') */
  primaryColor?: string;

  /** Optional: Accent color (hex) (default: '#6db3b0') */
  accentColor?: string;

  /** Optional: Border radius style (default: 'medium') */
  borderRadius?: BorderRadius;

  /** Optional: Base background color for widget (hex) */
  baseColor?: string;

  /** Optional: Floating button background color (hex) */
  buttonBaseColor?: string;

  /** Optional: Floating button text/icon color (hex) */
  buttonAccentColor?: string;

  /** Optional: Widget size (default: 'medium') */
  size?: WidgetSize;

  /** Optional: Widget mode - voice, chat, or hybrid (default: 'voice') */
  mode?: WidgetMode;

  /** Optional: Auto-expand widget on page load (default: false) */
  autoOpen?: boolean;

  /** Optional: Show message transcript (default: true) */
  showTranscript?: boolean;

  /** Optional: Require microphone consent before starting (default: true) */
  requireConsent?: boolean;

  /** Optional: Custom button text (default: 'Asistan ile Konuş') */
  buttonText?: string;

  /** Optional: Placeholder text in chat input (default: 'Bir şeyler yazın...') */
  placeholderText?: string;

  /** Optional: Metadata to pass to API */
  metadata?: Record<string, any>;

  /** Optional: Assistant overrides for per-widget customization */
  assistantOverrides?: AssistantOverrides;

  /** Optional: Locale/Language (default: 'tr') */
  locale?: WidgetLocale;

  /** Optional: Enable debug logging (default: false) */
  debug?: boolean;

  /** Optional: Z-index for widget (default: 9999) */
  zIndex?: number;

  /** Event Callbacks */
  /** Fired when call starts */
  onCallStart?: () => void;

  /** Fired when call ends */
  onCallEnd?: () => void;

  /** Fired when a message is received */
  onMessage?: (message: WidgetMessage) => void;

  /** Fired when an error occurs */
  onError?: (error: WidgetError) => void;

  /** Fired when transcript updates */
  onTranscriptUpdate?: (messages: WidgetMessage[]) => void;

  /** Fired when widget state changes */
  onStateChange?: (state: WidgetState) => void;
}

/**
 * Widget error interface
 */
export interface WidgetError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Widget API methods
 */
export interface WespokeWidgetAPI {
  /** Open/expand the widget */
  open: () => void;

  /** Close/minimize the widget */
  close: () => void;

  /** Toggle widget open/close */
  toggle: () => void;

  /** Start a voice call */
  startCall: () => Promise<void>;

  /** End the current call */
  endCall: () => Promise<void>;

  /** Toggle microphone mute */
  toggleMute: () => Promise<boolean>;

  /** Check if microphone is muted */
  isMuted: () => boolean;

  /** Get current widget state */
  getState: () => WidgetState;

  /** Get message transcript */
  getTranscript: () => WidgetMessage[];

  /** Clear message transcript */
  clearTranscript: () => void;

  /** Destroy widget and cleanup */
  destroy: () => void;

  /** Update widget configuration */
  updateConfig: (config: Partial<WespokeWidgetConfig>) => void;
}

/**
 * Widget props for React component
 */
export interface WespokeWidgetProps extends WespokeWidgetConfig {
  /** Children elements (not typically used) */
  children?: React.ReactNode;
}
