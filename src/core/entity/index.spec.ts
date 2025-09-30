import { describe, it, expect } from 'vitest'
import { EntityId, Entity } from './index'
import * as EntityExports from './index'

// 测试用实体
interface TestProps {
  name: string
  value: number
}

class TestEntity extends Entity<TestProps, number> {
  constructor(props: TestProps, id?: EntityId<number>) {
    super(props, id)
  }

  protected validate(): void {
    if (!this.props.name) {
      throw new Error('Name is required')
    }
    if (this.props.value < 0) {
      throw new Error('Value must be non-negative')
    }
  }
}

describe('Entity模块导出', () => {
  it('应该导出EntityId类', () => {
    expect(EntityId).toBeDefined()
    expect(typeof EntityId).toBe('function')
    expect(typeof EntityId.create).toBe('function')
    expect(typeof EntityId.restore).toBe('function')
  })

  it('应该导出Entity基类', () => {
    expect(Entity).toBeDefined()
    expect(typeof Entity).toBe('function')
  })

  it('应该只导出预期的成员', () => {
    const exports = Object.keys(EntityExports)
    expect(exports).toHaveLength(2)
    expect(exports).toContain('EntityId')
    expect(exports).toContain('Entity')
  })

  it('应该能够创建和使用实体', () => {
    // 创建新实体
    const entity = new TestEntity({
      name: 'Test',
      value: 100
    })

    expect(entity.getClientId()).toBeDefined()
    expect(entity.isNew()).toBe(true)
    expect(entity.getProps()).toEqual({
      name: 'Test',
      value: 100
    })

    // 设置业务ID
    entity.setBusinessId(12345)
    expect(entity.getBusinessId()).toBe(12345)
    expect(entity.isNew()).toBe(false)

    // 添加额外标识符
    entity.addIdentifier('externalId', 'EXT-001')
    expect(entity.getIdentifier('externalId')).toBe('EXT-001')
  })

  it('EntityId应该支持双ID模式', () => {
    const id = EntityId.create<number>()

    // 初始状态
    expect(id.getClientId()).toBeDefined()
    expect(id.getBusinessId()).toBeUndefined()
    expect(id.isNew()).toBe(true)

    // 设置业务ID
    id.setBusinessId(999)
    expect(id.getBusinessId()).toBe(999)
    expect(id.isNew()).toBe(false)

    // 添加次要ID
    id.addSecondaryId('orderId', 'ORD-123')
    id.addSecondaryId('invoiceId', 'INV-456')
    expect(id.getSecondaryId('orderId')).toBe('ORD-123')
    expect(id.getSecondaryId('invoiceId')).toBe('INV-456')
  })

  it('实体应该基于ID判断相等性', () => {
    const id = EntityId.create<number>()

    const entity1 = new TestEntity({ name: 'A', value: 1 }, id)
    const entity2 = new TestEntity({ name: 'B', value: 2 }, id)
    const entity3 = new TestEntity({ name: 'C', value: 3 })

    // 相同ID，不同属性，应该相等
    expect(entity1.equals(entity2)).toBe(true)

    // 不同ID，应该不相等
    expect(entity1.equals(entity3)).toBe(false)
  })
})
