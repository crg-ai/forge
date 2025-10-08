import { describe, it, expect } from 'vitest'
import { AggregateRoot } from '../AggregateRoot'
import { BaseDomainEvent } from '../../domain-event/DomainEvent'

// 测试用的领域事件
interface OrderCreatedEventProps {
  aggregateId: string
  customerId: string
}

class OrderCreatedEvent extends BaseDomainEvent<OrderCreatedEventProps> {
  constructor(props: OrderCreatedEventProps) {
    super('OrderCreated', props)
  }

  get customerId() {
    return this.props.customerId
  }
}

interface OrderSubmittedEventProps {
  aggregateId: string
  totalAmount: number
}

class OrderSubmittedEvent extends BaseDomainEvent<OrderSubmittedEventProps> {
  constructor(props: OrderSubmittedEventProps) {
    super('OrderSubmitted', props)
  }

  get totalAmount() {
    return this.props.totalAmount
  }
}

// 测试用的聚合根
interface OrderProps {
  customerId: string
  status: 'DRAFT' | 'SUBMITTED' | 'PAID'
  items: Array<{ productId: string; quantity: number; price: number }>
  totalAmount: number
}

class Order extends AggregateRoot<OrderProps, string> {
  private constructor(props: OrderProps) {
    super(props)
  }

  static create(customerId: string): Order {
    const props: OrderProps = {
      customerId,
      status: 'DRAFT',
      items: [],
      totalAmount: 0
    }
    const order = new Order(props)

    order.addDomainEvent(
      new OrderCreatedEvent({
        aggregateId: order.getClientId(),
        customerId
      })
    )

    return order
  }

  addItem(productId: string, quantity: number, price: number): void {
    if (this.props.status !== 'DRAFT') {
      throw new Error('只有草稿订单可以添加商品')
    }

    this.props.items.push({ productId, quantity, price })
    this.props.totalAmount += quantity * price
  }

  submit(): void {
    if (this.props.status !== 'DRAFT') {
      throw new Error('只有草稿订单可以提交')
    }

    if (this.props.items.length === 0) {
      throw new Error('订单必须包含至少一个商品')
    }

    this.props.status = 'SUBMITTED'

    this.addDomainEvent(
      new OrderSubmittedEvent({
        aggregateId: this.getClientId(),
        totalAmount: this.props.totalAmount
      })
    )
  }

  getStatus() {
    return this.props.status
  }

  getTotalAmount() {
    return this.props.totalAmount
  }

  getItems() {
    return [...this.props.items]
  }
}

