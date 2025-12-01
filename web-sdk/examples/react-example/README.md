# Wespoke SDK - React Example

A complete React TypeScript example demonstrating how to integrate the Wespoke Web SDK into a React application using a custom hook.

## Features

- ✅ React 18 with TypeScript
- ✅ Custom `useWespoke` hook for easy SDK integration
- ✅ Real-time conversation display
- ✅ Call controls (start, end, mute)
- ✅ Message sending functionality
- ✅ State management with React hooks
- ✅ Clean component architecture
- ✅ Error handling

## Prerequisites

1. **Build the SDK** (if not already done):
   ```bash
   cd /path/to/wespoke/packages/web-sdk
   npm run build
   ```

2. **Get an API key**:
   - Log in to [Wespoke Dashboard](https://wespoke.com.tr/dashboard/embedding)
   - Create a new API key
   - Add your development domain to allowed origins (e.g., `http://localhost:5173`)
   - Copy your `pk_live_xxx` or `pk_test_xxx` key

3. **Get an Assistant ID**:
   - Go to [Dashboard > Assistants](https://wespoke.com.tr/dashboard/assistants)
   - Copy the ID of an existing assistant

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open in browser**:
   - The app will open at `http://localhost:5173` (default Vite port)
   - If port 5173 is taken, Vite will use the next available port

## How to Use

1. **Configure the SDK**:
   - Enter your API key
   - Enter your assistant ID
   - Optionally set custom API URL
   - Enable debug mode if needed
   - Click "Initialize SDK"

2. **Start a Call**:
   - Click "Start Call" button
   - Allow microphone access when prompted
   - Wait for connection (status badge will show CONNECTED)

3. **During the Call**:
   - Speak naturally with the assistant
   - Watch messages appear in real-time
   - Use the Mute button to toggle microphone
   - Send text messages using the input form
   - Monitor call status and metrics

4. **End the Call**:
   - Click "End Call" button
   - Call will disconnect gracefully

## Project Structure

```
react-example/
├── src/
│   ├── hooks/
│   │   └── useWespoke.ts      # Custom React hook for SDK
│   ├── App.tsx                # Main application component
│   ├── App.css                # Application styles
│   └── main.tsx               # React entry point
├── index.html                 # HTML template
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite bundler configuration
└── README.md                  # This file
```

## useWespoke Hook

The `useWespoke` hook provides a clean React interface to the SDK:

```typescript
import { useWespoke } from './hooks/useWespoke';

function MyComponent() {
  const wespoke = useWespoke({
    apiKey: 'pk_live_xxx',
    debug: true,
    onMessage: (message) => console.log(message),
    onError: (error) => console.error(error),
  });

  // Available properties and methods:
  const {
    state,              // Current call state
    isMuted,            // Microphone mute state
    isAssistantSpeaking, // Is assistant currently speaking
    callId,             // Current call ID
    messages,           // Array of conversation messages
    startCall,          // Start a call function
    endCall,            // End call function
    toggleMute,         // Toggle mute function
    sendMessage,        // Send text message function
    clearMessages,      // Clear messages function
    error,              // Latest error (if any)
  } = wespoke;

  return (
    <div>
      <button onClick={() => startCall('assistant-id')}>
        Start Call
      </button>
      <p>Status: {state}</p>
    </div>
  );
}
```

## Hook Options

```typescript
interface UseWespokeOptions {
  apiKey: string;              // Required: Your API key
  apiUrl?: string;             // Optional: Custom API URL
  debug?: boolean;             // Optional: Enable debug logging
  onMessage?: (message) => void;       // Optional: Message callback
  onError?: (error) => void;           // Optional: Error callback
  onStateChange?: (state) => void;     // Optional: State change callback
  onConnected?: () => void;            // Optional: Connected callback
  onDisconnected?: (reason?) => void;  // Optional: Disconnected callback
}
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Building for Production

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Preview the build**:
   ```bash
   npm run preview
   ```

3. **Deploy**:
   - Deploy the `dist/` folder to your hosting service
   - Update API key allowed origins to include your production domain

## Environment Variables

For production, you can use environment variables:

1. Create `.env.local`:
   ```env
   VITE_WESPOKE_API_KEY=pk_live_your_key_here
   VITE_WESPOKE_API_URL=https://api.wespoke.com.tr
   ```

2. Access in code:
   ```typescript
   const apiKey = import.meta.env.VITE_WESPOKE_API_KEY;
   ```

## Troubleshooting

### SDK Not Loading
- Make sure the SDK is built: `npm run build` in `/packages/web-sdk`
- Check Vite alias in `vite.config.ts` points to correct path
- Check browser console for import errors

### Microphone Not Working
- Allow microphone access when prompted
- Check browser permissions
- Try HTTPS or localhost (some browsers require secure context)

### Authentication Failed
- Verify API key is correct
- Add `http://localhost:5173` to allowed origins in dashboard
- Check that key is not revoked

### TypeScript Errors
- Make sure all dependencies are installed: `npm install`
- Restart TypeScript server in your IDE
- Check that `@types/react` and `@types/react-dom` are installed

## Customization

### Styling
- All styles are in `src/App.css`
- Uses gradient theme matching Wespoke brand colors
- Fully responsive design

### Custom Hook
- The `useWespoke` hook can be customized for your needs
- Add additional state or methods as needed
- Implement custom event handlers

### Components
- `App.tsx` can be split into smaller components
- Extract panels into separate component files
- Create reusable UI components

## Next Steps

- Check out the **Vanilla JS example** for simple HTML integration
- Check out the **Vue example** for Vue.js integration
- Read the full [SDK Documentation](../../README.md)
- Build your custom UI on top of the hook

## Support

- Documentation: https://docs.wespoke.com.tr
- Dashboard: https://wespoke.com.tr/dashboard
- Email: support@wespoke.com.tr
