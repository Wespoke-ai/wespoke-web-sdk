# Wespoke Web Widget

🚧 **Work in Progress** - This widget is currently under active development.

Add a complete AI voice assistant to your website with a single line of code.

## Overview

The Wespoke Web Widget is a pre-built, drop-in UI component that provides instant AI voice assistant functionality for any website. Unlike the core SDK which requires custom UI development, the widget comes with a beautiful, customizable interface out of the box.

## Features (Planned)

- 🎙️ **Voice Conversations** - Real-time AI voice calls with your assistant
- 💬 **Message Transcript** - See the conversation history
- 🎨 **Fully Customizable** - Match your brand with custom colors, position, and styling
- 📱 **Mobile Responsive** - Works perfectly on desktop and mobile
- 🌐 **Framework Agnostic** - Use with React, Vue, Angular, or plain HTML
- 🔒 **Secure** - API key authentication with domain whitelisting
- ♿ **Accessible** - ARIA labels, keyboard navigation, screen reader support

## Installation

### NPM/Yarn

```bash
npm install @wespoke/widget
# or
yarn add @wespoke/widget
```

### CDN

```html
<script src="https://unpkg.com/@wespoke/widget/dist/wespoke-widget.umd.js"></script>
<link rel="stylesheet" href="https://unpkg.com/@wespoke/widget/dist/wespoke-widget.css">
```

## Quick Start

### HTML + CDN

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://unpkg.com/@wespoke/widget/dist/wespoke-widget.css">
</head>
<body>
  <!-- Your page content -->

  <script src="https://unpkg.com/@wespoke/widget/dist/wespoke-widget.umd.js"></script>
  <script>
    // Initialize widget
    const widget = WespokeWidget.create({
      apiKey: 'pk_live_your_api_key_here',
      assistantId: 'asst_your_assistant_id',
      position: 'bottom-right',
      theme: 'dark'
    });
  </script>
</body>
</html>
```

### React

```tsx
import { WespokeWidget } from '@wespoke/widget';
import '@wespoke/widget/dist/wespoke-widget.css';

function App() {
  return (
    <div>
      <h1>My Website</h1>

      <WespokeWidget
        apiKey="pk_live_your_api_key_here"
        assistantId="asst_your_assistant_id"
        position="bottom-right"
        theme="dark"
        onCallStart={() => console.log('Call started')}
        onMessage={(message) => console.log('Message:', message)}
      />
    </div>
  );
}
```

## Configuration

```typescript
interface WespokeWidgetConfig {
  // Required
  apiKey: string;              // Your web embedding API key
  assistantId: string;         // Assistant ID to connect to

  // Appearance
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'light' | 'dark' | 'auto';
  primaryColor?: string;       // Brand color (hex)
  accentColor?: string;        // Accent color (hex)
  size?: 'compact' | 'medium' | 'full';

  // Behavior
  autoOpen?: boolean;          // Auto-expand on page load
  showTranscript?: boolean;    // Display message history
  requireConsent?: boolean;    // Show mic permission prompt

  // Text
  buttonText?: string;
  welcomeMessage?: string;
  placeholderText?: string;

  // Advanced
  metadata?: Record<string, any>;
  locale?: 'tr' | 'en';
  debug?: boolean;

  // Callbacks
  onCallStart?: () => void;
  onCallEnd?: () => void;
  onMessage?: (message) => void;
  onError?: (error) => void;
}
```

## API Methods

```typescript
// Open/close widget
widget.open();
widget.close();
widget.toggle();

// Call control
await widget.startCall();
await widget.endCall();
await widget.toggleMute();

// State
const state = widget.getState();
const transcript = widget.getTranscript();
widget.clearTranscript();

// Cleanup
widget.destroy();
```

## Examples

See the `examples/` directory for complete working examples:

- `examples/html-cdn/` - Plain HTML with CDN
- `examples/react/` - React integration
- `examples/nextjs/` - Next.js integration

## Development Status

**Phase 1: Foundation** ✅
- [x] Package setup
- [x] TypeScript configuration
- [x] Build system (Rollup)
- [x] Type definitions

**Phase 2: Core Components** 🚧 In Progress
- [ ] FloatingButton component
- [ ] ChatWindow component
- [ ] Voice controls
- [ ] Message transcript
- [ ] SDK integration

**Phase 3: Polish** 📋 Planned
- [ ] Themes and styling
- [ ] Mobile responsive
- [ ] Accessibility
- [ ] Error handling

**Phase 4: Release** 📋 Planned
- [ ] Examples and documentation
- [ ] Testing
- [ ] npm publish
- [ ] CDN deployment

## Browser Support

- Chrome/Edge: 90+
- Firefox: 88+
- Safari: 14+
- Mobile Safari: 14+
- Chrome Android: 90+

## License

MIT © Wespoke

## Related Packages

- [@wespoke/web-sdk](../web-sdk) - Core SDK for custom integrations
- [Wespoke Dashboard](https://wespoke.ai) - Create and manage assistants
