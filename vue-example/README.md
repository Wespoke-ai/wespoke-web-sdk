# Wespoke SDK - Vue 3 Example

A complete Vue 3 TypeScript example demonstrating how to integrate the Wespoke Web SDK into a Vue application using the Composition API and a custom composable.

## Features

- ✅ Vue 3 with TypeScript
- ✅ Composition API with `<script setup>`
- ✅ Custom `useWespoke` composable for easy SDK integration
- ✅ Real-time conversation display
- ✅ Call controls (start, end, mute)
- ✅ Message sending functionality
- ✅ Reactive state management
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
vue-example/
├── src/
│   ├── composables/
│   │   └── useWespoke.ts      # Custom Vue composable for SDK
│   ├── App.vue                # Main application component
│   ├── style.css              # Application styles
│   └── main.ts                # Vue entry point
├── index.html                 # HTML template
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite bundler configuration
└── README.md                  # This file
```

## useWespoke Composable

The `useWespoke` composable provides a clean Vue interface to the SDK:

```typescript
import { useWespoke } from './composables/useWespoke';

export default {
  setup() {
    const wespoke = useWespoke({
      apiKey: 'pk_live_xxx',
      debug: true,
      onMessage: (message) => console.log(message),
      onError: (error) => console.error(error),
    });

    // Available reactive properties and methods:
    const {
      state,              // Ref<CallState> - Current call state
      isMuted,            // Ref<boolean> - Microphone mute state
      isAssistantSpeaking, // Ref<boolean> - Is assistant speaking
      callId,             // Ref<string | null> - Current call ID
      messages,           // Ref<Message[]> - Conversation messages
      error,              // Ref<Error | null> - Latest error
      startCall,          // Start a call function
      endCall,            // End call function
      toggleMute,         // Toggle mute function
      sendMessage,        // Send text message function
      clearMessages,      // Clear messages function
    } = wespoke;

    return { wespoke };
  },
};
```

### Using with `<script setup>`

```vue
<script setup lang="ts">
import { useWespoke } from './composables/useWespoke';

const wespoke = useWespoke({
  apiKey: 'pk_live_xxx',
  debug: true,
});

const handleStartCall = async () => {
  await wespoke.startCall('assistant-id');
};
</script>

<template>
  <div>
    <button @click="handleStartCall">Start Call</button>
    <p>Status: {{ wespoke.state.value }}</p>
    <div v-for="msg in wespoke.messages.value" :key="msg.timestamp">
      {{ msg.role }}: {{ msg.content }}
    </div>
  </div>
</template>
```

## Composable Options

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
- Restart TypeScript server: `vue-tsc --noEmit`
- Check that Vue TypeScript plugin is installed in your IDE

### Reactive Updates Not Working
- Make sure you're using `.value` to access ref values in script
- No `.value` needed in template (automatic unwrapping)
- Check that composable is called inside `setup()` or `<script setup>`

## Customization

### Styling
- All styles are in `src/style.css`
- Uses gradient theme matching Wespoke brand colors
- Fully responsive design

### Custom Composable
- The `useWespoke` composable can be customized for your needs
- Add additional reactive state or methods as needed
- Implement custom event handlers

### Components
- `App.vue` can be split into smaller components
- Extract panels into separate Vue components
- Create reusable UI components

## Vue Best Practices Used

- ✅ Composition API with `<script setup>`
- ✅ TypeScript for type safety
- ✅ Reactive refs for state management
- ✅ Lifecycle hooks (onMounted, onUnmounted)
- ✅ Computed properties for derived state
- ✅ Event handling with `@click`, `@submit`
- ✅ Conditional rendering with `v-if`, `v-for`
- ✅ Two-way binding with `v-model`

## Next Steps

- Check out the **Vanilla JS example** for simple HTML integration
- Check out the **React example** for React integration
- Read the full [SDK Documentation](../../README.md)
- Build your custom UI on top of the composable

## Support

- Documentation: https://docs.wespoke.com.tr
- Dashboard: https://wespoke.com.tr/dashboard
- Email: support@wespoke.com.tr
