(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('livekit-client')) :
    typeof define === 'function' && define.amd ? define(['exports', 'livekit-client'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Wespoke = {}, global.LivekitClient));
})(this, (function (exports, livekitClient) { 'use strict';

    /**
     * Browser-compatible EventEmitter implementation
     * Provides type-safe event handling for the SDK
     */
    class EventEmitter {
        constructor() {
            this.events = new Map();
        }
        /**
         * Register an event listener
         */
        on(event, handler) {
            if (!this.events.has(event)) {
                this.events.set(event, new Set());
            }
            const handlers = this.events.get(event);
            handlers.add(handler);
            return this;
        }
        /**
         * Register a one-time event listener
         */
        once(event, handler) {
            const onceHandler = (data) => {
                handler(data);
                this.off(event, onceHandler);
            };
            return this.on(event, onceHandler);
        }
        /**
         * Remove an event listener
         */
        off(event, handler) {
            const handlers = this.events.get(event);
            if (handlers) {
                handlers.delete(handler);
                if (handlers.size === 0) {
                    this.events.delete(event);
                }
            }
            return this;
        }
        /**
         * Emit an event
         */
        emit(event, ...args) {
            const handlers = this.events.get(event);
            if (!handlers || handlers.size === 0) {
                return false;
            }
            handlers.forEach((handler) => {
                try {
                    handler(args[0]);
                }
                catch (error) {
                    console.error(`Error in event handler for "${String(event)}":`, error);
                }
            });
            return true;
        }
        /**
         * Remove all listeners for an event, or all events if no event specified
         */
        removeAllListeners(event) {
            if (event) {
                this.events.delete(event);
            }
            else {
                this.events.clear();
            }
            return this;
        }
        /**
         * Get the number of listeners for an event
         */
        listenerCount(event) {
            const handlers = this.events.get(event);
            return handlers ? handlers.size : 0;
        }
        /**
         * Get all event names that have listeners
         */
        eventNames() {
            return Array.from(this.events.keys());
        }
    }

    /**
     * Wespoke SDK TypeScript Type Definitions
     */
    /**
     * Call State
     */
    exports.CallState = void 0;
    (function (CallState) {
        CallState["IDLE"] = "idle";
        CallState["CONNECTING"] = "connecting";
        CallState["CONNECTED"] = "connected";
        CallState["DISCONNECTING"] = "disconnecting";
        CallState["DISCONNECTED"] = "disconnected";
        CallState["ERROR"] = "error";
    })(exports.CallState || (exports.CallState = {}));

    /**
     * Base error class for all Wespoke SDK errors
     */
    class WespokeError extends Error {
        constructor(message, code, statusCode, details) {
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
    class AuthenticationError extends WespokeError {
        constructor(message, details) {
            super(message, 'AUTHENTICATION_ERROR', 403, details);
            this.name = 'AuthenticationError';
        }
    }
    /**
     * Insufficient credits error
     */
    class InsufficientCreditsError extends WespokeError {
        constructor(message = 'Insufficient credits to start call', details) {
            super(message, 'INSUFFICIENT_CREDITS', 402, details);
            this.name = 'InsufficientCreditsError';
        }
    }
    /**
     * Rate limit exceeded error
     */
    class RateLimitError extends WespokeError {
        constructor(message, retryAfter, resetAt, details) {
            super(message, 'RATE_LIMIT_EXCEEDED', 429, details);
            this.name = 'RateLimitError';
            this.retryAfter = retryAfter;
            this.resetAt = resetAt;
        }
    }
    /**
     * Connection error (network issues, WebRTC failures, etc.)
     */
    class ConnectionError extends WespokeError {
        constructor(message, details) {
            super(message, 'CONNECTION_ERROR', undefined, details);
            this.name = 'ConnectionError';
        }
    }
    /**
     * Invalid configuration error
     */
    class ConfigurationError extends WespokeError {
        constructor(message, details) {
            super(message, 'CONFIGURATION_ERROR', undefined, details);
            this.name = 'ConfigurationError';
        }
    }
    /**
     * Assistant not found error
     */
    class AssistantNotFoundError extends WespokeError {
        constructor(assistantId) {
            super(`Assistant not found: ${assistantId}`, 'ASSISTANT_NOT_FOUND', 404, { assistantId });
            this.name = 'AssistantNotFoundError';
        }
    }
    /**
     * Media devices error (microphone access denied, etc.)
     */
    class MediaDevicesError extends WespokeError {
        constructor(message, details) {
            super(message, 'MEDIA_DEVICES_ERROR', undefined, details);
            this.name = 'MediaDevicesError';
        }
    }
    /**
     * API request error
     */
    class APIError extends WespokeError {
        constructor(message, code, statusCode, details) {
            super(message, code, statusCode, details);
            this.name = 'APIError';
        }
    }
    /**
     * Parse API error response and throw appropriate error
     */
    function parseAPIError(response, statusCode) {
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
                return new RateLimitError(errorMessage, response?.error?.retryAfter, response?.error?.resetAt, response);
            default:
                return new APIError(errorMessage, errorCode, statusCode, response);
        }
    }

    /**
     * Wespoke Web SDK (REST API Version)
     * Official JavaScript SDK for embedding Wespoke AI voice assistants
     *
     * This version uses REST API endpoints instead of LiveKit client for call control
     */
    class Wespoke extends EventEmitter {
        constructor(config) {
            super();
            this.room = null;
            this.localAudioTrack = null;
            this.assistantParticipant = null;
            this.attachedTracks = new Map();
            this.callState = exports.CallState.IDLE;
            this.currentCallId = null;
            this.abortController = null;
            this.pollInterval = null;
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
        async startCall(assistantId, options = {}) {
            if (this.callState !== exports.CallState.IDLE && this.callState !== exports.CallState.DISCONNECTED) {
                throw new WespokeError('A call is already in progress', 'CALL_IN_PROGRESS');
            }
            this.setState(exports.CallState.CONNECTING);
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
                this.setState(exports.CallState.CONNECTED);
                this.log('Call started successfully');
            }
            catch (error) {
                this.setState(exports.CallState.ERROR);
                this.log('Error starting call:', error);
                this.emit('error', error);
                throw error;
            }
        }
        /**
         * End the current call (uses REST API)
         */
        async endCall() {
            if (this.callState === exports.CallState.IDLE || !this.currentCallId) {
                return;
            }
            this.setState(exports.CallState.DISCONNECTING);
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
                this.setState(exports.CallState.DISCONNECTED);
                this.log('Call ended');
            }
            catch (error) {
                this.log('Error ending call:', error);
                this.emit('error', error);
                throw error;
            }
        }
        /**
         * Toggle microphone mute state (uses REST API)
         */
        async toggleMute() {
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
                }
                else {
                    await this.localAudioTrack.unmute();
                }
                this.emit('microphoneMuted', newMuted);
                return !newMuted; // Return enabled state
            }
            catch (error) {
                this.log('Error toggling mute:', error);
                throw error;
            }
        }
        /**
         * Check if microphone is muted
         */
        isMuted() {
            return this.localAudioTrack ? this.localAudioTrack.isMuted : true;
        }
        /**
         * Check if assistant is currently speaking
         */
        isAssistantSpeaking() {
            return this.assistantParticipant?.isSpeaking || false;
        }
        /**
         * Get current call state
         */
        getState() {
            return this.callState;
        }
        /**
         * Get current call ID
         */
        getCallId() {
            return this.currentCallId;
        }
        /**
         * Get connection state from LiveKit
         */
        getConnectionState() {
            return this.room?.state || null;
        }
        /**
         * Get connection quality
         */
        getConnectionQuality() {
            return livekitClient.ConnectionQuality.Unknown; // TODO: Track from room events
        }
        /**
         * Send a text message to the assistant (uses REST API)
         */
        async sendMessage(message) {
            if (!this.currentCallId) {
                throw new WespokeError('No active call', 'NO_ACTIVE_CALL');
            }
            if (this.callState !== exports.CallState.CONNECTED) {
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
            }
            catch (error) {
                this.log('Error sending message:', error);
                throw error;
            }
        }
        /**
         * Get messages for the current call (uses REST API)
         */
        async getMessages(limit = 50, offset = 0) {
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
            }
            catch (error) {
                this.log('Error getting messages:', error);
                throw error;
            }
        }
        /**
         * Destroy the SDK instance and clean up resources
         */
        destroy() {
            this.stopMessagePolling();
            this.endCall().catch(() => {
                // Ignore errors during cleanup
            });
            this.removeAllListeners();
            this.log('SDK destroyed');
        }
        // ===== Private Methods =====
        async fetchToken(assistantId, options) {
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
        createRoom() {
            this.room = new livekitClient.Room({
                adaptiveStream: true,
                dynacast: true,
                publishDefaults: {
                    audioPreset: livekitClient.AudioPresets.speech,
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
        setupRoomEventHandlers() {
            if (!this.room)
                return;
            // Connection events
            this.room.on(livekitClient.RoomEvent.Connected, () => {
                this.emit('connected');
            });
            this.room.on(livekitClient.RoomEvent.Disconnected, (reason) => {
                this.setState(exports.CallState.DISCONNECTED);
                this.stopMessagePolling();
                this.emit('disconnected', reason?.toString());
            });
            this.room.on(livekitClient.RoomEvent.ConnectionStateChanged, (state) => {
                this.emit('connectionStateChanged', state);
            });
            this.room.on(livekitClient.RoomEvent.ConnectionQualityChanged, (quality) => {
                this.emit('connectionQualityChanged', quality);
            });
            // Reconnection events
            this.room.on(livekitClient.RoomEvent.Reconnecting, () => {
                this.emit('reconnecting');
            });
            this.room.on(livekitClient.RoomEvent.Reconnected, () => {
                this.emit('reconnected');
            });
            // Participant events
            this.room.on(livekitClient.RoomEvent.ParticipantConnected, (participant) => {
                if (this.isAssistantParticipant(participant)) {
                    if (!this.assistantParticipant) {
                        this.assistantParticipant = participant;
                        this.setupAssistantTracks(participant);
                    }
                }
            });
            this.room.on(livekitClient.RoomEvent.ParticipantDisconnected, (participant) => {
                if (participant === this.assistantParticipant) {
                    this.cleanupParticipantTracks(participant);
                    this.assistantParticipant = null;
                }
            });
            // Track events
            this.room.on(livekitClient.RoomEvent.TrackSubscribed, (track, _publication, participant) => {
                if (track.kind === livekitClient.Track.Kind.Audio && participant === this.assistantParticipant) {
                    this.handleAssistantAudioTrack(track);
                }
            });
            this.room.on(livekitClient.RoomEvent.TrackUnsubscribed, (track) => {
                if (track.sid) {
                    this.detachTrack(track.sid);
                }
            });
            // Data channel events (still used for real-time events from agent)
            this.room.on(livekitClient.RoomEvent.DataReceived, (payload) => {
                this.handleDataChannelMessage(payload);
            });
            // Error events
            this.room.on(livekitClient.RoomEvent.MediaDevicesError, (error) => {
                this.log('Media devices error:', error);
                this.emit('error', new MediaDevicesError(error.message, error));
            });
        }
        isAssistantParticipant(participant) {
            // Check metadata
            if (participant.metadata) {
                try {
                    const metadata = JSON.parse(participant.metadata);
                    if (metadata.role === 'assistant') {
                        return true;
                    }
                }
                catch {
                    // Invalid JSON, continue
                }
            }
            // Fallback: check identity
            const identity = participant.identity.toLowerCase();
            return identity.includes('agent') || identity.includes('assistant');
        }
        setupAssistantTracks(participant) {
            // Handle existing tracks
            participant.trackPublications.forEach((publication) => {
                if (publication.track) {
                    this.handleAssistantAudioTrack(publication.track);
                }
            });
            // Listen for speaking events
            participant.on('isSpeakingChanged', (speaking) => {
                this.emit('assistantSpeaking', speaking);
            });
        }
        handleAssistantAudioTrack(track) {
            if (track.sid && this.attachedTracks.has(track.sid)) {
                return;
            }
            const audioElement = track.attach();
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
        handleDataChannelMessage(payload) {
            try {
                const text = new TextDecoder().decode(payload);
                const data = JSON.parse(text);
                switch (data.type) {
                    case 'message':
                    case 'conversation_item':
                        this.emit('message', {
                            id: data.id,
                            role: data.role,
                            content: data.content,
                            timestamp: data.timestamp,
                            isComplete: data.isComplete,
                            isFirstChunk: data.isFirstChunk,
                            isStreaming: data.isStreaming
                        });
                        break;
                    case 'transcription_stream':
                        this.emit('transcription', {
                            text: data.text,
                            transcriptionId: data.transcriptionId,
                            isFinal: data.isFinal,
                            timestamp: data.timestamp,
                            sequence: data.sequence,
                            isStreaming: data.isStreaming
                        });
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
                        });
                        break;
                    case 'metrics':
                        this.emit('metrics', data);
                        break;
                    case 'barge_in':
                        this.emit('bargeIn', data);
                        break;
                    case 'call_ending':
                        this.emit('callEnding', {
                            reason: data.reason,
                            message: data.message,
                            timestamp: data.timestamp
                        });
                        break;
                    default:
                        this.log('Unknown data message type:', data.type);
                }
            }
            catch (error) {
                this.log('Error parsing data message:', error);
            }
        }
        startMessagePolling() {
            // Poll for new messages every 2 seconds
            // Note: This is a fallback - data channel messages are still preferred
            this.pollInterval = setInterval(() => {
                if (this.currentCallId && this.callState === exports.CallState.CONNECTED) {
                    // Silent polling - don't throw errors
                    this.getMessages(10, 0).catch((error) => {
                        this.log('Error polling messages:', error);
                    });
                }
            }, 2000);
        }
        stopMessagePolling() {
            if (this.pollInterval) {
                clearInterval(this.pollInterval);
                this.pollInterval = null;
            }
        }
        async activateAudioContext() {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                }
                await audioContext.close();
            }
            catch (error) {
                this.log('Could not activate audio context:', error);
            }
        }
        async connectToRoom(url, token) {
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
                }
                catch (error) {
                    const errorMessage = error.message?.toLowerCase() || '';
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
        async publishLocalAudio() {
            if (!this.room) {
                throw new ConnectionError('Room not initialized');
            }
            try {
                this.localAudioTrack = await livekitClient.createLocalAudioTrack({
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                });
                await this.room.localParticipant.publishTrack(this.localAudioTrack, {
                    name: 'microphone',
                    simulcast: false
                });
            }
            catch (error) {
                throw new MediaDevicesError('Failed to access microphone', error);
            }
        }
        checkExistingParticipants() {
            if (!this.room)
                return;
            const participants = Array.from(this.room.remoteParticipants.values());
            for (const participant of participants) {
                if (this.isAssistantParticipant(participant) && !this.assistantParticipant) {
                    this.assistantParticipant = participant;
                    this.setupAssistantTracks(participant);
                }
            }
        }
        detachTrack(trackSid) {
            const element = this.attachedTracks.get(trackSid);
            if (element) {
                element.pause();
                element.srcObject = null;
                element.remove();
                this.attachedTracks.delete(trackSid);
            }
        }
        cleanupParticipantTracks(participant) {
            participant.trackPublications.forEach((publication) => {
                if (publication.track?.sid) {
                    this.detachTrack(publication.track.sid);
                }
            });
        }
        cleanupAllTracks() {
            this.attachedTracks.forEach((_element, trackSid) => {
                this.detachTrack(trackSid);
            });
            this.attachedTracks.clear();
        }
        setState(newState) {
            if (this.callState !== newState) {
                this.callState = newState;
                this.emit('stateChange', newState);
            }
        }
        log(...args) {
            if (this.config.debug) {
                console.log('[Wespoke SDK]', ...args);
            }
        }
    }

    exports.APIError = APIError;
    exports.AssistantNotFoundError = AssistantNotFoundError;
    exports.AuthenticationError = AuthenticationError;
    exports.ConfigurationError = ConfigurationError;
    exports.ConnectionError = ConnectionError;
    exports.EventEmitter = EventEmitter;
    exports.InsufficientCreditsError = InsufficientCreditsError;
    exports.MediaDevicesError = MediaDevicesError;
    exports.RateLimitError = RateLimitError;
    exports.Wespoke = Wespoke;
    exports.WespokeError = WespokeError;
    exports.parseAPIError = parseAPIError;

}));
//# sourceMappingURL=wespoke.umd.js.map
