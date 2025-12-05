# Assistant Overrides

Assistant overrides allow you to customize your AI assistant's behavior per-widget or per-call without creating multiple assistant configurations. This feature is inspired by Vapi's assistant overrides system.

## Overview

Assistant overrides enable you to:
- **Customize per-widget**: Different behavior on different pages using the same assistant
- **Dynamic personalization**: Use template variables to inject runtime values (customer name, product info, etc.)
- **Test variations**: A/B test different prompts or settings without creating separate assistants
- **Client-specific behavior**: Tailor responses for different customers using the same base assistant

## Features

### Configuration Overrides
- **temperature**: Control creativity level (0-2)
- **maxResponseTokens**: Limit response length
- **recordingEnabled**: Enable/disable call recording
- **endCallAfterSilence**: Automatic call ending after silence (seconds)

### Content Overrides with Template Variables
- **systemPrompt**: Override the assistant's system instructions
- **firstMessage**: Customize the initial greeting
- **variableValues**: Dynamic variable substitution using `{{variableName}}` syntax

## Usage

### Web SDK (Voice Calls)

```typescript
import Wespoke from '@wespoke/web-sdk';

const client = new Wespoke({
  apiKey: 'your-api-key',
  apiUrl: 'https://api.wespoke.ai'
});

await client.startCall({
  assistantId: 'your-assistant-id',

  // Assistant overrides
  assistantOverrides: {
    temperature: 0.8,
    maxResponseTokens: 500,

    systemPrompt: 'You are a customer support agent for {{companyName}}. Help customers with {{productName}}.',
    firstMessage: 'Hello! I\'m the {{companyName}} AI assistant. How can I help you with {{productName}} today?',

    variableValues: {
      companyName: 'Acme Corp',
      productName: 'Cloud Platform',
      supportEmail: 'support@acme.com'
    },

    recordingEnabled: true,
    endCallAfterSilence: 30
  }
});
```

### Widget (Voice + Chat)

```javascript
const widget = WespokeWidget.create({
  apiKey: 'your-api-key',
  assistantId: 'your-assistant-id',
  mode: 'hybrid', // 'voice', 'chat', or 'hybrid'

  // Assistant overrides
  assistantOverrides: {
    temperature: 0.7,

    systemPrompt: 'Sen {{companyName}} için çalışan AI asistansın.',
    firstMessage: 'Merhaba! {{companyName}} AI asistanınız. Size nasıl yardımcı olabilirim?',

    variableValues: {
      companyName: 'Wespoke',
      productName: 'AI Sesli Asistan'
    }
  }
});
```

### Text Chat

```typescript
import Wespoke from '@wespoke/web-sdk';

const client = new Wespoke({
  apiKey: 'your-api-key',
  apiUrl: 'https://api.wespoke.ai'
});

const chat = await client.startTextChat({
  assistantId: 'your-assistant-id',

  // Assistant overrides
  assistantOverrides: {
    temperature: 0.9,
    maxResponseTokens: 300,

    systemPrompt: 'You are a helpful {{role}} assistant specializing in {{expertise}}.',
    firstMessage: 'Hi! I\'m your {{role}} assistant. How can I assist you with {{expertise}}?',

    variableValues: {
      role: 'technical support',
      expertise: 'API integration',
      docsUrl: 'https://docs.example.com'
    }
  }
});
```

## Template Variables

Template variables allow dynamic content substitution using `{{variableName}}` syntax.

### Syntax
- **Variable Declaration**: Use `{{variableName}}` in `systemPrompt` or `firstMessage`
- **Variable Values**: Provide values in `variableValues` object
- **Supported Types**: string, number, boolean

### Examples

```typescript
// Basic substitution
systemPrompt: 'You work for {{companyName}}'
variableValues: { companyName: 'Acme Corp' }
// Result: "You work for Acme Corp"

// Multiple variables
firstMessage: 'Hello! I\'m {{name}} from {{company}}. I can help with {{topic}}.'
variableValues: {
  name: 'Alice',
  company: 'Support Team',
  topic: 'billing questions'
}
// Result: "Hello! I'm Alice from Support Team. I can help with billing questions."

// Undefined variables are preserved
systemPrompt: 'Contact us at {{email}} or {{phone}}'
variableValues: { email: 'support@acme.com' }
// Result: "Contact us at support@acme.com or {{phone}}"
```

### Best Practices

1. **Use descriptive variable names**: `{{customerName}}` instead of `{{name}}`
2. **Provide all variables**: Missing values leave placeholders in output
3. **Validate inputs**: Sanitize user-provided variable values
4. **Keep it simple**: Avoid complex logic in prompts, use straightforward substitutions

## Override Priority

When multiple override sources exist, they are applied in this order:

1. **Base assistant configuration** (from dashboard)
2. **Assistant overrides** (per-call/widget overrides)
3. **Legacy overrides** (deprecated `customGreetingMessage` and `customInstructions`)

Overrides completely replace base values (no merging):
- If you override `systemPrompt`, the base `systemPrompt` is ignored
- If you don't provide an override, the base value is used

## API Reference

