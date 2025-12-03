/**
 * Wespoke Web SDK (REST API Version)
 * Official JavaScript SDK for embedding Wespoke AI voice assistants
 *
 * This version uses REST API endpoints instead of LiveKit client for call control
 */

import { Room, RoomEvent, Track, ConnectionState, ConnectionQuality, LocalAudioTrack, createLocalAudioTrack, AudioPresets, RemoteParticipant, RemoteTrack } from 'livekit-client';
import { EventEmitter } from './EventEmitter';
import {
  WespokeConfig,
  CallOptions,
  CallState,
  WespokeEvents,
  TokenResponse,
  ConversationMessage,
  TranscriptionEvent,
  ToolEvent,
  CallMetrics,
  CallEndingEvent,
  ChatSessionResponse
} from './types';
import {
  WespokeError,
  ConfigurationError,
  ConnectionError,
  MediaDevicesError,
  parseAPIError
} from './errors';

export class Wespoke extends EventEmitter<WespokeEvents> {
  private config: Required<WespokeConfig>;
  private room: Room | null = null;
  private localAudioTrack: LocalAudioTrack | null = null;
  private assistantParticipant: RemoteParticipant | null = null;
  private attachedTracks: Map<string, HTMLAudioElement> = new Map();
  private callState: CallState = CallState.IDLE;
  private currentCallId: string | null = null;
  private currentChatId: string | null = null;
  private abortController: AbortController | null = null;
  private chatAbortController: AbortController | null = null;
  private pollInterval: NodeJS.Timeout | null = null;
  private seenMessageIds: Set<string> = new Set();
  private shouldEndChatAfterStart: boolean = false;

  constructor(config: WespokeConfig) {
    super();

    // Validate required config
    if (!config.apiKey) {
      throw new ConfigurationError('API key is required');
    }

    if (!config.apiKey.startsWith('pk_')) {
      throw new ConfigurationError('Invalid API key format. Must start with pk_live_ or pk_test_');
    }

    // Set defaults
    this.config = {
      apiKey: config.apiKey,
      apiUrl: config.apiUrl || 'https://api.wespoke.com.tr',
      debug: config.debug || false,
      maxRetryAttempts: config.maxRetryAttempts || 3,
      retryDelay: config.retryDelay || 2000
    };

    this.log('Wespoke SDK initialized (REST API mode)');
  }

