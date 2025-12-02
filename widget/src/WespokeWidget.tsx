import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WespokeWidgetConfig, WespokeWidgetAPI, WidgetMessage, WidgetState, WidgetError } from './types';
import { FloatingButton } from './components/FloatingButton';
import { ChatWindow } from './components/ChatWindow';
import { VoiceControls } from './components/VoiceControls';
import { Transcript } from './components/Transcript';

// Import base styles
import './styles/widget-base.css';

export const WespokeWidget: React.FC<WespokeWidgetConfig> = (config) => {
  // Destructure config with defaults
  const {
    apiKey,
    assistantId,
    apiUrl = 'https://api.wespoke.ai',
    position = 'bottom-right',
    theme = 'dark',
    primaryColor = '#4d8e8c',
    accentColor = '#6db3b0',
    size = 'medium',
    autoOpen = false,
    showTranscript = true,
    requireConsent = true,
    buttonText,
    welcomeMessage,
    placeholderText,
    metadata = {},
    locale = 'tr',
    debug = false,
    zIndex = 9999,
    onCallStart,
    onCallEnd,
    onMessage,
    onError,
    onTranscriptUpdate,
    onStateChange
  } = config;

  // State
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [state, setState] = useState<WidgetState>('idle');
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [badgeCount, setBadgeCount] = useState(0);

  // Refs
  const sdkRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Set CSS custom property for z-index
  useEffect(() => {
    document.documentElement.style.setProperty('--wespoke-widget-z-index', zIndex.toString());
  }, [zIndex]);

  // Handle state changes
  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  // Handle transcript updates
  useEffect(() => {
    onTranscriptUpdate?.(messages);
  }, [messages, onTranscriptUpdate]);

  // Initialize SDK (placeholder - actual SDK integration will be implemented)
  useEffect(() => {
    if (debug) {
      console.log('[Wespoke Widget] Initializing with config:', {
        apiKey: `${apiKey.substring(0, 10)}...`,
        assistantId,
        apiUrl
      });
    }

    // TODO: Initialize @wespoke/web-sdk here
    // sdkRef.current = new Wespoke({ apiKey, assistantId, apiUrl, ...metadata });

    return () => {
      // Cleanup SDK on unmount
      if (sdkRef.current) {
        // TODO: Call SDK cleanup
        // sdkRef.current.disconnect();
      }
    };
  }, [apiKey, assistantId, apiUrl, metadata, debug]);

  // Handle opening/closing
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setBadgeCount(0); // Clear badge when opening
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      setBadgeCount(0);
    }
  }, [isOpen]);

  // Handle call control
  const handleStartCall = useCallback(async () => {
    try {
      setState('connecting');

      // TODO: Implement actual SDK call start
      // await sdkRef.current.startCall();

      setState('connected');
      onCallStart?.();

      // Simulate a welcome message (remove after SDK integration)
      const welcomeMsg: WidgetMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'Merhaba! Size nasıl yardımcı olabilirim?',
        timestamp: Date.now()
      };
      setMessages([welcomeMsg]);
      onMessage?.(welcomeMsg);

      if (debug) {
        console.log('[Wespoke Widget] Call started');
      }
    } catch (error) {
      const err: WidgetError = {
        code: 'CALL_START_FAILED',
        message: error instanceof Error ? error.message : 'Failed to start call',
        details: error
      };
      onError?.(err);
      setState('idle');

      if (debug) {
        console.error('[Wespoke Widget] Failed to start call:', error);
      }
    }
  }, [onCallStart, onMessage, onError, debug]);

  const handleEndCall = useCallback(async () => {
    try {
      // TODO: Implement actual SDK call end
      // await sdkRef.current.endCall();

      setState('idle');
      onCallEnd?.();

      if (debug) {
        console.log('[Wespoke Widget] Call ended');
      }
    } catch (error) {
      const err: WidgetError = {
        code: 'CALL_END_FAILED',
        message: error instanceof Error ? error.message : 'Failed to end call',
        details: error
      };
      onError?.(err);

      if (debug) {
        console.error('[Wespoke Widget] Failed to end call:', error);
      }
    }
  }, [onCallEnd, onError, debug]);

  const handleToggleMute = useCallback(async () => {
    try {
      // TODO: Implement actual SDK mute toggle
      // const newMutedState = await sdkRef.current.toggleMute();

      const newMutedState = !isMuted;
      setIsMuted(newMutedState);

      if (debug) {
        console.log('[Wespoke Widget] Mute toggled:', newMutedState);
      }

      return newMutedState;
    } catch (error) {
      const err: WidgetError = {
        code: 'MUTE_TOGGLE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to toggle mute',
        details: error
      };
      onError?.(err);

      if (debug) {
        console.error('[Wespoke Widget] Failed to toggle mute:', error);
      }

      return isMuted;
    }
  }, [isMuted, onError, debug]);

  // Apply theme class
  const themeClass = theme === 'light' ? 'wespoke-widget-light' : '';

  return (
    <div ref={containerRef} className={`wespoke-widget ${themeClass}`}>
      {/* Floating Action Button */}
      <FloatingButton
        position={position}
        isOpen={isOpen}
        isActive={state === 'connected'}
        primaryColor={primaryColor}
        accentColor={accentColor}
        onClick={handleToggle}
        badgeCount={badgeCount}
        buttonText={buttonText}
      />

      {/* Chat Window */}
      <ChatWindow
        isOpen={isOpen}
        size={size}
        position={position}
        primaryColor={primaryColor}
        accentColor={accentColor}
        welcomeMessage={welcomeMessage}
        onClose={handleClose}
      >
        {/* Transcript */}
        <Transcript
          messages={messages}
          showTranscript={showTranscript}
          placeholderText={placeholderText}
        />

        {/* Voice Controls */}
        <VoiceControls
          state={state}
          isMuted={isMuted}
          primaryColor={primaryColor}
          accentColor={accentColor}
          onStartCall={handleStartCall}
          onEndCall={handleEndCall}
          onToggleMute={handleToggleMute}
          requireConsent={requireConsent}
        />
      </ChatWindow>
    </div>
  );
};

