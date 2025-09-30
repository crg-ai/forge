# Forge 代码风格规范

## 文件命名规范

### 目录命名

- 使用 **kebab-case** (小写+连字符)
- 语义化命名，反映目录内容

```
✅ 好的示例：
src/domain-events/
src/value-objects/
src/application-services/

❌ 坏的示例：
src/domainEvents/
src/ValueObjects/
src/AppServices/
```

### 类文件命名

- 使用 **PascalCase** (大驼峰)
- 文件名与类名保持一致
- 一个文件只包含一个主要的类或接口

```
✅ 好的示例：
Entity.ts          // export class Entity
ValueObject.ts     // export abstract class ValueObject
AggregateRoot.ts   // export class AggregateRoot

❌ 坏的示例：
entity.ts          // 应该使用 PascalCase
entityBase.ts      // 应该叫 Entity.ts
entities.ts        // 包含多个类，应该拆分
```

### 工具函数文件命名

- 使用 **camelCase** (小驼峰)
- 描述文件的功能

```
✅ 好的示例：
uuid.ts            // UUID 生成和验证
typeGuards.ts      // 类型守卫函数集合
validators.ts      // 验证函数集合

❌ 坏的示例：
UUID.ts            // 不是类文件，不应该用 PascalCase
Helpers.ts         // 名称过于宽泛
utils.ts           // 太通用，应该更具体
```

### 测试文件命名

- 与源文件同名，添加 `.test.ts` 或 `.spec.ts` 后缀
- 推荐使用 `.spec.ts`（与主流框架保持一致）

```
✅ 好的示例：
Entity.ts → Entity.spec.ts
uuid.ts → uuid.spec.ts
ValueObject.ts → ValueObject.spec.ts

❌ 坏的示例：
Entity.ts → entityTest.ts
uuid.ts → test-uuid.ts
ValueObject.ts → ValueObject.test.js  // 应该是 .ts
```

## 导入导出规范

### 使用 Named Export（避免 Default Export）

**为什么？**

- 更好的 IDE 支持（自动导入、重构）
- 避免命名不一致
- Tree-shaking 更友好
- 更容易追踪依赖关系

```typescript
// ✅ 好的示例：Named Export
// Entity.ts
export abstract class Entity<ID> {
  constructor(protected readonly _id: ID) {}

  get id(): ID {
    return this._id
  }

  equals(other: Entity<ID>): boolean {
    return this._id === other._id
  }
}

// 使用时
import { Entity } from './Entity'

// ❌ 坏的示例：Default Export
// Entity.ts
export default class Entity<ID> {
  // ...
}

// 使用时可能出现不一致
import Entity from './Entity' // 开发者 A
import EntityBase from './Entity' // 开发者 B
import E from './Entity' // 开发者 C
```

### 导入顺序

按以下顺序组织导入，各组之间空一行：

1. 外部依赖（如果有）
2. 核心模块（src/core）
3. 应用层模块（src/application）
4. 基础设施层（src/infrastructure）
5. 工具函数（src/utils）
6. 类型定义
7. 相对路径导入

```typescript
// ✅ 好的示例：清晰的导入顺序
// 外部依赖（Forge 项目中应该没有）
// import { something } from 'external-package'

// 核心模块
import { Entity } from '@/core/Entity'
import { ValueObject } from '@/core/ValueObject'
import { AggregateRoot } from '@/core/AggregateRoot'

// 应用层
import { DomainEvent } from '@/application/DomainEvent'

// 工具函数
import { generateUUID } from '@/utils/uuid'

// 类型定义
import type { Repository } from '@/types'

// 相对路径
import { UserCreatedEvent } from './UserCreatedEvent'

// ❌ 坏的示例：混乱的导入
import { UserCreatedEvent } from './UserCreatedEvent'
import type { Repository } from '@/types'
import { generateUUID } from '@/utils/uuid'
import { Entity } from '@/core/Entity'
```

### Index 文件导出规范

每个模块应该有一个 `index.ts` 统一导出公共 API：

```typescript
// ✅ 好的示例：core/index.ts
export { Entity } from './Entity'
export { ValueObject } from './ValueObject'
export { AggregateRoot } from './AggregateRoot'
export type { Repository } from './Repository'

// 使用时
import { Entity, ValueObject, AggregateRoot } from '@/core'

// ❌ 坏的示例：使用 export * from
export * from './Entity'
export * from './ValueObject'
// 问题：无法控制导出内容，可能暴露内部实现
```

## 代码格式规范

### 缩进和空格

- 使用 **2 个空格**缩进（不使用 Tab）
- 运算符前后加空格
- 逗号后面加空格
- 冒号后面加空格（类型注解）

```typescript
// ✅ 好的示例
class User extends Entity<string> {
  constructor(
    id: string,
    private readonly name: string,
    private readonly email: string
  ) {
    super(id)
  }

  changeName(newName: string): void {
    if (newName.length < 2) {
      throw new Error('名称太短')
    }
    this.name = newName
  }
}

// ❌ 坏的示例
class User extends Entity<string> {
  constructor(
    id: string,
    private readonly name: string,
    private readonly email: string
  ) {
    super(id)
  }
  changeName(newName: string): void {
    if (newName.length < 2) {
      throw new Error('名称太短')
    }
    this.name = newName
  }
}
```

