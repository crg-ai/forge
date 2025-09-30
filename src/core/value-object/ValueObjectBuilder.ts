import { Result } from '../shared/Result'
import type { ValueObject } from './ValueObject'

/**
 * 值对象 Builder 基类
 *
 * 提供流式 API 来构建复杂的值对象，特别适合有多个属性的值对象
 *
 * @template T 值对象类型
 * @template Props 值对象属性类型
 *
 * @example
 * ```typescript
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
 *   zipCode(value: string): this {
 *     this.props.zipCode = value
 *     return this
 *   }
 *
 *   protected validate(): string[] {
 *     const errors: string[] = []
 *     if (!this.props.street) errors.push('Street is required')
 *     if (!this.props.city) errors.push('City is required')
 *     if (!this.props.zipCode) errors.push('Zip code is required')
 *     return errors
 *   }
 *
 *   protected createValueObject(): Address {
 *     return new Address(this.props as AddressProps)
 *   }
 * }
 *
 * // 使用
 * const result = new AddressBuilder()
 *   .street('123 Main St')
 *   .city('New York')
 *   .zipCode('10001')
 *   .build()
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
      return Result.fail([(error as Error).message])
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
 *
 * @template T 值对象类型
 * @template Props 值对象属性类型
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
