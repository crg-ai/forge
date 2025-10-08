import { describe, it, expect } from 'vitest'
import { BaseDomainEvent } from '../DomainEvent'
import { deserializeEvent, createEventRegistry } from '../deserializeEvent'

// 测试用的领域事件
interface OrderCreatedEventProps {
  aggregateId: string
  customerId: string
  totalAmount: number
}

class OrderCreatedEvent extends BaseDomainEvent<OrderCreatedEventProps> {
  constructor(props: OrderCreatedEventProps) {
    super('OrderCreated', props)
  }

  get customerId() {
    return this.props.customerId
  }

  get totalAmount() {
    return this.props.totalAmount
  }
}

interface OrderSubmittedEventProps {
  aggregateId: string
  orderId: string
  amount: number
}

class OrderSubmittedEvent extends BaseDomainEvent<OrderSubmittedEventProps> {
  constructor(props: OrderSubmittedEventProps) {
    super('OrderSubmitted', props)
  }

  get orderId() {
    return this.props.orderId
  }

  get amount() {
    return this.props.amount
  }
}

interface UserRegisteredEventProps {
  aggregateId: string
  email: string
  username: string
}

class UserRegisteredEvent extends BaseDomainEvent<UserRegisteredEventProps> {
  constructor(props: UserRegisteredEventProps) {
    super('UserRegistered', props)
  }

  get email() {
    return this.props.email
  }

  get username() {
    return this.props.username
  }
}

