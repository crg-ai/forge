import { EntityId } from './EntityId'

/**
 * 实体基类 - 混合模式设计
 *
 * DDD中的核心构建块，具有唯一标识符的领域对象
 *
 * 设计原则：
 * 1. 实体是可变的（与值对象不同，允许状态改变）
 * 2. 支持混合模式：纯 Props 或 直接属性 + Props 同步
 * 3. 选择性暴露：通过 getPrivateFields() 控制哪些字段不对外暴露
 * 4. 类型安全：通过泛型参数 PrivateKeys 在类型层面排除私有字段
 *
 * @template Props - 实体属性类型
 * @template BizId - 业务 ID 类型（string 或 number）
 * @template PrivateKeys - 需要排除的私有字段键（默认为 never，表示无私有字段）
 *
 * @example 纯 Props 模式（简单场景）
 * ```typescript
 * interface UserProps {
 *   email: string
 *   name: string
 *   passwordHash: string  // 私有字段
 * }
 *
 * class User extends Entity<UserProps, number, 'passwordHash'> {
 *   activate() {
 *     this.props.status = 'active'  // 直接修改 props
 *   }
 *
 *   protected getPrivateFields() {
 *     return ['passwordHash'] as const  // 敏感字段不对外暴露
 *   }
 * }
 *
 * const json = user.toJSON()
 * json.email       // ✅ string
 * json.passwordHash // ❌ TypeScript 编译错误：属性不存在
 * ```
 *
 * @example 混合模式（复杂聚合）
 * ```typescript
 * class Order extends Entity<OrderProps, string> {
 *   private _status: OrderStatus
 *   private _items: OrderItem[]
 *
 *   get status() { return this._status }
 *
 *   submit() {
 *     this._status = 'submitted'  // 修改直接属性
 *     // toObject() 时同步到 props
 *   }
 * }
 * ```
 */
export abstract class Entity<
  Props,
  BizId extends string | number = number,
  PrivateKeys extends keyof Props = never
