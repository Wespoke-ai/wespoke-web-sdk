import { useState, useEffect, useRef, useCallback } from 'react';

// Import types from the SDK
// Note: In a real app, these would come from @wespoke/web-sdk
// For this example, we'll define them inline
type CallState = 'idle' | 'connecting' | 'connected' | 'disconnecting' | 'disconnected' | 'error';

interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp?: number;
}

interface EventLog {
  time: string;
  type: string;
  data?: any;
}

interface WespokeConfig {
  apiKey: string;
  apiUrl?: string;
  debug?: boolean;
}

interface UseWespokeOptions extends WespokeConfig {
  onMessage?: (message: Message) => void;
  onError?: (error: Error) => void;
  onStateChange?: (state: CallState) => void;
  onConnected?: () => void;
  onDisconnected?: (reason?: string) => void;
}

interface UseWespokeReturn {
  state: CallState;
  isMuted: boolean;
  isAssistantSpeaking: boolean;
  callId: string | null;
  messages: Message[];
  events: EventLog[];
  startCall: (assistantId: string, metadata?: any) => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  clearEvents: () => void;
  error: Error | null;
}

export function useWespoke(options: UseWespokeOptions): UseWespokeReturn {
  const [state, setState] = useState<CallState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [events, setEvents] = useState<EventLog[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const wespokeRef = useRef<any>(null);
  const isInitialized = useRef(false);

  // Log event function
  const logEvent = useCallback((type: string, data?: any) => {
    const time = new Date().toLocaleTimeString();
    setEvents((prev) => [{ time, type, data }, ...prev]);
  }, []);

  // Initialize SDK
  useEffect(() => {
    if (isInitialized.current) return;

    const initializeSDK = async () => {
      try {
        // @ts-ignore - SDK will be loaded via Vite alias
        const { Wespoke } = await import('@wespoke/web-sdk');

        const config: WespokeConfig = {
          apiKey: options.apiKey,
          debug: options.debug || false,
        };

        if (options.apiUrl) {
          config.apiUrl = options.apiUrl;
        }

        const wespoke = new Wespoke(config);

        // Set up event listeners
        wespoke.on('stateChange', (newState: CallState) => {
          setState(newState);
          logEvent('STATE_CHANGE', { state: newState });
          options.onStateChange?.(newState);
        });

        wespoke.on('connected', () => {
          setCallId(wespoke.getCallId());
          logEvent('CONNECTED');
          options.onConnected?.();
        });

        wespoke.on('disconnected', (reason?: string) => {
          setCallId(null);
          logEvent('DISCONNECTED', { reason });
          options.onDisconnected?.(reason);
        });

        wespoke.on('reconnecting', () => {
          logEvent('RECONNECTING');
        });

        wespoke.on('reconnected', () => {
          logEvent('RECONNECTED');
        });

        wespoke.on('message', (message: Message) => {
          setMessages((prev) => [...prev, message]);
          logEvent('MESSAGE', { role: message.role, content: message.content.substring(0, 50) });
          options.onMessage?.(message);
        });

        wespoke.on('transcription', (transcription: any) => {
          logEvent('TRANSCRIPTION', { text: transcription.text, final: transcription.isFinal });
        });

        wespoke.on('microphoneMuted', (muted: boolean) => {
          setIsMuted(muted);
          logEvent('MICROPHONE_MUTED', { muted });
        });

        wespoke.on('assistantSpeaking', (speaking: boolean) => {
          setIsAssistantSpeaking(speaking);
          logEvent('ASSISTANT_SPEAKING', { speaking });
        });

        wespoke.on('toolEvent', (event: any) => {
          logEvent('TOOL_EVENT', { tool: event.toolName, type: event.type });
        });

        wespoke.on('callEnding', (event: any) => {
          logEvent('CALL_ENDING', { reason: event.reason });
        });

        wespoke.on('bargeIn', () => {
          logEvent('BARGE_IN');
        });

        wespoke.on('connectionQualityChanged', (quality: any) => {
          logEvent('CONNECTION_QUALITY', { quality });
        });

        wespoke.on('metrics', (metrics: any) => {
          logEvent('METRICS', metrics);
        });

        wespoke.on('error', (err: Error) => {
          setError(err);
          logEvent('ERROR', { message: err.message });
          options.onError?.(err);
        });

        wespokeRef.current = wespoke;
        isInitialized.current = true;
      } catch (err) {
        console.error('Failed to initialize Wespoke SDK:', err);
        setError(err as Error);
      }
    };

    initializeSDK();

    // Cleanup
    return () => {
      if (wespokeRef.current) {
        wespokeRef.current.destroy();
        wespokeRef.current = null;
        isInitialized.current = false;
      }
    };
  }, [options.apiKey, options.apiUrl, options.debug, logEvent]);

  // Start call
  const startCall = useCallback(async (assistantId: string, metadata?: any) => {
    if (!wespokeRef.current) {
      throw new Error('SDK not initialized');
    }

    try {
      setError(null);
      await wespokeRef.current.startCall(assistantId, { metadata });
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  // End call
  const endCall = useCallback(async () => {
    if (!wespokeRef.current) {
      throw new Error('SDK not initialized');
    }

    try {
      await wespokeRef.current.endCall();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(async () => {
    if (!wespokeRef.current) {
      throw new Error('SDK not initialized');
    }

    try {
      await wespokeRef.current.toggleMute();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (message: string) => {
    if (!wespokeRef.current) {
      throw new Error('SDK not initialized');
    }

    try {
      await wespokeRef.current.sendMessage(message);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Clear events
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    state,
    isMuted,
    isAssistantSpeaking,
    callId,
    messages,
    events,
    startCall,
    endCall,
    toggleMute,
    sendMessage,
    clearMessages,
    clearEvents,
    error,
  };
}
