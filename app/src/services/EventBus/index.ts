export default class EventBus<T extends Event> {
  private readonly handlers: Record<string, Set<EventHandler<T>>> = {};

  constructor() {}

  addEventListener<E extends T>(
    type: E['type'],
    handler: EventHandler<E>,
  ): void {
    if (!this.handlers[type]) {
      this.handlers[type] = new Set();
    }

    this.handlers[type].add(handler as any);
  }

  removeEventListener<E extends T>(
    type: E['type'],
    handler: EventHandler<E>,
  ): void {
    this.handlers[type]?.delete(handler as any);
  }

  dispatchEvent<E extends T>(event: E): void {
    this.handlers[event.type]?.forEach((handler) => {
      handler(event);
    });
  }

  pipeFrom<E extends T>(type: E['type'], other: EventBus<E>): void {
    other.addEventListener(type, (event) => {
      this.dispatchEvent(event as E);
    });
  }

  clear() {
    Object.keys(this.handlers).forEach((key) => {
      delete this.handlers[key];
    });
  }
}

export type EventHandler<E> = (event: E) => void;

export abstract class CustomEvent<T extends string> extends Event {
  public type!: T;
  constructor(type: T) {
    super(type);
    this.type = type;
  }
}
