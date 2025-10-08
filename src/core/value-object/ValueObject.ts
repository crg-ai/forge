import { deepFreeze } from '../../utils/deepFreeze'
import { deepEquals } from '../../utils/deepEquals'
import { deepClone } from '../../utils/deepClone'
import { Result } from '../shared/Result'

/**
 * 值对象（ValueObject）抽象基类 - DDD 战术模式的核心构建块
 *
 * 值对象是通过属性值定义的不可变对象，没有唯一标识符。它是 DDD 中表达领域概念的重要工具，
 * 用于封装验证逻辑、提升类型安全，并使业务规则显式化。
 *
 * ## 核心设计原则
 *
 * 1. **不可变性（Immutability）** - 创建后属性不可修改，操作返回新对象
 *    - 深度冻结所有属性（包括嵌套对象）
 *    - 构造时深度克隆，防止外部引用修改
 *    - 所有修改操作返回新实例
 *
 * 2. **值相等（Value Equality）** - 通过属性值判断相等性，而非引用
 *    - 深度比较所有属性值
 *    - 类型检查：不同类型的值对象永不相等
 *    - 适用于集合、比较、去重等场景
 *
 * 3. **自我验证（Self-Validation）** - 创建时验证，确保始终有效
 *    - 构造函数前置验证
 *    - 验证失败抛出异常
 *    - 对象存在即合法
 *
 * 4. **无标识符（No Identity）** - 不需要 ID，可完全替换
 *    - 值相同即可互换
 *    - 适合表达度量、描述、规格等概念
 *
 * ## ValueObject vs Entity vs 原始类型
 *
 * | 特性 | ValueObject | Entity | 原始类型 |
 * |------|------------|--------|---------|
 * | 标识符 | ❌ 无需ID | ✅ 必须有ID | ❌ 无 |
 * | 相等性 | 值相等 | ID相等 | 值相等 |
 * | 可变性 | 不可变 | 可变 | 可变 |
 * | 验证 | 创建时验证 | 可随时验证 | 无验证 |
 * | 替换性 | 可完全替换 | 不可替换 | 可替换 |
 * | 业务语义 | ✅ 有明确语义 | ✅ 有明确语义 | ❌ 语义模糊 |
 * | 类型安全 | ✅ 强类型 | ✅ 强类型 | ⚠️  弱类型 |
 *
 * ## 使用场景对比
 *
 * ### ✅ 何时使用 ValueObject
 *
 * - **度量和数量** - Money（金额+货币）、Temperature（温度+单位）、Weight
 * - **描述性信息** - Address、Email、PhoneNumber、URL
 * - **规格和配置** - Color、Size、ProductSpec、FilterCriteria
 * - **复合概念** - DateRange、TimeSlot、Coordinate（经纬度）
 * - **业务规则复杂** - 需要验证和领域逻辑的值
 *
 * ### ❌ 何时不使用 ValueObject（使用原始类型）
 *
 * - **简单标识符** - 用户名（仅字符串）、简单配置项
 * - **无验证需求** - 不需要业务规则校验的数据
 * - **临时变量** - 函数内部计算的中间值
 * - **性能关键路径** - 高频计算场景（值对象有轻微开销）
 *
 * ### ❌ 何时不使用 ValueObject（使用 Entity）
 *
 * - **需要跟踪身份** - User、Order、Product（需要区分不同实例）
 * - **需要修改** - 属性会随时间变化的对象
 * - **有生命周期** - 创建、更新、删除等状态变化
 *
 * ## 边界条件和规则
 *
 * - ✅ null/undefined 属性值允许存在（由子类验证逻辑决定是否接受）
 * - ✅ 空值对象通过 `isEmpty()` 判断（默认检查 null/undefined/空字符串）
 * - ✅ 相等性判断包含类型检查（`instanceof` + `constructor` 检查）
 * - ✅ 深度冻结防止嵌套对象被修改
 * - ✅ 深度克隆防止外部引用污染
 * - ✅ 深度比较支持复杂嵌套结构
 *
 * ## 性能考虑
 *
 * - **创建开销** - 深度克隆 + 深度冻结有轻微开销，适合中等频率操作
 * - **比较开销** - 深度比较复杂对象可能较慢，缓存 `hashCode()` 可优化
 * - **内存占用** - 不可变对象可能产生更多临时对象，现代 JS 引擎已优化
 *
 * @template Props - 值对象的属性类型，必须是 Record<string, any>
 *
 * @example 基本使用 - Email 值对象
 * ```typescript
 * interface EmailProps {
 *   value: string
 * }
 *
 * class Email extends ValueObject<EmailProps> {
 *   private constructor(props: EmailProps) {
 *     super(props)
 *   }
 *
 *   get value(): string {
 *     return this.props.value
 *   }
 *
 *   // 静态工厂方法（推荐模式）
 *   static create(value: string): Result<Email, string> {
 *     // 验证逻辑
 *     if (!value || !value.includes('@')) {
 *       return Result.fail('Invalid email address')
 *     }
 *
 *     // 标准化处理
 *     const normalized = value.toLowerCase().trim()
 *     return Result.ok(new Email({ value: normalized }))
 *   }
 *
 *   // 验证方法（必须实现）
 *   protected validate(props: EmailProps): void {
 *     if (!props.value || !props.value.includes('@')) {
 *       throw new Error('Invalid email address')
 *     }
 *   }
 * }
 *
 * // 使用
 * const emailResult = Email.create('USER@EXAMPLE.COM')
 * if (emailResult.isSuccess) {
 *   const email = emailResult.value
 *   console.log(email.value) // 'user@example.com' (已标准化)
 *
 *   // 不可变性
 *   // email.props.value = 'hacked' // ❌ 运行时错误（已冻结）
 * }
 * ```
 *
 * @example 电商场景 - Money 值对象
 * ```typescript
 * interface MoneyProps {
 *   amount: number
 *   currency: string
 * }
 *
 * class Money extends ValueObject<MoneyProps> {
 *   private constructor(props: MoneyProps) {
 *     super(props)
 *   }
 *
 *   get amount(): number {
 *     return this.props.amount
 *   }
 *
 *   get currency(): string {
 *     return this.props.currency
 *   }
 *
 *   static create(amount: number, currency: string): Result<Money, string> {
 *     if (amount < 0) {
 *       return Result.fail('Amount cannot be negative')
 *     }
 *     if (!['CNY', 'USD', 'EUR'].includes(currency)) {
 *       return Result.fail('Unsupported currency')
 *     }
 *     return Result.ok(new Money({ amount, currency }))
 *   }
 *
 *   protected validate(props: MoneyProps): void {
 *     if (props.amount < 0) {
 *       throw new Error('Amount cannot be negative')
 *     }
 *   }
 *
 *   // 操作返回新对象（不可变性）
 *   add(other: Money): Money {
 *     if (this.currency !== other.currency) {
 *       throw new Error('Cannot add different currencies')
 *     }
 *     return new Money({ amount: this.amount + other.amount, currency: this.currency })
 *   }
 *
 *   multiply(factor: number): Money {
 *     return new Money({ amount: this.amount * factor, currency: this.currency })
 *   }
 * }
 *
 * // 使用
 * const price = Money.create(100, 'CNY').value
 * const total = price.multiply(3) // 新对象，price 不变
 * console.log(total.amount) // 300
 * ```
 *
 * @example 社交场景 - Address 值对象
 * ```typescript
 * interface AddressProps {
 *   province: string
 *   city: string
 *   district: string
 *   street: string
 *   zipCode: string
 * }
 *
 * class Address extends ValueObject<AddressProps> {
 *   private constructor(props: AddressProps) {
 *     super(props)
 *   }
 *
 *   static create(props: Omit<AddressProps, 'zipCode'> & { zipCode?: string }): Result<Address, string> {
 *     // 验证
 *     if (!props.province || !props.city) {
 *       return Result.fail('Province and city are required')
 *     }
 *     if (props.zipCode && !/^\d{6}$/.test(props.zipCode)) {
 *       return Result.fail('Invalid zip code format (6 digits required)')
 *     }
 *
 *     return Result.ok(new Address({
 *       province: props.province.trim(),
 *       city: props.city.trim(),
 *       district: props.district?.trim() || '',
 *       street: props.street?.trim() || '',
 *       zipCode: props.zipCode || ''
 *     }))
 *   }
 *
 *   protected validate(props: AddressProps): void {
 *     if (!props.province || !props.city) {
 *       throw new Error('Province and city are required')
 *     }
 *   }
 *
 *   // 业务方法
 *   toString(): string {
 *     return `${this.props.province}${this.props.city}${this.props.district}${this.props.street}`
 *   }
 *
 *   isSameCityAs(other: Address): boolean {
 *     return this.props.province === other.props.province && this.props.city === other.props.city
 *   }
 * }
 * ```
 *
 * @example React 集成 - 表单值对象
 * ```typescript
 * // React Hook Form 集成
 * import { useForm } from 'react-hook-form'
 *
 * function UserForm() {
 *   const { register, handleSubmit, setError } = useForm()
 *
 *   const onSubmit = (data: any) => {
 *     // 使用值对象验证
 *     const emailResult = Email.create(data.email)
 *     if (emailResult.isFailure) {
 *       setError('email', { message: emailResult.error })
 *       return
 *     }
 *
 *     const phoneResult = PhoneNumber.create(data.phone)
 *     if (phoneResult.isFailure) {
 *       setError('phone', { message: phoneResult.error })
 *       return
 *     }
 *
 *     // 创建用户（类型安全）
 *     const user = User.create({
 *       email: emailResult.value,
 *       phone: phoneResult.value
 *     })
 *   }
 *
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       <input {...register('email')} />
 *       <input {...register('phone')} />
 *       <button type="submit">Submit</button>
 *     </form>
 *   )
 * }
 * ```
 *
 * @example Vue 集成 - Pinia Store
 * ```typescript
 * import { defineStore } from 'pinia'
 *
 * export const useCartStore = defineStore('cart', {
 *   state: () => ({
 *     items: [] as Array<{ product: string, price: Money, quantity: number }>
 *   }),
 *
 *   getters: {
 *     total(): Money {
 *       if (this.items.length === 0) {
 *         return Money.create(0, 'CNY').value
 *       }
 *
 *       return this.items.reduce((sum, item) => {
 *         const itemTotal = item.price.multiply(item.quantity)
 *         return sum.add(itemTotal)
 *       }, Money.create(0, 'CNY').value)
 *     }
 *   },
 *
 *   actions: {
 *     addItem(product: string, price: Money, quantity: number) {
 *       this.items.push({ product, price, quantity })
 *     }
 *   }
 * })
 * ```
 *
 * @example 高级用法 - 组合值对象
 * ```typescript
 * // 商品规格（组合多个值对象）
 * interface ProductSpecProps {
 *   color: Color
 *   size: Size
 *   material: Material
 * }
 *
 * class ProductSpec extends ValueObject<ProductSpecProps> {
 *   static create(props: ProductSpecProps): Result<ProductSpec, string> {
 *     return Result.ok(new ProductSpec(props))
 *   }
 *
 *   protected validate(props: ProductSpecProps): void {
 *     // 值对象已在创建时验证，这里无需额外验证
 *   }
 *
 *   matches(spec: ProductSpec): boolean {
 *     return this.equals(spec)
 *   }
 * }
 *
 * // 使用
 * const colorResult = Color.create('red')
 * const sizeResult = Size.create('L')
 * const materialResult = Material.create('cotton')
 *
 * const specResult = Result.combine([colorResult, sizeResult, materialResult])
 *   .map(([color, size, material]) => ProductSpec.create({ color, size, material }))
 *
 * if (specResult.isSuccess) {
 *   const spec = specResult.value
 *   // 类型安全的规格对象
 * }
 * ```
 *
 * @see {@link Entity} - 用于有唯一标识符的领域对象
 * @see {@link ValueObjectBuilder} - 用于构建复杂值对象
 * @see {@link Result} - 用于错误处理
 *
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class ValueObject<Props extends Record<string, any>> {
  protected readonly props: Props

  /**
   * 构造函数 - 验证、克隆、冻结属性
   *
   * 执行流程（不可变性三步骤）：
   * 1. **验证**：调用子类的 `validate()` 方法，验证失败抛出异常
   * 2. **深度克隆**：防止外部引用修改影响值对象
   * 3. **深度冻结**：确保对象及嵌套属性不可修改
   *
   * 为什么需要深度克隆：
   * ```typescript
   * const data = { value: { nested: 'test' } }
   * const vo = new ValueObject(data)
   * data.value.nested = 'hacked' // 如果不克隆，会影响 vo
   * ```
   *
   * 为什么需要深度冻结：
   * ```typescript
   * const vo = new ValueObject({ value: { nested: 'test' } })
   * vo.props.value.nested = 'hacked' // 如果不冻结，可以修改
   * ```
   *
   * @param props - 值对象的属性
   * @throws 当验证失败时抛出错误（由子类的 validate 方法决定）
   * @throws 当 props 为 null 或 undefined 时抛出错误
   *
   * @example 正确使用（通过静态工厂方法）
   * ```typescript
   * class Email extends ValueObject<EmailProps> {
   *   private constructor(props: EmailProps) {
   *     super(props) // ✅ 私有构造函数，只能通过工厂方法创建
   *   }
   *
   *   static create(value: string): Result<Email, string> {
   *     if (!value.includes('@')) {
   *       return Result.fail('Invalid email')
   *     }
   *     return Result.ok(new Email({ value }))
   *   }
   *
   *   protected validate(props: EmailProps): void {
   *     if (!props.value.includes('@')) {
   *       throw new Error('Invalid email')
   *     }
   *   }
   * }
   *
   * // 使用
   * const email = Email.create('user@example.com') // ✅ 通过工厂方法
   * ```
   *
   * @example 不可变性验证
   * ```typescript
   * const money = Money.create(100, 'CNY').value
   *
   * // ❌ 以下操作都会失败
   * money.props.amount = 200                // TypeError: Cannot assign to read only property
   * Object.assign(money.props, { amount: 200 }) // 无效，对象已冻结
   * delete money.props.amount                // TypeError: Cannot delete property
   *
   * // ✅ 正确做法：创建新对象
   * const newMoney = Money.create(200, 'CNY').value
   * ```
   */
  protected constructor(props: Props) {
    // 先验证
    this.validate(props)

    // 深度克隆并冻结，确保不可变性
    this.props = deepFreeze(deepClone(props)) as Props
  }

  /**
   * 验证属性的有效性
   *
   * 子类必须实现此方法来定义验证规则。验证应该：
   * - 检查必填字段
   * - 验证格式（正则表达式、范围检查等）
   * - 验证业务规则（如金额不能为负、日期范围有效等）
   * - 失败时抛出描述性错误
   *
   * 验证时机：
   * - 构造函数中自动调用（创建时验证）
   * - `isValid()` 方法中调用（运行时检查）
   *
   * @param props - 要验证的属性
   * @throws 如果验证失败，抛出包含错误信息的 Error
   *
   * @example 简单验证
   * ```typescript
   * protected validate(props: EmailProps): void {
   *   if (!props.value) {
   *     throw new Error('Email cannot be empty')
   *   }
   *   if (!props.value.includes('@')) {
   *     throw new Error('Invalid email format')
   *   }
   * }
   * ```
   *
   * @example 复杂验证（多条规则）
   * ```typescript
   * protected validate(props: MoneyProps): void {
   *   const errors: string[] = []
   *
   *   if (props.amount < 0) {
   *     errors.push('Amount cannot be negative')
   *   }
   *   if (!Number.isFinite(props.amount)) {
   *     errors.push('Amount must be a finite number')
   *   }
   *   if (!props.currency) {
   *     errors.push('Currency is required')
   *   }
   *   if (props.currency && props.currency.length !== 3) {
   *     errors.push('Currency code must be 3 characters (ISO 4217)')
   *   }
   *
   *   if (errors.length > 0) {
   *     throw new Error(errors.join('; '))
   *   }
   * }
   * ```
   */
  protected abstract validate(props: Props): void

  /**
   * 判断两个值对象是否相等
   *
   * 值对象的相等性基于属性值，而非引用地址。使用深度比较算法，支持：
   * - 嵌套对象
   * - 数组
   * - Date、RegExp 等特殊类型
   * - null、undefined 处理
   *
   * 类型检查规则：
   * 1. null/undefined → 返回 false
   * 2. 不是 ValueObject 实例 → 返回 false
   * 3. 不同构造函数（不同类） → 返回 false
   * 4. 相同类且属性值相等 → 返回 true
   *
   * @param other - 要比较的值对象
   * @returns 如果值相等返回 true，否则返回 false
   *
   * @example 基本相等性
   * ```typescript
   * const email1 = Email.create('user@example.com').value
   * const email2 = Email.create('user@example.com').value
   * const email3 = Email.create('other@example.com').value
   *
   * console.log(email1.equals(email2)) // true（值相同）
   * console.log(email1 === email2)     // false（引用不同）
   * console.log(email1.equals(email3)) // false（值不同）
   * ```
   *
   * @example 类型安全检查
   * ```typescript
   * const email = Email.create('user@example.com').value
   * const phone = PhoneNumber.create('13800138000').value
   *
   * console.log(email.equals(phone))     // false（不同类型）
   * console.log(email.equals(null))      // false
   * console.log(email.equals(undefined)) // false
   * ```
   *
   * @example 复杂对象比较
   * ```typescript
   * const address1 = Address.create({
   *   province: 'Beijing',
   *   city: 'Beijing',
   *   district: 'Chaoyang',
   *   street: '123 Main St',
   *   zipCode: '100000'
   * }).value
   *
   * const address2 = Address.create({
   *   province: 'Beijing',
   *   city: 'Beijing',
   *   district: 'Chaoyang',
   *   street: '123 Main St',
   *   zipCode: '100000'
   * }).value
   *
   * console.log(address1.equals(address2)) // true（深度比较所有属性）
   * ```
   *
   * @example 在集合中使用
   * ```typescript
   * const emails = [
   *   Email.create('a@example.com').value,
   *   Email.create('b@example.com').value,
   *   Email.create('a@example.com').value
   * ]
   *
   * // 去重
   * const unique = emails.filter((email, index) =>
   *   emails.findIndex(e => e.equals(email)) === index
   * )
   * console.log(unique.length) // 2
   * ```
   */
  equals(other?: ValueObject<Props>): boolean {
    if (!other) {
      return false
    }

    if (other === this) {
      return true
    }

    if (other.constructor !== this.constructor) {
      return false
    }

    return deepEquals(this.props, other.props)
  }

  /**
   * 获取值对象的属性（只读）
   *
   * 返回属性的只读引用，注意：
   * - 返回的是原始 props（已冻结）
   * - TypeScript 层面标记为 Readonly
   * - 运行时尝试修改会抛出 TypeError
   *
   * @returns 属性的只读副本
   *
   * @example 安全访问
   * ```typescript
   * const money = Money.create(100, 'CNY').value
   * const props = money.getValue()
   *
   * console.log(props.amount)   // 100
   * console.log(props.currency) // 'CNY'
   *
   * // ❌ 修改会失败
   * props.amount = 200 // TypeError: Cannot assign to read only property
   * ```
   */
  getValue(): Readonly<Props> {
    return this.props
  }

  /**
   * 转换为普通对象
   *
   * 返回可序列化的普通对象，用于：
   * - JSON 序列化
   * - API 请求/响应
   * - 数据库存储
   * - 日志记录
   *
   * @returns 属性的只读副本
   *
   * @example 序列化
   * ```typescript
   * const address = Address.create({
   *   province: 'Beijing',
   *   city: 'Beijing',
   *   district: 'Chaoyang',
   *   street: '123 Main St',
   *   zipCode: '100000'
   * }).value
   *
   * const json = JSON.stringify(address.toObject())
   * // {"province":"Beijing","city":"Beijing",...}
   * ```
   *
   * @example API 请求
   * ```typescript
   * const email = Email.create('user@example.com').value
   * const phone = PhoneNumber.create('13800138000').value
   *
   * await api.post('/user', {
   *   email: email.toObject(),
   *   phone: phone.toObject()
   * })
   * ```
   */
  toObject(): Readonly<Props> {
    return this.props
  }

  /**
   * 创建修改后的副本（不可变更新）
   *
   * 这是实现值对象"修改"的推荐方式。由于值对象不可变，任何修改都返回新实例。
   *
   * 工作原理：
   * 1. 浅合并：`{ ...this.props, ...partial }`
   * 2. 使用当前类的构造函数创建新实例
   * 3. 触发验证逻辑（可能抛出异常）
   * 4. 返回新对象（原对象不变）
   *
   * @param partial - 要修改的部分属性
   * @returns 新的值对象实例
   * @throws 当新属性组合验证失败时抛出错误
   *
   * @example React 状态更新
   * ```typescript
   * // React 组件
   * const [address, setAddress] = useState<Address>(initialAddress)
   *
   * // 更新街道地址
   * const updateStreet = (newStreet: string) => {
   *   const newAddress = address.with({ street: newStreet })
   *   setAddress(newAddress) // 触发重新渲染
   * }
   * ```
   *
   * @example Vue 响应式更新
   * ```typescript
   * // Vue 3 Composition API
   * const address = ref<Address>(initialAddress)
   *
   * const updateCity = (newCity: string) => {
   *   address.value = address.value.with({ city: newCity })
   * }
   * ```
   *
   * @example 链式修改
   * ```typescript
   * const address = Address.create({
   *   province: 'Beijing',
   *   city: 'Beijing',
   *   district: 'Chaoyang',
   *   street: '123 Main St',
   *   zipCode: '100000'
   * }).value
   *
   * // 原对象不变
   * const updated = address
   *   .with({ street: '456 Second Ave' })
   *   .with({ zipCode: '100001' })
   *
   * console.log(address === updated) // false（新对象）
   * ```
   */
  protected with(partial: Partial<Props>): this {
    const constructor = this.constructor as new (props: Props) => this
    const newProps = { ...this.props, ...partial }
    return new constructor(newProps)
  }

  /**
   * 转换为 JSON
   *
   * 用于 JSON.stringify() 自动序列化。
   * 默认返回 `toObject()` 的结果，子类可重写以自定义序列化格式。
   *
   * @returns 可 JSON 序列化的对象
   *
   * @example 默认序列化
   * ```typescript
   * const money = Money.create(100.5, 'CNY').value
   * console.log(JSON.stringify(money))
   * // {"amount":100.5,"currency":"CNY"}
   * ```
   *
   * @example 自定义序列化
   * ```typescript
   * class DateRange extends ValueObject<{ start: Date, end: Date }> {
   *   toJSON() {
   *     return {
   *       start: this.props.start.toISOString(),
   *       end: this.props.end.toISOString()
   *     }
   *   }
   * }
   * ```
   */
  toJSON(): unknown {
    return this.toObject()
  }

  /**
   * 转换为字符串
   *
   * 默认返回 JSON 字符串表示。
   * 子类应该重写此方法提供更有意义的字符串表示（如用于日志、调试、UI 显示）。
   *
   * @returns 字符串表示
   *
   * @example 默认行为
   * ```typescript
   * const money = Money.create(100, 'CNY').value
   * console.log(money.toString())
   * // '{"amount":100,"currency":"CNY"}'
   * ```
   *
   * @example 自定义字符串表示
   * ```typescript
   * class Money extends ValueObject<MoneyProps> {
   *   toString(): string {
   *     return `${this.props.currency} ${this.props.amount.toFixed(2)}`
   *   }
   * }
   *
   * const money = Money.create(100, 'CNY').value
   * console.log(money.toString()) // 'CNY 100.00'
   * ```
   *
   * @example 用于日志
   * ```typescript
   * const email = Email.create('user@example.com').value
   * logger.info(`User registered with email: ${email}`)
   * // User registered with email: user@example.com
   * ```
   */
  toString(): string {
    return JSON.stringify(this.toJSON())
  }

  /**
   * 获取值的哈希码
   *
   * 用于在 Map 或 Set 中使用值对象作为键。
   * 默认使用 JSON 字符串作为哈希，性能可能不是最优。
   *
   * 子类可以重写此方法提供更高效的哈希算法（如使用核心字段组合）。
   *
   * @returns 哈希码字符串
   *
   * @example 在 Map 中使用
   * ```typescript
   * const priceMap = new Map<string, number>()
   * const product1 = ProductSpec.create({ color: 'red', size: 'L' }).value
   *
   * priceMap.set(product1.hashCode(), 99.99)
   *
   * // 查找
   * const product2 = ProductSpec.create({ color: 'red', size: 'L' }).value
   * console.log(priceMap.get(product2.hashCode())) // 99.99
   * ```
   *
   * @example 自定义哈希（性能优化）
   * ```typescript
   * class Email extends ValueObject<EmailProps> {
   *   hashCode(): string {
   *     return this.props.value // 直接使用 email 值作为哈希
   *   }
   * }
   * ```
   */
  hashCode(): string {
    return this.toString()
  }

  /**
   * 类型守卫：检查是否为值对象
   *
   * 用于运行时类型检查，特别是在处理 any 或 unknown 类型时。
   *
   * @param value - 要检查的值
   * @returns 如果是值对象返回 true，否则返回 false
   *
   * @example 类型守卫
   * ```typescript
   * function processValue(value: unknown) {
   *   if (ValueObject.isValueObject(value)) {
   *     console.log(value.toJSON()) // ✅ 类型安全
   *   }
   * }
   * ```
   *
   * @example 过滤数组
   * ```typescript
   * const mixed: unknown[] = [
   *   Email.create('a@example.com').value,
   *   'plain string',
   *   Money.create(100, 'CNY').value,
   *   42
   * ]
   *
   * const valueObjects = mixed.filter(ValueObject.isValueObject)
   * // 只包含 Email 和 Money 实例
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static isValueObject(value: unknown): value is ValueObject<Record<string, any>> {
    return value instanceof ValueObject
  }

  /**
   * 从普通对象创建值对象（工厂方法模板）
   *
   * 提供统一的反序列化接口，用于从 JSON、数据库、API 响应中恢复值对象。
   * 子类可以重写此方法提供更具体的创建逻辑。
   *
   * @param props - 属性对象
   * @returns Result 包装的值对象
   *
   * @example 从 API 响应恢复
   * ```typescript
   * const response = await api.get('/user/123')
   * const emailResult = Email.fromObject(response.email)
   *
   * if (emailResult.isSuccess) {
   *   const email = emailResult.value
   * }
   * ```
   *
   * @example 从 LocalStorage 恢复
   * ```typescript
   * const saved = localStorage.getItem('user-address')
   * if (saved) {
   *   const addressData = JSON.parse(saved)
   *   const addressResult = Address.fromObject(addressData)
   *
   *   if (addressResult.isSuccess) {
   *     setAddress(addressResult.value)
   *   }
   * }
   * ```
   *
   * @example 子类重写（自定义逻辑）
   * ```typescript
   * class DateRange extends ValueObject<{ start: Date, end: Date }> {
   *   static fromObject(props: { start: string, end: string }): Result<DateRange, string> {
   *     try {
   *       const start = new Date(props.start)
   *       const end = new Date(props.end)
   *
   *       if (start > end) {
   *         return Result.fail('Start date must be before end date')
   *       }
   *
   *       return Result.ok(new DateRange({ start, end }))
   *     } catch (error) {
   *       return Result.fail('Invalid date format')
   *     }
   *   }
   * }
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromObject<T extends ValueObject<Record<string, any>>>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this: new (props: Record<string, any>) => T,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: Record<string, any>
  ): Result<T, string> {
    try {
      return Result.ok(new this(props))
    } catch (error) {
      return Result.fail((error as Error).message || 'Invalid value object properties')
    }
  }

  /**
   * 批量创建值对象
   *
   * 用于批量验证和创建场景，如导入数据、批量处理表单。
   * 如果任一项验证失败，返回失败 Result，包含所有错误信息。
   *
   * 错误聚合策略：
   * - 收集所有失败项的索引和错误信息
   * - 格式：`"Item 0: 错误信息; Item 2: 错误信息"`
   * - 方便前端定位具体失败项
   *
   * @param propsList - 属性对象数组
   * @returns Result 包装的值对象数组
   *
   * @example 批量创建邮箱
   * ```typescript
   * const emailsData = [
   *   { value: 'user1@example.com' },
   *   { value: 'invalid-email' },    // ❌ 验证失败
   *   { value: 'user2@example.com' },
   *   { value: 'another-invalid' }   // ❌ 验证失败
   * ]
   *
   * const result = Email.createMany(emailsData)
   *
   * if (result.isFailure) {
   *   console.log(result.error)
   *   // "Item 1: Invalid email address; Item 3: Invalid email address"
   * } else {
   *   const emails = result.value
   *   // 所有邮箱都有效
   * }
   * ```
   *
   * @example 导入用户数据
   * ```typescript
   * const usersData = [
   *   { email: 'user1@example.com', name: 'Alice' },
   *   { email: 'user2@example.com', name: 'Bob' }
   * ]
   *
   * const emailsResult = Email.createMany(
   *   usersData.map(u => ({ value: u.email }))
   * )
   *
   * if (emailsResult.isSuccess) {
   *   const users = usersData.map((data, i) =>
   *     User.create({ email: emailsResult.value[i], name: data.name })
   *   )
   * }
   * ```
   *
   * @example 表单批量验证
   * ```typescript
   * function validateBulkEmails(emails: string[]): Result<Email[], string> {
   *   return Email.createMany(emails.map(e => ({ value: e })))
   * }
   *
   * const result = validateBulkEmails(['a@example.com', 'invalid', 'b@example.com'])
   * if (result.isFailure) {
   *   alert(`Validation failed: ${result.error}`)
   * }
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static createMany<T extends ValueObject<Record<string, any>>>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this: new (props: Record<string, any>) => T,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    propsList: Record<string, any>[]
  ): Result<T[], string> {
    const results: T[] = []
    const errors: string[] = []

    for (let i = 0; i < propsList.length; i++) {
      try {
        const instance = new this(propsList[i])
        results.push(instance)
      } catch (error) {
        errors.push(`Item ${i}: ${(error as Error).message}`)
      }
    }

    if (errors.length > 0) {
      return Result.fail(errors.join('; '))
    }

    return Result.ok(results)
  }

  /**
   * 克隆值对象
   *
   * 由于值对象是不可变的，克隆实际上返回自身（引用复制）。
   * 这是安全的，因为对象已冻结，无法被修改。
   *
   * 性能优化：避免不必要的深拷贝
   *
   * @returns 值对象本身（引用）
   *
   * @example 克隆行为
   * ```typescript
   * const email = Email.create('user@example.com').value
   * const cloned = email.clone()
   *
   * console.log(email === cloned) // true（同一对象）
   * console.log(email.equals(cloned)) // true（值相等）
   *
   * // 安全的，因为对象不可变
   * const array = [email, cloned]
   * // 实际上是 [email, email]，但没有副作用风险
   * ```
   */
  clone(): this {
    return this
  }

  /**
   * 检查属性是否包含指定的键值对
   *
   * 使用深度比较判断指定属性的值是否匹配。
   * 适用于过滤、查找等场景。
   *
   * @param key - 属性键
   * @param value - 期望的值
   * @returns 如果包含返回 true，否则返回 false
   *
   * @example 查找匹配项
   * ```typescript
   * const addresses = [
   *   Address.create({ province: 'Beijing', city: 'Beijing', ... }).value,
   *   Address.create({ province: 'Shanghai', city: 'Shanghai', ... }).value,
   *   Address.create({ province: 'Beijing', city: 'Tianjin', ... }).value
   * ]
   *
   * const beijingAddresses = addresses.filter(addr => addr.has('province', 'Beijing'))
   * // 返回 2 个北京的地址
   * ```
   *
   * @example 复杂对象匹配
   * ```typescript
   * const spec = ProductSpec.create({ color: 'red', size: 'L' }).value
   * console.log(spec.has('color', 'red'))  // true
   * console.log(spec.has('color', 'blue')) // false
   * ```
   */
  has<K extends keyof Props>(key: K, value: Props[K]): boolean {
    return deepEquals(this.props[key], value)
  }

  /**
   * 获取指定属性的值
   *
   * 类型安全的属性访问器，返回指定键的属性值。
   *
   * @param key - 属性键
   * @returns 属性值
   *
   * @example 访问属性
   * ```typescript
   * const money = Money.create(100, 'CNY').value
   * const amount = money.get('amount')    // 100
   * const currency = money.get('currency') // 'CNY'
   * ```
   *
   * @example 泛型约束
   * ```typescript
   * function getProperty<T extends ValueObject<any>, K extends keyof T['props']>(
   *   vo: T,
   *   key: K
   * ): T['props'][K] {
   *   return vo.get(key)
   * }
   * ```
   */
  get<K extends keyof Props>(key: K): Props[K] {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.props[key]
  }

  /**
   * 检查是否为空值对象
   *
   * 默认检查所有属性是否为 null、undefined 或空字符串。
   * 子类可以重写此方法提供自定义的空值检查逻辑。
   *
   * 适用场景：
   * - 表单验证（检查是否填写）
   * - 数据清洗（过滤空对象）
   * - UI 条件渲染（空状态显示）
   *
   * @returns 如果为空返回 true，否则返回 false
   *
   * @example 默认行为（概念演示）
   * ```typescript
   * // 注意：这是 isEmpty() 默认行为的概念演示
   * // 实际值对象（如 Email）通常在 validate() 中不允许空值
   *
   * // 假设有一个允许空值的值对象
   * interface OptionalTextProps {
   *   value: string | null
   * }
   *
   * class OptionalText extends ValueObject<OptionalTextProps> {
   *   protected validate(props: OptionalTextProps): void {
   *     // 允许空值，无额外验证
   *   }
   * }
   *
   * const empty1 = new OptionalText({ value: '' })
   * const empty2 = new OptionalText({ value: null })
   * const valid = new OptionalText({ value: 'hello' })
   *
   * console.log(empty1.isEmpty()) // true
   * console.log(empty2.isEmpty()) // true
   * console.log(valid.isEmpty())  // false
   * ```
   *
   * @example 自定义空值逻辑
   * ```typescript
   * class Address extends ValueObject<AddressProps> {
   *   isEmpty(): boolean {
   *     // 只要省份和城市为空就认为是空地址
   *     return !this.props.province || !this.props.city
   *   }
   * }
   * ```
   *
   * @example UI 条件渲染
   * ```typescript
   * function AddressDisplay({ address }: { address: Address }) {
   *   if (address.isEmpty()) {
   *     return <div>No address provided</div>
   *   }
   *   return <div>{address.toString()}</div>
   * }
   * ```
   */
  isEmpty(): boolean {
    for (const key in this.props) {
      const value = this.props[key]
      if (value !== null && value !== undefined && value !== '') {
        return false
      }
    }
    return true
  }

  /**
   * 检查是否为有效值对象
   *
   * 重新运行验证逻辑，检查当前对象是否仍然有效。
   * 通常在以下场景使用：
   * - 运行时验证（业务规则可能改变）
   * - 调试（确认对象状态）
   * - 测试（验证对象创建逻辑）
   *
   * 注意：
   * - 正常情况下值对象创建后就是有效的
   * - 此方法主要用于防御性编程
   * - 子类可以重写提供自定义验证
   *
   * @returns 如果有效返回 true，否则返回 false
   *
   * @example 运行时验证
   * ```typescript
   * function processEmail(email: Email) {
   *   if (!email.isValid()) {
   *     logger.error('Invalid email object detected')
   *     return
   *   }
   *   // 继续处理
   * }
   * ```
   *
   * @example 测试辅助
   * ```typescript
   * test('Email validation', () => {
   *   const email = Email.create('user@example.com').value
   *   expect(email.isValid()).toBe(true)
   * })
   * ```
   */
  isValid(): boolean {
    try {
      this.validate(this.props)
      return true
    } catch {
      return false
    }
  }
}
