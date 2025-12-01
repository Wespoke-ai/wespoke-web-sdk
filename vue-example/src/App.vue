<template>
  <div class="app">
    <div class="header">
      <h1>🎙️ Wespoke Web SDK</h1>
      <p class="subtitle">Vue 3 Integration Example</p>
      <button
        v-if="isConfigured"
        class="btn btn-secondary btn-sm"
        @click="reconfigure"
      >
        ← Reconfigure
      </button>
    </div>

    <!-- Configuration Panel -->
    <div v-if="!isConfigured" class="config-panel">
      <h2>Configuration</h2>
      <form @submit.prevent="handleConfigure">
        <div class="form-group">
          <label for="apiKey">API Key *</label>
          <input
            id="apiKey"
            v-model="config.apiKey"
            type="text"
            placeholder="pk_live_xxx or pk_test_xxx"
            required
          />
        </div>

        <div class="form-group">
          <label for="assistantId">Assistant ID *</label>
          <input
            id="assistantId"
            v-model="config.assistantId"
            type="text"
            placeholder="Enter your assistant ID"
            required
          />
        </div>

        <div class="form-group">
          <label for="apiUrl">API URL (Optional)</label>
          <input
            id="apiUrl"
            v-model="config.apiUrl"
            type="text"
            placeholder="https://api.wespoke.com.tr"
          />
        </div>

        <div class="form-group checkbox">
          <label>
            <input v-model="config.debug" type="checkbox" />
            Enable Debug Mode
          </label>
        </div>

        <button type="submit" class="btn btn-primary">
          Initialize SDK
        </button>
      </form>
    </div>

    <!-- Main Interface -->
    <div v-else>
      <div class="grid">
        <!-- Status Panel -->
        <div class="panel">
          <h2>Status</h2>
          <div
            class="status-badge"
            :style="{ backgroundColor: getStateColor(wespoke.state.value) }"
          >
            {{ wespoke.state.value }}
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Call ID</div>
              <div class="info-value">{{ wespoke.callId.value || '-' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Microphone</div>
              <div class="info-value">
                {{ wespoke.isMuted.value ? '🔇 Muted' : '🎤 Active' }}
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">Assistant</div>
              <div class="info-value">
                {{ wespoke.isAssistantSpeaking.value ? '🗣️ Speaking' : '🤐 Silent' }}
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">Messages</div>
              <div class="info-value">{{ wespoke.messages.value.length }}</div>
            </div>
          </div>

          <div v-if="wespoke.error.value" class="error-message">
            <strong>Error:</strong> {{ wespoke.error.value.message }}
          </div>
        </div>

        <!-- Controls Panel -->
        <div class="panel">
          <h2>Controls</h2>
          <div class="button-group">
            <button
              class="btn btn-primary"
              :disabled="wespoke.state.value !== 'IDLE' && wespoke.state.value !== 'DISCONNECTED'"
              @click="handleStartCall"
            >
              Start Call
            </button>
            <button
              class="btn btn-danger"
              :disabled="wespoke.state.value !== 'CONNECTED'"
              @click="handleEndCall"
            >
              End Call
            </button>
          </div>

          <div class="button-group">
            <button
              class="btn btn-secondary"
              :disabled="wespoke.state.value !== 'CONNECTED'"
              @click="handleToggleMute"
            >
              {{ wespoke.isMuted.value ? '🔇 Unmute' : '🎤 Mute' }}
            </button>
          </div>

          <form @submit.prevent="handleSendMessage" class="message-form">
            <input
              v-model="messageInput"
              type="text"
              placeholder="Type a message..."
              :disabled="wespoke.state.value !== 'CONNECTED'"
            />
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="wespoke.state.value !== 'CONNECTED' || !messageInput.trim()"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      <!-- Messages Panel -->
      <div class="panel">
        <div class="panel-header">
          <h2>Conversation</h2>
          <button
            class="btn btn-secondary btn-sm"
            @click="wespoke.clearMessages"
          >
            Clear
          </button>
        </div>

        <div class="messages-container">
          <p v-if="wespoke.messages.value.length === 0" class="empty-state">
            No messages yet. Start a call to begin.
          </p>
          <div
            v-for="(message, index) in wespoke.messages.value"
            :key="index"
            :class="['message', `message-${message.role}`]"
          >
            <div class="message-role">{{ message.role.toUpperCase() }}</div>
            <div class="message-content">{{ message.content }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWespoke } from './composables/useWespoke';

// Configuration state
const config = ref({
  apiKey: '',
  assistantId: '',
  apiUrl: '',
  debug: false,
});

const isConfigured = ref(false);
const messageInput = ref('');

// Initialize Wespoke composable
const wespoke = useWespoke({
  apiKey: computed(() => config.value.apiKey || 'pk_test_placeholder').value,
  apiUrl: computed(() => config.value.apiUrl || undefined).value,
  debug: computed(() => config.value.debug).value,
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

// Handlers
const handleConfigure = () => {
  if (!config.value.apiKey.trim()) {
    alert('Please enter an API key');
    return;
  }
  if (!config.value.assistantId.trim()) {
    alert('Please enter an assistant ID');
    return;
  }
  isConfigured.value = true;
};

const reconfigure = () => {
  isConfigured.value = false;
};

const handleStartCall = async () => {
  try {
    await wespoke.startCall(config.value.assistantId, {
      userId: 'demo-user-' + Date.now(),
      sessionId: 'session-' + Date.now(),
      customData: { source: 'vue-example' },
    });
  } catch (error) {
    console.error('Failed to start call:', error);
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

const handleSendMessage = async () => {
  if (messageInput.value.trim()) {
    try {
      await wespoke.sendMessage(messageInput.value.trim());
      messageInput.value = '';
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }
};

const getStateColor = (state: string): string => {
  switch (state) {
    case 'CONNECTED':
      return '#27ae60';
    case 'CONNECTING':
      return '#f39c12';
    case 'ERROR':
      return '#e74c3c';
    case 'DISCONNECTING':
      return '#e67e22';
    default:
      return '#95a5a6';
  }
};
</script>

<style scoped>
/* Component-specific styles can go here if needed */
/* Most styles are in style.css */
</style>
