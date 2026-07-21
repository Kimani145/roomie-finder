import { EventEmitter } from 'events'
import { Events, EventPayloads, AppEvent } from './EventCatalogue'
import { logger } from '../utils/logger'

class TypedEventBus extends EventEmitter {
  public publish<K extends AppEvent>(event: K, payload: EventPayloads[K]): boolean {
    logger.debug({ msg: 'Publishing event', event, payload })
    return this.emit(event, payload)
  }

  public subscribe<K extends AppEvent>(event: K, listener: (payload: EventPayloads[K]) => void | Promise<void>): this {
    // Wrap listener to catch unhandled promise rejections since EventBus is sync by default
    const wrappedListener = async (payload: EventPayloads[K]) => {
      try {
        await listener(payload)
      } catch (err) {
        logger.error({ msg: 'Error processing event', event, err })
      }
    }
    return this.on(event, wrappedListener)
  }

  public unsubscribe<K extends AppEvent>(event: K, listener: (payload: EventPayloads[K]) => void): this {
    return this.off(event, listener)
  }
}

// Singleton instance
export const EventBus = new TypedEventBus()
