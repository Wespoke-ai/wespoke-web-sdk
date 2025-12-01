import { ref, onMounted, onUnmounted, Ref } from 'vue';

// Import types from the SDK
// Note: In a real app, these would come from @wespoke/web-sdk
// For this example, we'll define them inline
type CallState = 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTING' | 'DISCONNECTED' | 'ERROR';

interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp?: number;
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
  state: Ref<CallState>;
  isMuted: Ref<boolean>;
  isAssistantSpeaking: Ref<boolean>;
  callId: Ref<string | null>;
  messages: Ref<Message[]>;
  error: Ref<Error | null>;
  startCall: (assistantId: string, metadata?: any) => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
}

export function useWespoke(options: UseWespokeOptions): UseWespokeReturn {
  const state = ref<CallState>('IDLE');
  const isMuted = ref(false);
  const isAssistantSpeaking = ref(false);
  const callId = ref<string | null>(null);
  const messages = ref<Message[]>([]);
  const error = ref<Error | null>(null);

  let wespokeInstance: any = null;

  // Initialize SDK
  onMounted(async () => {
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
        state.value = newState;
        options.onStateChange?.(newState);
      });

      wespoke.on('connected', () => {
        callId.value = wespoke.getCallId();
        options.onConnected?.();
      });

      wespoke.on('disconnected', (reason?: string) => {
        callId.value = null;
        options.onDisconnected?.(reason);
      });

      wespoke.on('message', (message: Message) => {
        messages.value.push(message);
        options.onMessage?.(message);
      });

      wespoke.on('microphoneMuted', (muted: boolean) => {
        isMuted.value = muted;
      });

      wespoke.on('assistantSpeaking', (speaking: boolean) => {
        isAssistantSpeaking.value = speaking;
      });

      wespoke.on('error', (err: Error) => {
        error.value = err;
        options.onError?.(err);
      });

      wespokeInstance = wespoke;
    } catch (err) {
      console.error('Failed to initialize Wespoke SDK:', err);
      error.value = err as Error;
    }
  });

  // Cleanup
  onUnmounted(() => {
    if (wespokeInstance) {
      wespokeInstance.destroy();
      wespokeInstance = null;
    }
  });

  // Start call
  const startCall = async (assistantId: string, metadata?: any) => {
    if (!wespokeInstance) {
      throw new Error('SDK not initialized');
    }

    try {
      error.value = null;
      await wespokeInstance.startCall(assistantId, { metadata });
    } catch (err) {
      error.value = err as Error;
      throw err;
    }
  };

  // End call
  const endCall = async () => {
    if (!wespokeInstance) {
      throw new Error('SDK not initialized');
    }

    try {
      await wespokeInstance.endCall();
    } catch (err) {
      error.value = err as Error;
      throw err;
    }
  };

  // Toggle mute
  const toggleMute = async () => {
    if (!wespokeInstance) {
      throw new Error('SDK not initialized');
    }

    try {
      await wespokeInstance.toggleMute();
    } catch (err) {
      error.value = err as Error;
      throw err;
    }
  };

  // Send message
  const sendMessage = async (message: string) => {
    if (!wespokeInstance) {
      throw new Error('SDK not initialized');
    }

    try {
      await wespokeInstance.sendMessage(message);
    } catch (err) {
      error.value = err as Error;
      throw err;
    }
  };

  // Clear messages
  const clearMessages = () => {
    messages.value = [];
  };

  return {
    state,
    isMuted,
    isAssistantSpeaking,
    callId,
    messages,
    error,
    startCall,
    endCall,
    toggleMute,
    sendMessage,
    clearMessages,
  };
}
