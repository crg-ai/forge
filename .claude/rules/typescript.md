# Forge TypeScript 规范

## 类型定义规范

### Interface vs Type

#### 何时使用 Interface

✅ **使用 interface 的场景：**

1. 定义对象的形状
2. 需要声明合并
3. 面向对象编程（类实现）
4. 公共 API 定义

```typescript
// ✅ 好的示例：使用 interface 定义对象形状
/**
 * 仓储接口
 */
export interface Repository<T extends AggregateRoot<ID>, ID> {
  findById(id: ID): Promise<T | null>
  save(aggregate: T): Promise<void>
  delete(id: ID): Promise<void>
}

/**
 * 领域事件接口
 */
export interface DomainEvent {
  readonly eventId: string
  readonly occurredOn: Date
  readonly aggregateId: string
}

/**
 * 用户仓储接口 - 扩展基础接口
 */
export interface UserRepository extends Repository<User, string> {
  findByEmail(email: Email): Promise<User | null>
  existsByEmail(email: Email): Promise<boolean>
}

// ✅ 类实现接口
export class InMemoryUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    // ...
  }
}

// ✅ 声明合并（扩展第三方库）
interface Window {
  myCustomProperty: string
}
```

#### 何时使用 Type

✅ **使用 type 的场景：**

1. 联合类型
2. 交叉类型
3. 元组类型
4. 映射类型
5. 条件类型
6. 工具类型

```typescript
// ✅ 好的示例：使用 type 定义联合类型
export type OrderStatus = 'DRAFT' | 'SUBMITTED' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

// ✅ 使用 type 定义交叉类型
export type EntityWithTimestamps<T> = T & {
  createdAt: Date
  updatedAt: Date
}

// ✅ 使用 type 定义元组
export type Coordinates = [number, number]
export type RGB = [red: number, green: number, blue: number]

// ✅ 使用 type 定义映射类型
export type Readonly<T> = {
  readonly [P in keyof T]: T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// ✅ 使用 type 定义条件类型
export type Result<T, E = Error> = { success: true; value: T } | { success: false; error: E }

// ✅ 函数类型别名
export type EventHandler<T extends DomainEvent> = (event: T) => void | Promise<void>
export type Predicate<T> = (value: T) => boolean
```

#### Interface vs Type 对比

```typescript
// ✅ Interface 可以声明合并
interface User {
  id: string
  name: string
}

interface User {
  email: string  // 合并到上面的 User
}

// ❌ Type 不能声明合并
type User = {
  id: string
  name: string
}

// 错误：标识符"User"重复
type User = {
  email: string
}

// ✅ Type 支持联合类型
type ID = string | number

// ❌ Interface 不支持联合类型
interface ID extends string | number {}  // 错误

// ✅ Type 支持复杂的类型操作
type ReadonlyUser = Readonly<User>
type PartialUser = Partial<User>

// ❌ Interface 需要手动定义
interface ReadonlyUser {
  readonly id: string
  readonly name: string
  readonly email: string
}
```

### 决策树

```
需要定义类型？
├─ 是对象形状？
│  ├─ 是 → 用 interface
│  └─ 需要类型操作？
│     ├─ 是 → 用 type
│     └─ 否 → 用 interface
├─ 是联合/交叉类型？
│  └─ 是 → 用 type
├─ 是函数类型？
│  └─ 是 → 用 type
└─ 是元组？
   └─ 是 → 用 type
```

## 泛型使用规范

### 有意义的泛型参数名

```typescript
// ✅ 好的示例：泛型参数名有意义
export abstract class Entity<ID> {
  protected readonly _id: ID

  constructor(id: ID) {
    this._id = id
  }

  equals(other: Entity<ID>): boolean {
    return this._id === other._id
  }
}

export interface Repository<Aggregate extends AggregateRoot<ID>, ID> {
  findById(id: ID): Promise<Aggregate | null>
  save(aggregate: Aggregate): Promise<void>
}

export type Result<Value, Error = string> =
  | { success: true; value: Value }
  | { success: false; error: Error }

// ❌ 坏的示例：泛型参数名不清晰
export abstract class Entity<T> {
  // T 指什么？
  protected readonly _id: T
}

export interface Repository<T, U> {
  // T 和 U 是什么？
  findById(id: U): Promise<T | null>
}
```

### 泛型命名约定

