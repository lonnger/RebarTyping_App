class EventBus {
  private events: Map<string, Function[]>;

  constructor() {
    this.events = new Map();
  }

  /**
   * Subscribe to an event
   * @param event Event name
   * @param callback Function to be called when event is triggered
   * @returns Unsubscribe function
   */
  subscribe(event: string, callback: Function): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    this.events.get(event)!.push(callback);

    return () => this.unsubscribe(event, callback);
  }

  /**
   * Unsubscribe from an event
   * @param event Event name
   * @param callback Function to remove from event listeners
   */
  unsubscribe(event: string, callback: Function): void {
    if (!this.events.has(event)) return;

    const callbacks = this.events.get(event)!;
    const index = callbacks.indexOf(callback);

    if (index !== -1) {
      callbacks.splice(index, 1);

      if (callbacks.length === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * Publish an event with data
   * @param event Event name
   * @param data Data to pass to event listeners
   */
  publish(event: string, ...data: any[]): void {
    if (!this.events.has(event)) return;

    const callbacks = this.events.get(event)!;
    callbacks.forEach((callback) => {
      try {
        callback(...data);
      } catch (error) {
        console.error(`Error in event listener for "${event}":`, error);
      }
    });
  }

  /**
   * Clear all event listeners
   */
  clear(): void {
    this.events.clear();
  }

  /**
   * Clear all listeners for a specific event
   * @param event Event name
   */
  clearEvent(event: string): void {
    this.events.delete(event);
  }
}

export default new EventBus();
