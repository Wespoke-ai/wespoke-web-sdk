/**
 * @wespoke/widget - Pre-built web widget for Wespoke AI voice assistants
 *
 * Add AI voice chat to your website with a single line of code.
 *
 * @example
 * ```typescript
 * // React
 * import { WespokeWidget } from '@wespoke/widget';
 * import '@wespoke/widget/dist/wespoke-widget.css';
 *
 * <WespokeWidget
 *   apiKey="pk_live_your_key"
 *   assistantId="asst_your_id"
 * />
 * ```
 *
 * @example
 * ```html
 * <!-- Vanilla JS -->
 * <script src="https://unpkg.com/@wespoke/widget"></script>
 * <link rel="stylesheet" href="https://unpkg.com/@wespoke/widget/dist/wespoke-widget.css">
 * <script>
 *   WespokeWidget.create({
 *     apiKey: 'pk_live_your_key',
 *     assistantId: 'asst_your_id'
 *   });
 * </script>
 * ```
 */

// Export main widget component and factory function
export { WespokeWidget, create } from './WespokeWidget';

// Export all components for advanced usage
export { FloatingButton } from './components/FloatingButton';
export { ChatWindow } from './components/ChatWindow';
export { VoiceControls } from './components/VoiceControls';
export { ChatInput } from './components/ChatInput';
export { Transcript } from './components/Transcript';

// Export all types
export type {
  WespokeWidgetConfig,
  WespokeWidgetAPI,
  WespokeWidgetProps,
  WidgetPosition,
  WidgetTheme,
  WidgetSize,
  WidgetMode,
  WidgetState,
  WidgetLocale,
  WidgetMessage,
  WidgetError,
  MessageRole
} from './types';

// Re-export for CommonJS compatibility
import { WespokeWidget, create } from './WespokeWidget';

// Default export for simpler imports
export default {
  WespokeWidget,
  create
};