### 行长度

- 最大行长度：100 字符
- 超长时在合适位置换行

```typescript
// ✅ 好的示例：合理换行
const result = await this.userRepository.findByEmailAndStatus(email, UserStatus.ACTIVE, options)

// ❌ 坏的示例：一行太长
const result = await this.userRepository.findByEmailAndStatus(
  email,
  UserStatus.ACTIVE,
  options,
  includeDeleted,
  withRelations
)
```

### 空行使用

- 类成员之间空一行
- 逻辑块之间空一行
- 文件末尾保留一个空行

```typescript
// ✅ 好的示例
export class Order extends AggregateRoot<string> {
  private items: OrderItem[] = []
  private status: OrderStatus

  constructor(id: string, customerId: string) {
    super(id)
    this.customerId = customerId
    this.status = OrderStatus.DRAFT
  }

  addItem(product: Product, quantity: number): void {
    const item = OrderItem.create(product, quantity)
    this.items.push(item)

    this.addDomainEvent(new ItemAddedEvent(this.id, item))
  }

  submit(): void {
    if (this.items.length === 0) {
      throw new Error('订单不能为空')
    }

    this.status = OrderStatus.SUBMITTED
    this.addDomainEvent(new OrderSubmittedEvent(this.id))
  }
}

// ❌ 坏的示例：缺少空行，难以阅读
export class Order extends AggregateRoot<string> {
  private items: OrderItem[] = []
  private status: OrderStatus
  constructor(id: string, customerId: string) {
    super(id)
    this.customerId = customerId
    this.status = OrderStatus.DRAFT
  }
  addItem(product: Product, quantity: number): void {
    const item = OrderItem.create(product, quantity)
    this.items.push(item)
    this.addDomainEvent(new ItemAddedEvent(this.id, item))
  }
  submit(): void {
    if (this.items.length === 0) {
      throw new Error('订单不能为空')
    }
    this.status = OrderStatus.SUBMITTED
    this.addDomainEvent(new OrderSubmittedEvent(this.id))
  }
}
```

## 注释规范

### JSDoc 格式

所有公共 API 必须有 JSDoc 注释：

````typescript
// ✅ 好的示例：完整的 JSDoc
/**
 * 生成 UUID v4 标识符
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
 * 值对象抽象基类
 *
 * 值对象特点：
 * - 不可变性：创建后不能修改
 * - 值相等：通过值判断相等性，而非引用
 * - 无标识符：不需要唯一 ID
 *
 * @template Props 值对象的属性类型
 *
 * @example
 * ```typescript
 * interface EmailProps {
 *   value: string
 * }
 *
 * class Email extends ValueObject<EmailProps> {
 *   get value(): string {
 *     return this.props.value
 *   }
 *
 *   static create(value: string): Email {
 *     if (!value.includes('@')) {
 *       throw new Error('无效的邮箱地址')
 *     }
 *     return new Email({ value })
 *   }
 * }
 * ```
 */
export abstract class ValueObject<Props> {
  protected readonly props: Props

  protected constructor(props: Props) {
    this.props = Object.freeze(props)
  }

  /**
   * 判断两个值对象是否相等
   *
   * @param other 要比较的值对象
   * @returns 如果值相等返回 true，否则返回 false
   */
  equals(other: ValueObject<Props>): boolean {
    return JSON.stringify(this.props) === JSON.stringify(other.props)
  }
}

