# Forge 测试规范

## 测试文件命名和位置

### 命名约定

使用 `*.spec.ts` 后缀（推荐）或 `*.test.ts` 后缀：

```
✅ 推荐：
Entity.spec.ts
ValueObject.spec.ts
User.spec.ts
uuid.spec.ts

✅ 可选：
Entity.test.ts
ValueObject.test.ts
```

### 文件位置

测试文件与源码文件放在同一目录：

```
✅ 好的示例：
src/core/entity/
├── Entity.ts           # 源码
├── Entity.spec.ts      # 测试
└── index.ts            # 导出

src/utils/
├── uuid.ts
├── uuid.spec.ts
└── index.ts

❌ 坏的示例（需要跨目录查找）：
src/
├── core/
│   └── entity/
│       └── Entity.ts
└── tests/
    └── Entity.spec.ts
```

### 为什么测试与源码在一起？

1. **就近原则** - 修改代码时立即看到测试
2. **易于导航** - 不需要在不同目录间切换
3. **模块化** - 测试随代码一起移动/删除
4. **清晰的对应** - 一眼看出哪些文件有测试

## 测试结构（Describe/It/Expect）

### 基本结构

```typescript
import { describe, it, expect } from 'vitest'

describe('测试套件名称', () => {
  // 设置和清理
  beforeEach(() => {
    // 每个测试前执行
  })

  afterEach(() => {
    // 每个测试后执行
  })

  it('应该做某事', () => {
    // Arrange（准备）
    const input = 'test'

    // Act（执行）
    const result = someFunction(input)

    // Assert（断言）
    expect(result).toBe('expected')
  })
})
```

### 中文描述规范

从 Forge v1.0 开始，所有测试描述统一使用中文，以提高可读性和团队协作效率：

```typescript
// ✅ 推荐：使用中文描述
describe('值对象', () => {
  describe('创建和验证', () => {
    it('应该使用有效属性创建值对象', () => {})
    it('应该在属性无效时创建失败', () => {})
    it('应该在创建期间规范化值', () => {})
  })

  describe('不可变性', () => {
    it('应该深度冻结属性', () => {})
    it('不应该修改原始属性对象', () => {})
    it('克隆时应该返回相同实例', () => {})
  })

  describe('相等性', () => {
    it('应该按值而不是引用进行比较', () => {})
    it('对于不同值应该返回false', () => {})
    it('对于null或undefined应该返回false', () => {})
  })
})

// ✅ 实际示例：UUID工具测试
describe('UUID 工具', () => {
  describe('生成UUID', () => {
    it('应该生成有效的 UUID v4', () => {})
    it('应该生成唯一的 UUID', () => {})
    it('应该具有正确的连字符格式', () => {})
  })

  describe('验证UUID', () => {
    it('对于有效的 UUID 应该返回 true', () => {})
    it('对于无效的 UUID 应该返回 false', () => {})
  })
})

// ✅ 实际示例：结果类型测试
describe('结果类型', () => {
  describe('创建', () => {
    it('应该创建成功的结果', () => {})
    it('应该创建失败的结果', () => {})
  })

  describe('值访问', () => {
    it('应该从成功的结果获取值', () => {})
    it('从失败的结果获取值时应该抛出错误', () => {})
  })

  describe('映射', () => {
    it('应该映射成功的值', () => {})
    it('不应该映射失败的结果', () => {})
  })

  describe('链式调用', () => {
    it('应该链式调用成功的结果', () => {})
    it('应该在第一个失败时停止链式调用', () => {})
  })
})
```

### 嵌套 Describe