> {
  protected readonly id: EntityId<BizId>
  protected props: Props

  protected constructor(props: Props, id?: EntityId<BizId>) {
    this.id = id ?? EntityId.create<BizId>()
    this.props = props
  }

  /**
   * 获取ID对象
   */
  getId(): EntityId<BizId> {
    return this.id
  }

  /**
   * 获取客户端ID
   */
  getClientId(): string {
    return this.id.getClientId()
  }

  /**
   * 获取业务ID
   */
  getBusinessId(): BizId | undefined {
    return this.id.getBusinessId()
  }

  /**
   * 设置业务ID（通常在持久化后调用）
   *
   * @param businessId - 业务ID
   * @throws 当业务ID已设置时抛出异常
   * @throws 当传入 null 或 undefined 时抛出异常
   */
  setBusinessId(businessId: BizId): void {
    this.id.setBusinessId(businessId)
  }

  /**
   * 是否是新实体
   */
  isNew(): boolean {
    return this.id.isNew()
  }

  /**
   * 【可选】子类覆盖此方法，声明不对外暴露的私有字段
   *
   * 这些字段将在 toJSON() 序列化时被自动排除
   *
   * 典型用途：
   * - 敏感信息：密码哈希、token、密钥
   * - 内部状态：调试信息、临时标记、缓存数据
   * - 不希望序列化的字段
   *
   * @returns 需要排除的字段键数组
   *
   * @example
   * ```typescript
   * protected getPrivateFields(): Array<keyof UserProps> {
   *   return ['passwordHash', 'securityToken', 'internalMemo']
   * }
   *
   * // toJSON() 自动排除这些字段
   * JSON.stringify(user) // 不含 passwordHash
   * ```
   */
  protected getPrivateFields?(): ReadonlyArray<keyof Props>

  /**
   * 【辅助方法】更新 props（可选使用）
   *
   * 提供一个便捷的方式来更新多个属性
   *
   * @param updates - 要更新的属性（部分）
   *
   * @example
   * ```typescript
   * // 方式1：直接修改（简洁）
   * this.props.email = email
   *
   * // 方式2：使用辅助方法（便捷）
   * this.updateProps({ email, name })
   * ```
   */
  protected updateProps(updates: Partial<Props>): void {
    this.props = { ...this.props, ...updates }
  }

  /**
   * 过滤私有字段的内部辅助方法
   *
   * 实现细节：
   * - 使用浅拷贝创建新对象（避免修改原始数据）
   * - 通过 delete 操作符移除私有字段
   * - 返回 Partial<Props> 因为可能移除了必填字段
   *
   * 性能考虑：
   * - 当无私有字段时，仅执行一次浅拷贝
   * - delete 操作是 O(n)，n 为私有字段数量
   *
   * @param data - 要过滤的数据
   * @returns 过滤后的数据（移除私有字段）
   */
  private filterPrivateFields(data: Props): Partial<Props> {
    const privateFields = this.getPrivateFields?.() || []

    // 没有私有字段，直接返回浅拷贝
    if (privateFields.length === 0) {
      return { ...data }
    }

    // 过滤掉私有字段
    const filtered = { ...data }
    privateFields.forEach(field => {
      delete filtered[field]
    })

    return filtered
  }

  /**
   * 判断相等性（基于 ID 和实体类型）
   *
   * DDD 原则：
   * 1. 实体通过 ID 判断相等（而非属性）
   * 2. 只有同类型的实体才能比较
   * 3. 不同类型的实体即使 ID 相同也不相等
   *
   * @param other - 要比较的实体
   * @returns 如果是相同类型且 ID 相等则返回 true
   *
   * @example
   * ```typescript
   * const user1 = new User({ ... }, id)
   * const user2 = new User({ ... }, id)
   * const order = new Order({ ... }, id)
   *
   * user1.equals(user2)  // true - 同类型，相同 ID
   * user1.equals(order)  // false - 不同类型
   * user1.equals(null)   // false - 空值检查
   * ```
   */
  equals(other?: Entity<Props, string | number, never>): boolean {
    // 1. 空值检查
    if (other == null) {
      return false
    }

    // 2. 类型检查：必须是 Entity 实例
    if (!(other instanceof Entity)) {
      return false
    }

    // 3. 构造函数检查：必须是同一个类
    // 确保 User 不会与 Order 相等，即使 ID 相同
    if (this.constructor !== other.constructor) {
      return false
    }

    // 5. ID 相等性判断
    return this.id.equals(other.id)
  }

  /**
   * 检查字段是否存在
   *
   * @param field - 字段名
   * @returns 如果字段值不为 undefined 和 null 则返回 true
   *
   * @example
   * ```typescript
   * if (this.hasField('email')) {
   *   console.log('Email exists:', this.props.email)
   * }
   * ```
   */
  protected hasField<K extends keyof Props>(field: K): boolean {
    const value = this.props[field]
    return value !== undefined && value !== null
  }

  /**
   * 确保字段存在，否则抛出错误
   *
   * @param field - 字段名
   * @param action - 操作描述（可选），用于生成友好的错误消息
   * @returns 字段的非空值
   * @throws 当字段不存在时抛出错误
   *
   * @example
   * ```typescript
   * // 基本用法
   * const email = this.ensureField('email')
   *
   * // 带操作描述
   * const email = this.ensureField('email', 'send notification')
   * // 错误消息：Cannot send notification: field 'email' is not loaded
   * ```
   */
  protected ensureField<K extends keyof Props>(field: K, action?: string): NonNullable<Props[K]> {
    const value = this.props[field]

    if (value === undefined || value === null) {
      const fieldName = String(field)
      const msg =
        action !== undefined && action !== ''
          ? `Cannot ${action}: field '${fieldName}' is not loaded`
          : `Field '${fieldName}' is not loaded`
      throw new Error(msg)
    }

    return value as NonNullable<Props[K]>
  }

  /**
   * 确保多个字段都存在，否则抛出错误
   *
   * @param fields - 字段名数组
   * @param action - 操作描述（可选），用于生成友好的错误消息
   * @throws 当任一字段不存在时抛出错误，错误消息会列出所有缺失的字段
   *
   * @example
   * ```typescript
   * // 基本用法
   * this.ensureFields(['email', 'name', 'phone'])
   *
   * // 带操作描述
   * this.ensureFields(['orderNo', 'amount', 'status'], 'process payment')
   * // 错误消息：Cannot process payment: missing fields [amount, status]
   *
   * // 在业务方法中使用
   * pay(transactionId: string): void {
   *   this.ensureFields(['orderNo', 'status', 'amount'], 'pay order')
   *   // ... 业务逻辑
   * }
   * ```
   */
  protected ensureFields(fields: Array<keyof Props>, action?: string): void {
    const missingFields: string[] = []

    for (const field of fields) {
      const value = this.props[field]
      if (value === undefined || value === null) {
        missingFields.push(String(field))
      }
    }

    if (missingFields.length > 0) {
      const msg =
        action !== undefined && action !== ''
          ? `Cannot ${action}: missing fields [${missingFields.join(', ')}]`
          : `Missing required fields: [${missingFields.join(', ')}]`
      throw new Error(msg)
    }
  }

  /**
   * 序列化为扁平化 JSON 对象（自动排除私有字段）
   *
   * 返回扁平化的对象，包含 ID 信息和公开属性，方便前端直接使用
   * 序列化结果会自动排除通过 getPrivateFields() 声明的私有字段
   *
   * 类型说明：
   * - 公开字段保持原始的必填/可选状态（不会变成全部可选）
   * - 私有字段通过 Omit<Props, PrivateKeys> 在类型层面精确排除
   * - ID 字段始终包含：clientId (必填)、businessId (可选)
   *
   * @returns 扁平化对象，包含 clientId、businessId 和所有公开属性
   *
   * @example
   * ```typescript
   * // 定义实体（指定私有字段类型）
   * interface UserProps {
   *   email: string        // 必填
   *   name: string         // 必填
   *   age?: number         // 可选
   *   passwordHash: string // 私有字段
   * }
   *
   * class User extends Entity<UserProps, number, 'passwordHash'> {
   *   protected getPrivateFields() {
   *     return ['passwordHash'] as const
   *   }
   * }
   *
   * const user = new User({ email: 'test@example.com', name: 'John', passwordHash: 'xxx' })
   * const json = user.toJSON()
   *
   * // ✅ 类型安全：必填字段仍然是必填的
   * json.clientId    // string (必填)
   * json.businessId  // number | undefined (可选)
   * json.email       // string (必填，继承自 Props)
   * json.name        // string (必填，继承自 Props)
   * json.age         // number | undefined (可选，继承自 Props)
   * json.passwordHash // ❌ TypeScript 编译错误：属性 'passwordHash' 不存在
   *
   * // ✅ 支持直接解构
   * const { clientId, email, name } = user.toJSON()
   *
   * // ✅ 前端使用场景
   * setState(json)                      // 状态管理
   * <Input defaultValue={json.email} /> // 表单回显
   * await api.post('/users', json)      // API 请求
   *
   * // ✅ 支持 JSON.stringify 自动调用
   * JSON.stringify(user) // 自动调用 toJSON()
   * ```
   */
  toJSON(): {
    clientId: string
    businessId?: BizId
  } & Omit<Props, PrivateKeys> {
    const idData = this.id.toJSON()
    const publicProps = this.filterPrivateFields(this.props)

    // 类型断言：运行时通过 filterPrivateFields() 保证只包含公开字段
    // Omit<Props, PrivateKeys> 在编译时保证类型安全
    return {
      clientId: idData.clientId,
      businessId: idData.businessId,
      ...publicProps
    } as unknown as { clientId: string; businessId?: BizId } & Omit<Props, PrivateKeys>
  }
}
