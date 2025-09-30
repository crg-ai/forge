# Forge 文件组织规范

## 目录结构标准

### 顶层目录结构

```
forge/
├── .claude/              # Claude Code 配置和规范
│   ├── agents/          # 自定义 Agent 配置
│   └── rules/           # 项目规范文档
├── src/                 # 源代码目录
│   ├── core/           # DDD 核心构建块
│   ├── application/    # 应用层
│   ├── infrastructure/ # 基础设施层
│   └── utils/          # 工具函数
├── tests/              # 独立测试文件（可选）
├── examples/           # 使用示例
├── docs/               # 文档
├── site/               # 文档网站
└── dist/               # 构建输出（自动生成）
```

### 为什么这样组织？

1. **清晰的分层** - 按 DDD 分层架构组织
2. **就近原则** - 测试文件与源码在一起
3. **易于导航** - 功能相关的文件放在同一目录
4. **扩展性好** - 新增功能只需添加新模块
5. **构建友好** - 符合现代构建工具的期望

## 核心模块结构（src/core/）

### 标准模块组织

每个核心模块按以下结构组织：

```
src/core/
├── entity/
│   ├── Entity.ts           # 实体基类实现
│   ├── Entity.spec.ts      # 实体测试
│   └── index.ts            # 模块导出
├── value-object/
│   ├── ValueObject.ts      # 值对象基类实现
│   ├── ValueObject.spec.ts # 值对象测试
│   └── index.ts            # 模块导出
├── aggregate/
│   ├── AggregateRoot.ts    # 聚合根基类实现
│   ├── AggregateRoot.spec.ts
│   └── index.ts
├── repository/
│   ├── Repository.ts       # 仓储接口定义
│   ├── Repository.spec.ts
│   └── index.ts
├── domain-event/
│   ├── DomainEvent.ts      # 领域事件接口
│   ├── DomainEvent.spec.ts
│   └── index.ts
└── index.ts                # 核心模块统一导出
```

### 示例：完整的模块实现

#### entity/ 模块

```typescript
// src/core/entity/Entity.ts
/**
 * 实体抽象基类
 *
 * @template ID 实体标识符类型
 */
export abstract class Entity<ID> {
  protected readonly _id: ID

  protected constructor(id: ID) {
    this._id = id
  }

  get id(): ID {
    return this._id
  }

  equals(other: Entity<ID>): boolean {
    if (other === null || other === undefined) {
      return false
    }
    if (!(other instanceof Entity)) {
      return false
    }
    return this._id === other._id
  }
}
```

```typescript
// src/core/entity/Entity.spec.ts
import { describe, it, expect } from 'vitest'
import { Entity } from './Entity'

class TestEntity extends Entity<string> {
  constructor(id: string) {
    super(id)
  }
}

describe('Entity', () => {
  it('should have an id', () => {
    const entity = new TestEntity('123')
    expect(entity.id).toBe('123')
  })

  it('should be equal to another entity with same id', () => {
    const entity1 = new TestEntity('123')
    const entity2 = new TestEntity('123')

    expect(entity1.equals(entity2)).toBe(true)
  })

  it('should not be equal to entity with different id', () => {
    const entity1 = new TestEntity('123')
    const entity2 = new TestEntity('456')

    expect(entity1.equals(entity2)).toBe(false)
  })
})
```

```typescript
// src/core/entity/index.ts
export { Entity } from './Entity'
```

#### core/ 统一导出

```typescript
// src/core/index.ts
export { Entity } from './entity'
export { ValueObject } from './value-object'
export { AggregateRoot } from './aggregate'
export type { Repository } from './repository'
export type { DomainEvent } from './domain-event'
```

## 应用层结构（src/application/）

应用层包含用例、应用服务、DTO、映射器等：

```
src/application/
├── use-cases/           # 用例实现
│   ├── CreateUserUseCase.ts
│   ├── CreateUserUseCase.spec.ts
│   └── index.ts
├── services/            # 应用服务
│   ├── UserService.ts
│   ├── UserService.spec.ts
│   └── index.ts
├── dto/                 # 数据传输对象
│   ├── CreateUserDto.ts
│   ├── UserDto.ts
│   └── index.ts
├── mappers/             # DTO 与领域对象映射
│   ├── UserMapper.ts
│   ├── UserMapper.spec.ts
│   └── index.ts
└── index.ts             # 应用层统一导出
```

