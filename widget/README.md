# Wespoke Web Widget

Add a complete AI voice assistant to your website with a single line of code.

## Overview

The Wespoke Web Widget is a pre-built, drop-in UI component that provides instant AI voice assistant functionality for any website. Unlike the core SDK which requires custom UI development, the widget comes with a beautiful, customizable interface out of the box.

## Features

- **Voice Conversations** - Real-time AI voice calls with your assistant
- **Message Transcript** - See the conversation history
- **Fully Customizable** - Match your brand with custom colors, position, and styling
- **Mobile Responsive** - Works perfectly on desktop and mobile
- **Framework Agnostic** - Use with React, Vue, Angular, or plain HTML
- **Secure** - API key authentication with domain whitelisting
- **Accessible** - ARIA labels, keyboard navigation, screen reader support
- **Mute Control** - Toggle microphone mute during calls
- **Real-time State** - Live connection status updates
- **Event Callbacks** - React to call events and messages

## Installation

### NPM/Yarn

```bash
npm install @wespoke/widget react react-dom
# or
yarn add @wespoke/widget react react-dom
```

**Note**: React 18+ and ReactDOM are required peer dependencies.

### CDN

```html
<!-- React 18 (required peer dependencies) -->
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<!-- Wespoke Widget -->
<link rel="stylesheet" href="https://unpkg.com/@wespoke/widget/dist/wespoke-widget.umd.css">
<script src="https://unpkg.com/@wespoke/widget/dist/wespoke-widget.umd.js"></script>
```

## Quick Start

### HTML + CDN

```html
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Website with AI Assistant</title>

  <!-- React 18 (required) -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

  <!-- Wespoke Widget CSS -->
  <link rel="stylesheet" href="https://unpkg.com/@wespoke/widget/dist/wespoke-widget.umd.css">
</head>
<body>
  <h1>My Website</h1>
  <p>Your content here...</p>

  <!-- Wespoke Widget UMD Bundle -->
  <script src="https://unpkg.com/@wespoke/widget/dist/wespoke-widget.umd.js"></script>

  <script>
    // Initialize widget
    const widget = WespokeWidget.create({
      // Your Wespoke API Key (Public Key - safe to use in browser)
      apiKey: 'pk_live_your_api_key_here',

      // Your AI Assistant ID
      assistantId: 'asst_your_assistant_id',

      // API URL (production)
      apiUrl: 'https://api.wespoke.ai',

      // Customization Options
      position: 'bottom-right',
      theme: 'dark',
      primaryColor: '#4d8e8c',
      accentColor: '#6db3b0',
      buttonText: 'AI Asistan',
      showTranscript: true,
      requireConsent: true,
      debug: false
    });

    console.log('Wespoke Widget initialized:', widget);
  </script>
</body>
</html>
```

### React

```tsx
import { WespokeWidget } from '@wespoke/widget';
import '@wespoke/widget/dist/wespoke-widget.umd.css';

function App() {
  const handleCallStart = () => {
    console.log('Call started');
  };

  const handleMessage = (message: any) => {
    console.log('New message:', message);
  };

  const handleError = (error: any) => {
    console.error('Widget error:', error);
  };

  return (
    <div>
      <h1>My Website</h1>

      <WespokeWidget
        apiKey="pk_live_your_api_key_here"
        assistantId="asst_your_assistant_id"
        apiUrl="https://api.wespoke.ai"
        position="bottom-right"
        theme="dark"
        primaryColor="#4d8e8c"
        accentColor="#6db3b0"
        showTranscript={true}
        requireConsent={true}
        onCallStart={handleCallStart}
        onMessage={handleMessage}
        onError={handleError}
      />
    </div>
  );
}
```

## Configuration

### Required Options

```typescript
{
  apiKey: string;              // Your web embedding API key (get from dashboard)
  assistantId: string;         // Assistant ID to connect to
}
```

### Appearance Options

```typescript
{
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';  // Default: 'bottom-right'
  theme?: 'light' | 'dark';                                               // Default: 'dark'
  primaryColor?: string;                                                  // Hex color, default: '#4d8e8c'
  accentColor?: string;                                                   // Hex color, default: '#6db3b0'
  size?: 'compact' | 'medium' | 'full';                                  // Default: 'medium'
  zIndex?: number;                                                        // Default: 9999
}
```

### Behavior Options

```typescript
{
  autoOpen?: boolean;          // Auto-expand widget on page load (default: false)
  showTranscript?: boolean;    // Display message history (default: true)
  requireConsent?: boolean;    // Show mic permission prompt (default: true)
  apiUrl?: string;             // API endpoint (default: 'https://api.wespoke.ai')
  debug?: boolean;             // Enable debug logging (default: false)
}
```

### Text Customization

```typescript
{
  buttonText?: string;         // Floating button text
  placeholderText?: string;    // Placeholder for transcript area
}
```

### Advanced Options

```typescript
{
  metadata?: Record<string, any>;  // Custom metadata to pass to assistant
  locale?: 'tr' | 'en';            // Language locale (default: 'tr')
}
```

### Event Callbacks

```typescript
{
  onCallStart?: () => void;                      // Called when call starts
  onCallEnd?: () => void;                        // Called when call ends
  onMessage?: (message: WidgetMessage) => void;  // Called on new message
  onError?: (error: WidgetError) => void;        // Called on error
  onTranscriptUpdate?: (messages: WidgetMessage[]) => void;  // Called when transcript updates
  onStateChange?: (state: WidgetState) => void;  // Called when connection state changes
}
```

## API Methods

The widget returns an API object with methods for programmatic control:

### Widget Control

```typescript
// Open/close widget UI
widget.open();
widget.close();
widget.toggle();
```

### Call Control

