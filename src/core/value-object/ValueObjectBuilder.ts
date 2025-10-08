import { Result } from '../shared/Result'
import type { ValueObject } from './ValueObject'

/**
 * 值对象 Builder 基类 - 流式 API 构建复杂值对象
 *
 * Builder 模式为复杂值对象的创建提供了清晰、可读的流式接口。它特别适合处理多属性值对象、
 * 表单数据验证、条件性构建等场景，是值对象工厂方法的有力补充。
 *
 * ## 核心优势
 *
 * 1. **可读性** - 流式 API 比传统构造函数更清晰、易读
 * 2. **灵活性** - 支持条件设置、批量应用、函数式组合
 * 3. **验证友好** - 分步验证，实时反馈，错误定位准确
 * 4. **表单契合** - 天然适配前端表单场景，与 React Hook Form、Formik 等无缝集成
 * 5. **类型安全** - 完整的 TypeScript 类型支持
 *
 * ## Builder vs 直接创建（create 方法）
 *
 * | 特性 | Builder 模式 | 直接创建（create） |
 * |------|------------|------------------|
 * | 适用场景 | 3+ 属性的复杂对象 | 简单对象（1-2 属性） |
 * | 可读性 | ✅ 非常清晰 | ⚠️  参数多时混乱 |
 * | 参数顺序 | ✅ 无需记忆 | ❌ 必须按顺序 |
 * | 可选参数 | ✅ 自然表达 | ⚠️  需要默认值 |
 * | 条件设置 | ✅ when/apply | ❌ 需要三元表达式 |
 * | 表单绑定 | ✅ 完美契合 | ⚠️  需要转换 |
 * | 分步验证 | ✅ 支持 | ❌ 一次性验证 |
 *
 * ## 何时使用 Builder
 *
 * ### ✅ 推荐使用的场景：
 *
 * - **复杂值对象** - 3 个以上属性的值对象
 * - **表单数据** - 用户输入的多字段表单
 * - **条件构建** - 根据条件决定某些属性是否设置
 * - **分步验证** - 需要实时验证反馈
 * - **配置对象** - 有很多可选配置项
 * - **UI 构建器** - 可视化编辑器、配置面板等
 *
 * ### ❌ 不推荐使用的场景：
 *
 * - **简单值对象** - 只有 1-2 个属性，用 create() 更简洁
 * - **性能关键路径** - Builder 有轻微开销，高频场景考虑直接创建
 * - **不可变性要求严格** - Builder 本身是可变的（构建过程中）
 *
 * @template T - 值对象类型
 * @template Props - 值对象属性类型
 *
 * @example 基本使用 - Address Builder
 * ```typescript
 * // 1. 定义属性接口
 * interface AddressProps {
 *   street: string
 *   city: string
 *   state: string
 *   zipCode: string
 *   country?: string
 * }
 *
 * // 2. 定义值对象
 * class Address extends ValueObject<AddressProps> {
 *   get street() { return this.props.street }
 *   get city() { return this.props.city }
 *   get fullAddress() {
 *     return `${this.street}, ${this.city}, ${this.props.state} ${this.props.zipCode}`
 *   }
 *
 *   protected validate(props: AddressProps): void {
 *     if (!props.street || !props.city || !props.state || !props.zipCode) {
 *       throw new Error('Address fields are required')
 *     }
 *   }
 * }
 *
 * // 3. 定义 Builder
 * class AddressBuilder extends ValueObjectBuilder<Address, AddressProps> {
 *   street(value: string): this {
 *     this.props.street = value
 *     return this
 *   }
 *
 *   city(value: string): this {
 *     this.props.city = value
 *     return this
 *   }
 *
 *   state(value: string): this {
 *     this.props.state = value
 *     return this
 *   }
 *
 *   zipCode(value: string): this {
 *     this.props.zipCode = value
 *     return this
 *   }
 *
 *   country(value: string): this {
 *     this.props.country = value
 *     return this
 *   }
 *
 *   protected validate(): string[] {
 *     const errors: string[] = []
 *     if (!this.props.street) errors.push('Street is required')
 *     if (!this.props.city) errors.push('City is required')
 *     if (!this.props.state) errors.push('State is required')
 *     if (!this.props.zipCode) errors.push('Zip code is required')
 *     else if (!/^\d{5}$/.test(this.props.zipCode)) {
 *       errors.push('Zip code must be 5 digits')
 *     }
 *     return errors
 *   }
 *
 *   protected createValueObject(): Address {
 *     return new Address(this.props as AddressProps)
 *   }
 * }
 *
 * // 4. 使用 Builder（清晰易读）
 * const result = new AddressBuilder()
 *   .street('123 Main St')
 *   .city('New York')
 *   .state('NY')
 *   .zipCode('10001')
 *   .when(true, b => b.country('USA'))  // 条件设置
 *   .build()
 *
 * if (result.isSuccess) {
 *   console.log(result.value.fullAddress)
 * } else {
 *   console.error(result.error) // ['Street is required', ...]
 * }
 * ```
 *
 * @example 对比：Builder vs 直接创建
 * ```typescript
 * // ❌ 直接创建 - 参数过多时不清晰
 * const address1 = Address.create(
 *   '123 Main St',
 *   'New York',
 *   'NY',
 *   '10001',
 *   'USA'
 * ) // 哪个参数是什么？需要查看签名
 *
 * // ✅ Builder - 清晰易读
 * const address2 = new AddressBuilder()
 *   .street('123 Main St')
 *   .city('New York')
 *   .state('NY')
 *   .zipCode('10001')
 *   .country('USA')
 *   .build()
 * ```
 *
 * @example React Hook Form 集成
 * ```typescript
 * import { useForm } from 'react-hook-form'
 *
 * function AddressForm() {
 *   const { register, handleSubmit } = useForm()
 *   const [errors, setErrors] = useState<string[]>([])
 *   const builder = useMemo(() => new AddressBuilder(), [])
 *
 *   const onSubmit = (data: any) => {
 *     // 使用 Builder 构建和验证
 *     const result = builder
 *       .street(data.street)
 *       .city(data.city)
 *       .state(data.state)
 *       .zipCode(data.zipCode)
 *       .when(data.country, b => b.country(data.country)) // 条件设置
 *       .build()
 *
 *     if (result.isFailure) {
 *       setErrors(result.error)
 *       return
 *     }
 *
 *     // 提交表单
 *     submitAddress(result.value)
 *   }
 *
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       <input {...register('street')} placeholder="Street" />
 *       <input {...register('city')} placeholder="City" />
 *       <input {...register('state')} placeholder="State" />
 *       <input {...register('zipCode')} placeholder="Zip Code" />
 *       <input {...register('country')} placeholder="Country (optional)" />
 *       {errors.map(err => <div key={err} className="error">{err}</div>)}
 *       <button type="submit">Submit</button>
 *     </form>
 *   )
 * }
 * ```
 *
 * @example Vue 3 集成 - 实时验证
 * ```typescript
 * import { ref, computed } from 'vue'
 *
 * export default {
 *   setup() {
 *     const builder = new AddressBuilder()
 *     const errors = computed(() => builder.getErrors())
 *     const isValid = computed(() => builder.isValid())
 *
 *     // 实时更新
 *     const updateStreet = (value: string) => {
 *       builder.street(value)
 *     }
 *
 *     const submit = () => {
 *       const result = builder.build()
 *       if (result.isSuccess) {
 *         api.post('/address', result.value.toObject())
 *       }
 *     }
 *
 *     return { updateStreet, errors, isValid, submit }
 *   }
 * }
 * ```
 *
 * @example 条件构建 - when() 和 apply()
 * ```typescript
 * // 条件设置国家
 * const address = new AddressBuilder()
 *   .street('123 Main St')
 *   .city('Beijing')
 *   .state('Beijing')
 *   .zipCode('100000')
 *   .when(isInternational, b => b.country('China')) // 条件设置
 *   .build()
 *
 * // 批量应用预设配置
 * const defaultChinaConfig = (b: AddressBuilder) => {
 *   b.state('Beijing')
 *   b.country('China')
 * }
 *
 * const beijingAddress = new AddressBuilder()
 *   .street('456 Second Ave')
 *   .city('Beijing')
 *   .zipCode('100001')
 *   .apply(defaultChinaConfig) // 应用预设
 *   .build()
 * ```
 *
 * @example 复杂表单 - 注册表单
 * ```typescript
 * interface UserRegistrationProps {
 *   email: Email
 *   password: string
 *   confirmPassword: string
 *   profile: {
 *     firstName: string
 *     lastName: string
 *     age?: number
 *   }
 *   termsAccepted: boolean
 * }
 *
 * class UserRegistrationBuilder extends ValueObjectBuilder<UserRegistration, UserRegistrationProps> {
 *   email(value: string): this {
 *     const emailResult = Email.create(value)
 *     if (emailResult.isSuccess) {
 *       this.props.email = emailResult.value
 *     }
 *     return this
 *   }
 *
 *   password(value: string): this {
 *     this.props.password = value
 *     return this
 *   }
 *
 *   confirmPassword(value: string): this {
 *     this.props.confirmPassword = value
 *     return this
 *   }
 *
 *   firstName(value: string): this {
 *     if (!this.props.profile) {
 *       this.props.profile = { firstName: '', lastName: '' }
 *     }
 *     this.props.profile.firstName = value
 *     return this
 *   }
 *
 *   acceptTerms(): this {
 *     this.props.termsAccepted = true
 *     return this
 *   }
 *
 *   protected validate(): string[] {
 *     const errors: string[] = []
 *
 *     if (!this.props.email) {
 *       errors.push('Email is required')
 *     }
 *     if (!this.props.password || this.props.password.length < 8) {
 *       errors.push('Password must be at least 8 characters')
 *     }
 *     if (this.props.password !== this.props.confirmPassword) {
 *       errors.push('Passwords do not match')
 *     }
 *     if (!this.props.termsAccepted) {
 *       errors.push('You must accept the terms')
 *     }
 *
 *     return errors
 *   }
 *
 *   protected createValueObject(): UserRegistration {
 *     return new UserRegistration(this.props as UserRegistrationProps)
 *   }
 * }
 * ```
 *
 * @example 函数式组合 - pipe()
 * ```typescript
 * // 定义转换函数
 * const normalizeAddress = (b: AddressBuilder): AddressBuilder => {
 *   return b
 *     .street(b.get('street')?.toUpperCase() || '')
 *     .zipCode(b.get('zipCode')?.replace(/\D/g, '') || '')
 * }
 *
 * const addDefaultCountry = (b: AddressBuilder): AddressBuilder => {
 *   if (!b.has('country')) {
 *     b.country('USA')
 *   }
 *   return b
 * }
 *
 * // 使用 pipe 组合
 * const address = new AddressBuilder()
 *   .street('123 main st')
 *   .city('New York')
 *   .state('NY')
 *   .zipCode('10001')
 *   .pipe(normalizeAddress)
 *   .pipe(addDefaultCountry)
 *   .build()
 * ```
 *
 * @example 表单重置和克隆
 * ```typescript
 * function AddressFormWithReset() {
 *   const [builder] = useState(() => new AddressBuilder())
 *
 *   const handleReset = () => {
 *     builder.clearAll() // 清空所有字段
 *   }
 *
 *   const handleClone = () => {
 *     const cloned = builder.clone() // 克隆当前状态
 *     // 在克隆上继续编辑
 *     const newAddress = cloned
 *       .street('456 Different St')
 *       .build()
 *   }
 *
 *   return (
 *     <>
 *       <button onClick={handleReset}>Reset</button>
 *       <button onClick={handleClone}>Clone</button>
 *     </>
 *   )
 * }
 * ```
 *
 * @see {@link ValueObject} - 值对象基类
 * @see {@link GenericValueObjectBuilder} - 通用 Builder（无需子类）
 * @see {@link Result} - 错误处理
 *
 * @public
 */