// ❌ 坏的示例：缺少注释或注释不完整
export function generateUUID(): string {
  // 生成 UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// 没有类注释
export abstract class ValueObject<Props> {
  protected readonly props: Props

  // 没有方法注释
  equals(other: ValueObject<Props>): boolean {
    return JSON.stringify(this.props) === JSON.stringify(other.props)
  }
}
````

### 内联注释

- 用于解释复杂逻辑
- 说明"为什么"而不是"是什么"
- 放在代码上方，不是行尾

```typescript
// ✅ 好的示例：说明"为什么"
export class Money extends ValueObject<MoneyProps> {
  add(other: Money): Money {
    // 不同币种不能直接相加，必须先转换
    if (this.currency !== other.currency) {
      throw new Error('不能对不同币种的金额进行运算')
    }

    // 使用整数运算避免浮点数精度问题
    const totalCents = this.amountInCents + other.amountInCents
    return new Money({
      amount: totalCents / 100,
      currency: this.currency
    })
  }
}

// ❌ 坏的示例：说明显而易见的事情
export class Money extends ValueObject<MoneyProps> {
  add(other: Money): Money {
    // 检查币种
    if (this.currency !== other.currency) {
      throw new Error('不能对不同币种的金额进行运算')
    }

    // 相加
    const totalCents = this.amountInCents + other.amountInCents
    // 返回新的 Money
    return new Money({ amount: totalCents / 100, currency: this.currency })
  }
}
```

### TODO 注释

- 使用 `TODO:` 标记待完成的工作
- 包含简短说明和责任人（可选）

```typescript
// ✅ 好的示例
export class UserRepository implements Repository<User> {
  async save(user: User): Promise<void> {
    // TODO: 实现事务支持，确保聚合一致性
    // TODO(@crg): 添加乐观锁机制，防止并发更新冲突
    throw new Error('Not implemented')
  }
}

// ❌ 坏的示例
export class UserRepository implements Repository<User> {
  async save(user: User): Promise<void> {
    // TODO
    // FIXME later
    // 需要改
    throw new Error('Not implemented')
  }
}
```

## 变量命名规范

### 常量

- 使用 **UPPER_SNAKE_CASE**
- 放在文件顶部或类的静态成员

```typescript
// ✅ 好的示例
const MAX_RETRY_ATTEMPTS = 3
const DEFAULT_TIMEOUT_MS = 5000
const API_BASE_URL = 'https://api.example.com'

class Order {
  private static readonly MAX_ITEMS = 100
  private static readonly MIN_AMOUNT = 0.01
}

// ❌ 坏的示例
const maxRetry = 3
const DefaultTimeout = 5000
const apiUrl = 'https://api.example.com'
```

### 变量和参数

- 使用 **camelCase**
- 有意义的完整单词，避免缩写
- 布尔值使用 `is/has/can` 前缀

```typescript
// ✅ 好的示例
const userId = generateUUID()
const userEmail = 'user@example.com'
const isActive = true
const hasPermission = user.checkPermission('admin')
const canEdit = isActive && hasPermission

function createUser(userName: string, userEmail: string): User {
  // ...
}

// ❌ 坏的示例
const id = generateUUID() // 太宽泛
const e = 'user@example.com' // 太简短
const active = true // 应该用 isActive
const perm = user.checkPermission() // 缩写不清楚

function createUser(n: string, e: string): User {
  // 参数名不清晰
}
```

### 类和接口

- 使用 **PascalCase**
- 名词或名词短语
- 接口不使用 `I` 前缀

```typescript
// ✅ 好的示例
class User extends Entity<string> {}
class ShoppingCart extends AggregateRoot<string> {}
interface Repository<T> {}
interface DomainEvent {}

// ❌ 坏的示例
class user extends Entity<string> {} // 应该用 PascalCase
class cart extends AggregateRoot<string> {} // 应该更具体
interface IRepository<T> {} // 不使用 I 前缀
interface event {} // 应该用 PascalCase
```

### 类型别名和泛型

- 类型别名使用 **PascalCase**
- 泛型参数使用有意义的名称

```typescript
// ✅ 好的示例
type UserId = string
type OrderStatus = 'draft' | 'submitted' | 'paid' | 'shipped'
type Result<Value, Error = string> =
  | { success: true; value: Value }
  | { success: false; error: Error }

class Repository<Entity, ID> {
  async findById(id: ID): Promise<Entity | null> {
    // ...
  }
}

// ❌ 坏的示例
type userid = string // 应该用 PascalCase
type status = 'draft' | 'submitted' // 太宽泛

class Repository<T, U> {
  // 泛型参数不清晰
  async findById(id: U): Promise<T | null> {
    // ...
  }
}
```

## 使用 const 优先

优先使用 `const`，只在需要重新赋值时使用 `let`：

```typescript
// ✅ 好的示例
const user = User.create({ name: 'Alice' })
const items = order.getItems()
const total = items.reduce((sum, item) => sum + item.price, 0)

// 需要重新赋值时使用 let
let retryCount = 0
while (retryCount < MAX_RETRY_ATTEMPTS) {
  retryCount++
  // ...
}

// ❌ 坏的示例
let user = User.create({ name: 'Alice' }) // 不会重新赋值，应该用 const
let items = order.getItems() // 不会重新赋值，应该用 const
var total = 0 // 不使用 var
```

## Prettier 配置

Forge 项目使用 Prettier 自动格式化代码，配置如下：

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "avoid"
}
```

**使用方式：**

```bash
# 格式化所有文件
npm run format

# 检查格式是否符合规范
npm run format -- --check
```

## ESLint 规则

配合 ESLint 确保代码质量：

```bash
# 检查代码
npm run lint

# 自动修复
npm run lint -- --fix
```

## 总结

**核心原则：**

1. **一致性优于个人偏好** - 团队统一风格
2. **可读性优于简洁性** - 清晰的代码胜过聪明的代码
3. **显式优于隐式** - 明确的类型和命名
4. **文档化公共 API** - 所有对外接口都有完整注释
5. **自动化工具优先** - 让 Prettier/ESLint 处理格式问题

**工具链：**

- **Prettier**: 自动格式化
- **ESLint**: 代码质量检查
- **TypeScript**: 类型检查
- **Husky + lint-staged**: Git 提交前自动检查

遵循这些规范，保持代码库的高质量和一致性。
