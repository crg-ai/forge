import { generateUUID } from '../../utils/uuid'

/**
 * 实体ID - 支持客户端ID和双业务ID模式
 *
 * 设计原则：
 * 1. 客户端ID永不改变 - 保证前端状态稳定
 * 2. 支持双业务ID - 满足数据库双主键设计需求
 * 3. 智能相等性判断 - 正确处理双ID比较
 *
 * 边界条件处理：
 * - null/undefined ID 值会触发异常（setter 方法）
 * - 业务ID只能设置一次（防止误操作）
 * - 所有 getter 返回 undefined 而非 null（一致性）
 *
 * @template T - 业务ID类型，支持 string 或 number，默认为 number
 */
export class EntityId<T extends string | number = number> {
  /**
   * 客户端ID - UUID，创建时生成，永不改变
   */
  private readonly clientId: string

  /**
   * 主业务ID - 后端返回的主要标识符
   * 例如：数据库主键 id
   */
  private primaryBusinessId?: T

  /**
   * 次要业务ID - 另一个业务维度的唯一标识符
   * 例如：员工号、外部系统ID、遗留系统ID等
   */
  private secondaryBusinessId?: T

  /**
   * 创建时间戳 - 用于调试和审计
   */
  private readonly createdAt: number

  private constructor(clientId?: string) {
    this.clientId = clientId ?? generateUUID()
    this.createdAt = Date.now()
  }

  /**
   * 创建新的EntityId（生成UUID）
   */
  static create<T extends string | number = number>(): EntityId<T> {
    return new EntityId<T>()
  }

  /**
   * 从已有数据恢复 EntityId
   *
   * 用于反序列化场景（从数据库、LocalStorage、API 响应中恢复）
   *
   * @param data - 包含 ID 信息的对象
   * @returns 恢复的 EntityId 实例
   *
   * @example 从后端响应恢复
   * ```typescript
   * const userData = await api.get('/user/123')
   * const userId = EntityId.restore(userData)
   * const user = new User(userData, userId)
   * ```
   *
   * @example 兼容旧版本数据
   * ```typescript
   * // v1.x 数据格式
   * const oldData = { clientId: 'uuid-123', businessId: 1 }
   * const id = EntityId.restore(oldData) // 自动映射到 primaryBusinessId
   * ```
   */
  static restore<T extends string | number = number>(data: {
    clientId: string
    primaryBusinessId?: T
    secondaryBusinessId?: T
    // @deprecated since v2.0.0 - Use primaryBusinessId instead
    businessId?: T
  }): EntityId<T> {
    const id = new EntityId<T>(data.clientId)

    // 兼容旧版本的 businessId
    if (data.primaryBusinessId !== undefined) {
      id.primaryBusinessId = data.primaryBusinessId
    } else if (data.businessId !== undefined) {
      id.primaryBusinessId = data.businessId
    }

    if (data.secondaryBusinessId !== undefined) {
      id.secondaryBusinessId = data.secondaryBusinessId
    }

    return id
  }

  /**
   * 获取客户端ID（UUID）
   */
  getClientId(): string {
    return this.clientId
  }

  /**
   * 获取主业务ID
   */
  getPrimaryBusinessId(): T | undefined {
    return this.primaryBusinessId
  }

  /**
   * 获取业务ID
   *
   * @deprecated since v2.0.0 - Use getPrimaryBusinessId() instead
   * @returns 主业务ID（可能为 undefined）
   */
  getBusinessId(): T | undefined {
    return this.primaryBusinessId
  }

  /**
   * 设置主业务ID（只能设置一次）
   *
   * 通常在实体持久化后调用，保存后端返回的数据库主键
   *
   * @param id - 主业务ID
   * @throws 当业务ID已设置时抛出异常（防止重复设置）
   * @throws 当传入 null 或 undefined 时抛出异常
   *
   * @example 持久化后设置
   * ```typescript
   * const user = User.create({ email: 'test@example.com' })
   * const savedData = await userRepository.save(user)
   * user.getId().setPrimaryBusinessId(savedData.id) // 设置数据库主键
   * ```
   */
  setPrimaryBusinessId(id: T): void {
    if (this.primaryBusinessId !== undefined) {
      throw new Error('Primary business ID has already been set')
    }

    if (id === null || id === undefined) {
      throw new Error('Primary business ID cannot be null or undefined')
    }

    this.primaryBusinessId = id
  }