export abstract class ValueObjectBuilder<
  T extends ValueObject<Props>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Props extends Record<string, any>
> {
  protected props: Partial<Props> = {}

  /**
   * 构造函数
   *
   * 可选地接受初始属性，用于：
   * - 编辑现有值对象
   * - 提供默认值
   * - 从外部数据预填充
   *
   * @param initialProps - 初始属性（可选）
   *
   * @example 空构造
   * ```typescript
   * const builder = new AddressBuilder()
   * ```
   *
   * @example 带初始值
   * ```typescript
   * const builder = new AddressBuilder({
   *   country: 'USA', // 预设默认值
   *   state: 'NY'
   * })
   * ```
   *
   * @example 编辑现有对象
   * ```typescript
   * const existingAddress = Address.create({ ... }).value
   * const builder = new AddressBuilder(existingAddress.toObject())
   * ```
   */
  constructor(initialProps?: Partial<Props>) {
    if (initialProps) {
      this.props = { ...initialProps }
    }
  }

  /**
   * 验证当前属性
   *
   * 子类必须实现此方法来验证属性的完整性和有效性。
   * 返回错误数组而非抛出异常，支持：
   * - 收集所有验证错误（而非遇到第一个就停止）
   * - 前端显示多个错误信息
   * - 分步验证和实时反馈
   *
   * 验证策略：
   * - 检查必填字段
   * - 验证格式（正则、范围等）
   * - 验证业务规则
   * - 检查字段间的一致性
   *
   * @returns 错误消息数组，如果没有错误返回空数组
   *
   * @example 简单验证
   * ```typescript
   * protected validate(): string[] {
   *   const errors: string[] = []
   *
   *   if (!this.props.email) {
   *     errors.push('Email is required')
   *   }
   *   if (!this.props.password) {
   *     errors.push('Password is required')
   *   }
   *
   *   return errors
   * }
   * ```
   *
   * @example 复杂验证（格式 + 业务规则）
   * ```typescript
   * protected validate(): string[] {
   *   const errors: string[] = []
   *
   *   // 必填检查
   *   if (!this.props.zipCode) {
   *     errors.push('Zip code is required')
   *   }
   *   // 格式检查
   *   else if (!/^\d{5}$/.test(this.props.zipCode)) {
   *     errors.push('Zip code must be 5 digits')
   *   }
   *
   *   // 字段间一致性
   *   if (this.props.password !== this.props.confirmPassword) {
   *     errors.push('Passwords do not match')
   *   }
   *
   *   return errors
   * }
   * ```
   */
  protected abstract validate(): string[]

  /**
   * 创建值对象实例
   *
   * 子类必须实现此方法来创建具体的值对象。
   * 通常在 build() 成功后调用，此时属性已通过验证。
   *
   * @returns 值对象实例
   * @throws 如果属性不完整或值对象构造函数抛出异常
   *
   * @example 基本实现
   * ```typescript
   * protected createValueObject(): Address {
   *   return new Address(this.props as AddressProps)
   * }
   * ```
   *
   * @example 带额外处理
   * ```typescript
   * protected createValueObject(): UserRegistration {
   *   // 可以在创建前做最后的转换
   *   const props = {
   *     ...this.props,
   *     createdAt: new Date()
   *   }
   *   return new UserRegistration(props as UserRegistrationProps)
   * }
   * ```
   */
  protected abstract createValueObject(): T

  /**
   * 从对象批量设置属性
   *
   * 用于：
   * - 从 API 响应批量加载数据
   * - 从 LocalStorage 恢复状态
   * - 快速填充表单
   *
   * @param obj - 包含属性的对象
   * @returns Builder 实例，支持链式调用
   *
   * @example 从 API 加载
   * ```typescript
   * const apiData = await api.get('/address/123')
   * const builder = new AddressBuilder().fromObject(apiData)
   * ```
   *
   * @example 从 LocalStorage 恢复
   * ```typescript
   * const saved = localStorage.getItem('draft-address')
   * if (saved) {
   *   const data = JSON.parse(saved)
   *   builder.fromObject(data)
   * }
   * ```
   */
  fromObject(obj: Partial<Props>): this {
    Object.assign(this.props, obj)
    return this
  }

  /**
   * 设置单个属性
   *
   * 通用的属性设置方法，类型安全。
   * 子类通常会提供更具体的 setter 方法（如 `street(value: string)`），
   * 但此方法在动态场景下很有用。
   *
   * @param key - 属性键
   * @param value - 属性值
   * @returns Builder 实例，支持链式调用
   *
   * @example 基本使用
   * ```typescript
   * builder.set('street', '123 Main St').set('city', 'New York')
   * ```
   *
   * @example 动态设置
   * ```typescript
   * const fields = { street: '123 Main St', city: 'New York' }
   * Object.entries(fields).forEach(([key, value]) => {
   *   builder.set(key as keyof Props, value)
   * })
   * ```
   */
  set<K extends keyof Props>(key: K, value: Props[K]): this {
    this.props[key] = value
    return this
  }

  /**
   * 获取单个属性值
   *
   * 用于读取当前构建状态，支持：
   * - 条件逻辑
   * - 值转换
   * - 调试
   *
   * @param key - 属性键
   * @returns 属性值（可能为 undefined）
   *
   * @example 条件逻辑
   * ```typescript
   * const builder = new AddressBuilder()
   * if (builder.get('country') === 'USA') {
   *   builder.state('NY')
   * }
   * ```
   *
   * @example 值转换
   * ```typescript
   * const street = builder.get('street')
   * if (street) {
   *   builder.set('street', street.toUpperCase())
   * }
   * ```
   */
  get<K extends keyof Props>(key: K): Props[K] | undefined {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.props[key]
  }

  /**
   * 检查是否有指定属性
   *
   * 检查属性是否已设置（非 undefined）。
   * 用于条件逻辑和可选字段处理。
   *
   * @param key - 属性键
   * @returns 如果有返回 true，否则返回 false
   *
   * @example 可选字段处理
   * ```typescript
   * if (!builder.has('country')) {
   *   builder.country('USA') // 设置默认值
   * }
   * ```
   *
   * @example 条件验证
   * ```typescript
   * if (builder.has('email') && builder.has('phone')) {
   *   // 至少有一种联系方式
   * }
   * ```
   */
  has<K extends keyof Props>(key: K): boolean {
    return key in this.props && this.props[key] !== undefined
  }

  /**
   * 清除单个属性
   *
   * 从构建状态中移除指定属性。
   * 用于：
   * - 重置单个字段
   * - 移除可选字段
   * - 条件性清除
   *
   * @param key - 属性键
   * @returns Builder 实例，支持链式调用
   *
   * @example 清除单个字段
   * ```typescript
   * builder.clear('country') // 移除国家字段
   * ```
   *
   * @example 条件清除
   * ```typescript
   * if (!isInternational) {
   *   builder.clear('country')
   * }
   * ```
   */
  clear<K extends keyof Props>(key: K): this {
    delete this.props[key]
    return this
  }

  /**
   * 清除所有属性
   *
   * 重置 Builder 到初始状态。
   * 用于：
   * - 表单重置
   * - 复用 Builder 实例
   * - 清空草稿
   *
   * @returns Builder 实例，支持链式调用
   *
   * @example 表单重置
   * ```typescript
   * const handleReset = () => {
   *   builder.clearAll()
   *   // 重新渲染表单
   * }
   * ```
   */
  clearAll(): this {
    this.props = {}
    return this
  }

  /**
   * 获取当前所有属性
   *
   * 返回属性的浅拷贝，用于：
   * - 调试
   * - 持久化（保存草稿）
   * - 状态快照
   *
   * @returns 属性的副本
   *
   * @example 保存草稿
   * ```typescript
   * const draft = builder.getProps()
   * localStorage.setItem('draft', JSON.stringify(draft))
   * ```
   *
   * @example 调试
   * ```typescript
   * console.log('Current state:', builder.getProps())
   * ```
   */
  getProps(): Partial<Props> {
    return { ...this.props }
  }

  /**
   * 构建值对象
   *
   * 执行验证并创建值对象实例。
   * 这是 Builder 的核心方法，执行流程：
   * 1. 调用 validate() 验证属性
   * 2. 如果有错误，返回失败 Result（包含错误数组）
   * 3. 如果验证通过，调用 createValueObject() 创建实例
   * 4. 返回成功 Result（包含值对象）
   *
   * @returns Result 包装的值对象，如果验证失败返回错误数组
   *
   * @example 基本使用
   * ```typescript
   * const result = builder
   *   .street('123 Main St')
   *   .city('New York')
   *   .state('NY')
   *   .zipCode('10001')
   *   .build()
   *
   * if (result.isSuccess) {
   *   const address = result.value
   *   console.log(address.fullAddress)
   * } else {
   *   console.error('Validation errors:', result.error)
   *   // ['Street is required', 'Zip code must be 5 digits']
   * }
   * ```
   *
   * @example 错误处理
   * ```typescript
   * const result = builder.build()
   *
   * result.match({
   *   ok: address => {
   *     // 成功：提交表单
   *     submitForm(address)
   *   },
   *   fail: errors => {
   *     // 失败：显示错误
   *     errors.forEach(err => showError(err))
   *   }
   * })
   * ```
   */
  build(): Result<T, string[]> {
    const errors = this.validate()

    if (errors.length > 0) {
      return Result.fail(errors)
    }

    try {
      const valueObject = this.createValueObject()
      return Result.ok(valueObject)
    } catch (error) {
      return Result.fail([(error as Error).message || 'Unknown error'])
    }
  }

  /**
   * 尝试构建值对象（错误信息合并为字符串）
   *
   * 与 build() 类似，但将错误数组合并为单个字符串。
   * 适用于只需要简单错误提示的场景。
   *
   * @returns Result 包装的值对象，错误信息合并为字符串
   *
   * @example 简单错误提示
   * ```typescript
   * const result = builder.tryBuild()
   *
   * if (result.isFailure) {
   *   alert(result.error) // "Street is required; Zip code must be 5 digits"
   * }
   * ```
   */
  tryBuild(): Result<T, string> {
    const result = this.build()

    if (result.isFailure) {
      return Result.fail(result.error.join('; '))
    }

    return Result.ok(result.value)
  }

  /**
   * 验证当前属性是否有效
   *
   * 检查当前状态是否通过验证，但不创建值对象。
   * 用于：
   * - 实时验证反馈
   * - 禁用/启用提交按钮
   * - 表单步骤控制
   *
   * @returns 如果有效返回 true，否则返回 false
   *
   * @example 实时验证
   * ```typescript
   * const [canSubmit, setCanSubmit] = useState(false)
   *
   * const handleChange = () => {
   *   setCanSubmit(builder.isValid())
   * }
   *
   * return <button disabled={!canSubmit}>Submit</button>
   * ```
   *
   * @example 表单步骤控制
   * ```typescript
   * const canProceedToStep2 = builder.isValid()
   * ```
   */
  isValid(): boolean {
    return this.validate().length === 0
  }

  /**
   * 获取验证错误
   *
   * 返回当前的所有验证错误（不抛出异常）。
   * 用于：
   * - 显示错误列表
   * - 错误计数
   * - 调试
   *
   * @returns 错误消息数组
   *
   * @example 显示错误列表
   * ```typescript
   * const errors = builder.getErrors()
   *
   * return (
   *   <ul>
   *     {errors.map(err => <li key={err}>{err}</li>)}
   *   </ul>
   * )
   * ```
   *
   * @example 错误计数
   * ```typescript
   * const errorCount = builder.getErrors().length
   * console.log(`${errorCount} validation errors`)
   * ```
   */
  getErrors(): string[] {
    return this.validate()
  }

  /**
   * 克隆 Builder
   *
   * 创建 Builder 的副本（浅拷贝属性）。
   * 用于：
   * - 保存状态快照
   * - 分支构建（基于现有状态创建变体）
   * - 撤销/重做功能
   *
   * @returns 新的 Builder 实例，包含相同的属性
   *
   * @example 状态快照
   * ```typescript
   * const snapshot = builder.clone()
   * // 可以随时恢复
   * builder = snapshot.clone()
   * ```
   *
   * @example 分支构建
   * ```typescript
   * const baseBuilder = new AddressBuilder()
   *   .street('123 Main St')
   *   .city('New York')
   *
   * const address1 = baseBuilder.clone()
   *   .zipCode('10001')
   *   .build()
   *
   * const address2 = baseBuilder.clone()
   *   .zipCode('10002')
   *   .build()
   * ```
   */
  clone(): this {
    const Constructor = this.constructor as new (props?: Partial<Props>) => this
    return new Constructor(this.props)
  }

  /**
   * 条件设置
   *
   * 根据条件决定是否执行设置操作。
   * 提供清晰的条件逻辑，避免 if-else 嵌套。
   *
   * @param condition - 条件
   * @param fn - 设置函数（仅在条件为 true 时执行）
   * @returns Builder 实例，支持链式调用
   *
   * @example 基本条件
   * ```typescript
   * const isInternational = true
   * const address = new AddressBuilder()
   *   .street('123 Main St')
   *   .city('Beijing')
   *   .when(isInternational, b => b.country('China'))
   *   .build()
   * ```
   *
   * @example 复杂条件
   * ```typescript
   * const builder = new AddressBuilder()
   *   .street('123 Main St')
   *   .when(user.isPremium, b => {
   *     b.country('USA')
   *     b.state('NY')
   *   })
   *   .when(user.hasPhoneVerified, b => b.phone(user.phone))
   *   .build()
   * ```
   *
   * @example 替代 if-else
   * ```typescript
   * // ❌ 传统方式
   * if (condition) {
   *   builder.country('USA')
   * }
   *
   * // ✅ when() 方式（链式）
   * builder.when(condition, b => b.country('USA'))
   * ```
   */
  when(condition: boolean, fn: (builder: this) => void): this {
    if (condition) {
      fn(this)
    }
    return this
  }

  /**
   * 应用转换（函数式组合）
   *
   * 应用一个转换函数到 Builder，支持函数式编程风格。
   * 用于：
   * - 复用转换逻辑
   * - 函数组合
   * - 自定义操作
   *
   * @param fn - 转换函数
   * @returns 转换后的结果
   *
   * @example 基本转换
   * ```typescript
   * const normalize = (b: AddressBuilder): AddressBuilder => {
   *   return b.street(b.get('street')?.toUpperCase() || '')
   * }
   *
   * const address = builder
   *   .street('main st')
   *   .pipe(normalize)
   *   .build()
   * // street 被转为大写
   * ```
   *
   * @example 转换为其他类型
   * ```typescript
   * const toJSON = (b: AddressBuilder): Record<string, any> => {
   *   return b.getProps()
   * }
   *
   * const json = builder.pipe(toJSON)
   * ```
   *
   * @example 链式转换
   * ```typescript
   * const address = builder
   *   .pipe(normalize)
   *   .pipe(addDefaults)
   *   .pipe(validate)
   *   .build()
   * ```
   */
  pipe<R>(fn: (builder: this) => R): R {
    return fn(this)
  }

  /**
   * 批量应用多个设置
   *
   * 批量应用多个设置函数，用于：
   * - 应用预设配置
   * - 组合多个转换
   * - 插件系统
   *
   * @param setters - 设置函数数组
   * @returns Builder 实例，支持链式调用
   *
   * @example 应用预设
   * ```typescript
   * const chinaDefaults = (b: AddressBuilder) => {
   *   b.country('China')
   * }
   *
   * const beijingDefaults = (b: AddressBuilder) => {
   *   b.state('Beijing')
   *   b.city('Beijing')
   * }
   *
   * const address = new AddressBuilder()
   *   .street('123 Main St')
   *   .apply(chinaDefaults, beijingDefaults)
   *   .build()
   * ```
   *
   * @example 插件系统
   * ```typescript
   * const plugins = [
   *   normalizationPlugin,
   *   validationPlugin,
   *   loggingPlugin
   * ]
   *
   * const address = builder.apply(...plugins).build()
   * ```
   */
  apply(...setters: Array<(builder: this) => void>): this {
    for (const setter of setters) {
      setter(this)
    }
    return this
  }
}

