# Forge DDD 模式实现规范

## Entity（实体）模式

### 定义

实体是具有唯一标识符的领域对象，其身份在整个生命周期内保持不变。即使属性发生变化，只要标识符相同，就认为是同一个实体。

### 关键特性

1. **唯一标识符** - 每个实体都有一个唯一的 ID
2. **身份一致性** - 生命周期内身份不变
3. **可变性** - 属性可以改变
4. **相等性比较** - 通过 ID 判断相等，而非属性
5. **生命周期** - 有创建、修改、删除的完整生命周期

### 实现要点

#### 1. 必须有唯一标识符

```typescript
// ✅ 好的示例：实体有明确的 ID
export abstract class Entity<ID> {
  protected readonly _id: ID

  protected constructor(id: ID) {
    this._id = id
  }

  /**
   * 获取实体的唯一标识符
   */
  get id(): ID {
    return this._id
  }

  /**
   * 判断两个实体是否相等（通过 ID）
   */
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

// ❌ 坏的示例：没有 ID
class User {
  constructor(
    private name: string,
    private email: string
  ) {}
}
```

#### 2. ID 应该是不可变的

```typescript
// ✅ 好的示例：ID 使用 readonly
export class User extends Entity<string> {
  private _name: string
  private _email: string

  private constructor(id: string, name: string, email: string) {
    super(id) // ID 传给父类，成为 readonly
    this._name = name
    this._email = email
  }

  static create(props: { name: string; email: string }): User {
    const id = generateUUID()
    return new User(id, props.name, props.email)
  }

  // ID 只有 getter，没有 setter
  get name(): string {
    return this._name
  }

  // 业务行为可以修改属性
  changeName(newName: string): void {
    if (newName.length < 2) {
      throw new Error('名称至少需要2个字符')
    }
    this._name = newName
  }
}

// ❌ 坏的示例：ID 可以被修改
export class User extends Entity<string> {
  private id: string // 不是 readonly

  setId(newId: string): void {
    // 不应该允许修改 ID
    this.id = newId
  }
}
```

#### 3. 通过工厂方法或构造函数创建

```typescript
// ✅ 好的示例：使用静态工厂方法
export class Order extends Entity<string> {
  private _customerId: string
  private _items: OrderItem[] = []
  private _status: OrderStatus

  // 私有构造函数，强制使用工厂方法
  private constructor(id: string, customerId: string, status: OrderStatus = OrderStatus.DRAFT) {
    super(id)
    this._customerId = customerId
    this._status = status
  }

  /**
   * 创建新订单
   */
  static create(customerId: string): Order {
    if (!customerId) {
      throw new Error('客户 ID 不能为空')
    }
    const id = generateUUID()
    return new Order(id, customerId)
  }

  /**
   * 从持久化存储重建订单
   */
  static reconstitute(props: {
    id: string
    customerId: string
    items: OrderItem[]
    status: OrderStatus
  }): Order {
    const order = new Order(props.id, props.customerId, props.status)
    order._items = props.items
    return order
  }
}

// ❌ 坏的示例：公开构造函数，无验证
export class Order extends Entity<string> {
  public items: OrderItem[] = []
  public status: OrderStatus

  constructor(
    public id: string, // 公开可写
    public customerId: string
  ) {
    super(id)
    // 没有验证逻辑
  }
}
```

#### 4. 封装业务逻辑