  /**
   * 设置业务ID
   *
   * @deprecated since v2.0.0 - Use setPrimaryBusinessId() instead
   * @param id - 业务ID
   * @throws 当业务ID已设置时抛出异常
   * @throws 当传入 null 或 undefined 时抛出异常
   */
  setBusinessId(id: T): void {
    if (this.primaryBusinessId !== undefined) {
      throw new Error('Business ID has already been set')
    }

    if (id === null || id === undefined) {
      throw new Error('Business ID cannot be null or undefined')
    }

    this.primaryBusinessId = id
  }

  /**
   * 获取次要业务ID
   */
  getSecondaryBusinessId(): T | undefined {
    return this.secondaryBusinessId
  }

  /**
   * 设置次要业务ID（只能设置一次）
   *
   * 用于设置另一个业务维度的唯一标识符（如员工号、外部系统ID）
   *
   * @param id - 次要业务ID
   * @throws 当次要业务ID已设置时抛出异常（防止重复设置）
   * @throws 当传入 null 或 undefined 时抛出异常
   *
   * @example 员工系统集成
   * ```typescript
   * const user = User.create({ name: 'John' })
   * user.getId().setPrimaryBusinessId(123)    // 数据库主键
   * user.getId().setSecondaryBusinessId('E001') // 员工号
   * ```
   */
  setSecondaryBusinessId(id: T): void {
    if (this.secondaryBusinessId !== undefined) {
      throw new Error('Secondary business ID has already been set')
    }

    if (id === null || id === undefined) {
      throw new Error('Secondary business ID cannot be null or undefined')
    }

    this.secondaryBusinessId = id
  }

  /**
   * 是否有主业务ID
   */
  hasPrimaryBusinessId(): boolean {
    return this.primaryBusinessId !== undefined
  }

  /**
   * 是否有业务ID
   *
   * @deprecated since v2.0.0 - Use hasPrimaryBusinessId() instead
   * @returns 如果有主业务ID返回 true，否则返回 false
   */
  hasBusinessId(): boolean {
    return this.hasPrimaryBusinessId()
  }

  /**
   * 是否有次要业务ID
   */
  hasSecondaryBusinessId(): boolean {
    return this.secondaryBusinessId !== undefined
  }

  /**
   * 是否有任何业务ID
   */
  hasAnyBusinessId(): boolean {
    return this.hasPrimaryBusinessId() || this.hasSecondaryBusinessId()
  }

  /**
   * 是否是新实体（没有任何业务ID）
   */
  isNew(): boolean {
    return !this.hasAnyBusinessId()
  }

  /**
   * 获取有效ID（按优先级返回）
   *
   * 优先级：主业务ID > 次要业务ID > 客户端ID
   *
   * 用于需要唯一标识符但不关心具体来源的场景（如日志记录、Map key）
   *
   * @returns 有效的ID值
   *
   * @example
   * ```typescript
   * console.log(`Processing user: ${userId.getValue()}`)
   * // 输出：Processing user: 123（如果有主业务ID）
   * // 或：Processing user: uuid-xxx（如果没有业务ID）
   * ```
   */
  getValue(): string | number {
    return this.primaryBusinessId ?? this.secondaryBusinessId ?? this.clientId
  }