```typescript
// ✅ 好的示例：使用嵌套 describe 组织测试
import { describe, it, expect, beforeEach } from 'vitest'
import { User } from './User'
import { Email } from './Email'

describe('User', () => {
  describe('create', () => {
    it('should create a user with valid data', () => {
      const user = User.create({
        name: 'Alice',
        email: 'alice@example.com'
      })

      expect(user.name).toBe('Alice')
      expect(user.email.value).toBe('alice@example.com')
    })

    it('should throw error if name is too short', () => {
      expect(() => {
        User.create({
          name: 'A',
          email: 'alice@example.com'
        })
      }).toThrow('名称长度必须在 2-50 字符之间')
    })

    it('should throw error if email is invalid', () => {
      expect(() => {
        User.create({
          name: 'Alice',
          email: 'invalid-email'
        })
      }).toThrow('邮箱格式无效')
    })
  })

  describe('changeName', () => {
    let user: User

    beforeEach(() => {
      user = User.create({
        name: 'Alice',
        email: 'alice@example.com'
      })
    })

    it('should change name with valid input', () => {
      user.changeName('Bob')

      expect(user.name).toBe('Bob')
    })

    it('should throw error if name is too short', () => {
      expect(() => {
        user.changeName('A')
      }).toThrow('名称长度必须在 2-50 字符之间')
    })

    it('should update updatedAt timestamp', () => {
      const oldUpdatedAt = user.updatedAt

      // 等待一毫秒确保时间戳不同
      setTimeout(() => {
        user.changeName('Bob')
        expect(user.updatedAt).not.toEqual(oldUpdatedAt)
      }, 1)
    })
  })

  describe('changeEmail', () => {
    let user: User

    beforeEach(() => {
      user = User.create({
        name: 'Alice',
        email: 'alice@example.com'
      })
    })

    it('should change email with valid input', () => {
      user.changeEmail('newemail@example.com')

      expect(user.email.value).toBe('newemail@example.com')
    })

    it('should not change if email is the same', () => {
      const oldEmail = user.email
      user.changeEmail('alice@example.com')

      expect(user.email).toBe(oldEmail)
    })

    it('should throw error if email is invalid', () => {
      expect(() => {
        user.changeEmail('invalid')
      }).toThrow('邮箱格式无效')
    })
  })

  describe('equals', () => {
    it('should return true for users with same id', () => {
      const user1 = User.reconstitute({
        id: '123',
        name: 'Alice',
        email: 'alice@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const user2 = User.reconstitute({
        id: '123',
        name: 'Bob', // 不同的名字
        email: 'bob@example.com', // 不同的邮箱
        createdAt: new Date(),
        updatedAt: new Date()
      })

      expect(user1.equals(user2)).toBe(true)
    })

    it('should return false for users with different id', () => {
      const user1 = User.create({
        name: 'Alice',
        email: 'alice@example.com'
      })

      const user2 = User.create({
        name: 'Alice',
        email: 'alice@example.com'
      })

      expect(user1.equals(user2)).toBe(false)
    })
  })
})

// ❌ 坏的示例：没有组织的扁平测试
describe('User', () => {
  it('test 1', () => {
    // ...
  })

  it('test 2', () => {
    // ...
  })

  it('test 3', () => {
    // ...
  })

  // 所有测试混在一起，难以理解结构
})
```

## 测试覆盖率要求

### 目标覆盖率

- **总体覆盖率**: 100%
- **语句覆盖率**: 100%
- **分支覆盖率**: 100%
- **函数覆盖率**: 100%
- **行覆盖率**: 100%

### 必须测试的内容

1. **所有公共 API**
2. **所有业务逻辑**
3. **所有边界条件**
4. **所有错误情况**
5. **所有分支路径**

### 可以不测试的内容

1. **第三方库代码**
2. **自动生成的代码**
3. **简单的 getter/setter（如果没有逻辑）**