```typescript
// ✅ 好的示例：业务逻辑在实体内部
export class ShoppingCart extends Entity<string> {
  private items: Map<string, CartItem> = new Map()

  addItem(productId: string, quantity: number, price: number): void {
    if (quantity <= 0) {
      throw new Error('数量必须大于0')
    }

    const existingItem = this.items.get(productId)

    if (existingItem) {
      // 业务规则：合并相同商品
      existingItem.increaseQuantity(quantity)
    } else {
      // 业务规则：检查购物车容量
      if (this.items.size >= 50) {
        throw new Error('购物车已满，最多50种商品')
      }
      this.items.set(productId, new CartItem(productId, quantity, price))
    }
  }

  removeItem(productId: string): void {
    if (!this.items.has(productId)) {
      throw new Error('商品不在购物车中')
    }
    this.items.delete(productId)
  }

  calculateTotal(): number {
    let total = 0
    for (const item of this.items.values()) {
      total += item.subtotal
    }
    return total
  }

  clear(): void {
    this.items.clear()
  }
}

// ❌ 坏的示例：贫血模型，没有业务逻辑
export class ShoppingCart extends Entity<string> {
  public items: CartItem[] = [] // 公开数据

  // 没有业务逻辑，只是数据容器
}

// 业务逻辑在外部（Service 层）
class CartService {
  addItem(cart: ShoppingCart, productId: string, quantity: number): void {
    // 业务逻辑不应该在这里
    const item = new CartItem(productId, quantity, 0)
    cart.items.push(item)
  }
}
```

### 完整示例

```typescript
/**
 * 用户实体
 *
 * 业务规则：
 * - 用户名长度 2-50 字符
 * - 邮箱必须有效
 * - 用户可以激活/停用
 * - 用户可以更改邮箱（需要验证）
 */
export class User extends Entity<string> {
  private _name: string
  private _email: string
  private _isActive: boolean
  private _createdAt: Date
  private _updatedAt: Date

  private constructor(
    id: string,
    name: string,
    email: string,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date
  ) {
    super(id)
    this._name = name
    this._email = email
    this._isActive = isActive
    this._createdAt = createdAt
    this._updatedAt = updatedAt
  }

  // Getters
  get name(): string {
    return this._name
  }

  get email(): string {
    return this._email
  }

  get isActive(): boolean {
    return this._isActive
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  /**
   * 创建新用户
   */
  static create(props: { name: string; email: string }): User {
    // 验证
    if (props.name.length < 2 || props.name.length > 50) {
      throw new Error('用户名长度必须在 2-50 字符之间')
    }
    if (!props.email.includes('@')) {
      throw new Error('邮箱格式无效')
    }

    const now = new Date()
    const id = generateUUID()

    return new User(id, props.name, props.email, true, now, now)
  }

  /**
   * 从存储重建用户
   */
  static reconstitute(props: {
    id: string
    name: string
    email: string
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  }): User {
    return new User(
      props.id,
      props.name,
      props.email,
      props.isActive,
      props.createdAt,
      props.updatedAt
    )
  }

  /**
   * 更改用户名
   */
  changeName(newName: string): void {
    if (newName.length < 2 || newName.length > 50) {
      throw new Error('用户名长度必须在 2-50 字符之间')
    }
    this._name = newName
    this._updatedAt = new Date()
  }

  /**
   * 更改邮箱
   */
  changeEmail(newEmail: string): void {
    if (!newEmail.includes('@')) {
      throw new Error('邮箱格式无效')
    }
    if (this._email === newEmail) {
      return // 邮箱未变化
    }
    this._email = newEmail
    this._updatedAt = new Date()
  }

  /**
   * 激活用户
   */
  activate(): void {
    if (this._isActive) {
      throw new Error('用户已经是激活状态')
    }
    this._isActive = true
    this._updatedAt = new Date()
  }

  /**
   * 停用用户
   */
  deactivate(): void {
    if (!this._isActive) {
      throw new Error('用户已经是停用状态')
    }
    this._isActive = false
    this._updatedAt = new Date()
  }
}
```

## ValueObject（值对象）模式

### 定义

值对象是通过其属性值定义的对象，没有唯一标识符。两个值对象如果所有属性都相同，则认为它们相等。

### 关键特性

1. **不可变性** - 创建后不能修改
2. **值相等** - 通过值判断相等，而非引用
3. **无标识符** - 不需要唯一 ID
4. **可替换性** - 可以用另一个值相同的对象替换
5. **自我验证** - 创建时验证有效性

### 实现要点

#### 1. 使用 Object.freeze 确保不可变性

