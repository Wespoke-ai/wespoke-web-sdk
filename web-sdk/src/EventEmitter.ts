/**
 * Browser-compatible EventEmitter implementation
 * Provides type-safe event handling for the SDK
 */

type EventHandler<T = any> = (data: T) => void;

export class EventEmitter<Events extends Record<string, any> = Record<string, any>> {
  private events: Map<keyof Events, Set<EventHandler>>;

  constructor() {
    this.events = new Map();
  }

  /**
   * Register an event listener
   */
  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): this {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }

    const handlers = this.events.get(event)!;
    handlers.add(handler);

    return this;
  }

  /**
   * Register a one-time event listener
   */
  once<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): this {
    const onceHandler: EventHandler<Events[K]> = (data) => {
      handler(data);
      this.off(event, onceHandler);
    };

    return this.on(event, onceHandler);
  }

  /**
   * Remove an event listener
   */
  off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): this {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.events.delete(event);
      }
    }

    return this;
  }

  /**
   * Emit an event
   */
  emit<K extends keyof Events>(event: K, ...args: Events[K] extends void ? [] : [Events[K]]): boolean {
    const handlers = this.events.get(event);
    if (!handlers || handlers.size === 0) {
      return false;
    }

    handlers.forEach((handler) => {
      try {
        handler(args[0] as Events[K]);
      } catch (error) {
        console.error(`Error in event handler for "${String(event)}":`, error);
      }
    });

    return true;
  }

  /**
   * Remove all listeners for an event, or all events if no event specified
   */
  removeAllListeners<K extends keyof Events>(event?: K): this {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }

    return this;
  }

  /**
   * Get the number of listeners for an event
   */
  listenerCount<K extends keyof Events>(event: K): number {
    const handlers = this.events.get(event);
    return handlers ? handlers.size : 0;
  }

  /**
   * Get all event names that have listeners
   */
  eventNames(): Array<keyof Events> {
    return Array.from(this.events.keys());
  }
}
