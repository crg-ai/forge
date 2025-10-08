import { describe, it, expect } from 'vitest'
import { BaseDomainEvent } from '../DomainEvent'

// 测试用的领域事件
interface TestEventProps {
  aggregateId: string
  message: string
  value: number
}

class TestEvent extends BaseDomainEvent<TestEventProps> {
  constructor(props: TestEventProps) {
    super('TestEvent', props)
  }

  get message() {
    return this.props.message
  }

  get value() {
    return this.props.value
  }
}

describe('DomainEvent', () => {
  describe('BaseDomainEvent', () => {
    describe('事件创建', () => {
      it('应该生成唯一的事件ID', () => {
        // Arrange & Act
        const event = new TestEvent({
          aggregateId: 'test-id',
          message: 'Test message',
          value: 42
        })

        // Assert
        expect(event.eventId).toBeDefined()
      })

      it('应该使用正确的事件名称', () => {
        // Arrange & Act
        const event = new TestEvent({
          aggregateId: 'test-id',
          message: 'Test message',
          value: 42
        })

        // Assert
        expect(event.eventName).toBe('TestEvent')
      })

      it('应该记录发生时间', () => {
        // Arrange & Act
        const event = new TestEvent({
          aggregateId: 'test-id',
          message: 'Test message',
          value: 42
        })

        // Assert
        expect(event.occurredOn).toBeInstanceOf(Date)
      })

      it('应该包含聚合ID', () => {
        // Arrange & Act
        const event = new TestEvent({
          aggregateId: 'test-id',
          message: 'Test message',
          value: 42
        })

        // Assert
        expect(event.aggregateId).toBe('test-id')
      })

      it('应该包含业务数据', () => {
        // Arrange & Act
        const event = new TestEvent({
          aggregateId: 'test-id',
          message: 'Test message',
          value: 42
        })

        // Assert
        expect(event.message).toBe('Test message')
        expect(event.value).toBe(42)
      })
    })

    describe('事件唯一性', () => {
      it('不同事件应该有不同的事件ID', () => {
        // Arrange & Act
        const event1 = new TestEvent({
          aggregateId: 'test-id',
          message: 'Test 1',
          value: 1
        })

        const event2 = new TestEvent({
          aggregateId: 'test-id',
          message: 'Test 2',
          value: 2
        })

        // Assert
        expect(event1.eventId).not.toBe(event2.eventId)
      })
    })

    describe('不可变性', () => {
      it('事件属性应该被冻结', () => {
        // Arrange
        const event = new TestEvent({
          aggregateId: 'test-id',
          message: 'Test',
          value: 42
        })

        // Act & Assert
        expect(() => {
          ;(event.props as any).message = 'Modified'
        }).toThrow()
      })
    })

    describe('JSON序列化', () => {
      it('toJSON应该包含所有事件元数据', () => {
        // Arrange
        const event = new TestEvent({
          aggregateId: 'test-id',
          message: 'Test message',
          value: 42
        })

        // Act
        const json = event.toJSON()

        // Assert
        expect(json.eventId).toBe(event.eventId)
        expect(json.eventName).toBe('TestEvent')
        expect(json.eventType).toBe('TestEvent')
        expect(json.aggregateId).toBe('test-id')
        expect(json.occurredOn).toBe(event.occurredOn.toISOString())
        expect(json.props.message).toBe('Test message')
        expect(json.props.value).toBe(42)
      })

      it('eventType应该是构造函数名称', () => {
        // Arrange
        const event = new TestEvent({
          aggregateId: 'test-id',
          message: 'Test',
          value: 1
        })

        // Act
        const json = event.toJSON()

        // Assert
        expect(json.eventType).toBe(event.constructor.name)
        expect(json.eventType).toBe('TestEvent')
      })
    })

    describe('时间戳', () => {
      it('occurredOn应该记录事件创建时的当前时间', () => {
        // Arrange
        const before = new Date()

        // Act
        const event = new TestEvent({
          aggregateId: 'test-id',
          message: 'Test',
          value: 42
        })
        const after = new Date()

        // Assert
        expect(event.occurredOn.getTime()).toBeGreaterThanOrEqual(before.getTime())
        expect(event.occurredOn.getTime()).toBeLessThanOrEqual(after.getTime())
      })
    })

    describe('复杂业务数据', () => {
      it('应该支持嵌套对象和数组', () => {
        // Arrange
        interface ComplexEventProps {
          aggregateId: string
          user: {
            id: string
            name: string
          }
          items: Array<{ id: string; quantity: number }>
          metadata: Record<string, unknown>
        }

        class ComplexEvent extends BaseDomainEvent<ComplexEventProps> {
          constructor(props: ComplexEventProps) {
            super('ComplexEvent', props)
          }
        }

        // Act
        const event = new ComplexEvent({
          aggregateId: 'order-123',
          user: { id: 'user-1', name: 'John' },
          items: [
            { id: 'item-1', quantity: 2 },
            { id: 'item-2', quantity: 1 }
          ],
          metadata: { source: 'web', version: '1.0' }
        })

        // Assert
        expect(event.props.user.name).toBe('John')
        expect(event.props.items).toHaveLength(2)
        expect(event.props.metadata.source).toBe('web')
      })
    })
  })
})
