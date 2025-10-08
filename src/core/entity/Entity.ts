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
   * 获取实体的唯一标识符对象
   *
   * 返回完整的 EntityId 对象，包含客户端 ID 和业务 ID
   *
   * @returns EntityId 对象，包含客户端 ID（必有）和业务 ID（可选）
   *
   * @example
   * ```typescript
   * const user = User.create({ email: 'test@example.com', name: 'John' })
   * const id = user.getId()
   *
   * id.getClientId()    // 'cli_xxxxx' - 客户端生成的唯一标识
   * id.getBusinessId()  // undefined - 新实体未持久化
   *
   * // 持久化后设置业务 ID
   * user.setBusinessId(1001)
   * id.getBusinessId()  // 1001
   * ```
   *
   * @see {@link EntityId} - 实体标识符的实现细节
   * @see {@link getClientId} - 获取客户端 ID
   * @see {@link getBusinessId} - 获取业务 ID
   */
  getId(): EntityId<BizId> {
    return this.id
  }

  /**
   * 获取客户端生成的唯一标识符
   *
   * 客户端 ID 在实体创建时自动生成，用于在未持久化前唯一标识实体
   * 这对于客户端临时存储、乐观更新等场景非常有用
   *
   * @returns 客户端 ID 字符串，格式为 'cli_' 前缀 + UUID
   *
   * @example
   * ```typescript
   * const user = User.create({ email: 'test@example.com', name: 'John' })
   *
   * // 新实体立即拥有客户端 ID
   * user.getClientId()  // 'cli_7f8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o'
   *
   * // 可用于客户端缓存键
   * cache.set(user.getClientId(), user)
   *
   * // 持久化后仍然保留客户端 ID
   * user.setBusinessId(1001)
   * user.getClientId()  // 仍然是 'cli_7f8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o'
   * ```
   *
   * @see {@link getId} - 获取完整 ID 对象
   * @see {@link getBusinessId} - 获取业务 ID
   * @see {@link isNew} - 检查是否为新实体
   */
  getClientId(): string {
    return this.id.getClientId()
  }

  /**
   * 获取服务端分配的业务标识符
   *
   * 业务 ID 由服务端（数据库）在持久化时生成，通常是自增 ID 或数据库主键
   * 新创建的实体在持久化前业务 ID 为 undefined
   *
   * @returns 业务 ID（如果已持久化），否则返回 undefined
   *
   * @example
   * ```typescript
   * // 新实体没有业务 ID
   * const user = User.create({ email: 'test@example.com', name: 'John' })
   * user.getBusinessId()  // undefined
   * user.isNew()          // true
   *
   * // 持久化后设置业务 ID
   * const savedUser = await repository.save(user)
   * savedUser.setBusinessId(1001)
   * savedUser.getBusinessId()  // 1001
   * savedUser.isNew()          // false
   *
   * // 用于构建 API URL
   * if (!user.isNew()) {
   *   const url = `/api/users/${user.getBusinessId()}`
   * }
   * ```
   *
   * @see {@link setBusinessId} - 设置业务 ID
   * @see {@link isNew} - 检查是否为新实体
   * @see {@link getClientId} - 获取客户端 ID
   */
  getBusinessId(): BizId | undefined {
    return this.id.getBusinessId()
  }

  /**
   * 设置服务端分配的业务标识符
   *
   * 此方法通常在实体首次持久化后由仓储层调用，用于设置数据库生成的主键
   * 业务 ID 一旦设置后不可修改，重复设置会抛出异常
   *
   * @param businessId - 服务端分配的业务 ID（数字或字符串）
   * @throws {Error} 当业务 ID 已经设置时（防止重复设置）
   * @throws {Error} 当传入 null 或 undefined 时
   *
   * @example
   * ```typescript
   * // 在 Repository 实现中调用
   * class UserRepositoryImpl implements UserRepository {
   *   async save(user: User): Promise<void> {
   *     if (user.isNew()) {
   *       // 插入数据库并获取自增 ID
   *       const result = await db.insert('users', user.toJSON())
   *       user.setBusinessId(result.insertId)  // 设置业务 ID
   *     } else {
   *       // 更新已存在的记录
   *       await db.update('users', user.getBusinessId(), user.toJSON())
   *     }
   *   }
   * }
   *
   * // 错误用法示例
   * const user = User.create({ email: 'test@example.com' })
   * user.setBusinessId(1001)
   * user.setBusinessId(1002)  // ❌ 抛出异常：业务 ID 已设置
   * ```
   *
   * @see {@link getBusinessId} - 获取业务 ID
   * @see {@link isNew} - 检查是否为新实体
   */
  setBusinessId(businessId: BizId): void {
    this.id.setBusinessId(businessId)
  }

  /**
   * 判断实体是否为新创建的（未持久化）
   *
   * 通过检查业务 ID 是否存在来判断实体是否已持久化到数据库
   * 这对于决定执行 INSERT 还是 UPDATE 操作非常有用
   *
   * @returns 如果业务 ID 未设置返回 true，已设置返回 false
   *
   * @example
   * ```typescript
   * // 新创建的实体
   * const user = User.create({ email: 'test@example.com', name: 'John' })
   * user.isNew()  // true - 尚未持久化
   *
   * // 持久化后
   * user.setBusinessId(1001)
   * user.isNew()  // false - 已持久化
   *
   * // 在仓储中使用
   * async save(user: User): Promise<void> {
   *   if (user.isNew()) {
   *     await this.insert(user)  // 新实体，执行 INSERT
   *   } else {
   *     await this.update(user)  // 已存在，执行 UPDATE
   *   }
   * }
   *
   * // 在 UI 中使用
   * const buttonText = user.isNew() ? '创建' : '更新'
   * const apiMethod = user.isNew() ? 'POST' : 'PUT'
   * ```
   *
   * @see {@link getBusinessId} - 获取业务 ID
   * @see {@link setBusinessId} - 设置业务 ID
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
   * 批量更新实体属性（辅助方法）
   *
   * 提供一个便捷且类型安全的方式来更新多个属性，使用对象展开语法创建新的 props 对象
   * 这在需要同时修改多个属性时比逐个赋值更简洁
   *
   * @param updates - 要更新的属性（部分），支持任意 Props 的子集
   *
   * @example
   * ```typescript
   * class User extends Entity<UserProps, number> {
   *   // 方式1：直接修改单个属性（简洁明了）
   *   changeEmail(email: string): void {
   *     this.props.email = email
   *   }
   *
   *   // 方式2：使用 updateProps 批量更新（便捷）
   *   updateProfile(name: string, email: string, age: number): void {
   *     this.updateProps({ name, email, age })
   *   }
   *
   *   // 方式3：部分更新（类型安全）
   *   updateMetadata(updates: Partial<UserProps>): void {
   *     this.updateProps(updates)  // TypeScript 会检查类型
   *   }
   * }
   *
   * // 使用示例
   * const user = User.create({ name: 'John', email: 'john@example.com', age: 25 })
   *
   * // 批量更新
   * user.updateProfile('Jane', 'jane@example.com', 26)
   *
   * // 部分更新
   * user.updateMetadata({ age: 27 })
   * ```
   *
   * @remarks
   * 注意：此方法使用浅拷贝（shallow copy），如果 Props 包含嵌套对象，
   * 需要注意对象引用问题。建议嵌套对象使用值对象模式确保不可变性。
   */
  protected updateProps(updates: Partial<Props>): void {
    this.props = { ...this.props, ...updates }
  }

  /**
   * 过滤私有字段的内部辅助方法
   *
   * 在序列化（toJSON）时自动移除通过 getPrivateFields() 声明的私有字段
   * 这是一个内部实现细节，子类通常不需要直接调用此方法
   *
   * @param data - 要过滤的实体属性对象
   * @returns 移除私有字段后的对象（Partial 类型，因为可能移除了必填字段）
   *
   * @internal
   *
   * @remarks
   * **实现细节：**
   * - 使用浅拷贝创建新对象（避免修改原始数据）
   * - 通过 delete 操作符移除私有字段
   * - 返回 Partial<Props> 因为可能移除了必填字段
   *
   * **性能考虑：**
   * - 当无私有字段时：O(1)，仅执行一次浅拷贝
   * - 当有私有字段时：O(n)，n 为私有字段数量
   *
   * **类型安全：**
   * - 运行时通过 delete 确保私有字段被移除
   * - 编译时通过 Omit<Props, PrivateKeys> 确保类型安全
   *
   * @example
   * ```typescript
   * // 内部调用流程
   * interface UserProps {
   *   email: string
   *   name: string
   *   passwordHash: string  // 私有字段
   * }
   *
   * class User extends Entity<UserProps, number, 'passwordHash'> {
   *   protected getPrivateFields() {
   *     return ['passwordHash'] as const
   *   }
   *
   *   toJSON() {
   *     // 内部调用 filterPrivateFields
   *     const publicProps = this.filterPrivateFields(this.props)
   *     // publicProps 不包含 passwordHash
   *     return { ...publicProps, clientId: this.getClientId() }
   *   }
   * }
   * ```
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
   * 检查字段是否存在且非空
   *
   * 用于检查实体属性是否已加载或设置，防止访问 undefined/null 字段
   * 这在部分加载（partial loading）或懒加载（lazy loading）场景下特别有用
   *
   * @param field - 要检查的字段名（类型安全，必须是 Props 的键）
   * @returns 如果字段值不为 undefined 和 null 则返回 true，否则返回 false
   *
   * @example
   * ```typescript
   * interface UserProps {
   *   email: string
   *   name: string
   *   profile?: UserProfile  // 可选字段，可能未加载
   * }
   *
   * class User extends Entity<UserProps, number> {
   *   // 安全访问可选字段
   *   getProfileSummary(): string {
   *     if (this.hasField('profile')) {
   *       return this.props.profile.bio
   *     }
   *     return 'No profile information'
   *   }
   *
   *   // 条件执行业务逻辑
   *   sendWelcomeEmail(): void {
   *     if (this.hasField('email')) {
   *       emailService.send(this.props.email, 'Welcome!')
   *     }
   *   }
   * }
   *
   * // 部分加载场景
   * const user = await repository.findById(1, { fields: ['name'] })  // 只加载 name
   * user.hasField('name')     // true
   * user.hasField('profile')  // false - 未加载
   * ```
   *
   * @see {@link ensureField} - 确保字段存在，否则抛出异常
   * @see {@link ensureFields} - 确保多个字段都存在
   */
  protected hasField<K extends keyof Props>(field: K): boolean {
    const value = this.props[field]
    return value !== undefined && value !== null
  }

  /**
   * 确保字段存在且非空，否则抛出异常
   *
   * 用于在业务方法中强制要求某个字段必须存在，提供类型安全的非空断言
   * 相比 hasField，此方法在字段缺失时直接抛出异常，适合必需字段的场景
   *
   * @param field - 要检查的字段名（类型安全，必须是 Props 的键）
   * @param action - 操作描述（可选），用于生成更友好的错误消息
   * @returns 字段的非空值（类型为 NonNullable<Props[K]>）
   * @throws {Error} 当字段值为 undefined 或 null 时抛出异常
   *
   * @example
   * ```typescript
   * interface OrderProps {
   *   orderNo: string
   *   amount?: number     // 可选字段
   *   status?: string     // 可选字段
   * }
   *
   * class Order extends Entity<OrderProps, number> {
   *   // 基本用法：确保字段存在
   *   submit(): void {
   *     const amount = this.ensureField('amount')
   *     // TypeScript 知道 amount 是 number 类型（非 undefined）
   *     console.log(amount.toFixed(2))  // ✅ 类型安全
   *   }
   *
   *   // 带操作描述：提供更清晰的错误消息
   *   processPayment(): void {
   *     const amount = this.ensureField('amount', 'process payment')
   *     const status = this.ensureField('status', 'process payment')
   *     // 错误消息：Cannot process payment: field 'amount' is not loaded
   *
   *     paymentService.charge(amount)
   *   }
   *
   *   // 多个字段检查（推荐使用 ensureFields）
   *   ship(): void {
   *     const orderNo = this.ensureField('orderNo', 'ship order')
   *     const status = this.ensureField('status', 'ship order')
   *     // 业务逻辑...
   *   }
   * }
   *
   * // 使用场景
   * const order = await repository.findById(1, { fields: ['orderNo'] })
   * order.processPayment()  // ❌ 抛出异常：Cannot process payment: field 'amount' is not loaded
   * ```
   *
   * @see {@link hasField} - 检查字段是否存在（不抛异常）
   * @see {@link ensureFields} - 确保多个字段都存在
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
   * 批量确保多个字段都存在且非空，否则抛出异常
   *
   * 用于在业务方法执行前验证多个必需字段，一次性检查所有缺失字段
   * 相比多次调用 ensureField，此方法提供更好的错误提示（列出所有缺失字段）
   *
   * @param fields - 要检查的字段名数组（类型安全，必须是 Props 的键）
   * @param action - 操作描述（可选），用于生成更友好的错误消息
   * @throws {Error} 当任一字段不存在时抛出异常，错误消息会列出所有缺失的字段
   *
   * @example
   * ```typescript
   * interface OrderProps {
   *   orderNo: string
   *   amount?: number
   *   status?: string
   *   customerId?: string
   * }
   *
   * class Order extends Entity<OrderProps, number> {
   *   // 基本用法：确保多个字段都存在
   *   validate(): void {
   *     this.ensureFields(['orderNo', 'amount', 'status'])
   *     // 所有字段都必须存在，否则抛出异常
   *   }
   *
   *   // 带操作描述：提供业务上下文
   *   processPayment(): void {
   *     this.ensureFields(['orderNo', 'amount', 'status'], 'process payment')
   *     // 错误消息：Cannot process payment: missing fields [amount, status]
   *
   *     // 此处所有字段都已确保存在，可以安全使用
   *     paymentService.charge(this.props.amount!)
   *   }
   *
   *   // 复杂业务方法：验证多个前置条件
   *   ship(trackingNo: string): void {
   *     // 1. 确保必需字段都已加载
   *     this.ensureFields(['orderNo', 'status', 'amount', 'customerId'], 'ship order')
   *
   *     // 2. 验证业务规则
   *     if (this.props.status !== 'paid') {
   *       throw new Error('只有已支付订单可以发货')
   *     }
   *
   *     // 3. 执行业务逻辑
   *     this.props.status = 'shipped'
   *     this.props.trackingNo = trackingNo
   *   }
   * }
   *
   * // 使用场景1：部分加载导致字段缺失
   * const order = await repository.findById(1, { fields: ['orderNo'] })
   * order.processPayment()
   * // ❌ 抛出异常：Cannot process payment: missing fields [amount, status]
   *
   * // 使用场景2：所有字段都存在
   * const fullOrder = await repository.findById(1)
   * fullOrder.processPayment()  // ✅ 成功执行
   *
   * // 对比单个字段检查
   * // ❌ 不推荐：需要多次检查，错误消息不完整
   * this.ensureField('amount', 'process payment')
   * this.ensureField('status', 'process payment')
   * this.ensureField('orderNo', 'process payment')
   *
   * // ✅ 推荐：一次性检查，错误消息完整
   * this.ensureFields(['amount', 'status', 'orderNo'], 'process payment')
   * ```
   *
   * @remarks
   * **优势：**
   * - 一次性列出所有缺失字段，便于调试
   * - 减少代码重复，提高可读性
   * - 类型安全，编译时检查字段名
   *
   * **适用场景：**
   * - 复杂业务方法需要多个字段
   * - 部分加载（partial loading）场景
   * - 懒加载（lazy loading）场景
   *
   * @see {@link ensureField} - 确保单个字段存在
   * @see {@link hasField} - 检查字段是否存在（不抛异常）
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