  /**
   * Start a call with an assistant
   */
  async startCall(assistantId: string, options: CallOptions = {}): Promise<void> {
    if (this.callState !== CallState.IDLE && this.callState !== CallState.DISCONNECTED) {
      throw new WespokeError('A call is already in progress', 'CALL_IN_PROGRESS');
    }

    this.setState(CallState.CONNECTING);

    // Clear seen messages for new call
    this.seenMessageIds.clear();

    try {
      // 1. Fetch token from API
      this.log('Fetching token from API...');
      const tokenData = await this.fetchToken(assistantId, options);

      this.currentCallId = tokenData.callId;
      this.log(`Token received. Call ID: ${this.currentCallId}`);

      // 2. Create LiveKit room
      this.createRoom();

      // 3. Activate audio context
      await this.activateAudioContext();

      // 4. Connect to LiveKit
      await this.connectToRoom(tokenData.url, tokenData.token);

      // 5. Publish local audio
      await this.publishLocalAudio();

      // 6. Check for existing participants
      this.checkExistingParticipants();

      // 7. Start polling for messages
      this.startMessagePolling();

      this.setState(CallState.CONNECTED);
      this.log('Call started successfully');
    } catch (error) {
      // Reset to IDLE (not ERROR) to allow retries after transient failures
      this.setState(CallState.IDLE);
      // Clear any partial call state
      this.currentCallId = null;
      this.log('Error starting call:', error);
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * End the current call (uses REST API)
   */
  async endCall(): Promise<void> {
    if (this.callState === CallState.IDLE || !this.currentCallId) {
      return;
    }

    this.setState(CallState.DISCONNECTING);

    try {
      // Stop message polling
      this.stopMessagePolling();

      // Call REST API to end the call
      this.log('Calling REST API to end call...');
      const url = `${this.config.apiUrl}/api/v1/embed/calls/${this.currentCallId}/end`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        this.log('Failed to end call via API:', data);
        // Continue with cleanup even if API call fails
      }

      // Abort any ongoing connection attempts
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }

      // Clean up tracks
      this.cleanupAllTracks();

      // Unpublish local audio
      if (this.localAudioTrack && this.room) {
        this.room.localParticipant.unpublishTrack(this.localAudioTrack);
        this.localAudioTrack.stop();
        this.localAudioTrack = null;
      }

      // Reset assistant
      this.assistantParticipant = null;

      // Disconnect room
      if (this.room) {
        await this.room.disconnect();
        this.room = null;
      }

      this.currentCallId = null;
      this.seenMessageIds.clear();
      this.setState(CallState.DISCONNECTED);
      this.log('Call ended');
    } catch (error) {
      this.log('Error ending call:', error);
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Toggle microphone mute state (uses REST API)
   */
  async toggleMute(): Promise<boolean> {
    if (!this.currentCallId) {
      throw new WespokeError('No active call', 'NO_ACTIVE_CALL');
    }

    if (!this.localAudioTrack) {
      throw new WespokeError('No active audio track', 'NO_AUDIO_TRACK');
    }

    const currentMuted = this.localAudioTrack.isMuted;
    const newMuted = !currentMuted;

    try {
      // Call REST API to toggle mute
      const url = `${this.config.apiUrl}/api/v1/embed/calls/${this.currentCallId}/mute`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({ muted: newMuted })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw parseAPIError(data, response.status);
      }

      // Update local track state to match
      if (newMuted) {
        await this.localAudioTrack.mute();
      } else {
        await this.localAudioTrack.unmute();
      }

      this.emit('microphoneMuted', newMuted);

      return newMuted; // Return muted state (true = muted, false = unmuted)
    } catch (error) {
      this.log('Error toggling mute:', error);
      throw error;
    }
  }

  /**
   * Check if microphone is muted
   */
  isMuted(): boolean {
    return this.localAudioTrack ? this.localAudioTrack.isMuted : true;
  }

  /**
   * Check if assistant is currently speaking
   */
  isAssistantSpeaking(): boolean {
    return this.assistantParticipant?.isSpeaking || false;
  }

  /**
   * Get current call state
   */
  getState(): CallState {
    return this.callState;
  }

  /**
   * Get current call ID
   */
  getCallId(): string | null {
    return this.currentCallId;
  }

  /**
   * Get connection state from LiveKit
   */
  getConnectionState(): ConnectionState | null {
    return this.room?.state || null;
  }

  /**
   * Get connection quality
   */
  getConnectionQuality(): ConnectionQuality {
    return ConnectionQuality.Unknown; // TODO: Track from room events
  }

  /**
   * Send a text message to the assistant (uses REST API)
   */
  async sendMessage(message: string): Promise<void> {
    if (!this.currentCallId) {
      throw new WespokeError('No active call', 'NO_ACTIVE_CALL');
    }

    if (this.callState !== CallState.CONNECTED) {
      throw new WespokeError('Not connected to a call', 'NOT_CONNECTED');
    }

    try {
      // Call REST API to send message
      const url = `${this.config.apiUrl}/api/v1/embed/calls/${this.currentCallId}/messages`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw parseAPIError(data, response.status);
      }

      this.log('Message sent successfully');
    } catch (error) {
      this.log('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get messages for the current call (uses REST API)
   */
  async getMessages(limit: number = 50, offset: number = 0): Promise<ConversationMessage[]> {
    if (!this.currentCallId) {
      throw new WespokeError('No active call', 'NO_ACTIVE_CALL');
    }

    try {
      const url = `${this.config.apiUrl}/api/v1/embed/calls/${this.currentCallId}/messages?limit=${limit}&offset=${offset}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw parseAPIError(data, response.status);
      }

      return data.data.messages;
    } catch (error) {
      this.log('Error getting messages:', error);
      throw error;
    }
  }

  /**
   * Start a chat session (text-based, no voice)
   */
  async startChatSession(assistantId: string, options: CallOptions = {}): Promise<void> {
    if (this.currentChatId) {
      throw new WespokeError('A chat session is already in progress', 'CHAT_IN_PROGRESS');
    }

    if (
      (this.callState !== CallState.IDLE && this.callState !== CallState.DISCONNECTED) ||
      this.currentCallId
    ) {
      throw new WespokeError('Cannot start chat while a voice call is active', 'CALL_IN_PROGRESS');
    }

    this.setState(CallState.CONNECTING);
    this.seenMessageIds.clear();

    // Create abort controller for this chat session
    this.chatAbortController = new AbortController();
    this.shouldEndChatAfterStart = false;

    try {
      this.log('Starting chat session...');
      const url = `${this.config.apiUrl}/api/v1/embed/chat`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          assistantId,
          metadata: options.metadata || {}
        }),
        signal: this.chatAbortController.signal
      });

      const data: ChatSessionResponse = await response.json();

      if (!response.ok || !data.success) {
        throw parseAPIError(data, response.status);
      }

      this.currentChatId = data.data.chatId;

      // Check if endChatSession was called while we were connecting
      if (this.shouldEndChatAfterStart) {
        this.log('Chat session created but immediately ending due to close during connecting');
        await this.endChatSession();
        return;
      }

      this.setState(CallState.CONNECTED);
      this.log(`Chat session started. Chat ID: ${this.currentChatId}`);
      this.emit('connected');
    } catch (error) {
      // Check if it was an abort
      if (error instanceof Error && error.name === 'AbortError') {
        this.log('Chat session start aborted');
        this.setState(CallState.IDLE);
        this.emit('disconnected', 'Chat session start aborted');
        return;
      }

      this.setState(CallState.IDLE);
      this.emit('disconnected', 'Chat session failed to start');
      this.log('Error starting chat session:', error);
      this.emit('error', error as Error);
      throw error;
    } finally {
      this.chatAbortController = null;
    }
  }

  /**
   * Send a chat message and receive streaming response via SSE
   */
  async sendChatMessage(content: string): Promise<void> {
    if (!this.currentChatId) {
      throw new WespokeError('No active chat session', 'NO_ACTIVE_CHAT');
    }

    if (this.callState !== CallState.CONNECTED) {
      throw new WespokeError('Not connected to a chat session', 'NOT_CONNECTED');
    }

    try {
      // Emit user message immediately
      const userMessage: ConversationMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: Date.now(),
        isComplete: true
      };

      if (!this.seenMessageIds.has(userMessage.id)) {
        this.seenMessageIds.add(userMessage.id);
        this.emit('message', userMessage);
      }

      this.log('Sending chat message...');
      const url = `${this.config.apiUrl}/api/v1/embed/chat/${this.currentChatId}/messages`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        const data = await response.json();
        throw parseAPIError(data, response.status);
      }

      // Handle SSE streaming response
      await this.handleSSEStream(response);
    } catch (error) {
      this.log('Error sending chat message:', error);
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * End the current chat session
   */
  async endChatSession(): Promise<void> {
    // If chat is still connecting, abort the request and set flag
    if (this.callState === CallState.CONNECTING && this.chatAbortController && !this.currentChatId) {
      this.log('Aborting pending chat session start');
      this.shouldEndChatAfterStart = true;
      this.chatAbortController.abort();
      this.setState(CallState.IDLE);
      return;
    }

    // If we have a chat ID (even if still connecting), we need to end it on the server
    if (!this.currentChatId) {
      // Reset flag just in case
      this.shouldEndChatAfterStart = false;
      return;
    }

    this.setState(CallState.DISCONNECTING);

    try {
      this.log('Ending chat session...');
      const url = `${this.config.apiUrl}/api/v1/embed/chat/${this.currentChatId}/end`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        this.log('Failed to end chat session via API:', data);
        // Continue with cleanup even if API call fails
      }

      this.currentChatId = null;
      this.seenMessageIds.clear();
      this.shouldEndChatAfterStart = false;
      this.setState(CallState.DISCONNECTED);
      this.emit('disconnected', 'Chat session ended');
      this.log('Chat session ended');
    } catch (error) {
      this.log('Error ending chat session:', error);
      // Clear state even on error to allow retry
      this.currentChatId = null;
      this.shouldEndChatAfterStart = false;
      this.seenMessageIds.clear();
      // Reset to DISCONNECTED to allow new calls/chats
      this.setState(CallState.DISCONNECTED);
      this.emit('disconnected', 'Chat session ended with error');
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Get current chat ID
   */
  getChatId(): string | null {
    return this.currentChatId;
  }

  /**
   * Destroy the SDK instance and clean up resources
   */
  destroy(): void {
    this.stopMessagePolling();
    this.endCall().catch(() => {
      // Ignore errors during cleanup
    });
    this.endChatSession().catch(() => {
      // Ignore errors during cleanup
    });
    this.removeAllListeners();
    this.log('SDK destroyed');
  }

  // ===== Private Methods =====

  private async fetchToken(assistantId: string, options: CallOptions): Promise<TokenResponse['data']> {
    const url = `${this.config.apiUrl}/api/v1/embed/token`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        assistantId,
        metadata: options.metadata || {}
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw parseAPIError(data, response.status);
    }

    return data.data;
  }

  /**
   * Handle Server-Sent Events (SSE) stream from chat message response
   */
  private async handleSSEStream(response: Response): Promise<void> {
    if (!response.body) {
      throw new WespokeError('No response body', 'NO_RESPONSE_BODY');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentMessageId = `assistant-${Date.now()}`;
    let accumulatedContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages (ending with \n\n)
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // Keep incomplete message in buffer

        for (const message of messages) {
          if (!message.trim() || message.startsWith(': ')) {
            continue; // Skip empty messages and comments
          }

          // Parse SSE format with event: and data: lines
          const lines = message.split('\n');
          let eventType = '';
          let eventData: any = null;

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              try {
                const jsonData = line.slice(6); // Remove "data: " prefix
                eventData = JSON.parse(jsonData);
              } catch (error) {
                this.log('Error parsing SSE data:', error);
              }
            }
          }

          // Handle different SSE event types
          if (!eventType || !eventData) continue;

          switch (eventType) {
            case 'message:start':
              // New message starting
              currentMessageId = eventData.messageId || `assistant-${Date.now()}`;
              accumulatedContent = '';
              break;

            case 'message:chunk':
              // Streaming text chunk - just accumulate, don't emit yet
              accumulatedContent = eventData.accumulatedContent || accumulatedContent;
              // Note: We don't emit here to avoid duplicates.
              // The complete message will be emitted on message:complete
              break;

            case 'message:complete':
              // Message is complete
              const messageData = eventData.message || {};
              const completeMessage: ConversationMessage = {
                id: messageData.id || currentMessageId,
                role: messageData.role || 'assistant',
                content: messageData.content || accumulatedContent.trim(),
                timestamp: eventData.timestamp || Date.now(),
                isComplete: true
              };

              if (!this.seenMessageIds.has(completeMessage.id)) {
                this.seenMessageIds.add(completeMessage.id);
                this.emit('message', completeMessage);
              }

              // Reset for next message
              accumulatedContent = '';
              break;

            case 'tool:started':
              this.log('Tool started:', eventData.toolName);
              this.emit('toolEvent', {
                type: 'start',
                toolName: eventData.toolName,
                toolType: eventData.toolType,
                timestamp: eventData.timestamp || Date.now(),
                toolDetails: eventData.toolDetails || {}
              } as ToolEvent);
              break;

            case 'tool:completed':
              this.log('Tool completed:', eventData.toolId);
              this.emit('toolEvent', {
                type: 'complete',
                toolName: eventData.toolName,
                toolType: eventData.toolType,
                timestamp: eventData.timestamp || Date.now(),
                toolDetails: eventData.toolDetails || {}
              } as ToolEvent);
              break;

            case 'tool:failed':
              this.log('Tool failed:', eventData.toolId);
              this.emit('toolEvent', {
                type: 'failed',
                toolName: eventData.toolName,
                toolType: eventData.toolType,
                timestamp: eventData.timestamp || Date.now(),
                toolDetails: eventData.toolDetails || {}
              } as ToolEvent);
              break;

            case 'knowledge:used':
              this.log('Knowledge base used:', eventData.sources);
              // Emit knowledge event for consistency with voice sessions
              this.emit('knowledgeUsed', {
                sources: eventData.sources || [],
                timestamp: eventData.timestamp || Date.now()
              });
              break;

            case 'error':
              // Error occurred
              throw new WespokeError(eventData.message || 'Chat error', eventData.code || 'CHAT_ERROR');

            case 'done':
              // Stream complete
              return;
          }
        }
      }
    } catch (error) {
      this.log('Error reading SSE stream:', error);
      throw error;
    } finally {
      reader.releaseLock();
    }
  }

  private createRoom(): void {
    this.room = new Room({
      adaptiveStream: true,
      dynacast: true,
      publishDefaults: {
        audioPreset: AudioPresets.speech,
        simulcast: false
      },
      audioCaptureDefaults: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true
      }
    });

    this.setupRoomEventHandlers();
  }

  private setupRoomEventHandlers(): void {
    if (!this.room) return;

    // Connection events
    this.room.on(RoomEvent.Connected, () => {
      this.emit('connected');
    });

    this.room.on(RoomEvent.Disconnected, (reason) => {
      this.setState(CallState.DISCONNECTED);
      this.stopMessagePolling();
      this.emit('disconnected', reason?.toString());
    });

    this.room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
      this.emit('connectionStateChanged', state);
    });

    this.room.on(RoomEvent.ConnectionQualityChanged, (quality: ConnectionQuality) => {
      this.emit('connectionQualityChanged', quality);
    });

    // Reconnection events
    this.room.on(RoomEvent.Reconnecting, () => {
      this.emit('reconnecting');
    });

    this.room.on(RoomEvent.Reconnected, () => {
      this.emit('reconnected');
    });

    // Participant events
    this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      if (this.isAssistantParticipant(participant)) {
        if (!this.assistantParticipant) {
          this.assistantParticipant = participant;
          this.setupAssistantTracks(participant);
        }
      }
    });

    this.room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      if (participant === this.assistantParticipant) {
        this.cleanupParticipantTracks(participant);
        this.assistantParticipant = null;
      }
    });

    // Track events
    this.room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _publication, participant: RemoteParticipant) => {
      if (track.kind === Track.Kind.Audio && participant === this.assistantParticipant) {
        this.handleAssistantAudioTrack(track);
      }
    });

    this.room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
      if (track.sid) {
        this.detachTrack(track.sid);
      }
    });

    // Data channel events (still used for real-time events from agent)
    this.room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
      this.handleDataChannelMessage(payload);
    });

    // Error events
    this.room.on(RoomEvent.MediaDevicesError, (error: Error) => {
      this.log('Media devices error:', error);
      this.emit('error', new MediaDevicesError(error.message, error));
    });
  }

  private isAssistantParticipant(participant: RemoteParticipant): boolean {
    // Check metadata
    if (participant.metadata) {
      try {
        const metadata = JSON.parse(participant.metadata);
        if (metadata.role === 'assistant') {
          return true;
        }
      } catch {
        // Invalid JSON, continue
      }
    }

    // Fallback: check identity
    const identity = participant.identity.toLowerCase();
    return identity.includes('agent') || identity.includes('assistant');
  }

  private setupAssistantTracks(participant: RemoteParticipant): void {
    // Handle existing tracks
    participant.trackPublications.forEach((publication) => {
      if (publication.track) {
        this.handleAssistantAudioTrack(publication.track);
      }
    });

    // Listen for speaking events
    participant.on('isSpeakingChanged', (speaking: boolean) => {
      this.emit('assistantSpeaking', speaking);
    });
  }

  private handleAssistantAudioTrack(track: RemoteTrack): void {
    if (track.sid && this.attachedTracks.has(track.sid)) {
      return;
    }

    const audioElement = track.attach() as HTMLAudioElement;
    audioElement.volume = 1.0;
    audioElement.autoplay = true;
    audioElement.muted = false;
    audioElement.style.position = 'absolute';
    audioElement.style.left = '-9999px';

    if (track.sid) {
      this.attachedTracks.set(track.sid, audioElement);
    }

    audioElement.play().catch((error) => {
      this.log('Error playing audio:', error);
    });
  }

  private handleDataChannelMessage(payload: Uint8Array): void {
    try {
      const text = new TextDecoder().decode(payload);
      const data = JSON.parse(text);

      switch (data.type) {
        case 'message':
        case 'conversation_item':
          // Deduplicate streaming messages by ID
          // For incomplete/streaming messages: skip duplicates
          // For complete messages: allow through to update with final content
          if (data.id && this.seenMessageIds.has(data.id) && !data.isComplete) {
            this.log('Skipping duplicate incomplete message:', data.id);
            return;
          }

          // Emit the message
          this.emit('message', {
            id: data.id,
            role: data.role,
            content: data.content,
            timestamp: data.timestamp,
            isComplete: data.isComplete,
            isFirstChunk: data.isFirstChunk,
            isStreaming: data.isStreaming
          } as ConversationMessage);

          // Add to seen set after emitting
          // For streaming: mark after first chunk so final update can come through
          // For complete: mark to prevent polling fallback from re-emitting
          if (data.id && data.isComplete) {
            this.seenMessageIds.add(data.id);
          }
          break;

        case 'transcription_stream':
          this.emit('transcription', {
            text: data.text,
            transcriptionId: data.transcriptionId,
            isFinal: data.isFinal,
            timestamp: data.timestamp,
            sequence: data.sequence,
            isStreaming: data.isStreaming
          } as TranscriptionEvent);
          break;

        case 'tool_start':
        case 'tool_complete':
        case 'tool_failed':
        case 'tool_delayed':
          this.emit('toolEvent', {
            type: data.type.replace('tool_', ''),
            toolName: data.toolName,
            toolType: data.toolType,
            timestamp: data.timestamp,
            toolDetails: data.toolDetails || {}
          } as ToolEvent);
          break;

        case 'metrics':
          this.emit('metrics', data as CallMetrics);
          break;

        case 'barge_in':
          this.emit('bargeIn', data);
          break;

        case 'call_ending':
          this.emit('callEnding', {
            reason: data.reason,
            message: data.message,
            timestamp: data.timestamp
          } as CallEndingEvent);
          break;

        default:
          this.log('Unknown data message type:', data.type);
      }
    } catch (error) {
      this.log('Error parsing data message:', error);
    }
  }

  private startMessagePolling(): void {
    // Poll for new messages every 2 seconds
    // Note: This is a fallback - data channel messages are still preferred
    this.pollInterval = setInterval(async () => {
      if (this.currentCallId && this.callState === CallState.CONNECTED) {
        try {
          const messages = await this.getMessages(50, 0);

          this.log(`Polling found ${messages.length} messages`);

          // Emit messages that we haven't seen yet
          messages.forEach((message) => {
            if (message.id && !this.seenMessageIds.has(message.id)) {
              this.seenMessageIds.add(message.id);
              this.log(`Emitting new message: ${message.role} - ${message.content?.substring(0, 50)}`);
              this.emit('message', message);
            }
          });
        } catch (error) {
          this.log('Error polling messages:', error);
        }
      }
    }, 2000);
  }

  private stopMessagePolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private async activateAudioContext(): Promise<void> {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      await audioContext.close();
    } catch (error) {
      this.log('Could not activate audio context:', error);
    }
  }

  private async connectToRoom(url: string, token: string): Promise<void> {
    if (!this.room) {
      throw new ConnectionError('Room not initialized');
    }

    this.abortController = new AbortController();

    for (let attempt = 1; attempt <= this.config.maxRetryAttempts; attempt++) {
      if (this.abortController.signal.aborted) {
        throw new ConnectionError('Connection aborted');
      }

      try {
        await this.room.connect(url, token);
        return;
      } catch (error) {
        const errorMessage = (error as Error).message?.toLowerCase() || '';

        // Don't retry auth errors
        if (errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
          throw new ConnectionError('Authentication failed', error);
        }

        if (attempt === this.config.maxRetryAttempts) {
          throw new ConnectionError(`Failed to connect after ${attempt} attempts`, error);
        }

        // Exponential backoff
        const delay = this.config.retryDelay * Math.pow(1.5, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  private async publishLocalAudio(): Promise<void> {
    if (!this.room) {
      throw new ConnectionError('Room not initialized');
    }

    try {
      this.localAudioTrack = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      });

      await this.room.localParticipant.publishTrack(this.localAudioTrack, {
        name: 'microphone',
        simulcast: false
      });
    } catch (error) {
      throw new MediaDevicesError('Failed to access microphone', error);
    }
  }

  private checkExistingParticipants(): void {
    if (!this.room) return;

    const participants = Array.from(this.room.remoteParticipants.values());
    for (const participant of participants) {
      if (this.isAssistantParticipant(participant) && !this.assistantParticipant) {
        this.assistantParticipant = participant;
        this.setupAssistantTracks(participant);
      }
    }
  }

  private detachTrack(trackSid: string): void {
    const element = this.attachedTracks.get(trackSid);
    if (element) {
      element.pause();
      element.srcObject = null;
      element.remove();
      this.attachedTracks.delete(trackSid);
    }
  }

  private cleanupParticipantTracks(participant: RemoteParticipant): void {
    participant.trackPublications.forEach((publication) => {
      if (publication.track?.sid) {
        this.detachTrack(publication.track.sid);
      }
    });
  }

  private cleanupAllTracks(): void {
    this.attachedTracks.forEach((_element, trackSid) => {
      this.detachTrack(trackSid);
    });
    this.attachedTracks.clear();
  }

  private setState(newState: CallState): void {
    if (this.callState !== newState) {
      this.callState = newState;
      this.emit('stateChange', newState);
    }
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[Wespoke SDK]', ...args);
    }
  }
}
