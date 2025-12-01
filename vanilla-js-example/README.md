# Wespoke SDK - Vanilla JavaScript Example

This is a complete, standalone HTML test application for the Wespoke Web SDK. It demonstrates all core SDK features with a visual interface.

## Architecture

This example uses the **REST API + WebRTC hybrid mode**:
- 🔵 **WebRTC**: High-quality audio streaming via LiveKit
- 🟢 **REST API**: Call control (end call, mute, send messages) via backend endpoints

All operations use your embed API keys (`pk_live_xxx` or `pk_test_xxx`) for authentication.

## Features Demonstrated

- ✅ SDK initialization with configuration
- ✅ Starting and ending calls (REST API)
- ✅ Microphone mute/unmute (REST API)
- ✅ Sending text messages (REST API)
- ✅ Real-time event monitoring (WebRTC data channel)
- ✅ Conversation message display
- ✅ Connection state tracking
- ✅ Error handling
- ✅ Debug mode
- ✅ Message polling (automatic backup)

## Prerequisites

1. **Build the SDK** (if not already done):
   ```bash
   cd /path/to/wespoke/packages/web-sdk
   npm run build
   ```

2. **Copy SDK to this directory**:
   ```bash
   cd /path/to/wespoke/packages/web-sdk/examples/vanilla-js
   cp ../../dist/wespoke.umd.js .
   ```

   This is needed because the Python HTTP server serves files from the current directory.

3. **Get an API key**:
   - Log in to [Wespoke Dashboard](https://wespoke.com.tr/dashboard/embedding)
   - Create a new API key
   - Add `localhost` to the allowed origins (or `file://` if opening locally)
   - Copy your `pk_live_xxx` or `pk_test_xxx` key

3. **Get an Assistant ID**:
   - Go to [Dashboard > Assistants](https://wespoke.com.tr/dashboard/assistants)
   - Copy the ID of an existing assistant or create a new one

## How to Run

### Option 1: Open in Browser (Simplest)

1. Open `index.html` directly in your browser:
   - Double-click the file, or
   - Drag and drop into browser window

2. If you see CORS errors, use Option 2 instead.

### Option 2: Local Web Server (Recommended)

Run a local web server to avoid CORS issues:

**Using Python:**
```bash
# From this directory
python3 -m http.server 8080
```

**Using Node.js:**
```bash
# Install http-server globally
npm install -g http-server

# Run from this directory
http-server -p 8080
```

**Using PHP:**
```bash
php -S localhost:8080
```

Then open: http://localhost:8080

## How to Use

1. **Enter Configuration**:
   - API Key: Your `pk_live_xxx` or `pk_test_xxx` key
   - Assistant ID: Your assistant's ID from the dashboard
   - API URL: (Optional) Leave empty to use default
   - Debug Mode: Enable to see detailed console logs

2. **Initialize SDK**:
   - Click "Initialize SDK" button
   - Check for success message
   - Watch the Events Log for initialization confirmation

3. **Start a Call**:
   - Click "Start Call" button
   - Allow microphone access when prompted
   - Wait for connection (status badge will change)
   - Start speaking to test the conversation

4. **During Call**:
   - **Mute/Unmute**: Toggle microphone
   - **Send Message**: Send a text message to the assistant
   - **Watch Events**: See all SDK events in real-time
   - **Watch Messages**: See conversation flow
   - **Monitor Status**: Check connection quality, call ID, etc.

5. **End Call**:
   - Click "End Call" button
   - Call will terminate gracefully

## Testing Checklist

Use this example to verify:

- [ ] SDK initializes successfully with valid API key
- [ ] SDK rejects invalid API key with proper error
- [ ] Domain whitelisting works (try from non-whitelisted domain)
- [ ] Call connects successfully to assistant
- [ ] Microphone audio is captured and sent
- [ ] Assistant responses are played through speakers
- [ ] Transcription events are received
- [ ] Message events show conversation flow
- [ ] Mute/unmute functions correctly
- [ ] Text messages can be sent during call
- [ ] Call ends gracefully
- [ ] Reconnection works after network interruption
- [ ] Error events are properly emitted
- [ ] Tool execution events are visible
- [ ] Connection quality is reported

## Troubleshooting

### Microphone Access Denied
- Make sure to allow microphone access when prompted
- Check browser settings: Settings > Privacy > Microphone
- Try HTTPS or localhost (some browsers require secure context)

### SDK Not Loading
- Make sure the SDK is built: `npm run build` in `/packages/web-sdk`
- Make sure you copied the SDK file: `cp ../../dist/wespoke.umd.js .`
- Check browser console for 404 errors
- Verify `wespoke.umd.js` exists in the current directory

### CORS Errors
- Use Option 2 (local web server) instead of opening file directly
- Make sure your domain is whitelisted in the API key settings

### Authentication Failed
- Verify API key is correct and not revoked
- Check that domain is in allowed origins list
- For localhost testing, add `http://localhost:8080` to allowed origins

### No Audio
- Check microphone permissions
- Try different browser (Chrome/Firefox recommended)
- Check browser console for WebRTC errors
- Verify assistant is properly configured

## Browser Compatibility

Tested on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Next Steps

After testing this example:

1. Check out the **React example** for framework integration
2. Check out the **Vue example** for Vue.js usage
3. Read the full [SDK Documentation](../../README.md)
4. Deploy to production with your `pk_live_` key

## Support

- Documentation: https://docs.wespoke.com.tr
- Dashboard: https://wespoke.com.tr/dashboard
- Email: support@wespoke.com.tr