```typescript
// ✅ 好的示例：不可变的值对象
export abstract class ValueObject<Props> {
  protected readonly props: Props

  protected constructor(props: Props) {
    // 冻结属性，防止修改
    this.props = Object.freeze({ ...props })
  }

  /**
   * 通过值判断相等性
   */
  equals(other: ValueObject<Props>): boolean {
    if (other === null || other === undefined) {
      return false
    }
    if (other.constructor !== this.constructor) {
      return false
    }
    return JSON.stringify(this.props) === JSON.stringify(other.props)
  }
}

// ❌ 坏的示例：可变的值对象
export class Money {
  constructor(
    public amount: number, // 公开可写
    public currency: string
  ) {}

  // 错误：修改了自身
  add(other: Money): void {
    this.amount += other.amount
  }
}
```

#### 2. 在构造函数中验证

```typescript
// ✅ 好的示例：创建时验证
interface EmailProps {
  value: string
}

export class Email extends ValueObject<EmailProps> {
  get value(): string {
    return this.props.value
  }

  private constructor(props: EmailProps) {
    super(props)
  }

  /**
   * 创建邮箱值对象
   */
  static create(email: string): Email {
    // 验证规则
    if (!email || email.trim().length === 0) {
      throw new Error('邮箱不能为空')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('邮箱格式无效')
    }

    return new Email({ value: email.toLowerCase().trim() })
  }
}

// ❌ 坏的示例：没有验证
export class Email extends ValueObject<EmailProps> {
  constructor(value: string) {
    super({ value }) // 直接接受任何字符串
  }
}
```

#### 3. 操作返回新对象

```typescript
// ✅ 好的示例：操作返回新对象
interface MoneyProps {
  amount: number
  currency: string
}

export class Money extends ValueObject<MoneyProps> {
  get amount(): number {
    return this.props.amount
  }

  get currency(): string {
    return this.props.currency
  }

  private constructor(props: MoneyProps) {
    super(props)
  }

  static create(amount: number, currency: string): Money {
    if (amount < 0) {
      throw new Error('金额不能为负数')
    }
    if (!currency || currency.length !== 3) {
      throw new Error('货币代码必须是3个字符')
    }
    return new Money({ amount, currency: currency.toUpperCase() })
  }

  /**
   * 加法 - 返回新的 Money 对象
   */
  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('不能对不同货币进行运算')
    }
    return Money.create(this.amount + other.amount, this.currency)
  }

  /**
   * 减法 - 返回新的 Money 对象
   */
  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('不能对不同货币进行运算')
    }
    const result = this.amount - other.amount
    if (result < 0) {
      throw new Error('结果不能为负数')
    }
    return Money.create(result, this.currency)
  }

  /**
   * 乘法 - 返回新的 Money 对象
   */
  multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('乘数不能为负数')
    }
    return Money.create(this.amount * factor, this.currency)
  }
}

// ❌ 坏的示例：修改自身
export class Money extends ValueObject<MoneyProps> {
  add(other: Money): void {
    this.props.amount += other.amount // 错误：修改了自身
  }
}
```

### 完整示例

```typescript
/**
 * 地址值对象
 *
 * 业务规则：
 * - 地址组件都不能为空
 * - 邮编必须是6位数字
 * - 地址一旦创建不可修改
 */
interface AddressProps {
  province: string
  city: string
  district: string
  street: string
  zipCode: string
}

export class Address extends ValueObject<AddressProps> {
  get province(): string {
    return this.props.province
  }

  get city(): string {
    return this.props.city
  }

  get district(): string {
    return this.props.district
  }

  get street(): string {
    return this.props.street
  }

  get zipCode(): string {
    return this.props.zipCode
  }

  private constructor(props: AddressProps) {
    super(props)
  }

  /**
   * 创建地址值对象
   */
  static create(props: {
    province: string
    city: string
    district: string
    street: string
    zipCode: string
  }): Address {
    // 验证所有字段
    if (!props.province?.trim()) {
      throw new Error('省份不能为空')
    }
    if (!props.city?.trim()) {
      throw new Error('城市不能为空')
    }
    if (!props.district?.trim()) {
      throw new Error('区县不能为空')
    }
    if (!props.street?.trim()) {
      throw new Error('街道地址不能为空')
    }

    // 验证邮编格式
    const zipCodeRegex = /^\d{6}$/
    if (!zipCodeRegex.test(props.zipCode)) {
      throw new Error('邮编必须是6位数字')
    }

    return new Address({
      province: props.province.trim(),
      city: props.city.trim(),
      district: props.district.trim(),
      street: props.street.trim(),
      zipCode: props.zipCode
    })
  }

  /**
   * 获取完整地址字符串
   */
  toString(): string {
    return `${this.province}${this.city}${this.district}${this.street} (${this.zipCode})`
  }

  /**
   * 判断是否在同一城市
   */
  isSameCityAs(other: Address): boolean {
    return this.province === other.province && this.city === other.city
  }
}
```