describe('deserializeEvent', () => {
  describe('基础功能', () => {
    it('应该能够反序列化简单事件', () => {
      // Arrange
      const registry = createEventRegistry({
        OrderCreatedEvent
      })

      const json = {
        eventId: 'event-1',
        eventName: 'OrderCreated',
        eventType: 'OrderCreatedEvent',
        occurredOn: '2025-10-08T12:00:00.000Z',
        aggregateId: 'order-123',
        props: {
          aggregateId: 'order-123',
          customerId: 'customer-1',
          totalAmount: 100
        }
      }

      // Act
      const event = deserializeEvent(json, registry)

      // Assert
      expect(event).toBeInstanceOf(OrderCreatedEvent)
      expect(event.eventId).toBe('event-1')
      expect(event.eventName).toBe('OrderCreated')
      expect(event.aggregateId).toBe('order-123')
      expect(event.occurredOn).toEqual(new Date('2025-10-08T12:00:00.000Z'))
      expect((event as OrderCreatedEvent).customerId).toBe('customer-1')
      expect((event as OrderCreatedEvent).totalAmount).toBe(100)
    })

    it('应该能够反序列化多种事件类型', () => {
      // Arrange
      const registry = createEventRegistry({
        OrderCreatedEvent,
        OrderSubmittedEvent,
        UserRegisteredEvent
      })

      const orderJson = {
        eventId: 'event-1',
        eventName: 'OrderCreated',
        eventType: 'OrderCreatedEvent',
        occurredOn: '2025-10-08T12:00:00.000Z',
        aggregateId: 'order-1',
        props: {
          aggregateId: 'order-1',
          customerId: 'customer-1',
          totalAmount: 100
        }
      }

      const userJson = {
        eventId: 'event-2',
        eventName: 'UserRegistered',
        eventType: 'UserRegisteredEvent',
        occurredOn: '2025-10-08T13:00:00.000Z',
        aggregateId: 'user-1',
        props: {
          aggregateId: 'user-1',
          email: 'user@example.com',
          username: 'john'
        }
      }

      // Act
      const orderEvent = deserializeEvent(orderJson, registry)
      const userEvent = deserializeEvent(userJson, registry)

      // Assert
      expect(orderEvent).toBeInstanceOf(OrderCreatedEvent)
      expect(userEvent).toBeInstanceOf(UserRegisteredEvent)
      expect((userEvent as UserRegisteredEvent).email).toBe('user@example.com')
    })

    it('应该保留所有事件元数据', () => {
      // Arrange
      const registry = createEventRegistry({
        OrderSubmittedEvent
      })

      const json = {
        eventId: 'unique-event-id',
        eventName: 'OrderSubmitted',
        eventType: 'OrderSubmittedEvent',
        occurredOn: '2025-10-08T14:30:00.000Z',
        aggregateId: 'order-456',
        props: {
          aggregateId: 'order-456',
          orderId: 'order-456',
          amount: 250
        }
      }

      // Act
      const event = deserializeEvent(json, registry)

      // Assert
      expect(event.eventId).toBe('unique-event-id')
      expect(event.eventName).toBe('OrderSubmitted')
      expect(event.occurredOn).toEqual(new Date('2025-10-08T14:30:00.000Z'))
      expect(event.aggregateId).toBe('order-456')
    })
  })

  describe('错误处理', () => {
    it('应该在事件类型未注册时抛出错误', () => {
      // Arrange
      const registry = createEventRegistry({
        OrderCreatedEvent
      })

      const json = {
        eventId: 'event-1',
        eventName: 'UnknownEvent',
        eventType: 'UnknownEvent',
        occurredOn: '2025-10-08T12:00:00.000Z',
        aggregateId: 'agg-1',
        props: {
          aggregateId: 'agg-1'
        }
      }

      // Act & Assert
      expect(() => deserializeEvent(json, registry)).toThrow('Unknown event type: UnknownEvent')
    })

    it('错误信息应该包含可用的事件类型列表', () => {
      // Arrange
      const registry = createEventRegistry({
        OrderCreatedEvent,
        OrderSubmittedEvent
      })

      const json = {
        eventId: 'event-1',
        eventName: 'UnknownEvent',
        eventType: 'UnknownEvent',
        occurredOn: '2025-10-08T12:00:00.000Z',
        aggregateId: 'agg-1',
        props: {
          aggregateId: 'agg-1'
        }
      }

      // Act & Assert
      expect(() => deserializeEvent(json, registry)).toThrow(
        /Available types: OrderCreatedEvent, OrderSubmittedEvent/
      )
    })

    it('应该在 JSON 格式无效时抛出错误', () => {
      // Arrange
      const registry = createEventRegistry({
        OrderCreatedEvent
      })

      const invalidJson = {
        eventId: 'event-1',
        // 缺少 eventType
        occurredOn: '2025-10-08T12:00:00.000Z',
        aggregateId: 'order-1',
        props: {}
      } as any

      // Act & Assert
      expect(() => deserializeEvent(invalidJson, registry)).toThrow()
    })
  })

  describe('序列化和反序列化往返', () => {
    it('应该能够往返序列化事件', () => {
      // Arrange
      const registry = createEventRegistry({
        OrderCreatedEvent
      })

      const originalEvent = new OrderCreatedEvent({
        aggregateId: 'order-789',
        customerId: 'customer-2',
        totalAmount: 500
      })

      // Act - 序列化
      const json = originalEvent.toJSON()

      // Act - 反序列化
      const deserializedEvent = deserializeEvent(json, registry)

      // Assert - 验证关键属性
      expect(deserializedEvent).toBeInstanceOf(OrderCreatedEvent)
      expect(deserializedEvent.eventId).toBe(originalEvent.eventId)
      expect(deserializedEvent.eventName).toBe(originalEvent.eventName)
      expect(deserializedEvent.aggregateId).toBe(originalEvent.aggregateId)
      expect(deserializedEvent.occurredOn).toEqual(originalEvent.occurredOn)
      expect((deserializedEvent as OrderCreatedEvent).customerId).toBe('customer-2')
      expect((deserializedEvent as OrderCreatedEvent).totalAmount).toBe(500)
    })

    it('应该保持时间精度', () => {
      // Arrange
      const registry = createEventRegistry({
        OrderCreatedEvent
      })

      const originalEvent = new OrderCreatedEvent({
        aggregateId: 'order-1',
        customerId: 'customer-1',
        totalAmount: 100
      })

      const originalTime = originalEvent.occurredOn

      // Act
      const json = originalEvent.toJSON()
      const deserializedEvent = deserializeEvent(json, registry)

      // Assert
      expect(deserializedEvent.occurredOn.getTime()).toBe(originalTime.getTime())
    })
  })

  describe('createEventRegistry', () => {
    it('应该创建类型安全的事件注册表', () => {
      // Act
      const registry = createEventRegistry({
        OrderCreatedEvent,
        OrderSubmittedEvent,
        UserRegisteredEvent
      })

      // Assert
      expect(registry.OrderCreatedEvent).toBe(OrderCreatedEvent)
      expect(registry.OrderSubmittedEvent).toBe(OrderSubmittedEvent)
      expect(registry.UserRegisteredEvent).toBe(UserRegisteredEvent)
    })

    it('应该支持空注册表', () => {
      // Act
      const registry = createEventRegistry({})

      // Assert
      expect(Object.keys(registry)).toHaveLength(0)
    })
  })

  describe('复杂业务数据', () => {
    it('应该能够反序列化包含嵌套对象的事件', () => {
      // Arrange
      interface ComplexEventProps {
        aggregateId: string
        user: {
          id: string
          name: string
        }
        items: Array<{ productId: string; quantity: number }>
      }

      class ComplexEvent extends BaseDomainEvent<ComplexEventProps> {
        constructor(props: ComplexEventProps) {
          super('ComplexEvent', props)
        }
      }

      const registry = createEventRegistry({
        ComplexEvent
      })

      const json = {
        eventId: 'event-1',
        eventName: 'ComplexEvent',
        eventType: 'ComplexEvent',
        occurredOn: '2025-10-08T12:00:00.000Z',
        aggregateId: 'agg-1',
        props: {
          aggregateId: 'agg-1',
          user: { id: 'user-1', name: 'John' },
          items: [
            { productId: 'prod-1', quantity: 2 },
            { productId: 'prod-2', quantity: 1 }
          ]
        }
      }

      // Act
      const event = deserializeEvent(json, registry)

      // Assert
      expect(event.props.user.name).toBe('John')
      expect(event.props.items).toHaveLength(2)
      expect(event.props.items[0].quantity).toBe(2)
    })
  })
})