| 场景         | 推荐命名    | 示例                        |
| ------------ | ----------- | --------------------------- |
| 实体 ID 类型 | `ID`        | `Entity<ID>`                |
| 聚合类型     | `Aggregate` | `Repository<Aggregate, ID>` |
| 属性对象     | `Props`     | `ValueObject<Props>`        |
| 返回值类型   | `Value`     | `Result<Value, Error>`      |
| 错误类型     | `Error`     | `Result<Value, Error>`      |
| 事件类型     | `Event`     | `EventHandler<Event>`       |
| 状态类型     | `State`     | `StateMachine<State>`       |
| 元素类型     | `Element`   | `List<Element>`             |
| 键类型       | `Key`       | `Map<Key, Value>`           |

### 泛型约束

```typescript
// ✅ 好的示例：使用泛型约束
export class AggregateRepository<T extends AggregateRoot<ID>, ID extends string | number>
  implements Repository<T, ID>
{
  async findById(id: ID): Promise<T | null> {
    // T 一定是 AggregateRoot 的子类
    // ID 一定是 string 或 number
  }
}

// ✅ 使用 extends 约束对象形状
export function mapToDto<Entity extends { id: string; name: string }>(
  entity: Entity
): { id: string; name: string } {
  return {
    id: entity.id,
    name: entity.name
  }
}

// ✅ 使用 keyof 约束属性键
export function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

// ❌ 坏的示例：没有约束，类型不安全
export class AggregateRepository<T, ID> {
  async findById(id: ID): Promise<T | null> {
    // T 可能不是聚合根
    // ID 可能是任何类型
  }
}
```

### 默认泛型参数

```typescript
// ✅ 好的示例：提供合理的默认值
export type Result<Value, Error = string> =
  | { success: true; value: Value }
  | { success: false; error: Error }

// 使用时可以省略 Error 类型
const result1: Result<User> = { success: true, value: user }
const result2: Result<User, DomainError> = {
  success: false,
  error: new DomainError('错误')
}

// ✅ 默认 ID 类型为 string
export abstract class Entity<ID = string> {
  protected readonly _id: ID
}

// 使用默认类型
class User extends Entity {
  // ID 默认为 string
  // ...
}

// 或指定其他类型
class Product extends Entity<number> {
  // ID 为 number
  // ...
}
```

## 访问修饰符规范

### Public、Protected、Private 的使用

```typescript
// ✅ 好的示例：正确使用访问修饰符
export abstract class Entity<ID> {
  // protected: 子类可以访问，外部不能访问
  protected readonly _id: ID

  protected constructor(id: ID) {
    this._id = id
  }

  // public: 对外公开的 API（可以省略 public 关键字）
  get id(): ID {
    return this._id
  }

  equals(other: Entity<ID>): boolean {
    return this._id === other._id
  }

  // protected: 供子类使用的工具方法
  protected validate(): void {
    if (!this._id) {
      throw new Error('ID 不能为空')
    }
  }
}

export class User extends Entity<string> {
  // private: 只在当前类中使用
  private _name: string
  private _email: string
  private _isActive: boolean

  private constructor(id: string, name: string, email: string) {
    super(id) // 调用 protected 构造函数
    this._name = name
    this._email = email
    this._isActive = true
  }

  // public: 工厂方法
  static create(props: { name: string; email: string }): User {
    const id = generateUUID()
    return new User(id, props.name, props.email)
  }

  // public: 业务方法
  changeName(newName: string): void {
    this.validateName(newName)
    this._name = newName
  }

  // private: 内部验证逻辑
  private validateName(name: string): void {
    if (name.length < 2) {
      throw new Error('名称太短')
    }
  }
}

// ❌ 坏的示例：不使用访问修饰符
export class User extends Entity<string> {
  id: string // 应该是 protected readonly
  name: string // 应该是 private
  email: string // 应该是 private

  constructor(id: string, name: string, email: string) {
    // 应该是 private
    super(id)
    this.name = name
    this.email = email
  }
}
```

### 访问修饰符决策树

```
这个成员需要暴露吗？
├─ 对外部公开？
│  └─ 是 → public（可省略）
├─ 供子类使用？
│  └─ 是 → protected
└─ 只在当前类使用？
   └─ 是 → private
```

### 使用场景对比

| 修饰符      | 当前类 | 子类 | 外部 | 使用场景             |
| ----------- | ------ | ---- | ---- | -------------------- |
| `public`    | ✅     | ✅   | ✅   | 公共 API、业务方法   |
| `protected` | ✅     | ✅   | ❌   | 基类成员、供子类扩展 |
| `private`   | ✅     | ❌   | ❌   | 内部实现、辅助方法   |

## 不可变性规范

### 使用 readonly

