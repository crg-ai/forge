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

  // 公开 API - Getters
  get email(): string {
    return this.props.email
  }

  get name(): string {
    return this.props.name
  }

  get age(): number {
    return this.props.age
  }

  get status(): 'active' | 'inactive' {
    return this.props.status
  }

  // 业务方法示例
  activate(): void {
    this.props.status = 'active'
  }

  deactivate(): void {
    this.props.status = 'inactive'
  }

  updateEmail(email: string): void {
    this.ensureFields(['email'], 'update email')
    this.props.email = email
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

  // 公开 API - Getters
  get status(): 'pending' | 'paid' | 'shipped' | 'delivered' {
    return this.props.status
  }

  get customerId(): string {
    return this.props.customerId
  }

  get totalAmount(): number {
    return this.props.totalAmount
  }

  get items(): ReadonlyArray<{ productId: string; quantity: number; price: number }> {
    return this.props.items
  }

  // 业务方法：支付订单
  pay(): void {
    this.ensureFields(['status', 'customerId', 'totalAmount'], 'pay order')
    if (this.props.status !== 'pending') {
      throw new Error('Only pending orders can be paid')
    }
    this.props.status = 'paid'
  }

  // 业务方法：发货
  ship(): void {
    this.ensureFields(['status'], 'ship order')
    if (this.props.status !== 'paid') {
      throw new Error('Only paid orders can be shipped')
    }
    this.props.status = 'shipped'
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
      expect(user.email).toBe('test@example.com')
      expect(user.name).toBe('John Doe')
      expect(user.age).toBe(30)
      expect(user.status).toBe('active')
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
  })

  describe('业务ID场景', () => {
    it('应该支持订单的业务ID', () => {
      const order = new Order({
        customerId: 'CUST123',
        totalAmount: 100,
        items: [{ productId: 'P1', quantity: 2, price: 50 }],
        status: 'pending'
      })

      // 设置主业务ID
      order.setBusinessId('ORD-2024-001')
      expect(order.getBusinessId()).toBe('ORD-2024-001')

      // 支付订单
      order.pay()
      expect(order.status).toBe('paid')

      // 发货
      order.ship()
      expect(order.status).toBe('shipped')
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
        order.ship()
      }).toThrow('Only paid orders can be shipped')

      // 正确的流程
      order.pay()
      expect(() => {
        order.ship()
      }).not.toThrow()

      // 不能重复支付
      expect(() => {
        order.pay()
      }).toThrow('Only pending orders can be paid')
    })
  })

  describe('属性管理', () => {
    it('应该通过 getter 访问属性', () => {
      const user = new User({
        email: 'test@example.com',
        name: 'John Doe',
        age: 30,
        status: 'active'
      })

      // 验证通过 getter 访问
      expect(user.email).toBe('test@example.com')
      expect(user.name).toBe('John Doe')
      expect(user.age).toBe(30)
      expect(user.status).toBe('active')
    })

    it('应该允许通过方法修改属性', () => {
      const user = new User({
        email: 'test@example.com',
        name: 'John Doe',
        age: 30,
        status: 'inactive'
      })

      user.activate()
      expect(user.status).toBe('active')

      user.deactivate()
      expect(user.status).toBe('inactive')
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

    it('应该支持引用相等（性能优化）', () => {
      const user = new User({
        email: 'test@example.com',
        name: 'John',
        age: 30,
        status: 'active'
      })

      // 同一个引用应该相等
      expect(user.equals(user)).toBe(true)
    })

    it('应该在不同类型的实体间返回false', () => {
      const id = EntityId.create<string>()

      const user = new User(
        {
          email: 'test@example.com',
          name: 'John',
          age: 30,
          status: 'active'
        },
        id as any // 类型转换用于测试
      )

      const order = new Order(
        {
          customerId: 'CUST123',
          totalAmount: 100,
          items: [{ productId: 'P1', quantity: 1, price: 100 }],
          status: 'pending'
        },
        id
      )

      // 不同类型的实体，即使 ID 相同也不相等
      expect(user.equals(order as any)).toBe(false)
      expect(order.equals(user as any)).toBe(false)
    })

    it('应该正确处理子类继承的相等性', () => {
      // 定义一个 User 的子类
      class AdminUser extends User {
        private _isAdmin = true

        get isAdmin() {
          return this._isAdmin
        }
      }

      const id = EntityId.create<number>()

      const user = new User(
        {
          email: 'user@example.com',
          name: 'John',
          age: 30,
          status: 'active'
        },
        id
      )

      const admin = new AdminUser(
        {
          email: 'admin@example.com',
          name: 'Admin',
          age: 35,
          status: 'active'
        },
        id
      )

      // User 和 AdminUser 是不同的类，即使 ID 相同也不相等
      expect(user.equals(admin)).toBe(false)
      expect(admin.equals(user)).toBe(false)

      // 同类型的实例，相同 ID 应该相等
      const admin2 = new AdminUser(
        {
          email: 'admin2@example.com',
          name: 'Admin2',
          age: 40,
          status: 'active'
        },
        id
      )
      expect(admin.equals(admin2)).toBe(true)
    })
  })

  describe('序列化', () => {
    it('应该转换为扁平化 JSON 对象', () => {
      const user = new User({
        email: 'test@example.com',
        name: 'John Doe',
        age: 30,
        status: 'active'
      })

      user.setBusinessId(12345)

      const json = user.toJSON()
      // ✅ ID 信息在顶层
      expect(json.clientId).toBe(user.getClientId())
      expect(json.businessId).toBe(12345)

      // ✅ Props 直接展开（扁平化）
      expect(json.email).toBe('test@example.com')
      expect(json.name).toBe('John Doe')
      expect(json.age).toBe(30)
      expect(json.status).toBe('active')

      // ✅ 没有嵌套的 id 和 props 属性
      expect(json).not.toHaveProperty('id')
      expect(json).not.toHaveProperty('props')
    })

    it('应该序列化没有业务ID的实体', () => {
      const user = new User({
        email: 'test@example.com',
        name: 'John Doe',
        age: 30,
        status: 'active'
      })

      const json = user.toJSON()

      // ✅ clientId 始终存在
      expect(json.clientId).toBeDefined()
      expect(typeof json.clientId).toBe('string')

      // ✅ businessId 未设置时为 undefined
      expect(json.businessId).toBeUndefined()
    })

    it('应该支持 JSON.stringify', () => {
      const user = new User({
        email: 'test@example.com',
        name: 'John Doe',
        age: 30,
        status: 'active'
      })

      const jsonString = JSON.stringify(user)
      const parsed = JSON.parse(jsonString)

      // ✅ 扁平化结构
      expect(parsed.clientId).toBeDefined()
      expect(parsed.email).toBe('test@example.com')
      expect(parsed.name).toBe('John Doe')
      expect(parsed.age).toBe(30)
    })

    it('应该支持直接解构', () => {
      const user = new User({
        email: 'test@example.com',
        name: 'John Doe',
        age: 30,
        status: 'active'
      })

      // ✅ 直接解构使用
      const { clientId, email, name, age, status } = user.toJSON()

      expect(clientId).toBe(user.getClientId())
      expect(email).toBe('test@example.com')
      expect(name).toBe('John Doe')
      expect(age).toBe(30)
      expect(status).toBe('active')
    })
  })

  describe('边界情况', () => {
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

  describe('字段检查方法', () => {
    it('hasField() 应该正确检查字段存在性', () => {
      const user = new User({
        email: 'test@example.com',
        name: 'John',
        age: 30,
        status: 'active'
      })

      // ✅ 存在的字段返回 true
      expect(user['hasField']('email')).toBe(true)
      expect(user['hasField']('name')).toBe(true)
      expect(user['hasField']('age')).toBe(true)
    })

    it('ensureField() 应该返回存在的字段值', () => {
      const user = new User({
        email: 'test@example.com',
        name: 'John',
        age: 30,
        status: 'active'
      })

      // ✅ 字段存在，返回值
      expect(user['ensureField']('email')).toBe('test@example.com')
      expect(user['ensureField']('name')).toBe('John')
      expect(user['ensureField']('age')).toBe(30)
    })

    it('ensureField() 应该在字段不存在时抛出错误', () => {
      // 创建一个部分数据的实体（使用类型断言模拟）
      const user = new User({
        email: 'test@example.com',
        name: 'John',
        age: undefined as any,
        status: 'active'
      })

      // ❌ 字段不存在，抛出错误
      expect(() => {
        user['ensureField']('age')
      }).toThrow("Field 'age' is not loaded")
    })

    it('ensureField() 应该支持自定义错误消息', () => {
      const user = new User({
        email: 'test@example.com',
        name: 'John',
        age: undefined as any,
        status: 'active'
      })

      // ❌ 带操作描述的错误消息
      expect(() => {
        user['ensureField']('age', 'calculate age group')
      }).toThrow("Cannot calculate age group: field 'age' is not loaded")
    })

    it('ensureFields() 应该在所有字段存在时不抛出错误', () => {
      const user = new User({
        email: 'test@example.com',
        name: 'John',
        age: 30,
        status: 'active'
      })

      // ✅ 所有字段存在，不抛出错误
      expect(() => {
        user['ensureFields'](['email', 'name', 'age'])
      }).not.toThrow()
    })

    it('ensureFields() 应该在字段缺失时抛出友好错误', () => {
      // 模拟部分加载的实体
      const order = new Order({
        customerId: 'CUST123',
        totalAmount: 100,
        items: [],
        status: 'pending'
      })

      // 手动设置字段为 undefined 模拟缺失
      order['props'].customerId = undefined as any
      order['props'].totalAmount = undefined as any

      // ❌ 缺失字段，抛出错误
      expect(() => {
        order['ensureFields'](['customerId', 'totalAmount', 'status'], 'process order')
      }).toThrow('Cannot process order: missing fields [customerId, totalAmount]')
    })

    it('ensureFields() 应该列出所有缺失的字段', () => {
      const user = new User({
        email: 'test@example.com',
        name: undefined as any,
        age: undefined as any,
        status: 'active'
      })

      // ❌ 多个字段缺失
      expect(() => {
        user['ensureFields'](['email', 'name', 'age'])
      }).toThrow('Missing required fields: [name, age]')
    })

    it('业务方法应该使用 ensureFields 检查依赖字段', () => {
      const order = new Order({
        customerId: 'CUST123',
        totalAmount: 100,
        items: [{ productId: 'P1', quantity: 1, price: 100 }],
        status: 'pending'
      })

      // 模拟缺失字段
      order['props'].customerId = undefined as any

      // ❌ 业务方法检查到缺失字段
      expect(() => {
        order.pay()
      }).toThrow('Cannot pay order: missing fields [customerId]')
    })
  })

  describe('私有字段保护', () => {
    // 定义带私有字段的实体
    interface SecureUserProps {
      email: string
      name: string
      age: number
      passwordHash: string // 敏感字段
      internalNotes?: string // 内部字段
    }

    class SecureUser extends Entity<SecureUserProps, number, 'passwordHash' | 'internalNotes'> {
      constructor(props: SecureUserProps, id?: EntityId<number>) {
        super(props, id)
      }

      // 公开 API - Getters（不包含私有字段）
      get email(): string {
        return this.props.email
      }

      get name(): string {
        return this.props.name
      }

      get age(): number {
        return this.props.age
      }

      // passwordHash 和 internalNotes 不暴露

      // 声明私有字段
      protected getPrivateFields(): Array<keyof SecureUserProps> {
        return ['passwordHash', 'internalNotes']
      }

      // 业务方法：直接修改 props
      updatePassword(newHash: string): void {
        this.props.passwordHash = newHash
      }

      // 暴露 updateProps 用于测试
      updateInfo(updates: Partial<SecureUserProps>): void {
        this.updateProps(updates)
      }
    }

    it('应该通过 getter 访问公开字段（排除私有字段）', () => {
      const user = new SecureUser({
        email: 'test@example.com',
        name: 'John',
        age: 30,
        passwordHash: 'secret_hash_123',
        internalNotes: 'VIP customer'
      })

      // ✅ 公开字段可以访问
      expect(user.email).toBe('test@example.com')
      expect(user.name).toBe('John')
      expect(user.age).toBe(30)

      // ✅ 私有字段没有 getter（编译时就阻止访问）
      // @ts-expect-error - passwordHash 不应该有 getter
      expect(user.passwordHash).toBeUndefined()
    })

    it('应该在 toJSON() 中排除私有字段', () => {
      const user = new SecureUser({
        email: 'test@example.com',
        name: 'John',
        age: 30,
        passwordHash: 'secret_hash_123',
        internalNotes: 'Internal memo'
      })

      const json = user.toJSON()
      // ✅ 公开字段存在且扁平化
      expect(json.email).toBe('test@example.com')
      expect(json.name).toBe('John')
      expect(json.age).toBe(30)

      // ✅ 私有字段被排除
      expect(json).not.toHaveProperty('passwordHash')
      expect(json).not.toHaveProperty('internalNotes')

      // ✅ ID 信息在顶层
      expect(json.clientId).toBeDefined()
    })

    it('应该允许内部修改私有字段', () => {
      const user = new SecureUser({
        email: 'test@example.com',
        name: 'John',
        age: 30,
        passwordHash: 'old_hash'
      })

      // ✅ 业务方法可以修改私有字段
      user.updatePassword('new_hash_456')

      // ✅ 序列化时不包含私有字段（扁平化）
      const json = user.toJSON()
      expect(json).not.toHaveProperty('passwordHash')
    })

    it('没有私有字段时应该正常工作（向后兼容）', () => {
      // 使用原来的 User 类（无 getPrivateFields）
      const user = new User({
        email: 'test@example.com',
        name: 'John',
        age: 30,
        status: 'active'
      })

      // ✅ 所有字段都可以通过 getter 访问
      expect(user.email).toBe('test@example.com')
      expect(user.name).toBe('John')
      expect(user.age).toBe(30)
      expect(user.status).toBe('active')

      // ✅ toJSON 包含所有字段（扁平化）
      const json = user.toJSON()
      expect(json.email).toBe('test@example.com')
      expect(json.name).toBe('John')
      expect(json.age).toBe(30)
      expect(json.status).toBe('active')
    })

    it('应该处理空的私有字段数组', () => {
      class EmptyPrivateUser extends Entity<UserProps, number> {
        constructor(props: UserProps, id?: EntityId<number>) {
          super(props, id)
        }

        get email() {
          return this.props.email
        }
        get name() {
          return this.props.name
        }
        get age() {
          return this.props.age
        }
        get status() {
          return this.props.status
        }

        protected getPrivateFields(): Array<keyof UserProps> {
          return [] // 空数组
        }
      }

      const user = new EmptyPrivateUser({
        email: 'test@example.com',
        name: 'John',
        age: 30,
        status: 'active'
      })

      // ✅ 所有字段都应该可以访问
      expect(user.email).toBe('test@example.com')
      expect(user.name).toBe('John')
      expect(user.age).toBe(30)
      expect(user.status).toBe('active')

      // ✅ toJSON 也包含所有字段（扁平化）
      const json = user.toJSON()
      expect(json.email).toBe('test@example.com')
      expect(json.name).toBe('John')
      expect(json.age).toBe(30)
      expect(json.status).toBe('active')
    })

    it('应该支持 updateProps 辅助方法', () => {
      const user = new SecureUser({
        email: 'old@example.com',
        name: 'John',
        age: 30,
        passwordHash: 'hash123'
      })

      // 使用 updateProps 更新多个字段
      user.updateInfo({
        email: 'new@example.com',
        name: 'John Doe',
        age: 31
      })

      // 验证通过 getter 访问
      expect(user.email).toBe('new@example.com')
      expect(user.name).toBe('John Doe')
      expect(user.age).toBe(31)

      // 验证 toJSON 不包含私有字段（扁平化）
      const json = user.toJSON()
      expect(json).not.toHaveProperty('passwordHash')
    })

    it('应该处理可选的私有字段', () => {
      const user = new SecureUser({
        email: 'test@example.com',
        name: 'John',
        age: 30,
        passwordHash: 'hash123'
        // internalNotes 未提供（可选）
      })

      // ✅ 公开字段存在
      expect(user.email).toBe('test@example.com')

      // ✅ toJSON 不包含私有字段（扁平化）
      const json = user.toJSON()
      expect(json).not.toHaveProperty('passwordHash')
      expect(json).not.toHaveProperty('internalNotes')
    })

    it('类型安全：私有字段在类型层面被排除', () => {
      const user = new SecureUser({
        email: 'test@example.com',
        name: 'John',
        age: 30,
        passwordHash: 'secret_hash_123'
      })

      const json = user.toJSON()

      // ✅ 类型层面：公开字段可访问
      const email: string = json.email
      const name: string = json.name
      const age: number = json.age

      expect(email).toBe('test@example.com')
      expect(name).toBe('John')
      expect(age).toBe(30)

      // ✅ 类型层面：私有字段被 Omit 排除
      // 以下代码在 TypeScript 编译时会报错（取消注释会看到错误）
      // @ts-expect-error - passwordHash 在类型中已被排除
      const password = json.passwordHash
      expect(password).toBeUndefined()

      // @ts-expect-error - internalNotes 在类型中已被排除
      const notes = json.internalNotes
      expect(notes).toBeUndefined()

      // ✅ 运行时验证：私有字段确实不存在
      expect(json).not.toHaveProperty('passwordHash')
      expect(json).not.toHaveProperty('internalNotes')
    })
  })
})
