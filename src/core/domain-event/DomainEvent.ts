import { generateUUID } from '../../utils/uuid'

/**
 * 领域事件接口 - DDD 核心构建块
 *
 * 领域事件表示领域中发生的重要业务事实，用于解耦聚合间的通信
 *
 * 设计原则：
 * 1. 不可变性 - 事件一旦发生不能修改（使用 readonly）
 * 2. 过去时命名 - 描述已发生的事情（如 OrderSubmitted, UserRegistered）
 * 3. 包含关键信息 - 事件ID、发生时间、聚合ID、业务数据
 * 4. 自包含 - 事件携带足够信息供订阅者处理
 *
 * @example
 * ```typescript
 * // 定义领域事件
 * interface OrderSubmittedEventProps {
 *   orderId: string
 *   customerId: string
 *   totalAmount: number
 * }
 *
 * class OrderSubmittedEvent extends BaseDomainEvent<OrderSubmittedEventProps> {
 *   constructor(props: OrderSubmittedEventProps) {
 *     super('OrderSubmitted', props)
 *   }
 *
 *   get orderId() { return this.props.orderId }
 *   get customerId() { return this.props.customerId }
 *   get totalAmount() { return this.props.totalAmount }
 * }
 *
 * // 在聚合根中发布事件
 * class Order extends AggregateRoot<OrderProps> {
 *   submit() {
 *     // ... 业务逻辑
 *     this.addDomainEvent(new OrderSubmittedEvent({
 *       orderId: this.getClientId(),
 *       customerId: this.props.customerId,
 *       totalAmount: this.calculateTotal()
 *     }))
 *   }
 * }
 * ```
 */
export interface DomainEvent<Props = unknown> {
  /**
   * 事件唯一标识符（UUID）
   */
  readonly eventId: string

  /**
   * 事件类型名称（用于事件路由）
   *
   * @example 'OrderSubmitted', 'UserRegistered', 'PaymentCompleted'
   */
  readonly eventName: string

  /**
   * 事件发生时间（UTC）
   */
  readonly occurredOn: Date

  /**
   * 聚合根标识符（事件来源）
   */
  readonly aggregateId: string

  /**
   * 事件携带的业务数据
   */
  readonly props: Props
}

/**
 * 领域事件基类实现
 *
 * 提供领域事件的通用实现，子类只需关注业务数据
 *
 * @template Props - 事件携带的业务数据类型
 *
 * @example
 * ```typescript
 * interface UserRegisteredProps {
 *   userId: string
 *   email: string
 *   registeredAt: Date
 * }
 *
 * export class UserRegisteredEvent extends BaseDomainEvent<UserRegisteredProps> {
 *   constructor(props: UserRegisteredProps) {
 *     super('UserRegistered', props)
 *   }
 *
 *   // 提供便捷的属性访问
 *   get userId() { return this.props.userId }
 *   get email() { return this.props.email }
 *   get registeredAt() { return this.props.registeredAt }
 * }
 * ```
 */
export abstract class BaseDomainEvent<Props = unknown> implements DomainEvent<Props> {
  public readonly eventId: string
  public readonly eventName: string
  public readonly occurredOn: Date
  public readonly aggregateId: string
  public readonly props: Props

  /**
   * 创建领域事件
   *
   * @param eventName - 事件类型名称（过去时，如 'OrderSubmitted'）
   * @param props - 事件业务数据（必须包含 aggregateId）
   */
  protected constructor(eventName: string, props: Props & { aggregateId: string }) {
    this.eventId = generateUUID()
    this.eventName = eventName
    this.occurredOn = new Date()
    this.aggregateId = props.aggregateId
    this.props = Object.freeze({ ...props })
  }

  /**
   * 序列化为 JSON 对象
   *
   * 用于事件存储、消息队列传输等场景
   */
  toJSON(): {
    eventId: string
    eventName: string
    occurredOn: string
    aggregateId: string
    props: Props
  } {
    return {
      eventId: this.eventId,
      eventName: this.eventName,
      occurredOn: this.occurredOn.toISOString(),
      aggregateId: this.aggregateId,
      props: this.props
    }
  }
}