```typescript
// ✅ 好的示例：使用 readonly 保证不可变性
export abstract class Entity<ID> {
  protected readonly _id: ID // ID 不能修改

  protected constructor(id: ID) {
    this._id = id
  }
}

export abstract class ValueObject<Props> {
  protected readonly props: Props // 属性不能修改

  protected constructor(props: Props) {
    this.props = Object.freeze({ ...props })
  }
}

export interface DomainEvent {
  readonly eventId: string // 事件属性都是只读的
  readonly occurredOn: Date
  readonly aggregateId: string
}

// ✅ 类的 readonly 属性
export class User extends Entity<string> {
  private readonly _createdAt: Date // 创建后不能修改

  constructor(id: string) {
    super(id)
    this._createdAt = new Date()
  }

  get createdAt(): Date {
    return this._createdAt
  }
}

// ❌ 坏的示例：可变的应该不可变的属性
export abstract class Entity<ID> {
  protected _id: ID // ID 可以被修改，不安全

  setId(newId: ID): void {
    this._id = newId // 破坏实体身份
  }
}
```

### ReadonlyArray 和 readonly 修饰符

```typescript
// ✅ 好的示例：返回只读数组
export class Order extends AggregateRoot<string> {
  private items: OrderItem[] = []

  // 返回只读数组，防止外部修改
  getItems(): ReadonlyArray<OrderItem> {
    return [...this.items]  // 返回副本
  }

  // 或使用 readonly 修饰符
  getItemsReadonly(): readonly OrderItem[] {
    return this.items
  }
}

// ✅ 参数使用只读数组
export function calculateTotal(
  items: ReadonlyArray<OrderItem>
): Money {
  return items.reduce(
    (total, item) => total.add(item.subtotal),
    Money.zero()
  )
}

// ❌ 坏的示例：返回可变数组
export class Order extends AggregateRoot<string> {
  private items: OrderItem[] = []

  getItems(): OrderItem[] {
    return this.items  // 外部可以修改内部数组
  }
}

// 使用时可能破坏封装
const items = order.getItems()
items.push(new OrderItem(...))  // 绕过业务规则
```

### 深度只读类型

```typescript
// ✅ 好的示例：深度只读工具类型
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

interface UserData {
  id: string
  profile: {
    name: string
    address: {
      city: string
      street: string
    }
  }
}

// 所有层级都是只读的
type ReadonlyUserData = DeepReadonly<UserData>

const user: ReadonlyUserData = {
  id: '123',
  profile: {
    name: 'Alice',
    address: {
      city: 'Beijing',
      street: 'Main St'
    }
  }
}

// 错误：无法修改任何层级
// user.id = '456'
// user.profile.name = 'Bob'
// user.profile.address.city = 'Shanghai'
```

## 类型守卫和类型断言

### 使用类型守卫

```typescript
// ✅ 好的示例：使用类型守卫
export function isEntity<ID>(value: unknown): value is Entity<ID> {
  return value instanceof Entity
}

export function isValueObject<Props>(value: unknown): value is ValueObject<Props> {
  return value instanceof ValueObject
}

export function isAggregateRoot<ID>(value: unknown): value is AggregateRoot<ID> {
  return value instanceof AggregateRoot
}

// 使用类型守卫
function processValue(value: unknown): void {
  if (isEntity(value)) {
    // TypeScript 知道 value 是 Entity
    console.log(value.id)
  } else if (isValueObject(value)) {
    // TypeScript 知道 value 是 ValueObject
    console.log(value.equals(other))
  }
}

// ✅ 自定义类型守卫
export function isDomainEvent(value: unknown): value is DomainEvent {
  return (
    typeof value === 'object' &&
    value !== null &&
    'eventId' in value &&
    'occurredOn' in value &&
    'aggregateId' in value
  )
}

// ❌ 坏的示例：使用类型断言（不安全）
function processValue(value: unknown): void {
  // 危险：如果 value 不是 Entity 会导致运行时错误
  const entity = value as Entity<string>
  console.log(entity.id)
}
```

### 何时使用类型断言

只在以下情况使用类型断言：

1. 你比 TypeScript 更了解类型
2. 从外部获取的数据已经过验证
3. 使用非空断言 `!` 时确保值一定存在

```typescript
// ✅ 好的示例：合理使用类型断言
export class User extends Entity<string> {
  private _email: string | null = null

  setEmail(email: string): void {
    this._email = email
  }

  // 已经验证过 email 不为 null
  sendEmail(): void {
    if (!this._email) {
      throw new Error('邮箱未设置')
    }

    // 此时可以使用非空断言
    const email = this._email!
    this.sendEmailTo(email)
  }

  private sendEmailTo(email: string): void {
    // ...
  }
}

// ✅ 从已验证的 JSON 转换
interface UserJson {
  id: string
  name: string
  email: string
}

export function parseUser(json: string): User {
  const data = JSON.parse(json) as UserJson // 假设已经验证过格式

  return User.reconstitute({
    id: data.id,
    name: data.name,
    email: data.email
  })
}

// ❌ 坏的示例：滥用类型断言
function getUser(data: unknown): User {
  // 危险：未验证就断言
  return data as User
}
```