### AssistantOverrides Interface

```typescript
interface AssistantOverrides {
  // Configuration overrides
  temperature?: number;          // 0-2, controls creativity
  maxResponseTokens?: number;    // Positive integer, limits response length
  recordingEnabled?: boolean;    // Enable/disable recording
  endCallAfterSilence?: number;  // Seconds of silence before auto-end

  // Content overrides
  systemPrompt?: string;         // Override system instructions
  firstMessage?: string;         // Override initial greeting

  // Template variables
  variableValues?: Record<string, string | number | boolean>;
}
```

### Validation Rules

- **temperature**: Must be a number between 0 and 2
- **maxResponseTokens**: Must be a positive number
- **recordingEnabled**: Must be a boolean
- **endCallAfterSilence**: Must be a non-negative number
- **systemPrompt**: Must be a string
- **firstMessage**: Must be a string
- **variableValues**: Must be an object with primitive values (string, number, boolean)

## Use Cases

### Multi-Brand Support
Use the same assistant across different brands with customized branding:

```typescript
// Brand A widget
assistantOverrides: {
  systemPrompt: 'You represent {{brandName}}. Our values: {{values}}',
  variableValues: {
    brandName: 'TechCo',
    values: 'innovation and reliability'
  }
}

// Brand B widget
assistantOverrides: {
  systemPrompt: 'You represent {{brandName}}. Our values: {{values}}',
  variableValues: {
    brandName: 'ServicePro',
    values: 'customer satisfaction and speed'
  }
}
```

### Localized Experiences
Customize for different languages or regions:

```typescript
// Turkish
assistantOverrides: {
  firstMessage: 'Merhaba! {{companyName}} asistanınız. Nasıl yardımcı olabilirim?',
  variableValues: { companyName: 'Wespoke' }
}

// English
assistantOverrides: {
  firstMessage: 'Hello! I\'m the {{companyName}} assistant. How can I help?',
  variableValues: { companyName: 'Wespoke' }
}
```

### A/B Testing
Test different conversation styles:

```typescript
// Formal style
assistantOverrides: {
  temperature: 0.5,
  systemPrompt: 'You are a professional business consultant.'
}

// Casual style
assistantOverrides: {
  temperature: 0.9,
  systemPrompt: 'You are a friendly, casual assistant who uses simple language.'
}
```

### Context-Aware Support
Inject context based on the user's location or product:

```typescript
assistantOverrides: {
  systemPrompt: 'You are helping a customer with {{productName}}. Current plan: {{planName}}. Support priority: {{priority}}',
  variableValues: {
    productName: 'Enterprise Plan',
    planName: 'Premium',
    priority: 'high'
  }
}
```

## Implementation Details

### Backend Processing

1. **Storage**: Overrides are stored in `call.callMetadata.assistantOverrides`
2. **Processing**: `AssistantOverrideService` handles variable substitution and validation
3. **Application**: Overrides are applied before the agent receives the configuration

### Variable Substitution Algorithm

```javascript
// Simple regex-based replacement
text.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
  return variableValues[variableName] ?? match;
});
```

### Security Considerations

- **No code execution**: Template variables are simple string substitutions
- **No nested variables**: `{{{{nested}}}}` is not supported
- **Type safety**: Only primitive values (string, number, boolean) allowed
- **Input validation**: All overrides are validated before storage

## Migration from Legacy System

If you're using the deprecated `customGreetingMessage` or `customInstructions`:

```typescript
// Old approach (deprecated)
await client.startCall({
  assistantId: 'your-assistant-id',
  customGreetingMessage: 'Hello!',
  customInstructions: 'Be helpful'
});

// New approach (recommended)
await client.startCall({
  assistantId: 'your-assistant-id',
  assistantOverrides: {
    firstMessage: 'Hello!',
    systemPrompt: 'Be helpful'
  }
});
```

The legacy fields still work but will be removed in a future version.

## Troubleshooting

### Variables Not Substituting

**Problem**: `{{variableName}}` appears in output instead of the value

**Solutions**:
- Verify variable name matches exactly (case-sensitive)
- Check that `variableValues` object is provided
- Ensure value is not `null` or `undefined`

### Overrides Not Applied

**Problem**: Base assistant configuration is used instead of overrides

**Solutions**:
- Verify overrides are passed in the correct field (`assistantOverrides`)
- Check backend logs for validation errors
- Ensure assistant exists and is published

### Invalid Override Errors

**Problem**: API returns validation errors

**Solutions**:
- Check temperature is between 0-2
- Ensure maxResponseTokens is positive
- Verify variableValues contains only primitives (no objects/arrays)

## Resources

- **TypeScript Types**: See `@wespoke/web-sdk/src/types.ts` for full type definitions
- **Example Code**: See `/widget/examples/cdn-example/index.html` for complete examples
- **Backend Service**: See `/backend/src/services/AssistantOverrideService.js` for implementation details

## Support

For questions or issues with assistant overrides:
- Email: support@wespoke.ai
- Documentation: https://docs.wespoke.ai
- GitHub Issues: https://github.com/wespoke/wespoke-sdk
