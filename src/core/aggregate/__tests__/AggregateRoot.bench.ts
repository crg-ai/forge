import { bench, describe } from 'vitest'
import { AggregateRoot } from '../AggregateRoot'
import { BaseDomainEvent } from '../../domain-event/DomainEvent'

/**
 * AggregateRoot 性能基准测试
 *
 * 关注前端实际使用场景，而非极端情况
 * 前端特点：
 * - 事件数量通常较少（10-50 个）
 * - 关注内存占用和序列化性能
 * - 实时用户体验（操作应在 100ms 内完成）
 */

// 测试用的事件和聚合根
interface TestEventProps {
  aggregateId: string
  data: string
  value: number
}

class TestEvent extends BaseDomainEvent<TestEventProps> {
  constructor(aggregateId: string, data: string, value: number) {
    super('TestEvent', { aggregateId, data, value })
  }
}

interface TestAggregateProps {
  name: string
  items: Array<{ id: string; value: number }>
}

class TestAggregate extends AggregateRoot<TestAggregateProps> {
  static create(name: string): TestAggregate {
    return new TestAggregate({ name, items: [] })
  }

  performAction(data: string, value: number): void {
    this.addDomainEvent(new TestEvent(this.getClientId(), data, value))
  }

  addItem(id: string, value: number): void {
    this.props.items.push({ id, value })
    this.addDomainEvent(new TestEvent(this.getClientId(), `item-added-${id}`, value))
  }

  getItems() {
    return this.props.items
  }
}

describe('AggregateRoot 性能基准（前端场景）', () => {
  describe('事件管理性能', () => {
    bench('创建聚合根（无事件）', () => {
      TestAggregate.create('test-aggregate')
    })

    bench('添加 10 个事件（典型购物车场景）', () => {
      const aggregate = TestAggregate.create('shopping-cart')
      for (let i = 0; i < 10; i++) {
        aggregate.performAction(`action-${i}`, i)
      }
    })

    bench('添加 50 个事件（购物车容量上限）', () => {
      const aggregate = TestAggregate.create('shopping-cart')
      for (let i = 0; i < 50; i++) {
        aggregate.performAction(`action-${i}`, i)
      }
    })

    bench('getDomainEvents (10 events)', () => {
      const aggregate = TestAggregate.create('test')
      for (let i = 0; i < 10; i++) {
        aggregate.performAction(`action-${i}`, i)
      }
      aggregate.getDomainEvents()
    })

    bench('getDomainEvents (50 events)', () => {
      const aggregate = TestAggregate.create('test')
      for (let i = 0; i < 50; i++) {
        aggregate.performAction(`action-${i}`, i)
      }
      aggregate.getDomainEvents()
    })

    bench('clearDomainEvents (10 events)', () => {
      const aggregate = TestAggregate.create('test')
      for (let i = 0; i < 10; i++) {
        aggregate.performAction(`action-${i}`, i)
      }
      aggregate.clearDomainEvents()
    })

    bench('hasDomainEvents（快速检查）', () => {
      const aggregate = TestAggregate.create('test')
      aggregate.performAction('action', 1)
      aggregate.hasDomainEvents()
    })

    bench('getDomainEventCount', () => {
      const aggregate = TestAggregate.create('test')
      for (let i = 0; i < 10; i++) {
        aggregate.performAction(`action-${i}`, i)
      }
      aggregate.getDomainEventCount()
    })
  })

  describe('事件序列化性能', () => {
    bench('序列化 10 个事件到 JSON', () => {
      const aggregate = TestAggregate.create('test')
      for (let i = 0; i < 10; i++) {
        aggregate.performAction(`action-${i}`, i * 100)
      }
      const events = aggregate.getDomainEvents()
      events.map(e => e.toJSON())
    })

    bench('序列化 50 个事件到 JSON', () => {
      const aggregate = TestAggregate.create('test')
      for (let i = 0; i < 50; i++) {
        aggregate.performAction(`action-${i}`, i * 100)
      }
      const events = aggregate.getDomainEvents()
      events.map(e => e.toJSON())
    })

    bench('JSON.stringify 10 个事件（WebSocket 传输）', () => {
      const aggregate = TestAggregate.create('test')
      for (let i = 0; i < 10; i++) {
        aggregate.performAction(`action-${i}`, i)
      }
      const events = aggregate.getDomainEvents()
      JSON.stringify(events.map(e => e.toJSON()))
    })
  })

  describe('完整业务流程性能', () => {
    bench('创建订单 + 添加 5 个商品 + 获取事件', () => {
      const order = TestAggregate.create('order')

      // 添加商品
      for (let i = 0; i < 5; i++) {
        order.addItem(`product-${i}`, i * 100)
      }

      // 获取事件
      order.getDomainEvents()
    })

    bench('仓储保存流程（持久化 + 事件发布 + 清除）', () => {
      const aggregate = TestAggregate.create('aggregate')

      // 执行业务操作
      for (let i = 0; i < 10; i++) {
        aggregate.performAction(`action-${i}`, i)
      }

      // 模拟仓储操作
      const events = aggregate.getDomainEvents()
      JSON.stringify(events.map(e => e.toJSON()))
      aggregate.clearDomainEvents()
    })
  })

  describe('批量聚合根操作（前端实际场景）', () => {
    bench('创建 100 个聚合根（列表渲染）', () => {
      const aggregates = []
      for (let i = 0; i < 100; i++) {
        aggregates.push(TestAggregate.create(`aggregate-${i}`))
      }
    })

    bench('100 个聚合根各添加 10 个事件', () => {
      const aggregates = []
      for (let i = 0; i < 100; i++) {
        const agg = TestAggregate.create(`aggregate-${i}`)
        for (let j = 0; j < 10; j++) {
          agg.performAction(`action-${j}`, j)
        }
        aggregates.push(agg)
      }
    })

    bench('批量获取事件（100 个聚合根 × 10 事件）', () => {
      const aggregates = []

      // 创建并填充聚合根
      for (let i = 0; i < 100; i++) {
        const agg = TestAggregate.create(`aggregate-${i}`)
        for (let j = 0; j < 10; j++) {
          agg.performAction(`action-${j}`, j)
        }
        aggregates.push(agg)
      }

      // 批量获取事件
      aggregates.flatMap(agg => agg.getDomainEvents())
    })
  })

  describe('Entity 继承功能性能', () => {
    bench('getClientId', () => {
      const aggregate = TestAggregate.create('test')
      aggregate.getClientId()
    })

    bench('isNew', () => {
      const aggregate = TestAggregate.create('test')
      aggregate.isNew()
    })

    bench('equals 比较', () => {
      const agg1 = TestAggregate.create('test1')
      const agg2 = TestAggregate.create('test2')
      agg1.equals(agg2)
    })

    bench('toJSON（聚合根序列化）', () => {
      const aggregate = TestAggregate.create('test')
      for (let i = 0; i < 5; i++) {
        aggregate.addItem(`item-${i}`, i * 50)
      }
      aggregate.toJSON()
    })
  })
})
