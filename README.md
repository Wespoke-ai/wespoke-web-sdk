# Wespoke Web SDK

Official JavaScript SDK for embedding Wespoke AI voice assistants in any website. Build natural voice interactions into your web applications with just a few lines of code.

[![npm version](https://img.shields.io/npm/v/@wespoke/web-sdk.svg)](https://www.npmjs.com/package/@wespoke/web-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Packages

This repository contains two packages:

### [@wespoke/web-sdk](./web-sdk) - Core SDK

Headless JavaScript SDK for building custom voice interfaces. Gives you full control over the UI while handling all voice communication logic.

**Use when:** You want complete control over the UI and UX.

### [@wespoke/widget](./widget) - Pre-built Widget

Drop-in UI component with a complete voice chat interface. Add AI voice assistant to your site with zero UI development.

**Use when:** You want a ready-to-use interface that works out of the box.

## Features

- 🎤 **Real-time Voice Communication** - Powered by LiveKit WebRTC
- 🔒 **Secure Authentication** - API key-based with domain whitelisting
- 📱 **Framework Agnostic** - Works with React or vanilla JavaScript
- 🎯 **TypeScript Support** - Full type definitions included
- 🔧 **Easy Integration** - Simple API with comprehensive examples
- 📊 **Event-Driven** - Real-time events for connection state, messages, and errors
- 🌐 **Cross-Browser** - Works in all modern browsers with WebRTC support

## Installation

### Core SDK (Headless)

```bash
npm install @wespoke/web-sdk
```

See [web-sdk README](./web-sdk) for detailed SDK documentation.

### Pre-built Widget (With UI)

```bash
npm install @wespoke/widget react react-dom
```

Or use via CDN:

```html
<!-- React 18 (required) -->
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<!-- Wespoke Web SDK (required dependency) -->
<script src="https://unpkg.com/@wespoke/web-sdk/dist/wespoke.umd.js"></script>

<!-- Wespoke Widget -->
<link rel="stylesheet" href="https://unpkg.com/@wespoke/widget/dist/wespoke-widget.umd.css">
<script src="https://unpkg.com/@wespoke/widget/dist/wespoke-widget.umd.js"></script>
```

See [widget README](./widget) for detailed widget documentation.

## Quick Start

### Get Your API Credentials

1. Sign up at [Wespoke Dashboard](https://wespoke.ai)
2. Create a new Web Embedding API key
3. Add your domain to the allowed origins list
4. Copy your API key (starts with `pk_`)

### Option 1: Pre-built Widget (Easiest)

Add a complete voice interface with one script tag:

```html
<!DOCTYPE html>
<html>
<head>
  <!-- React 18 -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

  <!-- Wespoke Web SDK (required dependency) -->
  <script src="https://unpkg.com/@wespoke/web-sdk/dist/wespoke.umd.js"></script>

  <!-- Wespoke Widget -->
  <link rel="stylesheet" href="https://unpkg.com/@wespoke/widget/dist/wespoke-widget.umd.css">
</head>
<body>
  <h1>My Website</h1>

  <script src="https://unpkg.com/@wespoke/widget/dist/wespoke-widget.umd.js"></script>
  <script>
    WespokeWidget.create({
      apiKey: 'pk_your_api_key_here',
      assistantId: 'your_assistant_id',
      position: 'bottom-right',
      theme: 'dark'
    });
  </script>
</body>
</html>
```

See [widget documentation](./widget) for all customization options.

### Option 2: Core SDK (Custom UI)

Build your own interface with full control:

```javascript
import { Wespoke } from '@wespoke/web-sdk';

// Initialize the SDK
const wespoke = new Wespoke({
  apiKey: 'pk_your_api_key_here',
  assistantId: 'your_assistant_id',
  apiUrl: 'https://api.wespoke.ai' // optional
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

See [SDK documentation](./web-sdk) for complete API reference.

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

## API Reference

### Constructor

```typescript
new Wespoke(config: WespokeConfig)
```

**Config Options:**
- `apiKey` (required): Your Wespoke API key
- `assistantId` (required): ID of the assistant to use
- `apiUrl` (optional): Custom API URL (default: 'https://api.wespoke.ai')
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

- 🐛 [Issue Tracker](https://github.com/Wespoke-ai/wespoke-web-sdk/issues)

## License

MIT © Wespoke

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

---

Built with ❤️ by the Wespoke team
