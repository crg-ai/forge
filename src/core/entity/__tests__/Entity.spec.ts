import { describe, it, expect, beforeEach } from 'vitest'
import { Entity } from '../Entity'
import { EntityId } from '../EntityId'

// 测试用的具体实体实现
interface UserProps {
  email: string
  name: string
  age: number
  status: 'active' | 'inactive'
}

class User extends Entity<UserProps, number> {
  constructor(props: UserProps, id?: EntityId<number>) {
    super(props, id)
  }

  // 实现抽象方法
  protected validate(): void {
    if (!this.props.email || !this.props.email.includes('@')) {
      throw new Error('Invalid email')
    }
    if (!this.props.name || this.props.name.trim().length === 0) {
      throw new Error('Name cannot be empty')
    }
    if (this.props.age < 0 || this.props.age > 150) {
      throw new Error('Invalid age')
    }
  }

  // 业务方法示例
  activate(): void {
    this.props.status = 'active'
  }

  deactivate(): void {
    this.props.status = 'inactive'
  }

  updateEmail(email: string): void {
    this.props.email = email
    this.validate() // 重新验证
  }
}

// 测试用的订单实体（演示多个业务ID）
interface OrderProps {
  customerId: string
  totalAmount: number
  items: Array<{ productId: string; quantity: number; price: number }>
  status: 'pending' | 'paid' | 'shipped' | 'delivered'
}

class Order extends Entity<OrderProps, string> {
  constructor(props: OrderProps, id?: EntityId<string>) {
    super(props, id)
  }

  protected validate(): void {
    if (!this.props.customerId) {
      throw new Error('Customer ID is required')
    }
    if (this.props.totalAmount < 0) {
      throw new Error('Total amount cannot be negative')
    }
    if (this.props.items.length === 0) {
      throw new Error('Order must have at least one item')
    }
  }

  // 业务方法：支付订单
  pay(paymentId: string, transactionId: string): void {
    if (this.props.status !== 'pending') {
      throw new Error('Only pending orders can be paid')
    }
    this.props.status = 'paid'
    this.addIdentifier('paymentId', paymentId)
    this.addIdentifier('transactionId', transactionId)
  }

  // 业务方法：发货
  ship(trackingNumber: string): void {
    if (this.props.status !== 'paid') {
      throw new Error('Only paid orders can be shipped')
    }
    this.props.status = 'shipped'
    this.addIdentifier('trackingNumber', trackingNumber)
  }
}