## AggregateRoot（聚合根）模式

### 定义

聚合根是一组相关对象的根实体，作为事务边界和一致性边界。所有对聚合内对象的访问都必须通过聚合根。

### 关键特性

1. **事务边界** - 聚合内的修改在一个事务中
2. **一致性保证** - 维护聚合内的业务不变量
3. **对外接口** - 只暴露必要的操作
4. **领域事件** - 发布领域事件通知外部
5. **生命周期管理** - 管理聚合内所有对象的生命周期

### 实现要点

#### 1. 继承自 Entity，添加事件管理

```typescript
// ✅ 好的示例：聚合根基类
export abstract class AggregateRoot<ID> extends Entity<ID> {
  private domainEvents: DomainEvent[] = []

  /**
   * 添加领域事件
   */
  protected addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event)
  }

  /**
   * 获取所有未提交的领域事件
   */
  getDomainEvents(): ReadonlyArray<DomainEvent> {
    return [...this.domainEvents]
  }

  /**
   * 清除所有领域事件
   */
  clearDomainEvents(): void {
    this.domainEvents = []
  }
}

// ❌ 坏的示例：直接继承 Entity，没有事件支持
export class Order extends Entity<string> {
  // 没有事件管理能力
}
```

#### 2. 保护聚合内部对象

```typescript
// ✅ 好的示例：聚合根保护内部对象
export class Order extends AggregateRoot<string> {
  private items: OrderItem[] = [] // 私有，不可直接访问
  private status: OrderStatus

  /**
   * 添加订单项 - 通过聚合根操作
   */
  addItem(productId: string, quantity: number, price: number): void {
    // 验证业务规则
    if (this.status !== OrderStatus.DRAFT) {
      throw new Error('只有草稿订单可以添加商品')
    }

    if (quantity <= 0) {
      throw new Error('数量必须大于0')
    }

    // 查找是否已存在
    const existingItem = this.items.find(item => item.productId === productId)

    if (existingItem) {
      existingItem.increaseQuantity(quantity)
    } else {
      const item = OrderItem.create(productId, quantity, price)
      this.items.push(item)
    }

    // 发布领域事件
    this.addDomainEvent(new ItemAddedToOrderEvent(this.id, productId, quantity))
  }

  /**
   * 获取订单项（返回副本，防止外部修改）
   */
  getItems(): ReadonlyArray<OrderItem> {
    return [...this.items]
  }

  /**
   * 计算总价
   */
  calculateTotal(): Money {
    return this.items.reduce((total, item) => total.add(item.subtotal), Money.create(0, 'CNY'))
  }
}

// ❌ 坏的示例：暴露内部对象
export class Order extends AggregateRoot<string> {
  public items: OrderItem[] = [] // 公开，破坏封装

  // 外部可以直接操作
  // order.items.push(new OrderItem(...))  // 绕过业务规则
}
```

#### 3. 维护业务不变量

