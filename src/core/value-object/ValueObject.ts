import { deepFreeze } from '../../utils/deepFreeze'
import { deepEquals } from '../../utils/deepEquals'
import { deepClone } from '../../utils/deepClone'
import { Result } from '../shared/Result'

/**
 * 值对象抽象基类
 *
 * 值对象特点：
 * - 不可变性：创建后不能修改
 * - 值相等：通过值判断相等性，而非引用
 * - 无标识符：不需要唯一 ID
 * - 可替换性：可以用另一个值相同的对象替换
 * - 自我验证：创建时验证有效性
 *
 * @template Props 值对象的属性类型，必须是 Record<string, any>
 *
 * @example
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
 *   static create(value: string): Result<Email, string> {
 *     if (!value || !value.includes('@')) {
 *       return Result.fail('Invalid email address')
 *     }
 *     return Result.ok(new Email({ value: value.toLowerCase().trim() }))
 *   }
 *
 *   protected validate(props: EmailProps): void {
 *     if (!props.value || !props.value.includes('@')) {
 *       throw new Error('Invalid email address')
 *     }
 *   }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class ValueObject<Props extends Record<string, any>> {
  protected readonly props: Props

  /**
   * 构造函数
   *
   * @param props 值对象的属性
   * @throws 如果验证失败，抛出错误
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
   * 子类必须实现此方法来验证属性
   * 如果验证失败，应抛出错误
   *
   * @param props 要验证的属性
   * @throws 如果验证失败，抛出错误
   */
  protected abstract validate(props: Props): void

  /**
   * 判断两个值对象是否相等
   *
   * 通过深度比较所有属性值来判断相等性
   *
   * @param other 要比较的值对象
   * @returns 如果值相等返回 true，否则返回 false
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
   * @returns 属性的只读副本
   */
  getValue(): Readonly<Props> {
    return this.props
  }

  /**
   * 转换为普通对象
   *
   * @returns 属性的只读副本
   */
  toObject(): Readonly<Props> {
    return this.props
  }

  /**
   * 创建修改后的副本
   *
   * 返回一个新的值对象实例，其中包含部分修改的属性
   * 这是实现"修改"操作的推荐方式，保持不可变性
   *
   * @param partial 要修改的部分属性
   * @returns 新的值对象实例
   *
   * @example
   * ```typescript
   * const email = Email.create('user@example.com')
   * const newEmail = email.with({ value: 'newuser@example.com' })
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
   * @returns 可 JSON 序列化的对象
   */
  toJSON(): unknown {
    return this.toObject()
  }

  /**
   * 转换为字符串
   *
   * 默认返回 JSON 字符串表示
   * 子类可以重写此方法提供更有意义的字符串表示
   *
   * @returns 字符串表示
   */
  toString(): string {
    return JSON.stringify(this.toJSON())
  }

  /**
   * 获取值的哈希码
   *
   * 用于在 Map 或 Set 中使用值对象作为键
   * 默认使用 JSON 字符串作为哈希
   * 子类可以重写此方法提供更高效的哈希算法
   *
   * @returns 哈希码字符串
   */
  hashCode(): string {
    return this.toString()
  }

  /**
   * 类型守卫：检查是否为值对象
   *
   * @param value 要检查的值
   * @returns 如果是值对象返回 true，否则返回 false
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static isValueObject(value: unknown): value is ValueObject<Record<string, any>> {
    return value instanceof ValueObject
  }

  /**
   * 从普通对象创建值对象（工厂方法模板）
   *
   * 子类应该重写此方法，提供具体的创建逻辑
   *
   * @param props 属性对象
   * @returns Result 包装的值对象
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
   * @param propsList 属性对象数组
   * @returns Result 包装的值对象数组
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
   * 由于值对象是不可变的，克隆实际上返回自身
   *
   * @returns 值对象本身
   */
  clone(): this {
    return this
  }

  /**
   * 检查属性是否包含指定的键值对
   *
   * @param key 属性键
   * @param value 期望的值
   * @returns 如果包含返回 true，否则返回 false
   */
  has<K extends keyof Props>(key: K, value: Props[K]): boolean {
    return deepEquals(this.props[key], value)
  }

  /**
   * 获取指定属性的值
   *
   * @param key 属性键
   * @returns 属性值
   */
  get<K extends keyof Props>(key: K): Props[K] {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.props[key]
  }

  /**
   * 检查是否为空值对象
   *
   * 默认检查所有属性是否为 null、undefined 或空字符串
   * 子类可以重写此方法提供自定义的空值检查逻辑
   *
   * @returns 如果为空返回 true，否则返回 false
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
   * 默认尝试重新验证属性
   * 子类可以重写此方法提供自定义的有效性检查
   *
   * @returns 如果有效返回 true，否则返回 false
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