```typescript
// ✅ 好的示例：全面的测试覆盖
describe('Money', () => {
  describe('create', () => {
    it('should create money with valid amount and currency', () => {
      const money = Money.create(100, 'CNY')

      expect(money.amount).toBe(100)
      expect(money.currency).toBe('CNY')
    })

    it('should convert currency to uppercase', () => {
      const money = Money.create(100, 'cny')

      expect(money.currency).toBe('CNY')
    })

    it('should throw error if amount is negative', () => {
      expect(() => Money.create(-100, 'CNY')).toThrow('金额不能为负数')
    })

    it('should throw error if currency is empty', () => {
      expect(() => Money.create(100, '')).toThrow('货币代码必须是3个字符')
    })

    it('should throw error if currency is not 3 characters', () => {
      expect(() => Money.create(100, 'CN')).toThrow('货币代码必须是3个字符')
      expect(() => Money.create(100, 'CNYU')).toThrow('货币代码必须是3个字符')
    })

    it('should accept zero amount', () => {
      const money = Money.create(0, 'CNY')

      expect(money.amount).toBe(0)
    })
  })

  describe('add', () => {
    it('should add two money objects with same currency', () => {
      const money1 = Money.create(100, 'CNY')
      const money2 = Money.create(50, 'CNY')

      const result = money1.add(money2)

      expect(result.amount).toBe(150)
      expect(result.currency).toBe('CNY')
    })

    it('should not modify original money objects', () => {
      const money1 = Money.create(100, 'CNY')
      const money2 = Money.create(50, 'CNY')

      money1.add(money2)

      expect(money1.amount).toBe(100)
      expect(money2.amount).toBe(50)
    })

    it('should throw error if currencies are different', () => {
      const money1 = Money.create(100, 'CNY')
      const money2 = Money.create(50, 'USD')

      expect(() => money1.add(money2)).toThrow('不能对不同货币进行运算')
    })
  })

  describe('subtract', () => {
    it('should subtract two money objects with same currency', () => {
      const money1 = Money.create(100, 'CNY')
      const money2 = Money.create(50, 'CNY')

      const result = money1.subtract(money2)

      expect(result.amount).toBe(50)
      expect(result.currency).toBe('CNY')
    })

    it('should throw error if result is negative', () => {
      const money1 = Money.create(50, 'CNY')
      const money2 = Money.create(100, 'CNY')

      expect(() => money1.subtract(money2)).toThrow('结果不能为负数')
    })

    it('should throw error if currencies are different', () => {
      const money1 = Money.create(100, 'CNY')
      const money2 = Money.create(50, 'USD')

      expect(() => money1.subtract(money2)).toThrow('不能对不同货币进行运算')
    })
  })

  describe('multiply', () => {
    it('should multiply money by a factor', () => {
      const money = Money.create(100, 'CNY')

      const result = money.multiply(2)

      expect(result.amount).toBe(200)
      expect(result.currency).toBe('CNY')
    })

    it('should handle decimal factors', () => {
      const money = Money.create(100, 'CNY')

      const result = money.multiply(1.5)

      expect(result.amount).toBe(150)
    })

    it('should throw error if factor is negative', () => {
      const money = Money.create(100, 'CNY')

      expect(() => money.multiply(-2)).toThrow('乘数不能为负数')
    })

    it('should handle zero factor', () => {
      const money = Money.create(100, 'CNY')

      const result = money.multiply(0)

      expect(result.amount).toBe(0)
    })
  })

  describe('equals', () => {
    it('should return true for money with same amount and currency', () => {
      const money1 = Money.create(100, 'CNY')
      const money2 = Money.create(100, 'CNY')

      expect(money1.equals(money2)).toBe(true)
    })

    it('should return false for money with different amount', () => {
      const money1 = Money.create(100, 'CNY')
      const money2 = Money.create(200, 'CNY')

      expect(money1.equals(money2)).toBe(false)
    })

    it('should return false for money with different currency', () => {
      const money1 = Money.create(100, 'CNY')
      const money2 = Money.create(100, 'USD')

      expect(money1.equals(money2)).toBe(false)
    })
  })
})
```

## 单元测试 vs 集成测试

### 单元测试

**目标**：测试单个类或函数的行为

**特点**：

- 快速执行
- 隔离依赖（使用 Mock）
- 测试单一职责
- 测试文件与源码在同一目录

```typescript
// ✅ 好的示例：单元测试
import { describe, it, expect } from 'vitest'
import { Email } from './Email'

describe('Email', () => {
  describe('create', () => {
    it('should create email with valid input', () => {
      const email = Email.create('test@example.com')

      expect(email.value).toBe('test@example.com')
    })

    it('should convert email to lowercase', () => {
      const email = Email.create('Test@Example.COM')

      expect(email.value).toBe('test@example.com')
    })

    it('should trim whitespace', () => {
      const email = Email.create('  test@example.com  ')

      expect(email.value).toBe('test@example.com')
    })

    it('should throw error if email is empty', () => {
      expect(() => Email.create('')).toThrow('邮箱不能为空')
      expect(() => Email.create('   ')).toThrow('邮箱不能为空')
    })

    it('should throw error if email format is invalid', () => {
      expect(() => Email.create('invalid')).toThrow('邮箱格式无效')
      expect(() => Email.create('invalid@')).toThrow('邮箱格式无效')
      expect(() => Email.create('@example.com')).toThrow('邮箱格式无效')
      expect(() => Email.create('test@')).toThrow('邮箱格式无效')
    })
  })

  describe('equals', () => {
    it('should return true for emails with same value', () => {
      const email1 = Email.create('test@example.com')
      const email2 = Email.create('test@example.com')

      expect(email1.equals(email2)).toBe(true)
    })

    it('should return false for emails with different value', () => {
      const email1 = Email.create('test1@example.com')
      const email2 = Email.create('test2@example.com')

      expect(email1.equals(email2)).toBe(false)
    })

    it('should be case insensitive', () => {
      const email1 = Email.create('Test@Example.com')
      const email2 = Email.create('test@example.com')

      expect(email1.equals(email2)).toBe(true)
    })
  })
})
```

