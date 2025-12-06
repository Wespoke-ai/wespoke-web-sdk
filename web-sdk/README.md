# Wespoke Web SDK

Official JavaScript SDK for embedding Wespoke AI voice assistants and chat experiences in any website.

## Features

- 🎙️ **Real-time Voice Conversations**: Connect to AI voice assistants powered by LiveKit
- 💬 **Text Chat Sessions**: Start chat-only sessions with the same assistants
- 🎯 **Simple API**: Start a call with just 2 lines of code
- 📦 **Multiple Formats**: UMD, ESM, and CommonJS builds
- 🔒 **Secure**: API key authentication with domain whitelisting
- 📊 **Event-Driven**: Subscribe to call events, transcriptions, and tool executions
- 🌐 **Browser Support**: Works in all modern browsers
- 📘 **TypeScript**: Full type definitions included

## Installation

### NPM/Yarn

```bash
npm install @wespoke/web-sdk
# or
yarn add @wespoke/web-sdk
```

### CDN (UMD)

```html
<script src="https://unpkg.com/@wespoke/web-sdk/dist/wespoke.umd.js"></script>
```

## Quick Start

### 1. Get Your API Key

1. Log in to your [Wespoke Dashboard](https://wespoke.ai/dashboard)
2. Navigate to **Web Embedding**
3. Create a new API key with your domain whitelist
4. Copy your `pk_live_xxx` or `pk_test_xxx` key

### 2. Basic Usage

```javascript
import { Wespoke } from '@wespoke/web-sdk';

// Initialize the SDK
const wespoke = new Wespoke({
  apiKey: 'pk_live_your_api_key_here'
});

// Start a call
await wespoke.startCall('your-assistant-id');

// Listen for events
wespoke.on('connected', () => {
  console.log('Connected to assistant!');
});

wespoke.on('message', (message) => {
  console.log('Message:', message.content);
});

// End the call
await wespoke.endCall();
```

## Running Examples

The package includes ready-to-run example applications in the `examples/` directory:

### Vanilla JavaScript Example

Pure HTML/CSS/JavaScript - no build tools required.

```bash
cd node_modules/@wespoke/web-sdk/examples/vanilla-js-example
python3 -m http.server 8080
# Open http://localhost:8080
```

### React Example

Modern React app with TypeScript and custom `useWespoke` hook.

```bash
cd node_modules/@wespoke/web-sdk/examples/react-example
npm install
npm run dev
```

## API Reference

### Constructor

```typescript
new Wespoke(config: WespokeConfig)
```

**Config Options:**

```typescript
interface WespokeConfig {
  apiKey: string;           // Required: Your API key (pk_live_xxx)
  apiUrl?: string;          // Optional: API endpoint (default: 'https://api.wespoke.ai')
  debug?: boolean;          // Optional: Enable debug logging (default: false)
  maxRetryAttempts?: number; // Optional: Connection retry attempts (default: 3)
  retryDelay?: number;      // Optional: Retry delay in ms (default: 2000)
}
```

### Methods

#### `startChatSession(assistantId, options?)`

Start a text chat session with an assistant (no microphone/audio required).

```typescript
await wespoke.startChatSession('assistant-id', {
  metadata: { userId: 'user-123' },
  assistantOverrides: {
    systemPrompt: 'You are a concise support bot.',
    temperature: 0.2
  }
});
```

#### `sendChatMessage(content)`

Send a message during an active chat session. Responses stream through the `message` event.

```typescript
await wespoke.sendChatMessage('How can I reset my password?');
```

#### `endChatSession()`

End the current chat session.

```typescript
await wespoke.endChatSession();
```

#### `startCall(assistantId, options?)`

Start a voice call with an assistant.

```typescript
await wespoke.startCall('assistant-id', {
  metadata: {
    userId: 'user-123',
    sessionId: 'session-xyz',
    customData: { source: 'website' }
  },
  assistantOverrides: {
    systemPrompt: 'You are a friendly concierge for ACME Hotels.',
    temperature: 0.4,
    variableValues: { guestName: 'Sam' }
  }
});
```

**Call/Chat options**
- `metadata`: Custom data passed through to your assistant for analytics or routing.
- `assistantOverrides`: Per-session prompt/behavior tweaks (e.g., `systemPrompt`, `firstMessage`, `temperature`, `maxResponseTokens`, `variableValues`). When provided, overrides are forwarded for both voice calls and chat sessions.

#### `endCall()`

End the current call.

```typescript
await wespoke.endCall();
```

#### `toggleMute()`

Toggle microphone mute state. Returns `true` if microphone is muted, `false` if unmuted.

```typescript
const muted = await wespoke.toggleMute();
console.log('Microphone muted:', muted);
```

#### `isMuted()`

Check if microphone is currently muted.

```typescript
const muted = wespoke.isMuted();
```

#### `isAssistantSpeaking()`

Check if assistant is currently speaking.

```typescript
const speaking = wespoke.isAssistantSpeaking();
```

#### `getState()`

Get current call state.

```typescript
import { CallState } from '@wespoke/web-sdk';

const state = wespoke.getState();
// Returns: CallState.IDLE | CallState.CONNECTING | CallState.CONNECTED | CallState.DISCONNECTING | CallState.DISCONNECTED | CallState.ERROR
```

#### `getCallId()`

Get current call ID.

```typescript
const callId = wespoke.getCallId();
```

#### `destroy()`

Destroy the SDK instance and clean up resources.

```typescript
wespoke.destroy();
```

### Events

Subscribe to events using `.on(event, handler)`:

```typescript
wespoke.on('connected', () => {
  console.log('Call connected');
});
```

#### Connection Events

- **`connected`**: Call successfully connected
- **`disconnected`**: Call disconnected (receives optional reason string)
- **`reconnecting`**: Connection is reconnecting
- **`reconnected`**: Successfully reconnected
- **`connectionStateChanged`**: Connection state changed (receives ConnectionState)
- **`connectionQualityChanged`**: Connection quality changed (receives ConnectionQuality)
- **`stateChange`**: Call state changed (receives CallState)

#### Conversation Events

- **`message`**: Conversation message received

  ```typescript
  wespoke.on('message', (message) => {
    console.log(`${message.role}: ${message.content}`);
  });
  ```
  Messages may stream in multiple chunks; use `message.isComplete`/`message.isFirstChunk` to detect streaming progress.

- **`transcription`**: Real-time transcription event

  ```typescript
  wespoke.on('transcription', (transcription) => {
    console.log('Transcription:', transcription.text);
  });
  ```

- **`assistantSpeaking`**: Assistant speaking state changed

  ```typescript
  wespoke.on('assistantSpeaking', (speaking) => {
    console.log('Assistant speaking:', speaking);
  });
  ```

#### Audio Events

- **`microphoneMuted`**: Microphone mute state changed

  ```typescript
  wespoke.on('microphoneMuted', (muted) => {
    console.log('Microphone muted:', muted);
  });
  ```

#### Tool Events

- **`toolEvent`**: Tool execution event

  ```typescript
  wespoke.on('toolEvent', (event) => {
    console.log('Tool:', event.toolName, 'Type:', event.type);
  });
  ```

#### Call Events

- **`callEnding`**: Call is ending

  ```typescript
  wespoke.on('callEnding', (event) => {
    console.log('Call ending:', event.reason);
  });
  ```

- **`bargeIn`**: User interrupted the assistant
- **`metrics`**: Call metrics updated

#### Error Events

- **`error`**: Error occurred

  ```typescript
  wespoke.on('error', (error) => {
    console.error('Error:', error.message);
  });
  ```

## Error Handling

The SDK provides specific error types for different scenarios:

```typescript
import {
  WespokeError,
  AuthenticationError,
  InsufficientCreditsError,
  ConnectionError,
  ConfigurationError,
  AssistantNotFoundError,
  MediaDevicesError
} from '@wespoke/web-sdk';

try {
  await wespoke.startCall('assistant-id');
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key or domain not whitelisted');
  } else if (error instanceof InsufficientCreditsError) {
    console.error('Insufficient credits to start call');
  } else if (error instanceof MediaDevicesError) {
    console.error('Microphone access denied');
  } else if (error instanceof ConnectionError) {
    console.error('Connection failed:', error.message);
  }
}
```

## Advanced Usage

### Complete Example with UI

```html
<!DOCTYPE html>
<html>
<head>
  <title>Wespoke Voice Assistant</title>
</head>
<body>
  <button id="startCall">Start Call</button>
  <button id="endCall" disabled>End Call</button>
  <button id="toggleMute" disabled>Mute</button>
  <div id="status">Idle</div>
  <div id="messages"></div>

  <script type="module">
    import { Wespoke, CallState } from '@wespoke/web-sdk';

    const wespoke = new Wespoke({
      apiKey: 'pk_live_your_api_key_here',
      debug: true
    });

    const startBtn = document.getElementById('startCall');
    const endBtn = document.getElementById('endCall');
    const muteBtn = document.getElementById('toggleMute');
    const status = document.getElementById('status');
    const messages = document.getElementById('messages');

    // Event listeners
    wespoke.on('stateChange', (state) => {
      status.textContent = state;
      endBtn.disabled = state !== CallState.CONNECTED;
      muteBtn.disabled = state !== CallState.CONNECTED;
    });

    wespoke.on('message', (message) => {
      const div = document.createElement('div');
      div.textContent = `${message.role}: ${message.content}`;
      messages.appendChild(div);
    });

    wespoke.on('microphoneMuted', (muted) => {
      muteBtn.textContent = muted ? 'Unmute' : 'Mute';
    });

    wespoke.on('error', (error) => {
      alert('Error: ' + error.message);
    });

    // Button handlers
    startBtn.onclick = async () => {
      try {
        startBtn.disabled = true;
        await wespoke.startCall('your-assistant-id');
      } catch (error) {
        console.error('Failed to start call:', error);
        startBtn.disabled = false;
      }
    };

    endBtn.onclick = async () => {
      await wespoke.endCall();
      startBtn.disabled = false;
    };

    muteBtn.onclick = async () => {
      await wespoke.toggleMute();
    };
  </script>
</body>
</html>
```

### Using with React

```tsx
import { Wespoke, CallState } from '@wespoke/web-sdk';
import { useState, useEffect, useRef } from 'react';

function VoiceAssistant() {
  const [callState, setCallState] = useState(CallState.IDLE);
  const [messages, setMessages] = useState([]);
  const wespokeRef = useRef(null);

  useEffect(() => {
    const wespoke = new Wespoke({
      apiKey: process.env.REACT_APP_WESPOKE_API_KEY
    });

    wespoke.on('stateChange', setCallState);
    wespoke.on('message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    wespokeRef.current = wespoke;

    return () => {
      wespoke.destroy();
    };
  }, []);

  const startCall = async () => {
    try {
      await wespokeRef.current.startCall('assistant-id');
    } catch (error) {
      console.error('Failed to start call:', error);
    }
  };

  const endCall = async () => {
    await wespokeRef.current.endCall();
  };

  return (
    <div>
      <button onClick={startCall} disabled={callState !== CallState.IDLE}>
        Start Call
      </button>
      <button onClick={endCall} disabled={callState !== CallState.CONNECTED}>
        End Call
      </button>
      <div>Status: {callState}</div>
      <div>
        {messages.map((msg, i) => (
          <div key={i}>{msg.role}: {msg.content}</div>
        ))}
      </div>
    </div>
  );
}
```

## Security Best Practices

1. **Use Environment-Specific Keys**: Use `pk_test_` keys for development and `pk_live_` keys for production
2. **Domain Whitelisting**: Always whitelist specific domains, avoid using wildcards unless necessary
3. **Never Expose Keys**: Don't commit API keys to version control
4. **Monitor Usage**: Track API key usage in the Wespoke dashboard
5. **Rotate Keys**: Periodically rotate API keys and revoke old ones

## Browser Support

- Chrome/Edge: 90+
- Firefox: 88+
- Safari: 14+
- Mobile Safari: 14+
- Chrome Android: 90+

## Troubleshooting

### Microphone Not Working

```typescript
wespoke.on('error', (error) => {
  if (error instanceof MediaDevicesError) {
    alert('Please allow microphone access');
  }
});
```

### Domain Not Whitelisted

```typescript
// Make sure your domain is added to the API key's allowed origins
// Error: AuthenticationError with code 'DOMAIN_NOT_WHITELISTED'
```

### Connection Issues

```typescript
// Enable debug mode to see detailed logs
const wespoke = new Wespoke({
  apiKey: 'pk_live_xxx',
  debug: true
});
```

## License

MIT

## Support

- 🐛 [Issue Tracker](https://github.com/Wespoke-ai/wespoke-web-sdk/issues)