## 返回类型声明

### 必须明确声明返回类型

```typescript
// ✅ 好的示例：明确声明返回类型
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export class User extends Entity<string> {
  changeName(newName: string): void {
    this._name = newName
  }

  getName(): string {
    return this._name
  }

  async save(): Promise<void> {
    await this.repository.save(this)
  }
}

// ❌ 坏的示例：依赖类型推断
export function generateUUID() {
  // 返回类型不明确
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export class User extends Entity<string> {
  changeName(newName: string) {
    // 缺少返回类型
    this._name = newName
  }
}
```

### 为什么要明确声明返回类型？

1. **更好的文档** - 代码即文档
2. **类型检查** - 确保返回值符合预期
3. **IDE 支持** - 更好的代码提示
4. **重构安全** - 防止意外更改返回类型

```typescript
// ✅ 明确返回类型能捕获错误
export function getTotal(): number {
  // 错误：返回类型不匹配
  return '100' // Type 'string' is not assignable to type 'number'
}

// ❌ 没有返回类型，错误被忽略
export function getTotal() {
  return '100' // 不会报错，但运行时可能出问题
}
```

## 避免 Any，使用 Unknown

### 使用 unknown 代替 any

```typescript
// ✅ 好的示例：使用 unknown
export function parseJSON(json: string): unknown {
  return JSON.parse(json)
}

// 使用时必须进行类型检查
const data = parseJSON('{"name":"Alice"}')

if (typeof data === 'object' && data !== null && 'name' in data) {
  const name = (data as { name: string }).name
  console.log(name)
}

// ❌ 坏的示例：使用 any
export function parseJSON(json: string): any {
  return JSON.parse(json)
}

// 使用时没有类型安全
const data = parseJSON('{"name":"Alice"}')
console.log(data.name) // 没有类型检查，可能运行时错误
console.log(data.age) // 不存在的属性也不会报错
```

### 何时使用 any？

只在以下极少数情况使用 `any`：

1. 与无类型的第三方库交互
2. 复杂的类型操作无法表达
3. 临时的原型开发（记得标注 TODO）

```typescript
// ✅ 极少数情况可以使用 any
declare function legacyFunction(): any // 第三方库无类型定义

// ❌ 不应该使用 any
export function processData(data: any): any {
  // 应该定义具体类型
  return data
}
```

## 实用工具类型

### 常用内置工具类型

```typescript
// ✅ Partial - 所有属性变为可选
interface User {
  id: string
  name: string
  email: string
}

type PartialUser = Partial<User>
// { id?: string; name?: string; email?: string }

function updateUser(id: string, updates: Partial<User>): void {
  // 可以只更新部分字段
}

// ✅ Required - 所有属性变为必需
interface UserOptions {
  id?: string
  name?: string
}

type RequiredUserOptions = Required<UserOptions>
// { id: string; name: string }

// ✅ Readonly - 所有属性变为只读
type ReadonlyUser = Readonly<User>
// { readonly id: string; readonly name: string; readonly email: string }

// ✅ Pick - 选择部分属性
type UserBasicInfo = Pick<User, 'id' | 'name'>
// { id: string; name: string }

// ✅ Omit - 排除部分属性
type UserWithoutEmail = Omit<User, 'email'>
// { id: string; name: string }

// ✅ Record - 创建映射类型
type UserRoles = Record<string, User>
// { [key: string]: User }

type OrderStatusMap = Record<OrderStatus, string>
// { DRAFT: string; SUBMITTED: string; ... }

// ✅ Extract - 提取联合类型的子集
type Status = 'DRAFT' | 'SUBMITTED' | 'PAID' | 'SHIPPED'
type ActiveStatus = Extract<Status, 'SUBMITTED' | 'PAID' | 'SHIPPED'>
// 'SUBMITTED' | 'PAID' | 'SHIPPED'

// ✅ Exclude - 排除联合类型的子集
type NonDraftStatus = Exclude<Status, 'DRAFT'>
// 'SUBMITTED' | 'PAID' | 'SHIPPED'

// ✅ ReturnType - 获取函数返回类型
function createUser(): User {
  // ...
}

type UserType = ReturnType<typeof createUser>
// User

// ✅ Parameters - 获取函数参数类型
function updateUser(id: string, data: Partial<User>): void {
  // ...
}

type UpdateUserParams = Parameters<typeof updateUser>
// [id: string, data: Partial<User>]
```