### 集成测试

**目标**：测试多个模块协作的行为

**特点**：

- 测试真实的交互
- 不使用或少使用 Mock
- 可能涉及持久化
- 放在 `tests/integration/` 目录

```typescript
// ✅ 好的示例：集成测试
import { describe, it, expect, beforeEach } from 'vitest'
import { CreateUserUseCase } from '@/application/use-cases/CreateUserUseCase'
import { InMemoryUserRepository } from '@/infrastructure/repository/InMemoryUserRepository'
import { InMemoryEventBus } from '@/infrastructure/event-bus/InMemoryEventBus'

describe('CreateUserUseCase Integration', () => {
  let useCase: CreateUserUseCase
  let repository: InMemoryUserRepository
  let eventBus: InMemoryEventBus

  beforeEach(() => {
    repository = new InMemoryUserRepository()
    eventBus = new InMemoryEventBus()
    useCase = new CreateUserUseCase(repository, eventBus)
  })

  it('should create user and publish event', async () => {
    const events: DomainEvent[] = []
    eventBus.subscribe('UserCreated', event => {
      events.push(event)
    })

    const user = await useCase.execute({
      name: 'Alice',
      email: 'alice@example.com'
    })

    // 验证用户已创建
    expect(user.name).toBe('Alice')
    expect(user.email.value).toBe('alice@example.com')

    // 验证用户已保存
    const savedUser = await repository.findById(user.id)
    expect(savedUser).not.toBeNull()
    expect(savedUser?.id).toBe(user.id)

    // 验证事件已发布
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('UserCreated')
  })

  it('should throw error if email already exists', async () => {
    await useCase.execute({
      name: 'Alice',
      email: 'alice@example.com'
    })

    await expect(
      useCase.execute({
        name: 'Bob',
        email: 'alice@example.com'
      })
    ).rejects.toThrow('邮箱已被注册')
  })

  it('should not save user if validation fails', async () => {
    await expect(
      useCase.execute({
        name: 'A', // 名称太短
        email: 'alice@example.com'
      })
    ).rejects.toThrow()

    // 验证没有用户被保存
    const users = await repository.findAll()
    expect(users).toHaveLength(0)
  })
})
```

## Mock 使用规范

### 何时使用 Mock

✅ **应该 Mock 的场景：**

1. 外部依赖（HTTP、数据库、文件系统）
2. 难以构造的对象
3. 测试异常情况
4. 慢速操作

❌ **不应该 Mock 的场景：**

1. 正在测试的类
2. 简单的值对象
3. 纯函数
4. 数据结构

### 如何 Mock

```typescript
// ✅ 好的示例：Mock 外部依赖
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CreateUserUseCase } from './CreateUserUseCase'
import type { UserRepository } from '@/domain/user/UserRepository'
import type { EventBus } from '@/infrastructure/event-bus/EventBus'

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase
  let mockRepository: UserRepository
  let mockEventBus: EventBus

  beforeEach(() => {
    // Mock 仓储
    mockRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn().mockResolvedValue(null),
      existsByEmail: vi.fn().mockResolvedValue(false),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn()
    }

    // Mock 事件总线
    mockEventBus = {
      publish: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn()
    }

    useCase = new CreateUserUseCase(mockRepository, mockEventBus)
  })

  it('should check if email exists', async () => {
    await useCase.execute({
      name: 'Alice',
      email: 'alice@example.com'
    })

    expect(mockRepository.existsByEmail).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'alice@example.com' })
    )
  })

  it('should save user to repository', async () => {
    await useCase.execute({
      name: 'Alice',
      email: 'alice@example.com'
    })

    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Alice'
      })
    )
  })

  it('should publish domain event', async () => {
    await useCase.execute({
      name: 'Alice',
      email: 'alice@example.com'
    })

    expect(mockEventBus.publish).toHaveBeenCalled()
  })

  it('should throw error if email exists', async () => {
    // Mock 返回值
    mockRepository.existsByEmail = vi.fn().mockResolvedValue(true)

    await expect(
      useCase.execute({
        name: 'Alice',
        email: 'alice@example.com'
      })
    ).rejects.toThrow('邮箱已被注册')

    // 验证没有保存用户
    expect(mockRepository.save).not.toHaveBeenCalled()
  })
})

// ❌ 坏的示例：过度 Mock
describe('User', () => {
  it('should have name', () => {
    // 不需要 Mock 值对象
    const mockEmail = {
      value: 'test@example.com',
      equals: vi.fn()
    }

    const user = new User('123', 'Alice', mockEmail)

    // 直接用真实对象更简单
    const email = Email.create('test@example.com')
    const user2 = new User('123', 'Alice', email)
  })
})
```