describe('Entity', () => {
  describe('创建和初始化', () => {
    it('应该使用有效属性创建实体', () => {
      const user = new User({
        email: 'test@example.com',
        name: 'John Doe',
        age: 30,
        status: 'active'
      })

      expect(user.getClientId()).toBeDefined()
      expect(user.getBusinessId()).toBeUndefined()
      expect(user.isNew()).toBe(true)
      expect(user.getProps()).toEqual({
        email: 'test@example.com',
        name: 'John Doe',
        age: 30,
        status: 'active'
      })
    })

    it('应该使用提供的EntityId创建实体', () => {
      const id = EntityId.create<number>()
      id.setBusinessId(12345)

      const user = new User(
        {
          email: 'test@example.com',
          name: 'John Doe',
          age: 30,
          status: 'active'
        },
        id
      )

      expect(user.getClientId()).toBe(id.getClientId())
      expect(user.getBusinessId()).toBe(12345)
      expect(user.isNew()).toBe(false)
    })

    it('应该在属性无效时抛出错误', () => {
      expect(() => {
        new User({
          email: 'invalid-email',
          name: 'John',
          age: 30,
          status: 'active'
        })
      }).toThrow('Invalid email')

      expect(() => {
        new User({
          email: 'test@example.com',
          name: '',
          age: 30,
          status: 'active'
        })
      }).toThrow('Name cannot be empty')

      expect(() => {
        new User({
          email: 'test@example.com',
          name: 'John',
          age: -1,
          status: 'active'
        })
      }).toThrow('Invalid age')
    })
  })

  describe('ID管理', () => {
    let user: User

    beforeEach(() => {
      user = new User({
        email: 'test@example.com',
        name: 'John Doe',
        age: 30,
        status: 'active'
      })
    })

    it('应该获取客户端ID', () => {
      const clientId = user.getClientId()
      expect(clientId).toBeDefined()
      expect(typeof clientId).toBe('string')
    })

    it('应该设置和获取业务ID', () => {
      expect(user.getBusinessId()).toBeUndefined()
      expect(user.isNew()).toBe(true)

      user.setBusinessId(12345)

      expect(user.getBusinessId()).toBe(12345)
      expect(user.isNew()).toBe(false)
    })

    it('应该获取EntityId对象', () => {
      const id = user.getId()
      expect(id).toBeInstanceOf(EntityId)
      expect(id.getClientId()).toBe(user.getClientId())
    })

    it('应该添加和获取额外的标识符', () => {
      user.addIdentifier('externalId', 'EXT123')
      user.addIdentifier('legacyId', 456)

      expect(user.getIdentifier('externalId')).toBe('EXT123')
      expect(user.getIdentifier('legacyId')).toBe(456)
      expect(user.getIdentifier('nonexistent')).toBeUndefined()
    })
  })

  describe('业务ID场景', () => {
    it('应该支持订单的多个业务ID', () => {
      const order = new Order({
        customerId: 'CUST123',
        totalAmount: 100,
        items: [{ productId: 'P1', quantity: 2, price: 50 }],
        status: 'pending'
      })

      // 设置主业务ID
      order.setBusinessId('ORD-2024-001')
      expect(order.getBusinessId()).toBe('ORD-2024-001')

      // 支付订单，添加支付相关ID
      order.pay('PAY123', 'TXN456')
      expect(order.getIdentifier('paymentId')).toBe('PAY123')
      expect(order.getIdentifier('transactionId')).toBe('TXN456')
      expect(order.getProps().status).toBe('paid')

      // 发货，添加追踪号
      order.ship('TRACK789')
      expect(order.getIdentifier('trackingNumber')).toBe('TRACK789')
      expect(order.getProps().status).toBe('shipped')
    })

    it('应该正确处理订单状态流转', () => {
      const order = new Order({
        customerId: 'CUST123',
        totalAmount: 100,
        items: [{ productId: 'P1', quantity: 1, price: 100 }],
        status: 'pending'
      })

      // 尝试在未支付时发货应该失败
      expect(() => {
        order.ship('TRACK123')
      }).toThrow('Only paid orders can be shipped')

      // 正确的流程
      order.pay('PAY123', 'TXN456')
      expect(() => {
        order.ship('TRACK789')
      }).not.toThrow()

      // 不能重复支付
      expect(() => {
        order.pay('PAY456', 'TXN789')
      }).toThrow('Only pending orders can be paid')
    })
  })

  describe('属性管理', () => {
    it('应该返回只读的属性', () => {
      const user = new User({
        email: 'test@example.com',
        name: 'John Doe',
        age: 30,
        status: 'active'
      })

      const props = user.getProps()
      expect(props).toEqual({
        email: 'test@example.com',
        name: 'John Doe',
        age: 30,
        status: 'active'
      })

      // 验证返回的是副本，不是原始对象
      const props1 = user.getProps()
      const props2 = user.getProps()
      expect(props1).not.toBe(props2)
      expect(props1).toEqual(props2)
    })

    it('应该允许通过方法修改属性', () => {
      const user = new User({
        email: 'test@example.com',
        name: 'John Doe',
        age: 30,
        status: 'inactive'
      })

      user.activate()
      expect(user.getProps().status).toBe('active')

      user.deactivate()
      expect(user.getProps().status).toBe('inactive')
    })

    it('应该在修改后重新验证', () => {
      const user = new User({
        email: 'test@example.com',
        name: 'John Doe',
        age: 30,
        status: 'active'
      })

      expect(() => {
        user.updateEmail('invalid-email')
      }).toThrow('Invalid email')

      // 有效的更新应该成功
      user.updateEmail('new@example.com')
      expect(user.getProps().email).toBe('new@example.com')
    })
  })

  describe('相等性判断', () => {
    it('应该基于ID判断相等性', () => {
      const id = EntityId.create<number>()

      const user1 = new User(
        {
          email: 'test1@example.com',
          name: 'John',
          age: 30,
          status: 'active'
        },
        id
      )

      const user2 = new User(
        {
          email: 'test2@example.com',
          name: 'Jane',
          age: 25,
          status: 'inactive'
        },
        id
      )

      // 相同ID，不同属性，应该相等
      expect(user1.equals(user2)).toBe(true)
    })

    it('应该在ID不同时返回false', () => {
      const user1 = new User({
        email: 'test@example.com',
        name: 'John',
        age: 30,
        status: 'active'
      })

      const user2 = new User({
        email: 'test@example.com',
        name: 'John',
        age: 30,
        status: 'active'
      })

      // 不同ID，相同属性，应该不相等
      expect(user1.equals(user2)).toBe(false)
    })

    it('应该在比较业务ID时优先使用业务ID', () => {
      const user1 = new User({
        email: 'test1@example.com',
        name: 'John',
        age: 30,
        status: 'active'
      })

      const user2 = new User({
        email: 'test2@example.com',
        name: 'Jane',
        age: 25,
        status: 'inactive'
      })

      // 设置相同的业务ID
      user1.setBusinessId(12345)
      user2.setBusinessId(12345)

      // 不同的客户端ID，但相同的业务ID，应该相等
      expect(user1.equals(user2)).toBe(true)
    })

    it('应该对null或undefined返回false', () => {
      const user = new User({
        email: 'test@example.com',
        name: 'John',
        age: 30,
        status: 'active'
      })

      expect(user.equals(null as any)).toBe(false)
      expect(user.equals(undefined as any)).toBe(false)
      expect(user.equals()).toBe(false)
    })

    it('应该对非Entity实例返回false', () => {
      const user = new User({
        email: 'test@example.com',
        name: 'John',
        age: 30,
        status: 'active'
      })

      expect(user.equals({ id: 'test' } as any)).toBe(false)
      expect(user.equals('string' as any)).toBe(false)
      expect(user.equals(123 as any)).toBe(false)
    })
  })

  describe('序列化', () => {
    it('应该转换为对象', () => {
      const user = new User({
        email: 'test@example.com',
        name: 'John Doe',
        age: 30,
        status: 'active'
      })

      user.setBusinessId(12345)
      user.addIdentifier('externalId', 'EXT123')

      const obj = user.toObject()

      expect(obj.id).toBeDefined()
      expect(obj.id.clientId).toBe(user.getClientId())
      expect(obj.id.businessId).toBe(12345)
      expect(obj.id.secondaryIds).toEqual({ externalId: 'EXT123' })
      expect(obj.props).toEqual({
        email: 'test@example.com',
        name: 'John Doe',
        age: 30,
        status: 'active'
      })
    })

    it('应该序列化没有业务ID的实体', () => {
      const user = new User({
        email: 'test@example.com',
        name: 'John Doe',
        age: 30,
        status: 'active'
      })

      const obj = user.toObject()

      expect(obj.id.businessId).toBeUndefined()
      expect(obj.id.secondaryIds).toBeUndefined()
    })
  })

  describe('验证', () => {
    it('应该在创建时验证', () => {
      expect(() => {
        new User({
          email: '',
          name: 'John',
          age: 30,
          status: 'active'
        })
      }).toThrow('Invalid email')
    })

    it('应该验证复杂的业务规则', () => {
      expect(() => {
        new Order({
          customerId: '',
          totalAmount: 100,
          items: [{ productId: 'P1', quantity: 1, price: 100 }],
          status: 'pending'
        })
      }).toThrow('Customer ID is required')

      expect(() => {
        new Order({
          customerId: 'CUST123',
          totalAmount: -10,
          items: [{ productId: 'P1', quantity: 1, price: 100 }],
          status: 'pending'
        })
      }).toThrow('Total amount cannot be negative')

      expect(() => {
        new Order({
          customerId: 'CUST123',
          totalAmount: 0,
          items: [],
          status: 'pending'
        })
      }).toThrow('Order must have at least one item')
    })
  })

  describe('边界情况', () => {
    it('应该处理空的次要ID', () => {
      const user = new User({
        email: 'test@example.com',
        name: 'John',
        age: 30,
        status: 'active'
      })

      expect(user.getIdentifier('nonexistent')).toBeUndefined()
    })

    it('应该支持不同类型的业务ID', () => {
      // 数字类型
      const user = new User({
        email: 'test@example.com',
        name: 'John',
        age: 30,
        status: 'active'
      })
      user.setBusinessId(12345)
      expect(user.getBusinessId()).toBe(12345)

      // 字符串类型
      const order = new Order({
        customerId: 'CUST123',
        totalAmount: 100,
        items: [{ productId: 'P1', quantity: 1, price: 100 }],
        status: 'pending'
      })
      order.setBusinessId('ORD-2024-001')
      expect(order.getBusinessId()).toBe('ORD-2024-001')
    })
  })
})