describe('AggregateRoot', () => {
  describe('基础功能', () => {
    describe('Entity 继承', () => {
      it('应该有客户端ID', () => {
        // Arrange & Act
        const order = Order.create('customer-1')

        // Assert
        expect(order.getClientId()).toBeDefined()
      })

      it('新创建的聚合应该标记为新建', () => {
        // Arrange & Act
        const order = Order.create('customer-1')

        // Assert
        expect(order.isNew()).toBe(true)
      })

      it('应该有实体ID', () => {
        // Arrange & Act
        const order = Order.create('customer-1')

        // Assert
        expect(order.getId()).toBeDefined()
      })
    })

    it('应该在创建时初始化空的事件列表', () => {
      // Arrange & Act
      const order = Order.create('customer-1')

      // create 方法会添加一个 OrderCreatedEvent
      expect(order.getDomainEventCount()).toBe(1)
    })
  })

  describe('领域事件管理', () => {
    it('应该能够添加领域事件', () => {
      // Arrange
      const order = Order.create('customer-1')
      const initialCount = order.getDomainEventCount()

      // Act
      order.addItem('product-1', 2, 100)
      order.submit()

      // Assert - OrderCreatedEvent + OrderSubmittedEvent
      expect(order.getDomainEventCount()).toBe(initialCount + 1)
    })

    it('应该能够获取所有领域事件', () => {
      // Arrange
      const order = Order.create('customer-1')

      // Act
      order.addItem('product-1', 2, 100)
      order.submit()
      const events = order.getDomainEvents()

      // Assert
      expect(events).toHaveLength(2)
      expect(events[0]).toBeInstanceOf(OrderCreatedEvent)
      expect(events[1]).toBeInstanceOf(OrderSubmittedEvent)
    })

    it('返回的事件数组应该是只读副本', () => {
      // Arrange
      const order = Order.create('customer-1')

      // Act
      const events1 = order.getDomainEvents()
      const events2 = order.getDomainEvents()

      // Assert
      expect(events1).not.toBe(events2) // 不同的数组引用
      expect(events1).toEqual(events2) // 但内容相同
    })

    it('应该能够清除所有领域事件', () => {
      // Arrange
      const order = Order.create('customer-1')
      order.addItem('product-1', 2, 100)
      order.submit()
      expect(order.getDomainEventCount()).toBeGreaterThan(0)

      // Act
      order.clearDomainEvents()

      // Assert
      expect(order.getDomainEventCount()).toBe(0)
      expect(order.getDomainEvents()).toHaveLength(0)
    })

    it('应该能够检查是否有待发布事件', () => {
      // Arrange
      const order = Order.create('customer-1')

      // Act & Assert
      expect(order.hasDomainEvents()).toBe(true)

      order.clearDomainEvents()

      expect(order.hasDomainEvents()).toBe(false)
    })

    it('应该按照添加顺序保存事件', () => {
      // Arrange
      const order = Order.create('customer-1')

      // Act
      order.addItem('product-1', 2, 100)
      order.submit()
      const events = order.getDomainEvents()

      // Assert
      expect((events[0] as OrderCreatedEvent).customerId).toBe('customer-1')
      expect((events[1] as OrderSubmittedEvent).totalAmount).toBe(200)
    })

    it('应该正确统计事件数量', () => {
      // Arrange
      const order = Order.create('customer-1')

      // Assert - 创建时有1个事件
      expect(order.getDomainEventCount()).toBe(1)

      // Act - 添加商品并提交
      order.addItem('product-1', 2, 100)
      order.submit()

      // Assert - 现在有2个事件
      expect(order.getDomainEventCount()).toBe(2)

      // Act - 清除事件
      order.clearDomainEvents()

      // Assert - 事件数为0
      expect(order.getDomainEventCount()).toBe(0)
    })
  })

  describe('业务场景', () => {
    it('应该在聚合状态变更时发布事件', () => {
      // Arrange
      const order = Order.create('customer-1')

      // Act
      order.addItem('product-1', 1, 100)
      order.addItem('product-2', 2, 200)
      order.submit()

      // Assert
      const events = order.getDomainEvents()
      const submittedEvent = events.find(
        e => e.eventName === 'OrderSubmitted'
      ) as OrderSubmittedEvent

      expect(submittedEvent).toBeDefined()
      expect(submittedEvent.totalAmount).toBe(500) // 1*100 + 2*200
    })

    it('应该在业务规则验证失败时不产生事件', () => {
      // Arrange
      const order = Order.create('customer-1')
      const eventCountBefore = order.getDomainEventCount()

      // Act & Assert
      expect(() => {
        order.submit() // 没有商品，应该抛出异常
      }).toThrow('订单必须包含至少一个商品')

      expect(order.getDomainEventCount()).toBe(eventCountBefore)
    })

    it('应该维护聚合的一致性', () => {
      // Arrange
      const order = Order.create('customer-1')

      // Act
      order.addItem('product-1', 2, 100)
      order.submit()

      // Assert
      expect(order.getStatus()).toBe('SUBMITTED')
      expect(order.getTotalAmount()).toBe(200)

      // 已提交的订单不能再添加商品
      expect(() => {
        order.addItem('product-2', 1, 50)
      }).toThrow('只有草稿订单可以添加商品')
    })

    it('事件应该包含完整的业务信息', () => {
      // Arrange
      const customerId = 'customer-123'

      // Act
      const order = Order.create(customerId)
      const events = order.getDomainEvents()
      const createdEvent = events[0] as OrderCreatedEvent

      // Assert
      expect(createdEvent.eventId).toBeDefined()
      expect(createdEvent.eventName).toBe('OrderCreated')
      expect(createdEvent.occurredOn).toBeInstanceOf(Date)
      expect(createdEvent.aggregateId).toBe(order.getClientId())
      expect(createdEvent.customerId).toBe(customerId)
    })

    it('应该支持复杂的业务流程', () => {
      // Arrange & Act - 1. 创建订单
      const order = Order.create('customer-1')

      // Assert
      expect(order.getDomainEventCount()).toBe(1)

      // Act - 2. 添加商品
      order.addItem('product-1', 2, 100)
      order.addItem('product-2', 1, 300)

      // Assert
      expect(order.getTotalAmount()).toBe(500)

      // Act - 3. 提交订单
      order.submit()

      // Assert
      expect(order.getStatus()).toBe('SUBMITTED')
      expect(order.getDomainEventCount()).toBe(2)

      // Assert - 4. 验证事件
      const events = order.getDomainEvents()
      expect(events[0].eventName).toBe('OrderCreated')
      expect(events[1].eventName).toBe('OrderSubmitted')
    })
  })

  describe('与仓储的集成', () => {
    it('应该支持仓储的事件发布流程', () => {
      // Arrange - 模拟仓储保存流程
      const order = Order.create('customer-1')
      order.addItem('product-1', 2, 100)
      order.submit()

      // Act - 1. 获取事件
      const events = order.getDomainEvents()

      // Assert
      expect(events.length).toBeGreaterThan(0)

      // Act - 2. 模拟发布事件
      const publishedEvents = [...events]

      // Act - 3. 清除事件
      order.clearDomainEvents()

      // Assert - 4. 验证清除成功
      expect(order.hasDomainEvents()).toBe(false)
      expect(publishedEvents).toHaveLength(2)
    })
  })

  describe('边界情况', () => {
    it('应该处理没有事件的情况', () => {
      // Arrange
      const order = Order.create('customer-1')

      // Act
      order.clearDomainEvents()

      // Assert
      expect(order.getDomainEvents()).toEqual([])
      expect(order.hasDomainEvents()).toBe(false)
      expect(order.getDomainEventCount()).toBe(0)
    })

    it('应该支持多次清除事件', () => {
      // Arrange
      const order = Order.create('customer-1')

      // Act
      order.clearDomainEvents()
      order.clearDomainEvents()

      // Assert
      expect(order.hasDomainEvents()).toBe(false)
    })

    it('清除事件后应该能够继续添加新事件', () => {
      // Arrange
      const order = Order.create('customer-1')
      order.clearDomainEvents()

      // Act
      order.addItem('product-1', 1, 100)
      order.submit()

      // Assert
      expect(order.getDomainEventCount()).toBe(1)
      expect(order.getDomainEvents()[0].eventName).toBe('OrderSubmitted')
    })
  })
})