### Mock 验证

```typescript
// ✅ 好的示例：完整的 Mock 验证
describe('OrderService', () => {
  it('should call repository methods in correct order', async () => {
    const mockRepository = {
      findById: vi.fn().mockResolvedValue(order),
      save: vi.fn().mockResolvedValue(undefined)
    }

    await service.processOrder('order-123')

    // 验证调用次数
    expect(mockRepository.findById).toHaveBeenCalledTimes(1)
    expect(mockRepository.save).toHaveBeenCalledTimes(1)

    // 验证调用参数
    expect(mockRepository.findById).toHaveBeenCalledWith('order-123')

    // 验证调用顺序
    const findByIdCall = mockRepository.findById.mock.invocationCallOrder[0]
    const saveCall = mockRepository.save.mock.invocationCallOrder[0]
    expect(findByIdCall).toBeLessThan(saveCall)
  })
})
```

## 测试命名规范

### 中文测试命名模式

从 Forge v1.0 开始，推荐使用中文进行测试命名，使测试更加直观易懂：

```typescript
// ✅ 推荐：中文描述模式
describe('用户', () => {
  it('应该在数据有效时创建用户', () => {})
  it('应该在名称太短时抛出错误', () => {})
  it('应该在邮箱无效时抛出错误', () => {})
  it('应该在名称改变时更新updatedAt', () => {})
  it('当新邮箱相同时不应该改变邮箱', () => {})
  it('比较具有相同id的用户时应该返回true', () => {})
})

// ✅ 实际示例：值对象构建器
describe('值对象构建器', () => {
  describe('基础构建', () => {
    it('应该使用流式 API 构建值对象', () => {})
    it('缺少必填字段时应该失败', () => {})
    it('应该验证字段格式', () => {})
  })

  describe('条件方法', () => {
    it('应该根据条件使用when应用设置', () => {})
  })

  describe('管道和应用', () => {
    it('应该使用pipe转换构建器', () => {})
    it('应该应用多个设置器', () => {})
  })
})

// ❌ 不推荐：混合语言或模糊描述
describe('User', () => {
  it('test create', () => {}) // 测试什么？
  it('名称', () => {}) // 太简短
  it('测试1', () => {}) // 完全不知道在测什么
  it('应该工作', () => {}) // 太宽泛
  it('check email validation', () => {}) // 混合语言
})
```

### 测试命名的组成部分

中文测试命名应包含以下要素：

1. **动作**（应该/不应该）
2. **预期行为**（做什么）
3. **条件**（在什么情况下）

```typescript
// 格式：[应该/不应该] [预期行为] [当/如果/在...时] [条件]

// 示例
it('应该创建用户当数据有效时', () => {})
it('应该抛出错误当邮箱已存在时', () => {})
it('应该返回null当用户未找到时', () => {})
it('不应该保存用户如果验证失败', () => {})
```

## 边界条件测试

### 必须测试的边界条件

1. **空值**: `null`, `undefined`, `''`, `[]`, `{}`
2. **边界值**: 最小值、最大值、零、负数
3. **特殊字符**: 空格、换行符、特殊符号
4. **数组长度**: 空数组、单元素、多元素
5. **类型边界**: 各种类型的边界情况