/**
 * 通用的值对象 Builder
 *
 * 可以用于快速创建简单的 Builder，不需要定义具体的子类。
 * 适合临时使用或简单场景，复杂场景建议继承 ValueObjectBuilder。
 *
 * 优势：
 * - 无需创建子类
 * - 快速原型开发
 * - 动态场景（运行时构建）
 *
 * 限制：
 * - 没有类型安全的 setter 方法
 * - 验证逻辑需要单独定义
 * - 不适合复杂业务逻辑
 *
 * @template T - 值对象类型
 * @template Props - 值对象属性类型
 *
 * @example 基本使用
 * ```typescript
 * interface MoneyProps {
 *   amount: number
 *   currency: string
 * }
 *
 * class Money extends ValueObject<MoneyProps> {
 *   protected validate(props: MoneyProps): void {
 *     if (props.amount < 0) throw new Error('Amount must be positive')
 *     if (!props.currency) throw new Error('Currency is required')
 *   }
 * }
 *
 * // 使用通用 Builder
 * const builder = GenericValueObjectBuilder.create(
 *   (props: MoneyProps) => new Money(props),
 *   (props) => {
 *     const errors: string[] = []
 *     if (!props.amount) errors.push('Amount is required')
 *     if (!props.currency) errors.push('Currency is required')
 *     return errors
 *   }
 * )
 *
 * const result = builder
 *   .set('amount', 100)
 *   .set('currency', 'USD')
 *   .build()
 * ```
 *
 * @example 快速原型
 * ```typescript
 * const emailBuilder = GenericValueObjectBuilder.create(
 *   (props: EmailProps) => new Email(props),
 *   (props) => props.value ? [] : ['Email is required']
 * )
 *
 * const email = emailBuilder
 *   .set('value', 'user@example.com')
 *   .build()
 * ```
 */
