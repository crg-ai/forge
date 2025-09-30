import { EntityId } from './EntityId'

/**
 * 实体基类
 *
 * DDD中的核心构建块，具有唯一标识符的领域对象
 * 提供身份管理、验证、相等性判断等基础功能
 */
export abstract class Entity<Props, BizId extends string | number = number> {
  protected readonly id: EntityId<BizId>
  protected props: Props

  protected constructor(props: Props, id?: EntityId<BizId>) {
    this.id = id ?? EntityId.create<BizId>()
    this.props = props

    // 立即验证
    this.validate()
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
   */
  setBusinessId(businessId: BizId): void {
    this.id.setBusinessId(businessId)
  }

  /**
   * 添加额外的业务标识符
   */
  addIdentifier(key: string, value: string | number): void {
    this.id.addSecondaryId(key, value)
  }

  /**
   * 获取额外的业务标识符
   */
  getIdentifier(key: string): string | number | undefined {
    return this.id.getSecondaryId(key)
  }

  /**
   * 是否是新实体
   */
  isNew(): boolean {
    return this.id.isNew()
  }

  /**
   * 获取属性（只读副本）
   */
  getProps(): Readonly<Props> {
    // 返回属性的浅拷贝，防止外部直接修改
    return { ...this.props }
  }

  /**
   * 判断相等性（基于ID）
   */
  equals(other?: Entity<unknown, string | number>): boolean {
    if (!other) return false
    if (!(other instanceof Entity)) return false
    return this.id.equals(other.id)
  }

  /**
   * 验证实体状态（子类必须实现）
   */
  protected abstract validate(): void

  /**
   * 序列化为普通对象
   */
  toObject(): {
    id: ReturnType<EntityId<BizId>['toJSON']>
    props: Props
  } {
    return {
      id: this.id.toJSON(),
      props: { ...this.props }
    }
  }
}