```typescript
// ✅ 好的示例：全面的边界条件测试
describe('Email', () => {
  describe('边界条件测试', () => {
    it('should handle empty string', () => {
      expect(() => Email.create('')).toThrow('邮箱不能为空')
    })

    it('should handle whitespace only', () => {
      expect(() => Email.create('   ')).toThrow('邮箱不能为空')
      expect(() => Email.create('\t')).toThrow('邮箱不能为空')
      expect(() => Email.create('\n')).toThrow('邮箱不能为空')
    })

    it('should handle very long email', () => {
      const longEmail = 'a'.repeat(100) + '@example.com'
      // 根据业务规则决定是否接受
    })

    it('should handle special characters', () => {
      expect(() => Email.create('test+tag@example.com')).not.toThrow()
      expect(() => Email.create('test.name@example.com')).not.toThrow()
      expect(() => Email.create('test_name@example.com')).not.toThrow()
    })

    it('should handle international characters', () => {
      expect(() => Email.create('测试@example.com')).toThrow()
      expect(() => Email.create('test@例子.com')).toThrow()
    })
  })
})

describe('Money', () => {
  describe('边界条件测试', () => {
    it('should handle zero amount', () => {
      const money = Money.create(0, 'CNY')
      expect(money.amount).toBe(0)
    })

    it('should handle negative amount', () => {
      expect(() => Money.create(-1, 'CNY')).toThrow('金额不能为负数')
    })

    it('should handle very large amount', () => {
      const money = Money.create(Number.MAX_SAFE_INTEGER, 'CNY')
      expect(money.amount).toBe(Number.MAX_SAFE_INTEGER)
    })

    it('should handle decimal amounts', () => {
      const money = Money.create(99.99, 'CNY')
      expect(money.amount).toBe(99.99)
    })

    it('should handle floating point precision', () => {
      const money1 = Money.create(0.1, 'CNY')
      const money2 = Money.create(0.2, 'CNY')
      const result = money1.add(money2)

      // 注意浮点数精度问题
      expect(result.amount).toBeCloseTo(0.3)
    })
  })
})

describe('Order', () => {
  describe('边界条件测试', () => {
    it('should handle empty items', () => {
      const order = Order.create('customer-123')

      expect(() => order.submit()).toThrow('订单必须包含至少一个商品')
    })

    it('should handle single item', () => {
      const order = Order.create('customer-123')
      order.addItem('product-1', 1, Money.create(100, 'CNY'))

      expect(() => order.submit()).not.toThrow()
    })

    it('should handle maximum items', () => {
      const order = Order.create('customer-123')

      for (let i = 0; i < 100; i++) {
        order.addItem(`product-${i}`, 1, Money.create(100, 'CNY'))
      }

      expect(order.getItems().length).toBe(100)
    })

    it('should handle null/undefined gracefully', () => {
      const order = Order.create('customer-123')

      expect(() => order.addItem(null as any, 1, Money.create(100, 'CNY'))).toThrow()
      expect(() => order.addItem(undefined as any, 1, Money.create(100, 'CNY'))).toThrow()
    })
  })
})
```

## 异常情况测试

### 测试所有错误路径

```typescript
// ✅ 好的示例：全面的异常测试
describe('CreateUserUseCase', () => {
  describe('error handling', () => {
    it('should throw error if email already exists', async () => {
      await useCase.execute({
        name: 'Alice',
        email: 'alice@example.com'
      })

      await expect(
        useCase.execute({
          name: 'Bob',
          email: 'alice@example.com'
        })
      ).rejects.toThrow('邮箱已被注册')
    })

    it('should throw error if name is invalid', async () => {
      await expect(
        useCase.execute({
          name: 'A', // 太短
          email: 'alice@example.com'
        })
      ).rejects.toThrow('名称长度必须在 2-50 字符之间')
    })

    it('should throw error if email is invalid', async () => {
      await expect(
        useCase.execute({
          name: 'Alice',
          email: 'invalid'
        })
      ).rejects.toThrow('邮箱格式无效')
    })

    it('should handle repository errors', async () => {
      mockRepository.save = vi.fn().mockRejectedValue(new Error('Database connection failed'))

      await expect(
        useCase.execute({
          name: 'Alice',
          email: 'alice@example.com'
        })
      ).rejects.toThrow('Database connection failed')
    })

    it('should rollback if event publishing fails', async () => {
      mockEventBus.publish = vi.fn().mockRejectedValue(new Error('Event bus unavailable'))

      await expect(
        useCase.execute({
          name: 'Alice',
          email: 'alice@example.com'
        })
      ).rejects.toThrow()

      // 验证用户没有被保存（或已回滚）
      const user = await repository.findByEmail(Email.create('alice@example.com'))
      expect(user).toBeNull()
    })
  })
})
```