```typescript
// ✅ 好的示例：聚合根维护一致性
export class Order extends AggregateRoot<string> {
  private items: OrderItem[] = []
  private status: OrderStatus
  private customerId: string

  private constructor(id: string, customerId: string, status: OrderStatus = OrderStatus.DRAFT) {
    super(id)
    this.customerId = customerId
    this.status = status
  }

  static create(customerId: string): Order {
    if (!customerId) {
      throw new Error('客户ID不能为空')
    }
    const id = generateUUID()
    const order = new Order(id, customerId)

    // 发布创建事件
    order.addDomainEvent(new OrderCreatedEvent(id, customerId))
    return order
  }

  /**
   * 提交订单 - 维护业务不变量
   */
  submit(): void {
    // 不变量1：订单必须有商品
    if (this.items.length === 0) {
      throw new Error('订单必须包含至少一个商品')
    }

    // 不变量2：只有草稿状态可以提交
    if (this.status !== OrderStatus.DRAFT) {
      throw new Error('只有草稿订单可以提交')
    }

    // 不变量3：所有商品数量必须大于0
    const hasInvalidItem = this.items.some(item => item.quantity <= 0)
    if (hasInvalidItem) {
      throw new Error('所有商品数量必须大于0')
    }

    this.status = OrderStatus.SUBMITTED
    this.addDomainEvent(new OrderSubmittedEvent(this.id, this.calculateTotal()))
  }

  /**
   * 取消订单
   */
  cancel(): void {
    // 业务规则：已支付的订单不能取消
    if (this.status === OrderStatus.PAID || this.status === OrderStatus.SHIPPED) {
      throw new Error('已支付或已发货的订单不能取消')
    }

    if (this.status === OrderStatus.CANCELLED) {
      throw new Error('订单已经是取消状态')
    }

    this.status = OrderStatus.CANCELLED
    this.addDomainEvent(new OrderCancelledEvent(this.id))
  }
}

// ❌ 坏的示例：不维护一致性
export class Order extends AggregateRoot<string> {
  public status: OrderStatus

  submit(): void {
    this.status = OrderStatus.SUBMITTED // 没有验证业务规则
  }
}
```

### 完整示例

