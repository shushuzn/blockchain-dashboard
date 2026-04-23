class EventBus {
  constructor() {
    this.handlers = new Map()
  }

  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, [])
    }
    this.handlers.get(event).push(handler)
    return this
  }

  off(event, handler) {
    if (!handler) {
      this.handlers.delete(event)
    } else {
      const handlers = this.handlers.get(event) || []
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
    return this
  }

  emit(event, data) {
    const handlers = this.handlers.get(event) || []
    handlers.forEach((handler) => {
      try {
        Promise.resolve(handler(data)).catch(console.error)
      } catch (err) {
        console.error('Event handler error:', err)
      }
    })
    return this
  }

  once(event, handler) {
    const onceHandler = (data) => {
      handler(data)
      this.off(event, onceHandler)
    }
    return this.on(event, onceHandler)
  }
}

const eventBus = new EventBus()

module.exports = { EventBus, eventBus }