### 示例：用例模块

```typescript
// src/application/use-cases/CreateUserUseCase.ts
import { User } from '@/core/entity/User'
import { UserRepository } from '@/core/repository/UserRepository'
import { CreateUserDto } from '../dto/CreateUserDto'
import { Email } from '@/core/value-object/Email'

/**
 * 创建用户用例
 */
export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(dto: CreateUserDto): Promise<User> {
    // 验证邮箱是否已存在
    const email = Email.create(dto.email)
    const exists = await this.userRepository.existsByEmail(email)

    if (exists) {
      throw new Error('邮箱已被注册')
    }

    // 创建用户
    const user = User.create({
      name: dto.name,
      email: dto.email
    })

    // 保存用户
    await this.userRepository.save(user)

    return user
  }
}
```

```typescript
// src/application/use-cases/CreateUserUseCase.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { CreateUserUseCase } from './CreateUserUseCase'
import { InMemoryUserRepository } from '@/infrastructure/repository/InMemoryUserRepository'

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase
  let repository: InMemoryUserRepository

  beforeEach(() => {
    repository = new InMemoryUserRepository()
    useCase = new CreateUserUseCase(repository)
  })

  it('should create a new user', async () => {
    const user = await useCase.execute({
      name: 'Alice',
      email: 'alice@example.com'
    })

    expect(user.name).toBe('Alice')
    expect(user.email).toBe('alice@example.com')
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
})
```

```typescript
// src/application/use-cases/index.ts
export { CreateUserUseCase } from './CreateUserUseCase'
export { UpdateUserUseCase } from './UpdateUserUseCase'
// ... 其他用例
```

## 基础设施层结构（src/infrastructure/）

基础设施层包含技术实现：

```
src/infrastructure/
├── repository/          # 仓储实现
│   ├── InMemoryUserRepository.ts
│   ├── InMemoryUserRepository.spec.ts
│   ├── InMemoryOrderRepository.ts
│   └── index.ts
├── event-bus/           # 事件总线实现
│   ├── EventBus.ts
│   ├── EventBus.spec.ts
│   ├── InMemoryEventBus.ts
│   └── index.ts
├── persistence/         # 持久化适配器
│   ├── LocalStorageAdapter.ts
│   ├── IndexedDBAdapter.ts
│   └── index.ts
├── http/                # HTTP 客户端
│   ├── HttpClient.ts
│   └── index.ts
└── index.ts             # 基础设施层统一导出
```

### 示例：仓储实现

```typescript
// src/infrastructure/repository/InMemoryUserRepository.ts
import { User } from '@/core/entity/User'
import { UserRepository } from '@/core/repository/UserRepository'
import { Email } from '@/core/value-object/Email'

/**
 * 用户仓储的内存实现（用于测试和开发）
 */
export class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map()

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null
  }

  async findByEmail(email: Email): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email.value) {
        return user
      }
    }
    return null
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const user = await this.findByEmail(email)
    return user !== null
  }

  async save(user: User): Promise<void> {
    this.users.set(user.id, user)
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id)
  }

  // 测试辅助方法
  clear(): void {
    this.users.clear()
  }
}
```

```typescript
// src/infrastructure/repository/index.ts
export { InMemoryUserRepository } from './InMemoryUserRepository'
export { InMemoryOrderRepository } from './InMemoryOrderRepository'
```

## 工具函数结构（src/utils/）

工具函数按功能分类：

```
src/utils/
├── uuid.ts              # UUID 生成和验证
├── uuid.spec.ts
├── typeGuards.ts        # TypeScript 类型守卫
├── typeGuards.spec.ts
├── validators.ts        # 通用验证函数
├── validators.spec.ts
├── formatters.ts        # 格式化工具
├── formatters.spec.ts
└── index.ts             # 工具函数统一导出
```

### 示例：工具函数模块