### 自定义工具类型

```typescript
// ✅ 好的示例：自定义工具类型
/**
 * 使指定属性变为可选
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

interface User {
  id: string
  name: string
  email: string
}

// id 必需，name 和 email 可选
type CreateUserInput = Optional<User, 'name' | 'email'>
// { id: string; name?: string; email?: string }

/**
 * 使指定属性变为必需
 */
export type RequiredKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

interface UserOptions {
  id?: string
  name?: string
  email?: string
}

// name 必需，其他可选
type UserWithName = RequiredKeys<UserOptions, 'name'>
// { id?: string; name: string; email?: string }

/**
 * 深度部分类型
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * 函数类型提取
 */
export type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never
}[keyof T]

export type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>

// 提取所有方法
type UserMethods = FunctionProperties<User>
```

## 代码示例对比

### 好的示例：完整的类型安全实现

```typescript
/**
 * 邮箱值对象 - 展示最佳实践
 */
interface EmailProps {
  readonly value: string
}

export class Email extends ValueObject<EmailProps> {
  // 明确的返回类型
  get value(): string {
    return this.props.value
  }

  // private 构造函数
  private constructor(props: EmailProps) {
    super(props)
  }

  // 静态工厂方法，明确返回类型
  static create(email: string): Email {
    // 参数验证
    if (!email || email.trim().length === 0) {
      throw new Error('邮箱不能为空')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('邮箱格式无效')
    }

    return new Email({ value: email.toLowerCase().trim() })
  }

  // 类型守卫
  static isEmail(value: unknown): value is Email {
    return value instanceof Email
  }

  // 明确的返回类型
  toString(): string {
    return this.value
  }
}

/**
 * 用户实体 - 展示最佳实践
 */
export class User extends Entity<string> {
  // private 属性，使用 readonly 保证 ID 不可变
  private _name: string
  private _email: Email
  private readonly _createdAt: Date
  private _updatedAt: Date

  // private 构造函数
  private constructor(id: string, name: string, email: Email, createdAt: Date, updatedAt: Date) {
    super(id)
    this._name = name
    this._email = email
    this._createdAt = createdAt
    this._updatedAt = updatedAt
  }

  // 公共 getter，明确返回类型
  get name(): string {
    return this._name
  }

  get email(): Email {
    return this._email
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  // 静态工厂方法，明确返回类型
  static create(props: { name: string; email: string }): User {
    const id = generateUUID()
    const email = Email.create(props.email)
    const now = new Date()

    return new User(id, props.name, email, now, now)
  }

  // 业务方法，明确返回类型
  changeName(newName: string): void {
    if (newName.length < 2 || newName.length > 50) {
      throw new Error('名称长度必须在 2-50 字符之间')
    }
    this._name = newName
    this._updatedAt = new Date()
  }

  changeEmail(newEmail: string): void {
    const email = Email.create(newEmail)
    if (this._email.equals(email)) {
      return
    }
    this._email = email
    this._updatedAt = new Date()
  }
}
```

### 坏的示例：缺乏类型安全

```typescript
// ❌ 坏的示例：类型不安全的实现
export class Email {
  public value: any // 应该是 string，不应该用 any

  constructor(email) {
    // 缺少类型注解
    this.value = email // 没有验证
  }

  getValue() {
    // 缺少返回类型
    return this.value
  }
}

export class User {
  public id // 缺少类型注解
  public name // 缺少类型注解
  public email // 缺少类型注解

  constructor(id, name, email) {
    // 缺少类型注解
    this.id = id
    this.name = name
    this.email = email
  }

  changeName(newName) {
    // 缺少类型注解和返回类型
    this.name = newName
  }
}
```

## 总结

### 核心原则

1. **类型优先** - 明确定义所有类型
2. **类型安全** - 避免 any，使用 unknown
3. **不可变性** - 使用 readonly 保护数据
4. **有意义的命名** - 泛型参数要清晰
5. **访问控制** - 合理使用访问修饰符

### 检查清单

在编写代码前，检查：

- [ ] 所有函数都有明确的返回类型
- [ ] 所有参数都有类型注解
- [ ] 不可变的属性使用 readonly
- [ ] 使用 interface 定义对象形状
- [ ] 使用 type 定义联合类型和复杂类型
- [ ] 泛型参数名有意义
- [ ] 访问修饰符使用正确（public/protected/private）
- [ ] 没有使用 any（除非必要）
- [ ] 使用类型守卫而非类型断言

遵循这些 TypeScript 规范，充分利用类型系统，构建类型安全的 DDD 框架。
