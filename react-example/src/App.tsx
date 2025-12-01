import { useState, useEffect } from 'react';
import { useWespoke } from './hooks/useWespoke';
import './App.css';

// LocalStorage keys
const STORAGE_KEYS = {
  API_KEY: 'wespoke_test_api_key',
  ASSISTANT_ID: 'wespoke_test_assistant_id',
  API_URL: 'wespoke_test_api_url',
  DEBUG_MODE: 'wespoke_test_debug_mode'
};

function App() {
  // Configuration state with localStorage persistence
  const [apiKey, setApiKey] = useState('');
  const [assistantId, setAssistantId] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [debugMode, setDebugMode] = useState(false);

  // Load saved settings from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
    const savedAssistantId = localStorage.getItem(STORAGE_KEYS.ASSISTANT_ID);
    const savedApiUrl = localStorage.getItem(STORAGE_KEYS.API_URL);
    const savedDebugMode = localStorage.getItem(STORAGE_KEYS.DEBUG_MODE);

    if (savedApiKey) setApiKey(savedApiKey);
    if (savedAssistantId) setAssistantId(savedAssistantId);
    if (savedApiUrl) setApiUrl(savedApiUrl);
    if (savedDebugMode) setDebugMode(savedDebugMode === 'true');
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (apiKey) localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
  }, [apiKey]);

  useEffect(() => {
    if (assistantId) localStorage.setItem(STORAGE_KEYS.ASSISTANT_ID, assistantId);
  }, [assistantId]);

  useEffect(() => {
    if (apiUrl) localStorage.setItem(STORAGE_KEYS.API_URL, apiUrl);
  }, [apiUrl]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DEBUG_MODE, debugMode.toString());
  }, [debugMode]);

  // Initialize Wespoke hook
  const wespoke = useWespoke({
    apiKey: apiKey || 'pk_test_placeholder', // Use placeholder until configured
    apiUrl: apiUrl || undefined,
    debug: debugMode,
    onMessage: (message) => {
      console.log('New message:', message);
    },
    onError: (error) => {
      console.error('SDK Error:', error);
      alert(`Error: ${error.message}`);
    },
    onConnected: () => {
      console.log('Call connected!');
    },
    onDisconnected: (reason) => {
      console.log('Call disconnected:', reason);
    },
  });

  const handleStartCall = async () => {
    if (!apiKey || !assistantId) {
      alert('Please enter API key and Assistant ID');
      return;
    }

    try {
      await wespoke.startCall(assistantId, {
        userId: 'demo-user-' + Date.now(),
        sessionId: 'session-' + Date.now(),
        customData: { source: 'react-example' },
      });
    } catch (error) {
      console.error('Failed to start call:', error);
      alert(`Failed to start call: ${(error as Error).message}`);
    }
  };

  const handleEndCall = async () => {
    try {
      await wespoke.endCall();
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  };

  const handleToggleMute = async () => {
    try {
      await wespoke.toggleMute();
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  };

  return (
    <div className="app">
      <div className="header">
        <h1>Wespoke Web SDK Test</h1>
        <p className="subtitle">React Integration Example (REST API Mode)</p>
      </div>

      <div className="info-box">
        <strong>REST API Mode:</strong> This SDK now uses REST API endpoints for call control (end call, mute, send messages) while maintaining WebRTC for high-quality audio streaming. All operations use your existing embed API keys (<code>pk_live_xxx</code> or <code>pk_test_xxx</code>).
      </div>

      <div className="grid">
        {/* Configuration Panel */}
        <div className="panel">
          <h2>Configuration</h2>
          <div className="form-group">
            <label htmlFor="apiKey">API Key</label>
            <input
              id="apiKey"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="pk_live_xxx or pk_test_xxx"
            />
          </div>

          <div className="form-group">
            <label htmlFor="assistantId">Assistant ID</label>
            <input
              id="assistantId"
              type="text"
              value={assistantId}
              onChange={(e) => setAssistantId(e.target.value)}
              placeholder="Enter your assistant ID"
            />
          </div>

          <div className="form-group">
            <label htmlFor="apiUrl">API URL (Optional)</label>
            <input
              id="apiUrl"
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.wespoke.com.tr"
            />
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={debugMode}
                onChange={(e) => setDebugMode(e.target.checked)}
              />
              Enable Debug Mode
            </label>
          </div>
        </div>

        {/* Call Controls Panel */}
        <div className="panel">
          <h2>Call Controls</h2>
          <div
            className={`status-badge status-${wespoke.state}`}
          >
            {wespoke.state.toUpperCase()}
          </div>
          <div className="button-group">
            <button
              className="btn btn-primary"
              onClick={handleStartCall}
              disabled={
                !apiKey ||
                !assistantId ||
                wespoke.state === 'connecting' ||
                wespoke.state === 'connected' ||
                wespoke.state === 'disconnecting'
              }
            >
              Start Call
            </button>
            <button
              className="btn btn-danger"
              onClick={handleEndCall}
              disabled={
                wespoke.state === 'idle' ||
                wespoke.state === 'disconnected' ||
                wespoke.state === 'error'
              }
            >
              End Call
            </button>
          </div>

          <div className="button-group" style={{ marginTop: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={handleToggleMute}
              disabled={wespoke.state !== 'connected'}
            >
              {wespoke.isMuted ? 'Unmute' : 'Mute'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={async () => {
                const message = prompt('Enter message to send:');
                if (message && message.trim()) {
                  try {
                    await wespoke.sendMessage(message.trim());
                  } catch (error) {
                    console.error('Failed to send message:', error);
                  }
                }
              }}
              disabled={wespoke.state !== 'connected'}
            >
              Send Message
            </button>
          </div>

          <div className="info-grid" style={{ marginTop: '15px' }}>
            <div className="info-item">
              <div className="info-label">Call ID</div>
              <div className="info-value">{wespoke.callId || '-'}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Microphone</div>
              <div className="info-value">{wespoke.isMuted ? 'Muted' : 'Unmuted'}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Assistant Speaking</div>
              <div className="info-value">{wespoke.isAssistantSpeaking ? 'Yes' : 'No'}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Connection Quality</div>
              <div className="info-value">-</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid">
        {/* Messages Panel */}
        <div className="panel">
          <div className="panel-header">
            <h2>Conversation</h2>
            <button
              className="btn btn-secondary btn-sm"
              onClick={wespoke.clearMessages}
            >
              Clear Messages
            </button>
          </div>

          <div className="messages-container">
            {wespoke.messages.length === 0 ? (
              <p className="empty-state">No messages yet. Start a call to begin.</p>
            ) : (
              wespoke.messages.map((message, index) => (
                <div key={index} className={`message message-${message.role}`}>
                  <div className="message-role">{message.role.toUpperCase()}</div>
                  <div className="message-content">{message.content}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Events Log Panel */}
        <div className="panel">
          <div className="panel-header">
            <h2>Events Log</h2>
            <button
              className="btn btn-secondary btn-sm"
              onClick={wespoke.clearEvents}
            >
              Clear Events
            </button>
          </div>

          <div className="events-container">
            {wespoke.events.length === 0 ? (
              <p className="empty-state">No events yet</p>
            ) : (
              wespoke.events.map((event, index) => (
                <div key={index} className="event-item">
                  <span className="event-time">{event.time}</span>
                  <span className="event-type">{event.type}</span>
                  {event.data && (
                    <span className="event-data">{JSON.stringify(event.data)}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
