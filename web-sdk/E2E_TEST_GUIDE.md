# End-to-End Testing Guide for Wespoke Web SDK

## Test Status: READY FOR EXECUTION

**Date Prepared:** 2025-11-28
**SDK Build:** Latest (with REST API integration)
**Test Server:** Running on http://localhost:8081

---

## Prerequisites

### 1. SDK Build ✅ COMPLETE
- SDK built successfully with REST API integration
- All async/await patterns updated in examples
- Latest UMD bundle copied to vanilla-js example

### 2. Test Server ✅ RUNNING
- HTTP server running on port 8081
- Vanilla-js example available at: http://localhost:8081

### 3. Required Credentials
You'll need to obtain these from the dashboard:
- API Key (from existing test key or create new one)
- Assistant ID (from an existing assistant)

---

## Step 1: Get API Key and Assistant ID

### Option A: Use Existing Test Key
According to the completion report, there's an existing test key:
```
pk_test_1AEWcjp7JBpEFJVgl14tEmYKMNsqCjOyUOLQIdhJyAS
```

### Option B: Create New Key
1. Navigate to: http://localhost:3000/dashboard/embedding
2. Click "Create API Key"
3. Choose:
   - Environment: Test
   - Type: Public (for browser use)
   - Name: "E2E Test Key"
   - Allowed Origins: Add `http://localhost:8081`
4. Copy the API key (shown only once!)

### Get Assistant ID
1. Navigate to: http://localhost:3000/dashboard/assistants
2. Select any assistant
3. Copy the assistant ID from the URL or assistant details

---

## Step 2: Configure the Test Application

