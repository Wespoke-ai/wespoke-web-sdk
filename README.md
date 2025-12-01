# Wespoke Web SDK

Official JavaScript SDK for embedding Wespoke AI voice assistants in any website. Build natural voice interactions into your web applications with just a few lines of code.

[![npm version](https://img.shields.io/npm/v/@wespoke/web-sdk.svg)](https://www.npmjs.com/package/@wespoke/web-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- 🎤 **Real-time Voice Communication** - Powered by LiveKit WebRTC
- 🔒 **Secure Authentication** - API key-based with domain whitelisting
- 📱 **Framework Agnostic** - Works with React, Vue, Angular, or vanilla JavaScript
- 🎯 **TypeScript Support** - Full type definitions included
- 🔧 **Easy Integration** - Simple API with comprehensive examples
- 📊 **Event-Driven** - Real-time events for connection state, messages, and errors
- 🌐 **Cross-Browser** - Works in all modern browsers with WebRTC support

## Installation

### NPM

```bash
npm install @wespoke/web-sdk
```

### Yarn

```bash
yarn add @wespoke/web-sdk
```

### CDN (UMD)

```html
<script src="https://cdn.jsdelivr.net/npm/@wespoke/web-sdk@latest/dist/wespoke.umd.js"></script>
```

## Quick Start

### 1. Get Your API Credentials

1. Sign up at [Wespoke Dashboard](https://wespoke.com.tr)
2. Create a new Web Embedding API key
3. Add your domain to the allowed origins list
4. Copy your API key (starts with `pk_`)

### 2. Basic Usage

```javascript
import { Wespoke } from '@wespoke/web-sdk';

// Initialize the SDK
const wespoke = new Wespoke({
  apiKey: 'pk_your_api_key_here',
  assistantId: 'your_assistant_id',
  apiUrl: 'https://api.wespoke.com.tr' // optional
});

// Listen to events
wespoke.on('stateChange', (state) => {
  console.log('Connection state:', state);
});

wespoke.on('message', (message) => {
  console.log('New message:', message);
});

// Start a call
await wespoke.startCall();

// End the call
await wespoke.endCall();
```

## Framework Examples

This repository includes complete example applications for popular frameworks:

### [Vanilla JavaScript](./vanilla-js-example)
Pure HTML/CSS/JavaScript - no build tools required. Perfect for quick testing.

```bash
cd vanilla-js-example
python3 -m http.server 8080
```

### [React](./react-example)
Modern React app with TypeScript and custom `useWespoke` hook.

```bash
cd react-example
npm install
npm run dev
```

### [Vue 3](./vue-example)
Vue 3 app with TypeScript and `useWespoke` composable.

```bash
cd vue-example
npm install
npm run dev
```

## API Reference

### Constructor

```typescript
new Wespoke(config: WespokeConfig)
```

**Config Options:**
- `apiKey` (required): Your Wespoke API key
- `assistantId` (required): ID of the assistant to use
- `apiUrl` (optional): Custom API URL (default: 'https://api.wespoke.com.tr')
- `debug` (optional): Enable debug logging (default: false)

### Methods

#### `startCall(): Promise<void>`
Start a new voice call with the assistant.

```javascript
await wespoke.startCall();
```

#### `endCall(): Promise<void>`
End the current call.

```javascript
await wespoke.endCall();
```

#### `toggleMute(): Promise<boolean>`
Toggle microphone mute state. Returns new mute state.

```javascript
const isMuted = await wespoke.toggleMute();
```

#### `sendMessage(text: string): Promise<void>`
Send a text message during the call.

```javascript
await wespoke.sendMessage('Hello!');
```

#### `destroy(): void>`
Clean up resources and disconnect.

```javascript
wespoke.destroy();
```

### Events

Listen to events using the `on()` method:

```javascript
wespoke.on('eventName', (data) => {
  // Handle event
});
```

**Available Events:**

- `stateChange`: Connection state changed (`idle` | `connecting` | `connected` | `disconnected`)
- `message`: New message received
- `error`: Error occurred
- `callStarted`: Call successfully started
- `callEnded`: Call ended

### Types

```typescript
interface WespokeConfig {
  apiKey: string;
  assistantId: string;
  apiUrl?: string;
  debug?: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected';
```

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 14.3+)
- Opera: ✅ Full support

**Requirements:**
- WebRTC support
- Microphone access
- HTTPS or localhost (required for microphone permissions)

## Development

### Building the SDK

```bash
cd web-sdk
npm install
npm run build
```

### Running Tests

```bash
npm test
```

### Development Mode

```bash
npm run dev  # Watch mode with auto-rebuild
```

## Monorepo Structure

```
wespoke-web-sdk/
├── web-sdk/              # Core SDK package
├── react-example/        # React example app
├── vue-example/          # Vue example app
├── vanilla-js-example/   # Vanilla JS example
└── package.json          # Workspace configuration
```

## Troubleshooting

### Microphone Not Working

- Ensure HTTPS or localhost
- Check browser permissions
- Verify domain is in allowed origins list

### Authentication Errors

- Verify API key is correct
- Check domain is whitelisted
- Ensure API key hasn't been revoked

### Connection Issues

- Check console for detailed error messages
- Verify assistant ID is correct
- Test with debug mode enabled: `debug: true`

## Support

- 📖 [Documentation](https://docs.wespoke.com.tr)
- 💬 [Discord Community](https://discord.gg/wespoke)
- 📧 Email: support@wespoke.com.tr
- 🐛 [Issue Tracker](https://github.com/Wespoke-ai/wespoke-web-sdk/issues)

## License

MIT © Wespoke

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

---

Built with ❤️ by the Wespoke team
