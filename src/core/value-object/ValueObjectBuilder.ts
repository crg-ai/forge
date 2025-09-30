import { Result } from '../shared/Result'
import type { ValueObject } from './ValueObject'

/**
 * 值对象 Builder 基类
 *
 * 提供流式 API 来构建复杂的值对象，特别适合有多个属性的值对象
 *
 * 适用场景：
 * - 值对象有 3 个以上属性
 * - 需要复杂的验证逻辑
 * - 需要条件性构建（when、apply）
 * - 需要表单绑定场景
 *
 * @template T 值对象类型
 * @template Props 值对象属性类型
 *
 * @example 完整的地址 Builder
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
 * // 4. 使用 Builder
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
 * @example React 表单集成
 * ```typescript
 * function AddressForm() {
 *   const [builder] = useState(() => new AddressBuilder())
 *   const [errors, setErrors] = useState<string[]>([])
 *
 *   const handleSubmit = () => {
 *     const result = builder.build()
 *     if (result.isFailure) {
 *       setErrors(result.error)
 *       return
 *     }
 *     // 提交表单
 *     submitAddress(result.value)
 *   }
 *
 *   return (
 *     <form>
 *       <input onChange={e => builder.street(e.target.value)} />
 *       <input onChange={e => builder.city(e.target.value)} />
 *       {errors.map(err => <div>{err}</div>)}
 *       <button onClick={handleSubmit}>Submit</button>
 *     </form>
 *   )
 * }
 * ```
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
   * @param initialProps 初始属性（可选）
   */
  constructor(initialProps?: Partial<Props>) {
    if (initialProps) {
      this.props = { ...initialProps }
    }
  }

  /**
   * 验证当前属性
   *
   * 子类必须实现此方法来验证属性的完整性和有效性
   *
   * @returns 错误消息数组，如果没有错误返回空数组
   */
  protected abstract validate(): string[]

  /**
   * 创建值对象实例
   *
   * 子类必须实现此方法来创建具体的值对象
   *
   * @returns 值对象实例
   */
  protected abstract createValueObject(): T

  /**
   * 从对象批量设置属性
   *
   * @param obj 包含属性的对象
   * @returns Builder 实例，支持链式调用
   */
  fromObject(obj: Partial<Props>): this {
    Object.assign(this.props, obj)
    return this
  }

  /**
   * 设置单个属性
   *
   * @param key 属性键
   * @param value 属性值
   * @returns Builder 实例，支持链式调用
   */
  set<K extends keyof Props>(key: K, value: Props[K]): this {
    this.props[key] = value
    return this
  }

  /**
   * 获取单个属性值
   *
   * @param key 属性键
   * @returns 属性值
   */
  get<K extends keyof Props>(key: K): Props[K] | undefined {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.props[key]
  }

  /**
   * 检查是否有指定属性
   *
   * @param key 属性键
   * @returns 如果有返回 true，否则返回 false
   */
  has<K extends keyof Props>(key: K): boolean {
    return key in this.props && this.props[key] !== undefined
  }

  /**
   * 清除单个属性
   *
   * @param key 属性键
   * @returns Builder 实例，支持链式调用
   */
  clear<K extends keyof Props>(key: K): this {
    delete this.props[key]
    return this
  }

  /**
   * 清除所有属性
   *
   * @returns Builder 实例，支持链式调用
   */
  clearAll(): this {
    this.props = {}
    return this
  }

  /**
   * 获取当前所有属性
   *
   * @returns 属性的副本
   */
  getProps(): Partial<Props> {
    return { ...this.props }
  }

  /**
   * 构建值对象
   *
   * @returns Result 包装的值对象，如果验证失败返回错误
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
   * 尝试构建值对象
   *
   * @returns Result 包装的值对象，错误信息合并为字符串
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
   * @returns 如果有效返回 true，否则返回 false
   */
  isValid(): boolean {
    return this.validate().length === 0
  }

  /**
   * 获取验证错误
   *
   * @returns 错误消息数组
   */
  getErrors(): string[] {
    return this.validate()
  }

  /**
   * 克隆 Builder
   *
   * @returns 新的 Builder 实例，包含相同的属性
   */
  clone(): this {
    const Constructor = this.constructor as new (props?: Partial<Props>) => this
    return new Constructor(this.props)
  }

  /**
   * 条件设置
   *
   * 根据条件决定是否执行设置操作
   *
   * @param condition 条件
   * @param fn 设置函数
   * @returns Builder 实例，支持链式调用
   */
  when(condition: boolean, fn: (builder: this) => void): this {
    if (condition) {
      fn(this)
    }
    return this
  }

  /**
   * 应用转换
   *
   * 应用一个转换函数到 Builder
   *
   * @param fn 转换函数
   * @returns 转换后的结果
   */
  pipe<R>(fn: (builder: this) => R): R {
    return fn(this)
  }

  /**
   * 批量应用多个设置
   *
   * @param setters 设置函数数组
   * @returns Builder 实例，支持链式调用
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
 * 可以用于快速创建简单的 Builder，不需要定义具体的子类
 * 适合临时使用或简单场景，复杂场景建议继承 ValueObjectBuilder
 *
 * @template T 值对象类型
 * @template Props 值对象属性类型
 *
 * @example
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
   * @param factory 值对象工厂函数
   * @param validator 验证函数
   * @param initialProps 初始属性
   * @returns Builder 实例
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
