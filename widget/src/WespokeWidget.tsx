import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Wespoke } from '@wespoke/web-sdk';
import { WespokeWidgetConfig, WespokeWidgetAPI, WidgetMessage, WidgetState, WidgetError } from './types';
import { FloatingButton } from './components/FloatingButton';
import { ChatWindow } from './components/ChatWindow';
import { VoiceControls } from './components/VoiceControls';
import { ChatInput } from './components/ChatInput';
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
    borderRadius = 'medium',
    baseColor,
    buttonBaseColor,
    buttonAccentColor,
    size = 'medium',
    mode = 'voice',
    autoOpen = false,
    showTranscript = true,
    requireConsent = true,
    buttonText,
    placeholderText,
    metadata = {},
    assistantOverrides,
    locale: _locale = 'tr', // Prefix with _ to indicate intentionally unused for now
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
  const [voiceState, setVoiceState] = useState<WidgetState>('idle'); // Separate state for voice calls
  const [chatState, setChatState] = useState<WidgetState>('idle'); // Separate state for chat sessions
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [badgeCount, setBadgeCount] = useState(0);

  // Refs
  const sdkRef = useRef<Wespoke | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatStartAttemptedRef = useRef<boolean>(false);
  const isOpenRef = useRef<boolean>(isOpen);
  const chatStateRef = useRef<WidgetState>(chatState);
  const voiceStateRef = useRef<WidgetState>(voiceState);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Set CSS custom properties for styling
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--wespoke-widget-z-index', zIndex.toString());

    // Border radius mapping
    const borderRadiusMap = {
      'none': '0px',
      'small': '8px',
      'medium': '16px',
      'large': '24px'
    };
    root.style.setProperty('--wespoke-border-radius', borderRadiusMap[borderRadius]);

    // Base color for widget background
    if (baseColor) {
      root.style.setProperty('--wespoke-base-color', baseColor);
    }

    // Button colors
    if (buttonBaseColor) {
      root.style.setProperty('--wespoke-button-base-color', buttonBaseColor);
    }
    if (buttonAccentColor) {
      root.style.setProperty('--wespoke-button-accent-color', buttonAccentColor);
    }
  }, [zIndex, borderRadius, baseColor, buttonBaseColor, buttonAccentColor]);

  // Keep refs in sync with state to avoid stale closure values in setTimeout
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    chatStateRef.current = chatState;
  }, [chatState]);

  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  // Handle state changes
  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  // Handle transcript updates
  useEffect(() => {
    onTranscriptUpdate?.(messages);
  }, [messages, onTranscriptUpdate]);

  // Initialize SDK - only run once on mount
  useEffect(() => {
    // Only initialize once
    if (sdkRef.current) {
      return;
    }

    if (debug) {
      console.log('[Wespoke Widget] Initializing with config:', {
        apiKey: `${apiKey.substring(0, 10)}...`,
        assistantId,
        apiUrl
      });
    }

    // Initialize @wespoke/web-sdk
    sdkRef.current = new Wespoke({
      apiKey,
      apiUrl,
      debug
    });

    // Set up event listeners
    sdkRef.current.on('message', (message: any) => {
      const widgetMessage: WidgetMessage = {
        id: message.id || `msg-${Date.now()}`,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp || Date.now()
      };

      // Update or append message based on ID
      // The SDK emits messages twice for streaming: first chunk + final complete
      // We need to replace the existing message when the final version arrives
      setMessages(prev => {
        const existingIndex = prev.findIndex(m => m.id === widgetMessage.id);
        if (existingIndex !== -1) {
          // Replace existing message with updated content
          const updated = [...prev];
          updated[existingIndex] = widgetMessage;
          return updated;
        } else {
          // Append new message
          return [...prev, widgetMessage];
        }
      });

      onMessage?.(widgetMessage);
    });

    // Also listen for transcription events (user speech)
    sdkRef.current.on('transcription', (transcription: any) => {
      // Only show final transcriptions as messages
      if (transcription.isFinal && transcription.text && transcription.text.trim()) {
        const widgetMessage: WidgetMessage = {
          id: transcription.transcriptionId || `transcription-${Date.now()}`,
          role: 'user',
          content: transcription.text,
          timestamp: transcription.timestamp || Date.now()
        };
        setMessages(prev => [...prev, widgetMessage]);
        onMessage?.(widgetMessage);
      }
    });

    sdkRef.current.on('stateChange', (newState: string) => {
      // Map SDK states to widget states
      const widgetState: WidgetState =
        newState === 'connected' ? 'connected' :
        newState === 'connecting' ? 'connecting' :
        'idle';
      setState(widgetState);
    });

    sdkRef.current.on('disconnected', (reason?: string) => {
      if (debug) {
        console.log('[Wespoke Widget] SDK disconnected:', reason);
      }
      // Reset both voice and chat states to idle on disconnect
      // This ensures hybrid mode UI is properly updated on remote disconnects
      setVoiceState('idle');
      setChatState('idle');
      setState('idle');
      // Reset chat start flag to allow auto-restart after remote disconnect
      // Without this, chat mode stays permanently disabled until widget is closed/reopened
      chatStartAttemptedRef.current = false;
    });

    sdkRef.current.on('error', (error: any) => {
      const widgetError: WidgetError = {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message || 'An error occurred',
        details: error
      };
      onError?.(widgetError);
    });

    return () => {
      // Cleanup SDK on unmount - end sessions and remove listeners
      if (sdkRef.current) {
        // End voice call if active
        sdkRef.current.endCall().catch(() => {
          // Ignore errors during cleanup
        });
        // End chat session if active
        sdkRef.current.endChatSession().catch(() => {
          // Ignore errors during cleanup
        });
        // Destroy SDK instance to remove all event listeners
        // This prevents memory leaks and "Can't update unmounted component" warnings
        sdkRef.current.destroy();
        sdkRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - callbacks use latest values via closure

  // Handle opening/closing
  const handleToggle = useCallback(() => {
    const willBeOpen = !isOpen;
    setIsOpen(willBeOpen);

    if (willBeOpen) {
      // Opening: clear badge and reset chat start attempt flag
      setBadgeCount(0);
      chatStartAttemptedRef.current = false;
    } else {
      // Closing: end any active sessions (voice or chat)
      chatStartAttemptedRef.current = false;

      // Cancel any pending retry timeout to prevent background retry after widget closed
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      if (sdkRef.current) {
        // In hybrid mode, need to end both voice and chat if active
        if (mode === 'hybrid') {
          if (voiceState !== 'idle') {
            sdkRef.current.endCall().catch((error) => {
              const err: WidgetError = {
                code: 'CALL_END_FAILED',
                message: error instanceof Error ? error.message : 'Failed to end call',
                details: error
              };
              onError?.(err);
            });
          }
          if (chatState !== 'idle') {
            sdkRef.current.endChatSession().catch((error) => {
              const err: WidgetError = {
                code: 'CHAT_END_FAILED',
                message: error instanceof Error ? error.message : 'Failed to end chat session',
                details: error
              };
              onError?.(err);
            });
          }
        } else if (mode === 'chat' && state !== 'idle') {
          // End chat session for chat mode only
          sdkRef.current.endChatSession().catch((error) => {
            const err: WidgetError = {
              code: 'CHAT_END_FAILED',
              message: error instanceof Error ? error.message : 'Failed to end chat session',
              details: error
            };
            onError?.(err);
          });
        } else if (mode === 'voice' && state !== 'idle') {
          // End voice call for voice mode only
          sdkRef.current.endCall().catch((error) => {
            const err: WidgetError = {
              code: 'CALL_END_FAILED',
              message: error instanceof Error ? error.message : 'Failed to end call',
              details: error
            };
            onError?.(err);
          });
        }

        // Only reset states and invoke onCallEnd if a session was actually active
        const hadActiveSession = voiceState !== 'idle' || chatState !== 'idle';
        if (hadActiveSession) {
          setState('idle');
          setVoiceState('idle');
          setChatState('idle');
          onCallEnd?.();
        }
      }
    }
  }, [isOpen, mode, state, voiceState, chatState, onError, onCallEnd]);

  // Handle call control
  const handleStartCall = useCallback(async () => {
    if (!sdkRef.current) {
      console.error('[Wespoke Widget] SDK not initialized');
      return;
    }

    try {
      // In hybrid mode, if chat session is active, end it before starting voice call
      // The SDK enforces mutual exclusion - only one session type can be active
      if (mode === 'hybrid' && chatState !== 'idle') {
        if (debug) {
          console.log('[Wespoke Widget] Ending chat session before starting voice call');
        }
        await sdkRef.current.endChatSession();
        setChatState('idle');
        // Reset flag so chat can auto-restart after voice call ends
        chatStartAttemptedRef.current = false;
      }

      setVoiceState('connecting');
      setState('connecting');

      if (debug) {
        console.log('[Wespoke Widget] Starting call with assistant:', assistantId);
      }

      // Start the call using the SDK
      await sdkRef.current.startCall(assistantId, { metadata, assistantOverrides });

      setVoiceState('connected');
      setState('connected');
      onCallStart?.();

      if (debug) {
        console.log('[Wespoke Widget] Call started successfully');
      }
    } catch (error) {
      const err: WidgetError = {
        code: 'CALL_START_FAILED',
        message: error instanceof Error ? error.message : 'Failed to start call',
        details: error
      };
      onError?.(err);
      setVoiceState('idle');
      setState('idle');

      if (debug) {
        console.error('[Wespoke Widget] Failed to start call:', error);
      }
    }
  }, [mode, chatState, assistantId, metadata, assistantOverrides, onCallStart, onError, debug]);

  const handleEndCall = useCallback(async () => {
    if (!sdkRef.current) {
      console.error('[Wespoke Widget] SDK not initialized');
      return;
    }

    try {
      await sdkRef.current.endCall();

      setVoiceState('idle');
      // In hybrid mode, reset main state to idle if chat is also idle
      // This allows chat to auto-restart after voice call ends
      if (mode === 'hybrid') {
        // Use functional setState to read current chatState
        setChatState((currentChatState) => {
          if (currentChatState === 'idle') {
            setState('idle');
          }
          return currentChatState;
        });
      } else {
        // Voice-only mode, always reset to idle
        setState('idle');
      }
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
  }, [mode, onCallEnd, onError, debug]);

  const handleToggleMute = useCallback(async () => {
    if (!sdkRef.current) {
      console.error('[Wespoke Widget] SDK not initialized');
      return isMuted;
    }

    try {
      const sdkMuteState = await sdkRef.current.toggleMute();
      // SDK returns muted state (true = muted, false = unmuted)
      // Widget uses the same convention, so no inversion needed
      setIsMuted(sdkMuteState);

      if (debug) {
        console.log('[Wespoke Widget] Mute toggled - muted:', sdkMuteState);
      }

      return sdkMuteState;
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

  // Handle chat mode
  const handleStartChatSession = useCallback(async () => {
    if (!sdkRef.current) {
      console.error('[Wespoke Widget] SDK not initialized');
      return;
    }

    // Mark that we've attempted to start
    chatStartAttemptedRef.current = true;

    try {
      setChatState('connecting');
      // In hybrid mode, voice might already be running, don't override
      if (mode !== 'hybrid' || voiceState === 'idle') {
        setState('connecting');
      }

      if (debug) {
        console.log('[Wespoke Widget] Starting chat session with assistant:', assistantId);
      }

      // Start chat session using the SDK
      await sdkRef.current.startChatSession(assistantId, { metadata, assistantOverrides });

      setChatState('connected');
      // In hybrid mode, voice might already be running, don't override
      if (mode !== 'hybrid' || voiceState === 'idle') {
        setState('connected');
      }
      onCallStart?.();

      if (debug) {
        console.log('[Wespoke Widget] Chat session started successfully');
      }
    } catch (error) {
      // Check if this was an intentional abort (user closed widget during connection)
      const errorCode = error && typeof error === 'object' && 'code' in error ? error.code : null;
      const errorName = error && typeof error === 'object' && 'name' in error ? error.name : null;
      const isAbort = errorCode === 'CHAT_START_ABORTED';
      const isCallInProgress = errorCode === 'CALL_IN_PROGRESS';
      const isAuthError = errorCode === 'AUTHENTICATION_ERROR' || errorName === 'AuthenticationError';

      if (isAbort) {
        // Treat abort as normal close - don't fire error callback or retry
        if (debug) {
          console.log('[Wespoke Widget] Chat session start aborted (user closed widget)');
        }
        setChatState('idle');
        if (mode !== 'hybrid' || voiceState === 'idle') {
          setState('idle');
        }
        // Reset flag to allow future starts
        chatStartAttemptedRef.current = false;
        return;
      }

      // Real failure - fire error callback
      const err: WidgetError = {
        code: 'CHAT_START_FAILED',
        message: error instanceof Error ? error.message : 'Failed to start chat session',
        details: error
      };
      onError?.(err);
      setChatState('idle');
      if (mode !== 'hybrid' || voiceState === 'idle') {
        setState('idle');
      }

      // Don't retry permanent errors (auth failures, voice call active)
      // Retrying would just hammer the API endpoint with no chance of success
      if (isCallInProgress || isAuthError) {
        if (debug) {
          console.log(`[Wespoke Widget] Skipping chat retry - ${isAuthError ? 'auth error' : 'voice call is active'}`);
        }
        chatStartAttemptedRef.current = false;
        return;
      }

      // Reset flag and retry after a delay to allow recovery from transient failures
      // This prevents rapid retry spam while still allowing automatic recovery
      // Use refs to read latest state values (not stale closure values)
      retryTimeoutRef.current = setTimeout(() => {
        chatStartAttemptedRef.current = false;
        // Read latest values from refs to avoid stale closure
        // Only retry if widget is still open, in chat/hybrid mode, chat is idle, AND voice call is not active
        if (
          isOpenRef.current &&
          (mode === 'chat' || mode === 'hybrid') &&
          chatStateRef.current === 'idle' &&
          voiceStateRef.current === 'idle'
        ) {
          if (debug) {
            console.log('[Wespoke Widget] Retrying chat session after failure');
          }
          handleStartChatSession();
        }
      }, 2000); // 2 second delay before retry

      if (debug) {
        console.error('[Wespoke Widget] Failed to start chat session:', error);
      }
    }
  }, [mode, voiceState, assistantId, metadata, assistantOverrides, onCallStart, onError, debug, isOpen, chatState]);

  const handleSendChatMessage = useCallback(async (message: string) => {
    if (!sdkRef.current) {
      console.error('[Wespoke Widget] SDK not initialized');
      return;
    }

    try {
      if (debug) {
        console.log('[Wespoke Widget] Sending chat message:', message);
      }

      await sdkRef.current.sendChatMessage(message);

      if (debug) {
        console.log('[Wespoke Widget] Chat message sent successfully');
      }
    } catch (error) {
      const err: WidgetError = {
        code: 'CHAT_MESSAGE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to send chat message',
        details: error
      };
      onError?.(err);

      if (debug) {
        console.error('[Wespoke Widget] Failed to send chat message:', error);
      }
    }
  }, [onError, debug]);

  const handleEndChatSession = useCallback(async () => {
    if (!sdkRef.current) {
      console.error('[Wespoke Widget] SDK not initialized');
      return;
    }

    try {
      await sdkRef.current.endChatSession();

      setChatState('idle');
      // Reset main state based on mode - read current voiceState from ref to avoid stale closure
      if (mode === 'chat') {
        setState('idle');
      } else if (mode === 'hybrid') {
        // In hybrid mode, only set to idle if voice is also idle
        // Use functional setState to read current state values
        setVoiceState((currentVoiceState) => {
          if (currentVoiceState === 'idle') {
            setState('idle');
          }
          return currentVoiceState;
        });
      }
      // Reset flag so auto-start can trigger a new session if needed
      chatStartAttemptedRef.current = false;
      onCallEnd?.();

      if (debug) {
        console.log('[Wespoke Widget] Chat session ended');
      }
    } catch (error) {
      const err: WidgetError = {
        code: 'CHAT_END_FAILED',
        message: error instanceof Error ? error.message : 'Failed to end chat session',
        details: error
      };
      onError?.(err);

      // Reset states even on error to sync with SDK (which already cleared currentChatId)
      setChatState('idle');
      // Reset main state based on mode
      if (mode === 'chat') {
        setState('idle');
      } else if (mode === 'hybrid') {
        // In hybrid mode, check current voice state
        setVoiceState((currentVoiceState) => {
          if (currentVoiceState === 'idle') {
            setState('idle');
          }
          return currentVoiceState;
        });
      }
      // Reset flag so auto-start can retry
      chatStartAttemptedRef.current = false;

      if (debug) {
        console.error('[Wespoke Widget] Failed to end chat session:', error);
      }
    }
  }, [mode, onCallEnd, onError, debug]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Reset chat attempt flag so reopening can trigger a fresh start
    chatStartAttemptedRef.current = false;

    // Cancel any pending retry timeout to prevent background retry after widget closed
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // End any active sessions when closing
    if (mode === 'hybrid') {
      // In hybrid mode, end both voice and chat if active
      if (voiceState !== 'idle') {
        handleEndCall();
      }
      if (chatState !== 'idle') {
        handleEndChatSession();
      }
    } else if (mode === 'chat' && state !== 'idle') {
      // End chat session for chat mode only
      handleEndChatSession();
    } else if (mode === 'voice' && state !== 'idle') {
      // End voice call for voice mode only
      handleEndCall();
    }
  }, [mode, state, voiceState, chatState, handleEndChatSession, handleEndCall]);

  // Auto-start chat session when widget opens in chat or hybrid mode
  useEffect(() => {
    if (isOpen && (mode === 'chat' || mode === 'hybrid') && state === 'idle' && sdkRef.current && !chatStartAttemptedRef.current) {
      handleStartChatSession();
    }
  }, [isOpen, mode, state, handleStartChatSession]);

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
        mode={mode}
      />

      {/* Chat Window */}
      <ChatWindow
        isOpen={isOpen}
        size={size}
        position={position}
        primaryColor={primaryColor}
        accentColor={accentColor}
        onClose={handleClose}
      >
        {/* Transcript */}
        <Transcript
          messages={messages}
          showTranscript={showTranscript}
          placeholderText={placeholderText}
        />

        {/* Conditional rendering based on mode */}
        {mode === 'voice' ? (
          /* Voice Controls for voice mode */
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
        ) : mode === 'chat' ? (
          /* Chat Input for chat mode */
          <ChatInput
            onSendMessage={handleSendChatMessage}
            disabled={state !== 'connected'}
            placeholder={placeholderText}
          />
        ) : mode === 'hybrid' ? (
          /* Hybrid mode - both voice and chat controls with separate states */
          <>
            <VoiceControls
              state={voiceState}
              isMuted={isMuted}
              primaryColor={primaryColor}
              accentColor={accentColor}
              onStartCall={handleStartCall}
              onEndCall={handleEndCall}
              onToggleMute={handleToggleMute}
              requireConsent={requireConsent}
            />
            <ChatInput
              onSendMessage={handleSendChatMessage}
              disabled={chatState !== 'connected'}
              placeholder={placeholderText}
            />
          </>
        ) : null}
      </ChatWindow>
    </div>
  );
};

// Factory function for vanilla JS usage
export const create = (config: WespokeWidgetConfig): WespokeWidgetAPI => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  // Render React component to container using React 18 API
  const root = createRoot(container);
  root.render(React.createElement(WespokeWidget, config));

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
      // Unmount React component and remove from DOM
      root.unmount();
      container.remove();
      console.log('[Wespoke Widget] API: destroy()');
    },
    updateConfig: (newConfig: Partial<WespokeWidgetConfig>) => {
      // TODO: Update configuration
      console.log('[Wespoke Widget] API: updateConfig()', newConfig);
    }
  };
};