// Factory function for vanilla JS usage
export const create = (config: WespokeWidgetConfig): WespokeWidgetAPI => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  // TODO: Render React component to container
  // ReactDOM.render(<WespokeWidget {...config} />, container);

  // Return API methods
  return {
    open: () => {
      // TODO: Trigger open via ref or state management
      console.log('[Wespoke Widget] API: open()');
    },
    close: () => {
      // TODO: Trigger close
      console.log('[Wespoke Widget] API: close()');
    },
    toggle: () => {
      // TODO: Trigger toggle
      console.log('[Wespoke Widget] API: toggle()');
    },
    startCall: async () => {
      // TODO: Trigger startCall
      console.log('[Wespoke Widget] API: startCall()');
    },
    endCall: async () => {
      // TODO: Trigger endCall
      console.log('[Wespoke Widget] API: endCall()');
    },
    toggleMute: async () => {
      // TODO: Trigger toggleMute
      console.log('[Wespoke Widget] API: toggleMute()');
      return false;
    },
    isMuted: () => {
      // TODO: Return muted state
      return false;
    },
    getState: () => {
      // TODO: Return current state
      return 'idle';
    },
    getTranscript: () => {
      // TODO: Return messages
      return [];
    },
    clearTranscript: () => {
      // TODO: Clear messages
      console.log('[Wespoke Widget] API: clearTranscript()');
    },
    destroy: () => {
      // TODO: Cleanup and remove from DOM
      container.remove();
      console.log('[Wespoke Widget] API: destroy()');
    },
    updateConfig: (newConfig: Partial<WespokeWidgetConfig>) => {
      // TODO: Update configuration
      console.log('[Wespoke Widget] API: updateConfig()', newConfig);
    }
  };
};