export class GenericValueObjectBuilder<
  T extends ValueObject<Props>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Props extends Record<string, any>
> extends ValueObjectBuilder<T, Props> {
  constructor(
    private readonly factory: (props: Props) => T,
    private readonly validator: (props: Partial<Props>) => string[],
    initialProps?: Partial<Props>
  ) {
    super(initialProps)
  }

  protected validate(): string[] {
    return this.validator(this.props)
  }

  protected createValueObject(): T {
    return this.factory(this.props as Props)
  }

  /**
   * 创建通用 Builder
   *
   * 静态工厂方法，用于创建 GenericValueObjectBuilder 实例。
   *
   * @param factory - 值对象工厂函数
   * @param validator - 验证函数
   * @param initialProps - 初始属性
   * @returns Builder 实例
   *
   * @example 创建并使用
   * ```typescript
   * const builder = GenericValueObjectBuilder.create(
   *   (props: AddressProps) => new Address(props),
   *   (props) => {
   *     const errors: string[] = []
   *     if (!props.street) errors.push('Street is required')
   *     return errors
   *   },
   *   { country: 'USA' } // 初始值
   * )
   *
   * const result = builder
   *   .set('street', '123 Main St')
   *   .set('city', 'New York')
   *   .build()
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static create<T extends ValueObject<Props>, Props extends Record<string, any>>(
    factory: (props: Props) => T,
    validator: (props: Partial<Props>) => string[],
    initialProps?: Partial<Props>
  ): GenericValueObjectBuilder<T, Props> {
    return new GenericValueObjectBuilder(factory, validator, initialProps)
  }
}