```typescript
// Start a voice call
await widget.startCall();

// End the current call
await widget.endCall();

// Toggle microphone mute
const isMuted = await widget.toggleMute();
console.log('Muted:', isMuted);

// Check mute status
const muted = widget.isMuted();
```

### State Management

```typescript
// Get current connection state
const state = widget.getState();  // 'idle' | 'connecting' | 'connected'

// Get conversation transcript
const messages = widget.getTranscript();

// Clear transcript history
widget.clearTranscript();
```

### Configuration

```typescript
// Update widget configuration
widget.updateConfig({
  theme: 'light',
  primaryColor: '#ff6b6b'
});
```

### Cleanup

```typescript
// Destroy widget and remove from DOM
widget.destroy();
```

## Type Definitions

### WidgetMessage

```typescript
interface WidgetMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}
```

### WidgetState

```typescript
type WidgetState = 'idle' | 'connecting' | 'connected';
```

### WidgetError

```typescript
interface WidgetError {
  code: string;
  message: string;
  details?: any;
}
```

## Examples

See the `examples/` directory for complete working examples:

- `examples/cdn-example/` - Plain HTML with CDN
- `examples/react/` - React integration (coming soon)
- `examples/nextjs/` - Next.js integration (coming soon)

## Getting Your Credentials

1. **API Key**: Get your public API key from the [Wespoke Dashboard](https://wespoke.ai/dashboard/settings/api-keys)
   - Look for keys starting with `pk_live_` (production) or `pk_test_` (testing)
   - Public keys are safe to use in browser code

2. **Assistant ID**: Find your assistant ID in the [Assistants page](https://wespoke.ai/dashboard/assistants)
   - Click on any assistant to view its details
   - Copy the Assistant ID from the URL or details panel

## Customization Guide

### Theming

The widget supports light and dark themes:

```javascript
WespokeWidget.create({
  theme: 'dark',           // or 'light'
  primaryColor: '#4d8e8c', // Your brand color
  accentColor: '#6db3b0'   // Accent color for hover states
});
```

### Positioning

Choose where the widget appears on your page:

```javascript
WespokeWidget.create({
  position: 'bottom-right'  // 'bottom-left' | 'top-right' | 'top-left'
});
```

### Custom CSS

You can override widget styles with CSS custom properties:

```css
:root {
  --wespoke-widget-z-index: 9999;
  --wespoke-primary: #4d8e8c;
  --wespoke-accent: #6db3b0;
}
```

## Troubleshooting

### Widget not showing up

1. **Check React dependencies**: Make sure React 18+ and ReactDOM are loaded before the widget script
2. **Check console errors**: Open browser DevTools and look for JavaScript errors
3. **Verify API credentials**: Ensure your API key and assistant ID are correct
4. **Check network**: Verify your API URL is accessible

### Voice calls not connecting

1. **Verify microphone permissions**: Browser must have microphone access
2. **Check assistant status**: Make sure your assistant is published in the dashboard
3. **Enable debug mode**: Set `debug: true` to see detailed logs
4. **Check backend logs**: Verify the backend and voice agent are running

### No audio output

1. **Check browser audio**: Verify browser audio is not muted
2. **Check TTS configuration**: Verify your assistant has TTS properly configured
3. **Test in another browser**: Some browsers have stricter audio policies

### React hydration errors

If you see hydration errors in Next.js or SSR:

```tsx
// Use dynamic import with no SSR
import dynamic from 'next/dynamic';

const WespokeWidget = dynamic(
  () => import('@wespoke/widget').then(mod => mod.WespokeWidget),
  { ssr: false }
);
```

## Browser Support

- **Chrome/Edge**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Mobile Safari**: 14+
- **Chrome Android**: 90+

**Required Browser Features:**
- WebRTC support
- MediaRecorder API
- ES6+ JavaScript

## Security

- **Public API Keys**: Widget uses public keys (`pk_live_*` / `pk_test_*`) that are safe in browser code
- **Domain Whitelisting**: Configure allowed domains in your dashboard settings
- **HTTPS Required**: Widget requires HTTPS in production (localhost allowed for development)
- **No Sensitive Data**: Never expose secret API keys in frontend code

## Performance

- **Bundle Size**: ~150KB minified + gzipped (including React components)
- **First Load**: Widget loads asynchronously and doesn't block page rendering
- **Voice Streaming**: Real-time audio streaming with minimal latency via LiveKit
- **Caching**: Static assets are cached for 1 year

## Development

### Local Development

```bash
# Install dependencies
npm install

# Start development build
npm run dev

# Build for production
npm run build

# Run example
cd examples/cdn-example
python3 -m http.server 8080
```

### Project Structure

```
widget/
├── src/
│   ├── components/          # React components
│   │   ├── FloatingButton.tsx
│   │   ├── ChatWindow.tsx
│   │   ├── VoiceControls.tsx
│   │   └── Transcript.tsx
│   ├── styles/              # CSS styles
│   │   └── widget-base.css
│   ├── types.ts             # TypeScript types
│   ├── index.ts             # Main entry point
│   └── WespokeWidget.tsx    # Main widget component
├── examples/                # Example implementations
├── dist/                    # Built files (UMD, ESM, CJS)
└── package.json
```

## License

MIT © Wespoke

## Related Packages

- [@wespoke/web-sdk](../web-sdk) - Core SDK for custom integrations
- [Wespoke Dashboard](https://wespoke.ai) - Create and manage assistants

## Support

- **Documentation**: [docs.wespoke.ai](https://docs.wespoke.ai)
- **Issues**: [GitHub Issues](https://github.com/wespoke/web-sdk/issues)
- **Email**: support@wespoke.ai
- **Discord**: [Join our community](https://discord.gg/wespoke)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and updates.