```typescript
/**
 * 订单聚合根
 *
 * 业务规则：
 * - 订单必须属于一个客户
 * - 订单必须包含至少一个商品才能提交
 * - 只有草稿状态的订单可以修改
 * - 已支付/已发货的订单不能取消
 * - 订单状态变化会发布领域事件
 */

enum OrderStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  PAID = 'PAID',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export class Order extends AggregateRoot<string> {
  private customerId: string
  private items: OrderItem[] = []
  private status: OrderStatus
  private shippingAddress: Address | null = null
  private createdAt: Date
  private updatedAt: Date

  private constructor(
    id: string,
    customerId: string,
    status: OrderStatus,
    createdAt: Date,
    updatedAt: Date
  ) {
    super(id)
    this.customerId = customerId
    this.status = status
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }

  // Getters
  get getCustomerId(): string {
    return this.customerId
  }

  get getStatus(): OrderStatus {
    return this.status
  }

  get getShippingAddress(): Address | null {
    return this.shippingAddress
  }

  /**
   * 创建新订单
   */
  static create(customerId: string): Order {
    if (!customerId) {
      throw new Error('客户ID不能为空')
    }

    const id = generateUUID()
    const now = new Date()
    const order = new Order(id, customerId, OrderStatus.DRAFT, now, now)

    order.addDomainEvent(new OrderCreatedEvent(id, customerId, now))
    return order
  }

  /**
   * 从存储重建订单
   */
  static reconstitute(props: {
    id: string
    customerId: string
    items: OrderItem[]
    status: OrderStatus
    shippingAddress: Address | null
    createdAt: Date
    updatedAt: Date
  }): Order {
    const order = new Order(
      props.id,
      props.customerId,
      props.status,
      props.createdAt,
      props.updatedAt
    )
    order.items = props.items
    order.shippingAddress = props.shippingAddress
    return order
  }

  /**
   * 添加订单项
   */
  addItem(productId: string, quantity: number, price: Money): void {
    this.ensureIsDraft()

    if (quantity <= 0) {
      throw new Error('数量必须大于0')
    }

    const existingItem = this.items.find(item => item.productId === productId)

    if (existingItem) {
      existingItem.increaseQuantity(quantity)
    } else {
      this.items.push(OrderItem.create(productId, quantity, price))
    }

    this.updatedAt = new Date()
    this.addDomainEvent(new ItemAddedToOrderEvent(this.id, productId, quantity))
  }

  /**
   * 移除订单项
   */
  removeItem(productId: string): void {
    this.ensureIsDraft()

    const index = this.items.findIndex(item => item.productId === productId)
    if (index === -1) {
      throw new Error('商品不在订单中')
    }

    this.items.splice(index, 1)
    this.updatedAt = new Date()
    this.addDomainEvent(new ItemRemovedFromOrderEvent(this.id, productId))
  }

  /**
   * 设置收货地址
   */
  setShippingAddress(address: Address): void {
    this.ensureIsDraft()
    this.shippingAddress = address
    this.updatedAt = new Date()
  }

  /**
   * 提交订单
   */
  submit(): void {
    this.ensureIsDraft()

    if (this.items.length === 0) {
      throw new Error('订单必须包含至少一个商品')
    }

    if (!this.shippingAddress) {
      throw new Error('必须设置收货地址')
    }

    this.status = OrderStatus.SUBMITTED
    this.updatedAt = new Date()
    this.addDomainEvent(new OrderSubmittedEvent(this.id, this.calculateTotal()))
  }

  /**
   * 支付订单
   */
  pay(): void {
    if (this.status !== OrderStatus.SUBMITTED) {
      throw new Error('只有已提交的订单可以支付')
    }

    this.status = OrderStatus.PAID
    this.updatedAt = new Date()
    this.addDomainEvent(new OrderPaidEvent(this.id, this.calculateTotal()))
  }

  /**
   * 发货
   */
  ship(): void {
    if (this.status !== OrderStatus.PAID) {
      throw new Error('只有已支付的订单可以发货')
    }

    this.status = OrderStatus.SHIPPED
    this.updatedAt = new Date()
    this.addDomainEvent(new OrderShippedEvent(this.id))
  }

  /**
   * 取消订单
   */
  cancel(): void {
    if (this.status === OrderStatus.PAID || this.status === OrderStatus.SHIPPED) {
      throw new Error('已支付或已发货的订单不能取消')
    }

    if (this.status === OrderStatus.CANCELLED) {
      throw new Error('订单已经是取消状态')
    }

    this.status = OrderStatus.CANCELLED
    this.updatedAt = new Date()
    this.addDomainEvent(new OrderCancelledEvent(this.id))
  }

  /**
   * 计算订单总价
   */
  calculateTotal(): Money {
    if (this.items.length === 0) {
      return Money.create(0, 'CNY')
    }

    return this.items.reduce((total, item) => total.add(item.getSubtotal()), Money.create(0, 'CNY'))
  }

  /**
   * 获取订单项（只读副本）
   */
  getItems(): ReadonlyArray<OrderItem> {
    return [...this.items]
  }

  /**
   * 确保订单是草稿状态
   */
  private ensureIsDraft(): void {
    if (this.status !== OrderStatus.DRAFT) {
      throw new Error('只有草稿订单可以修改')
    }
  }
}

/**
 * 订单项（聚合内部实体）
 */
class OrderItem extends Entity<string> {
  private _productId: string
  private _quantity: number
  private _price: Money

  private constructor(id: string, productId: string, quantity: number, price: Money) {
    super(id)
    this._productId = productId
    this._quantity = quantity
    this._price = price
  }

  static create(productId: string, quantity: number, price: Money): OrderItem {
    const id = generateUUID()
    return new OrderItem(id, productId, quantity, price)
  }

  get productId(): string {
    return this._productId
  }

  get quantity(): number {
    return this._quantity
  }

  get price(): Money {
    return this._price
  }

  increaseQuantity(amount: number): void {
    if (amount <= 0) {
      throw new Error('数量必须大于0')
    }
    this._quantity += amount
  }

  decreaseQuantity(amount: number): void {
    if (amount <= 0) {
      throw new Error('数量必须大于0')
    }
    if (this._quantity - amount < 0) {
      throw new Error('数量不能为负数')
    }
    this._quantity -= amount
  }

  getSubtotal(): Money {
    return this._price.multiply(this._quantity)
  }
}
```

## Repository（仓储）模式

