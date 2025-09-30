import { generateUUID } from '../../utils/uuid'

/**
 * 实体ID - 支持客户端ID和双业务ID模式
 *
 * 设计原则：
 * 1. 客户端ID永不改变 - 保证前端状态稳定
 * 2. 支持双业务ID - 满足数据库双主键设计需求
 * 3. 智能相等性判断 - 正确处理双ID比较
 */
export class EntityId<T extends string | number = string> {
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
  static create<T extends string | number = string>(): EntityId<T> {
    return new EntityId<T>()
  }

  /**
   * 从已有数据恢复
   */
  static restore<T extends string | number = string>(data: {
    clientId: string
    primaryBusinessId?: T
    secondaryBusinessId?: T
    // 兼容旧版本
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
   * 获取业务ID（兼容旧版本）
   */
  getBusinessId(): T | undefined {
    return this.primaryBusinessId
  }

  /**
   * 设置主业务ID（只能设置一次）
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
   * 设置业务ID（兼容旧版本，实际设置主业务ID）
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
   * 是否有业务ID（兼容旧版本）
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
   * 获取有效ID（优先主业务ID，次要业务ID，最后客户端ID）
   */
  getValue(): string | number {
    return this.primaryBusinessId ?? this.secondaryBusinessId ?? this.clientId
  }

  /**
   * 判断相等性
   * 规则：
   * 1. 如果都有主业务ID，比较主业务ID
   * 2. 如果都有次要业务ID，比较次要业务ID
   * 3. 如果一个的主业务ID等于另一个的次要业务ID（交叉比较）
   * 4. 否则比较客户端ID
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
   */
  toJSON(): {
    clientId: string
    primaryBusinessId?: T
    secondaryBusinessId?: T
    createdAt: number
    // 兼容旧版本
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