1. Open http://localhost:8081 in your browser
2. The application should load with localStorage persisting your credentials
3. Enter your credentials:
   - **API Key**: `pk_test_1AEWcjp7JBpEFJVgl14tEmYKMNsqCjOyUOLQIdhJyAS` (or your new key)
   - **Assistant ID**: [Your assistant ID]
   - **API URL**: Leave blank (uses default: https://api.wespoke.com.tr)
   - **Debug Mode**: Check this to see detailed console logs
4. Click "Initialize SDK"
5. You should see: "SDK initialized successfully!"

---

## Step 3: Test Call Flow

### 3.1 Start a Call
1. Click "Start Call" button
2. Allow microphone access when prompted
3. Watch for state changes:
   - IDLE → CONNECTING → CONNECTED
4. Verify UI updates:
   - Status badge turns green
   - Call ID appears
   - Microphone shows "Active"
   - Controls become enabled

### 3.2 During the Call
1. **Test Microphone Mute/Unmute**
   - Click "Mute" button
   - Verify "Microphone" shows "Muted"
   - Click "Unmute"
   - Verify "Microphone" shows "Active"

2. **Test Send Message**
   - Click "Send Message"
   - Enter a text message in the prompt
   - Click OK
   - Verify message appears in conversation panel
   - Verify assistant responds

3. **Monitor Events**
   - Watch Events Log panel for real-time events
   - Verify events are logged:
     - CONNECTED
     - MESSAGE
     - TRANSCRIPTION
     - ASSISTANT_SPEAKING
     - MICROPHONE_MUTED
     - etc.

4. **Check Conversation**
   - Messages should appear in real-time
   - User messages in blue
   - Assistant messages in teal
   - Tool messages in purple

### 3.3 End the Call
1. Click "End Call" button
2. Verify state changes:
   - CONNECTED → DISCONNECTING → DISCONNECTED
3. Verify UI resets:
   - Status badge turns gray
   - Call ID clears
   - Controls become disabled
   - Start Call button re-enabled

---

## Step 4: Verify Backend Integration

### 4.1 Check Call Logs
1. Navigate to: http://localhost:3000/dashboard/call-logs
2. Find your test call (most recent)
3. Verify:
   - **Source (Kaynak)**: Should show "Web" (not "Telefon" or "Test")
   - **Duration**: Matches your call length
   - **Status**: Should be "completed"
   - **Messages**: Click to view conversation transcript

### 4.2 Check Credit Deduction
1. Navigate to: http://localhost:3000/dashboard/billing
2. Check current credit balance
3. Compare with balance before call
4. Verify deduction matches call duration
5. Expected formula: `max(actualCost + ($0.03 × minutes), plan.perMinuteRate × minutes)`

### 4.3 Check Analytics
1. Navigate to: http://localhost:3000/dashboard/embedding
2. Click "Analytics" tab
3. Verify:
   - **Total Calls**: Incremented by 1
   - **Total Duration**: Includes your call
   - **Calls Over Time chart**: Shows today's call
   - **API Key Usage**: Shows your test key usage

### 4.4 Check API Key Usage Stats
1. Navigate to: http://localhost:3000/dashboard/embedding
2. Find your API key in the list
3. Verify:
   - **Usage Count**: Incremented
   - **Last Used**: Shows current timestamp
   - **Status**: Still "Active"

---

## Step 5: Test Error Scenarios

### 5.1 Test Invalid Assistant ID
1. Initialize SDK with valid API key
2. Enter a non-existent assistant ID
3. Click "Start Call"
4. Expected: Error message showing "Assistant not found" or similar
5. Verify error appears in:
   - Init message area (red)
   - Events log
   - Browser console (if debug enabled)

### 5.2 Test Insufficient Credits (Optional)
**Note:** Only test if you have a test account with low/zero credits
1. Use an account with balance < $1
2. Try to start a call
3. Expected: 402 error "Insufficient credits"

### 5.3 Test Domain Validation
1. If you created a new key with specific allowed origins
2. Try accessing from a different origin (e.g., open file directly)
3. Expected: Origin validation error

### 5.4 Test Revoked Key
1. Create a new test API key
2. Initialize SDK with it
3. Make a successful call
4. Navigate to embedding dashboard
5. Revoke the key
6. Try to start another call with same key
7. Expected: "API key has been revoked" error

---

## Step 6: Test REST API Integration

### 6.1 Verify sendMessage is Async
1. Start a call
2. Open browser DevTools → Console
3. Click "Send Message" and enter text
4. Verify in console:
   - No "Promise rejection" errors
   - Message sent successfully
   - Response received from REST API

### 6.2 Verify endCall is Async
1. Start a call
2. Open browser DevTools → Network tab
3. Click "End Call"
4. Verify in Network tab:
   - POST request to `/api/v1/embed/calls/{callId}/end`
   - Authorization header with Bearer token
   - Successful 200 response

### 6.3 Verify toggleMute is Async
1. Start a call
2. Open browser DevTools → Network tab
3. Click "Mute"
4. Verify in Network tab:
   - POST request to `/api/v1/embed/calls/{callId}/mute`
   - Request completes successfully

---

## Step 7: Browser Compatibility Testing

### Test on Multiple Browsers
1. **Chrome** (Primary)
   - Test all features above
   - Note any issues

2. **Firefox**
   - Open http://localhost:8081
   - Repeat Step 3 tests
   - Note any issues

3. **Safari**
   - Open http://localhost:8081
   - Repeat Step 3 tests
   - Note WebRTC permission differences
   - Note any issues

4. **Edge** (if available)
   - Open http://localhost:8081
   - Repeat Step 3 tests
   - Note any issues

### Mobile Testing (Optional)
1. Find your local IP address: `ifconfig | grep inet`
2. Update allowed origins in API key to include `http://{your-ip}:8081`
3. Open on mobile browser
4. Test basic call flow
5. Note mobile-specific issues

---

## Step 8: Performance & Metrics

### Monitor Call Quality
During a call, check:
- **Connection Quality**: Should show "excellent" or "good"
- **Audio Latency**: Should be low (<500ms noticeable delay)
- **Transcription Accuracy**: Verify STT is working correctly
- **TTS Quality**: Verify assistant voice is clear

### Check Console Logs (Debug Mode)
With debug enabled, verify console shows:
- SDK initialization
- LiveKit connection events
- REST API calls with endpoints
- Event emissions
- Error handling

---

## Expected Results Checklist

### Basic Functionality
- [ ] SDK initializes without errors
- [ ] Call starts and connects successfully
- [ ] Audio bidirectional (can hear assistant, assistant hears you)
- [ ] Messages appear in real-time
- [ ] Mute/unmute works
- [ ] End call works gracefully
- [ ] Events log all actions

### Backend Integration
- [ ] Call appears in call logs with "Web" source
- [ ] Credits deducted correctly
- [ ] Analytics updated (total calls, duration)
- [ ] API key usage stats updated
- [ ] Messages persisted to database

### REST API Integration
- [ ] sendMessage() uses REST API (not WebSocket)
- [ ] endCall() uses REST API
- [ ] toggleMute() uses REST API
- [ ] All async operations complete successfully
- [ ] No unhandled Promise rejections

### Error Handling
- [ ] Invalid assistant ID shows error
- [ ] Insufficient credits shows 402 error (if tested)
- [ ] Revoked key rejected
- [ ] Domain validation enforced
- [ ] Errors displayed to user

### Browser Compatibility
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge (if tested)
- [ ] No console errors in any browser

---

## Troubleshooting

### Issue: "Origin not allowed"
**Solution:** Add `http://localhost:8081` to API key's allowed origins

### Issue: "Insufficient credits"
**Solution:** Add credits to your account via billing page

### Issue: "Assistant not found"
**Solution:** Verify assistant ID is correct and assistant exists

### Issue: Microphone not working
**Solution:**
- Check browser permissions
- Try HTTPS instead of HTTP (browsers restrict mic on HTTP)
- Use `localhost` (browsers allow mic on localhost even with HTTP)

### Issue: "SDK not initialized"
**Solution:** Click "Initialize SDK" button before starting call

### Issue: Events not appearing
**Solution:** Check if debug mode is enabled, verify SDK is initialized

### Issue: Messages not showing
**Solution:** Check browser console for errors, verify assistant is responding

---

## Post-Test Cleanup

1. Stop the test HTTP server:
   ```bash
   # Find the Python server process
   lsof -ti:8081 | xargs kill
   ```

2. Optional: Revoke test API keys if no longer needed
3. Optional: Clear localStorage in browser: `localStorage.clear()`

---

## Reporting Issues

If you encounter issues during testing, report them with:
1. **Browser & Version**: e.g., "Chrome 120.0.6099.109"
2. **Error Message**: Exact error from UI or console
3. **Steps to Reproduce**: What you did before error occurred
4. **Expected vs Actual**: What should happen vs what happened
5. **Screenshots**: If applicable
6. **Console Logs**: Full error stack trace if available

---

## Success Criteria

This E2E test is considered **PASSED** if:
1. ✅ Can initialize SDK with API key
2. ✅ Can start call successfully
3. ✅ Can send messages via REST API
4. ✅ Can mute/unmute via REST API
5. ✅ Can end call via REST API
6. ✅ Call appears in logs with "Web" source
7. ✅ Credits deducted correctly
8. ✅ Analytics updated correctly
9. ✅ Works in at least 3 browsers
10. ✅ No critical errors in console

---

**Next Steps After E2E Test:**
- Update completion report with test results
- Document any bugs found
- Fix any critical issues
- Proceed to browser compatibility testing (Step 7 in detail)
- Move to documentation phase