````typescript
// src/utils/uuid.ts
/**
 * 生成 UUID v4
 *
 * @returns 符合 RFC 4122 标准的 UUID 字符串
 *
 * @example
 * ```typescript
 * const id = generateUUID()
 * console.log(id) // "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 * ```
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * 验证是否为有效的 UUID
 *
 * @param uuid 待验证的字符串
 * @returns 如果是有效的 UUID 返回 true，否则返回 false
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}
````

```typescript
// src/utils/uuid.spec.ts
import { describe, it, expect } from 'vitest'
import { generateUUID, isValidUUID } from './uuid'

describe('UUID utilities', () => {
  describe('generateUUID', () => {
    it('should generate a valid UUID v4', () => {
      const uuid = generateUUID()
      expect(isValidUUID(uuid)).toBe(true)
    })

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID()
      const uuid2 = generateUUID()
      expect(uuid1).not.toBe(uuid2)
    })
  })

  describe('isValidUUID', () => {
    it('should return true for valid UUID', () => {
      const uuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
      expect(isValidUUID(uuid)).toBe(true)
    })

    it('should return false for invalid UUID', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false)
      expect(isValidUUID('12345678-1234-1234-1234-123456789012')).toBe(false)
    })
  })
})
```

```typescript
// src/utils/index.ts
export { generateUUID, isValidUUID } from './uuid'
export { isEntity, isValueObject, isAggregateRoot } from './typeGuards'
export { validateEmail, validateURL } from './validators'
```

## 测试文件位置和命名

### 测试文件命名约定

- 使用 `*.spec.ts` 后缀（推荐，与主流框架一致）
- 或使用 `*.test.ts` 后缀（可选）
- 测试文件与源码文件放在同一目录

### 为什么测试文件和源码在一起？

✅ **优点：**

1. **就近原则** - 修改代码时立即看到测试
2. **易于导航** - 不需要在不同目录切换
3. **模块化** - 测试随模块一起移动/删除
4. **清晰的对应关系** - 一目了然

```
✅ 好的示例：
src/core/entity/
├── Entity.ts           # 源码
├── Entity.spec.ts      # 测试
└── index.ts            # 导出

✅ 也可以接受（小型项目）：
src/
├── Entity.ts
└── Entity.spec.ts

❌ 不推荐（需要在目录间跳转）：
src/
└── Entity.ts
tests/
└── Entity.spec.ts
```

### 特殊情况：集成测试和 E2E 测试

复杂的集成测试或 E2E 测试可以放在独立的 `tests/` 目录：

```
tests/
├── integration/         # 集成测试
│   ├── order-flow.spec.ts
│   └── user-registration.spec.ts
├── e2e/                # 端到端测试
│   └── checkout.spec.ts
└── helpers/            # 测试辅助工具
    └── fixtures.ts
```

## Index 文件导出规范

### 为什么需要 index.ts？

1. **简化导入路径** - `from '@/core'` 而不是 `from '@/core/entity/Entity'`
2. **控制 API 暴露** - 只导出公共接口
3. **易于重构** - 内部结构变化不影响外部
4. **文档作用** - index.ts 就是模块的 API 文档

### Index 文件的层次结构

#### 1. 模块级 index.ts

```typescript
// ✅ 好的示例：src/core/entity/index.ts
// 只导出公共 API
export { Entity } from './Entity'

// 不导出内部实现
// export { InternalHelper } from './InternalHelper'  ❌
```

#### 2. 分层级 index.ts

```typescript
// ✅ 好的示例：src/core/index.ts
// 导出所有核心模块
export { Entity } from './entity'
export { ValueObject } from './value-object'
export { AggregateRoot } from './aggregate'
export type { Repository } from './repository'
export type { DomainEvent } from './domain-event'

// 可以有选择地重导出
export type { EntityProps } from './entity/types'
```

#### 3. 顶层 index.ts

```typescript
// ✅ 好的示例：src/index.ts
// 框架主入口，导出所有公共 API

// 核心模块
export { Entity, ValueObject, AggregateRoot } from './core'

export type { Repository, DomainEvent } from './core'

// 工具函数
export { generateUUID, isValidUUID } from './utils'

// 版本信息
export const VERSION = '0.1.0'
```

### 导出类型的注意事项

```typescript
// ✅ 好的示例：区分类型导出和值导出
export type { Repository } from './repository' // 仅类型
export { Entity } from './entity' // 类和类型

// ❌ 坏的示例：混淆类型和值
export { Repository } from './repository' // 如果 Repository 是 interface，会报错
```

## 导入路径规范

### 路径别名配置

在 `tsconfig.json` 中配置路径别名：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/core": ["src/core"],
      "@/application": ["src/application"],
      "@/infrastructure": ["src/infrastructure"],
      "@/utils": ["src/utils"]
    }
  }
}
```

### 导入路径使用规范

```typescript
// ✅ 好的示例：使用路径别名（跨层）
import { Entity } from '@/core'
import { generateUUID } from '@/utils'
import { UserRepository } from '@/infrastructure/repository'

// ✅ 好的示例：使用相对路径（同层相邻模块）
import { UserCreatedEvent } from './UserCreatedEvent'
import { Email } from '../value-objects/Email'

// ❌ 坏的示例：混乱的相对路径
import { Entity } from '../../../../core/entity/Entity'
import { generateUUID } from '../../../utils/uuid'
```

### 导入路径决策树

1. **同目录文件** → 相对路径 `./`
2. **父目录或子目录（同模块内）** → 相对路径 `../` 或 `./`
3. **不同模块** → 路径别名 `@/`
4. **工具函数** → 路径别名 `@/utils`

```typescript
// 示例文件：src/application/use-cases/CreateUserUseCase.ts

// ✅ 同目录
import { UpdateUserUseCase } from './UpdateUserUseCase'

// ✅ 父目录（同模块）
import { CreateUserDto } from '../dto/CreateUserDto'

// ✅ 不同模块（核心层）
import { User } from '@/core'
import { UserRepository } from '@/core/repository'

// ✅ 工具函数
import { generateUUID } from '@/utils'

// ✅ 基础设施层
import { InMemoryUserRepository } from '@/infrastructure/repository'
```

## 示例项目结构

### 完整的电商示例结构

```
forge/
├── src/
│   ├── core/                          # 核心 DDD 构建块
│   │   ├── entity/
│   │   │   ├── Entity.ts
│   │   │   ├── Entity.spec.ts
│   │   │   └── index.ts
│   │   ├── value-object/
│   │   │   ├── ValueObject.ts
│   │   │   ├── ValueObject.spec.ts
│   │   │   └── index.ts
│   │   ├── aggregate/
│   │   │   ├── AggregateRoot.ts
│   │   │   ├── AggregateRoot.spec.ts
│   │   │   └── index.ts
│   │   ├── repository/
│   │   │   ├── Repository.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── domain/                        # 领域层（用户项目）
│   │   ├── user/                      # 用户聚合
│   │   │   ├── User.ts               # 用户聚合根
│   │   │   ├── User.spec.ts
│   │   │   ├── Email.ts              # 邮箱值对象
│   │   │   ├── Email.spec.ts
│   │   │   ├── UserRepository.ts     # 仓储接口
│   │   │   ├── UserCreatedEvent.ts   # 领域事件
│   │   │   └── index.ts
│   │   ├── order/                     # 订单聚合
│   │   │   ├── Order.ts
│   │   │   ├── Order.spec.ts
│   │   │   ├── OrderItem.ts          # 订单项实体
│   │   │   ├── OrderItem.spec.ts
│   │   │   ├── Money.ts              # 金额值对象
│   │   │   ├── Money.spec.ts
│   │   │   ├── OrderRepository.ts
│   │   │   ├── OrderSubmittedEvent.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── application/                   # 应用层
│   │   ├── use-cases/
│   │   │   ├── user/
│   │   │   │   ├── CreateUserUseCase.ts
│   │   │   │   ├── CreateUserUseCase.spec.ts
│   │   │   │   └── index.ts
│   │   │   ├── order/
│   │   │   │   ├── PlaceOrderUseCase.ts
│   │   │   │   ├── PlaceOrderUseCase.spec.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── dto/
│   │   │   ├── CreateUserDto.ts
│   │   │   ├── PlaceOrderDto.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── infrastructure/                # 基础设施层
│   │   ├── repository/
│   │   │   ├── InMemoryUserRepository.ts
│   │   │   ├── InMemoryUserRepository.spec.ts
│   │   │   ├── InMemoryOrderRepository.ts
│   │   │   └── index.ts
│   │   ├── event-bus/
│   │   │   ├── InMemoryEventBus.ts
│   │   │   ├── InMemoryEventBus.spec.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── utils/                         # 工具函数
│   │   ├── uuid.ts
│   │   ├── uuid.spec.ts
│   │   └── index.ts
│   │
│   └── index.ts                       # 主入口
│
├── examples/                          # 使用示例
│   ├── e-commerce/                   # 电商系统示例
│   │   ├── README.md
│   │   └── main.ts
│   ├── blog/                         # 博客系统示例
│   │   ├── README.md
│   │   └── main.ts
│   └── index.ts
│
├── tests/                            # 独立测试
│   ├── integration/                  # 集成测试
│   │   ├── user-order-flow.spec.ts
│   │   └── event-handling.spec.ts
│   └── helpers/                      # 测试辅助
│       └── fixtures.ts
│
├── docs/                             # 文档
│   ├── architecture.md
│   ├── best-practices.md
│   └── api/                          # API 文档（自动生成）
│
└── dist/                             # 构建输出（自动生成）
    ├── index.js
    ├── index.d.ts
    └── index.mjs
```

## 文件命名检查清单

在创建新文件前，检查以下几点：

- [ ] 文件名符合命名约定（PascalCase/camelCase/kebab-case）
- [ ] 文件放在正确的目录
- [ ] 有对应的测试文件（\*.spec.ts）
- [ ] 有 index.ts 导出（如果是模块）
- [ ] 导入路径使用正确的别名
- [ ] 文件不超过 300 行（考虑拆分）

## 重构时的文件组织策略

### 何时拆分文件？

当文件出现以下情况时考虑拆分：

1. **文件行数 > 300** - 考虑按功能拆分
2. **多个类/接口** - 每个类一个文件
3. **复杂的值对象** - 单独文件
4. **测试文件过大** - 按测试套件拆分

### 拆分示例

```typescript
// ❌ 拆分前：一个文件包含太多内容
// src/domain/order/Order.ts (500+ 行)
export class Order extends AggregateRoot<string> { /* ... */ }
export class OrderItem extends Entity<string> { /* ... */ }
export class Money extends ValueObject<MoneyProps> { /* ... */ }
export enum OrderStatus { /* ... */ }
export class OrderSubmittedEvent implements DomainEvent { /* ... */ }