  /**
   * 判断两个 EntityId 是否相等
   *
   * 比较规则（优先级从高到低）：
   * 1. 主业务ID相同 → 相等
   * 2. 次要业务ID相同 → 相等
   * 3. 交叉匹配（this.primary == other.secondary OR this.secondary == other.primary）→ 相等
   * 4. 客户端ID相同 → 相等
   *
   * @param other - 要比较的 EntityId
   * @returns 如果相等返回 true，否则返回 false
   *
   * @example 典型场景 - 数据同步
   * ```typescript
   * // 场景：数据库实体 vs HR 系统实体
   * const dbEntity = EntityId.create()
   * dbEntity.setPrimaryBusinessId(1)        // DB主键
   * dbEntity.setSecondaryBusinessId('E001') // 员工号
   *
   * const hrEntity = EntityId.create()
   * hrEntity.setPrimaryBusinessId('E001')   // HR系统主键是员工号
   *
   * dbEntity.equals(hrEntity) // true - 交叉匹配（规则3）
   * ```
   *
   * @example 多系统集成
   * ```typescript
   * // 场景：同一用户在不同系统中的ID表示
   * const systemA = EntityId.restore({ clientId: 'uuid-1', primaryBusinessId: 100, secondaryBusinessId: 'USR_A' })
   * const systemB = EntityId.restore({ clientId: 'uuid-2', primaryBusinessId: 'USR_A', secondaryBusinessId: 100 })
   *
   * systemA.equals(systemB) // true - 交叉匹配
   * ```
   */
  equals(other?: EntityId<string | number>): boolean {
    if (!other) return false

    // 1. 都有主业务ID时，比较主业务ID
    if (this.hasPrimaryBusinessId() && other.hasPrimaryBusinessId()) {
      if (this.primaryBusinessId === other.getPrimaryBusinessId()) {
        return true
      }
    }

    // 2. 都有次要业务ID时，比较次要业务ID
    if (this.hasSecondaryBusinessId() && other.hasSecondaryBusinessId()) {
      if (this.secondaryBusinessId === other.getSecondaryBusinessId()) {
        return true
      }
    }

    // 3. 交叉比较：处理一个实体有主业务ID，另一个有次要业务ID的情况
    // 这种情况在数据同步或系统集成时可能出现
    // 也包括主次ID相反的情况，例如：
    // 系统A的(primary: DB_ID, secondary: EMP_ID) vs 系统B的(primary: EMP_ID, secondary: DB_ID)
    if (this.hasPrimaryBusinessId() && other.hasSecondaryBusinessId()) {
      // 检查是否是同一个实体（主ID等于另一个的次要ID）
      if (this.primaryBusinessId === other.getSecondaryBusinessId()) {
        return true
      }
    }
    if (this.hasSecondaryBusinessId() && other.hasPrimaryBusinessId()) {
      // 检查是否是同一个实体（次要ID等于另一个的主ID）
      if (this.secondaryBusinessId === other.getPrimaryBusinessId()) {
        return true
      }
    }

    // 4. 最后比较客户端ID
    return this.clientId === other.getClientId()
  }

  /**
   * 转换为字符串（用于日志、调试）
   */
  toString(): string {
    const parts: string[] = []

    // 兼容旧版本：如果只有主业务ID且没有次要业务ID，使用 "business" 标签
    if (this.primaryBusinessId !== undefined && this.secondaryBusinessId === undefined) {
      parts.push(`business: ${this.primaryBusinessId}`)
    } else {
      if (this.primaryBusinessId !== undefined) {
        parts.push(`primary: ${this.primaryBusinessId}`)
      }
      if (this.secondaryBusinessId !== undefined) {
        parts.push(`secondary: ${this.secondaryBusinessId}`)
      }
    }

    parts.push(`client: ${this.clientId}`)

    return `EntityId(${parts.join(', ')})`
  }

  /**
   * 序列化为JSON
   *
   * @returns 包含所有ID信息的对象
   *
   * @example
   * ```typescript
   * const id = EntityId.create<number>()
   * id.setPrimaryBusinessId(123)
   * const json = id.toJSON()
   * // {
   * //   clientId: 'uuid-xxx',
   * //   primaryBusinessId: 123,
   * //   businessId: 123,  // 兼容旧版本
   * //   createdAt: 1234567890
   * // }
   * ```
   */
  toJSON(): {
    clientId: string
    primaryBusinessId?: T
    secondaryBusinessId?: T
    createdAt: number
    // @deprecated since v2.0.0 - Use primaryBusinessId instead
    businessId?: T
  } {
    const json: {
      clientId: string
      primaryBusinessId?: T
      secondaryBusinessId?: T
      createdAt: number
      businessId?: T
    } = {
      clientId: this.clientId,
      createdAt: this.createdAt
    }

    if (this.primaryBusinessId !== undefined) {
      json.primaryBusinessId = this.primaryBusinessId
      json.businessId = this.primaryBusinessId // 兼容
    }

    if (this.secondaryBusinessId !== undefined) {
      json.secondaryBusinessId = this.secondaryBusinessId
    }

    return json
  }

  /**
   * 克隆ID（用于实体克隆）
   */
  clone(): EntityId<T> {
    return EntityId.restore(this.toJSON())
  }
}