### 定义

仓储是聚合根的持久化抽象，提供类似集合的接口来访问聚合根。

### 关键特性

1. **面向聚合根** - 只为聚合根创建仓储
2. **抽象持久化** - 领域层不关心存储细节
3. **集合语义** - 类似操作内存集合
4. **返回领域对象** - 返回完整的聚合根
5. **接口定义在领域层** - 实现在基础设施层

### 实现要点

```typescript
// ✅ 好的示例：Repository 接口
/**
 * 仓储接口
 *
 * @template T 聚合根类型
 * @template ID 聚合根ID类型
 */
export interface Repository<T extends AggregateRoot<ID>, ID> {
  /**
   * 根据 ID 查找聚合根
   */
  findById(id: ID): Promise<T | null>

  /**
   * 保存聚合根
   */
  save(aggregate: T): Promise<void>

  /**
   * 删除聚合根
   */
  delete(id: ID): Promise<void>
}

/**
 * 订单仓储接口
 */
export interface OrderRepository extends Repository<Order, string> {
  /**
   * 根据客户ID查找订单
   */
  findByCustomerId(customerId: string): Promise<Order[]>

  /**
   * 查找指定状态的订单
   */
  findByStatus(status: OrderStatus): Promise<Order[]>
}

// ❌ 坏的示例：暴露存储细节
export interface OrderRepository {
  executeQuery(sql: string): Promise<any[]> // 暴露 SQL
  getCollection(): Collection // 暴露 MongoDB
  save(data: any): Promise<void> // 接受任意数据
}
```

### 完整示例

```typescript
/**
 * 用户仓储接口（领域层）
 */
export interface UserRepository extends Repository<User, string> {
  /**
   * 根据邮箱查找用户
   */
  findByEmail(email: Email): Promise<User | null>

  /**
   * 查找所有激活用户
   */
  findActiveUsers(): Promise<User[]>

  /**
   * 检查邮箱是否已存在
   */
  existsByEmail(email: Email): Promise<boolean>
}

/**
 * 内存实现（基础设施层 - 用于测试）
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

  async findActiveUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.isActive)
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
}
```

## DomainEvent（领域事件）模式

### 定义

领域事件表示领域中发生的重要业务事实。

### 关键特性

1. **过去时命名** - 描述已发生的事情
2. **不可变** - 事件一旦发生不能修改
3. **包含关键信息** - 事件发生时间、聚合ID等
4. **解耦聚合** - 通过事件通信

### 实现要点

```typescript
// ✅ 好的示例：领域事件
/**
 * 领域事件基类
 */
export interface DomainEvent {
  readonly eventId: string
  readonly occurredOn: Date
  readonly aggregateId: string
}

/**
 * 订单已提交事件
 */
export class OrderSubmittedEvent implements DomainEvent {
  readonly eventId: string
  readonly occurredOn: Date
  readonly aggregateId: string
  readonly total: Money

  constructor(orderId: string, total: Money) {
    this.eventId = generateUUID()
    this.occurredOn = new Date()
    this.aggregateId = orderId
    this.total = total
  }
}

// ❌ 坏的示例：可变事件
export class OrderSubmittedEvent {
  public orderId: string // 可修改
  public total: number // 可修改

  constructor(orderId: string, total: number) {
    this.orderId = orderId
    this.total = total
    // 缺少时间戳
  }
}
```

## 总结

### 使用场景决策树

1. **需要唯一标识符？**
   - 是 → Entity 或 AggregateRoot
   - 否 → ValueObject

2. **需要管理其他对象？**
   - 是 → AggregateRoot
   - 否 → Entity

3. **需要持久化？**
   - 是 → 创建 Repository
   - 否 → 只在内存中使用

4. **需要通知其他聚合？**
   - 是 → 发布 DomainEvent
   - 否 → 直接调用

### 核心原则

1. **单一职责** - 每个模式解决特定问题
2. **封装性** - 保护业务不变量
3. **不可变性** - 优先使用不可变对象
4. **类型安全** - 利用 TypeScript 类型系统
5. **零依赖** - 保持领域层纯净