// ✅ 拆分后：每个概念一个文件
src/domain/order/
├── Order.ts                  # 订单聚合根
├── Order.spec.ts
├── OrderItem.ts              # 订单项实体
├── OrderItem.spec.ts
├── Money.ts                  # 金额值对象
├── Money.spec.ts
├── OrderStatus.ts            # 订单状态枚举
├── OrderSubmittedEvent.ts    # 领域事件
├── OrderSubmittedEvent.spec.ts
└── index.ts                  # 统一导出
```

## 总结

### 核心原则

1. **按功能组织** - 相关文件放在一起
2. **测试就近** - 测试文件与源码文件在同一目录
3. **清晰的边界** - 通过目录体现 DDD 分层
4. **统一导出** - 使用 index.ts 控制 API
5. **路径别名** - 使用 `@/` 简化导入

### 快速参考

| 文件类型   | 位置                             | 命名        | 示例                        |
| ---------- | -------------------------------- | ----------- | --------------------------- |
| 核心构建块 | `src/core/`                      | PascalCase  | `Entity.ts`                 |
| 领域实体   | `src/domain/[聚合]/`             | PascalCase  | `User.ts`                   |
| 值对象     | `src/domain/[聚合]/`             | PascalCase  | `Email.ts`                  |
| 用例       | `src/application/use-cases/`     | PascalCase  | `CreateUserUseCase.ts`      |
| 仓储实现   | `src/infrastructure/repository/` | PascalCase  | `InMemoryUserRepository.ts` |
| 工具函数   | `src/utils/`                     | camelCase   | `uuid.ts`                   |
| 测试文件   | 与源码同目录                     | `*.spec.ts` | `User.spec.ts`              |
| 模块导出   | 每个模块根目录                   | `index.ts`  | `src/core/index.ts`         |

遵循这些文件组织规范，保持代码库结构清晰、易于维护。