## 异步测试

### 测试 Promise

```typescript
// ✅ 好的示例：正确测试异步代码
describe('UserRepository', () => {
  it('should save and retrieve user', async () => {
    const user = User.create({
      name: 'Alice',
      email: 'alice@example.com'
    })

    await repository.save(user)
    const retrieved = await repository.findById(user.id)

    expect(retrieved).not.toBeNull()
    expect(retrieved?.id).toBe(user.id)
  })

  it('should return null if user not found', async () => {
    const user = await repository.findById('non-existent-id')

    expect(user).toBeNull()
  })

  it('should throw error on save failure', async () => {
    mockDb.save = vi.fn().mockRejectedValue(new Error('DB Error'))

    await expect(repository.save(user)).rejects.toThrow('DB Error')
  })
})

// ❌ 坏的示例：忘记 async/await
describe('UserRepository', () => {
  it('should save user', () => {
    // 忘记 await，测试会立即结束
    repository.save(user) // 这个不会被等待
    expect(true).toBe(true) // 总是通过
  })

  it('should throw error', () => {
    // 不会捕获异步错误
    expect(() => {
      repository.save(user)
    }).toThrow() // 永远不会抛出错误
  })
})
```

## 测试工具和辅助函数

### 创建测试辅助函数

```typescript
// tests/helpers/fixtures.ts

/**
 * 测试辅助函数
 */

export function createTestUser(
  overrides?: Partial<{
    name: string
    email: string
  }>
): User {
  return User.create({
    name: overrides?.name || 'Test User',
    email: overrides?.email || `test-${Date.now()}@example.com`
  })
}

export function createTestOrder(
  overrides?: Partial<{
    customerId: string
    items: Array<{ productId: string; quantity: number; price: number }>
  }>
): Order {
  const order = Order.create(overrides?.customerId || 'customer-123')

  const items = overrides?.items || [{ productId: 'product-1', quantity: 1, price: 100 }]

  items.forEach(item => {
    order.addItem(item.productId, item.quantity, Money.create(item.price, 'CNY'))
  })

  return order
}

export function createTestMoney(
  overrides?: Partial<{
    amount: number
    currency: string
  }>
): Money {
  return Money.create(overrides?.amount || 100, overrides?.currency || 'CNY')
}

// 使用示例
import { createTestUser, createTestOrder } from '@/tests/helpers/fixtures'

describe('OrderService', () => {
  it('should process order', async () => {
    const user = createTestUser({ name: 'Alice' })
    const order = createTestOrder({
      customerId: user.id,
      items: [{ productId: 'p1', quantity: 2, price: 100 }]
    })

    await service.processOrder(order)

    expect(order.getStatus()).toBe('SUBMITTED')
  })
})
```

## 测试性能

### 基准测试

```typescript
import { describe, bench } from 'vitest'

describe('performance', () => {
  bench('Money.create', () => {
    Money.create(100, 'CNY')
  })

  bench('Money.add', () => {
    const money1 = Money.create(100, 'CNY')
    const money2 = Money.create(50, 'CNY')
    money1.add(money2)
  })

  bench('Order.addItem', () => {
    const order = Order.create('customer-123')
    order.addItem('product-1', 1, Money.create(100, 'CNY'))
  })
})
```

## 总结

### 测试检查清单

在编写测试前，确认：

- [ ] 测试文件与源码文件在同一目录
- [ ] 使用 `*.spec.ts` 命名
- [ ] 使用 `describe` 组织测试套件
- [ ] 使用清晰的测试名称（should ... when ...）
- [ ] 测试所有公共 API
- [ ] 测试边界条件
- [ ] 测试异常情况
- [ ] 正确处理异步代码
- [ ] 适当使用 Mock
- [ ] 达到 100% 覆盖率

### 测试原则

1. **测试行为，不是实现** - 测试"做什么"而非"怎么做"
2. **一个测试一个断言** - 每个测试只验证一件事
3. **独立性** - 测试之间不应相互依赖
4. **可重复** - 测试应该每次都产生相同结果
5. **快速执行** - 单元测试应该在毫秒级完成
6. **清晰易懂** - 测试就是最好的文档

遵循这些测试规范，构建高质量、可维护的测试套件。
