import type { DomainEvent } from './DomainEvent'

/**
 * 事件构造函数类型
 *
 * 用于定义事件类的构造函数签名
 */
type EventConstructor<T extends DomainEvent = DomainEvent> = new (
  props: Record<string, unknown> & { aggregateId: string }
) => T

/**
 * 事件注册表类型
 *
 * 键为事件类名，值为事件构造函数
 */
export type EventRegistry = Record<string, EventConstructor>

/**
 * 序列化的事件 JSON 格式
 */
export interface SerializedEvent {
  eventId: string
  eventName: string
  eventType: string
  occurredOn: string
  aggregateId: string
  props: Record<string, unknown>
}

/**
 * 事件反序列化工具
 *
 * 将 JSON 对象重建为领域事件实例
 *
 * @template T - 领域事件类型
 * @param json - 序列化的事件 JSON 对象
 * @param eventRegistry - 事件注册表（事件类型映射）
 * @returns 重建的领域事件实例
 *
 * @throws {Error} 当事件类型未在注册表中找到时抛出错误
 * @throws {Error} 当 JSON 格式无效时抛出错误
 *
 * @example
 * ```typescript
 * // 定义事件映射
 * const eventRegistry = createEventRegistry({
 *   OrderSubmittedEvent,
 *   OrderPaidEvent,
 *   OrderShippedEvent
 * })
 *
 * // 从 IndexedDB 加载
 * const json = await db.events.get(eventId)
 * const event = deserializeEvent(json, eventRegistry)
 *
 * // 从 WebSocket 接收
 * ws.on('message', (data) => {
 *   const json = JSON.parse(data)
 *   const event = deserializeEvent(json, eventRegistry)
 *   eventBus.publish(event)
 * })
 * ```
 *
 * @remarks
 * **前端使用场景：**
 * - IndexedDB 持久化恢复
 * - WebSocket 实时事件接收
 * - LocalStorage/SessionStorage 状态恢复
 * - Redux 状态重放（时间旅行）
 *
 * **类型安全：**
 * - 使用 createEventRegistry 创建注册表可获得类型推导
 * - 反序列化后的事件保留完整的类型信息
 */
export function deserializeEvent<T extends DomainEvent>(
  json: SerializedEvent,
  eventRegistry: EventRegistry
): T {
  // 验证 JSON 格式
  if (!json.eventType) {
    throw new Error('Invalid event JSON: missing eventType field')
  }

  // 查找事件构造函数
  const EventClass = eventRegistry[json.eventType]

  if (EventClass === undefined) {
    const availableTypes = Object.keys(eventRegistry).join(', ')
    throw new Error(
      `Unknown event type: ${json.eventType}. ` + `Available types: ${availableTypes || 'none'}`
    )
  }

  // 重建事件实例
  // 使用特殊的内部 props 来传递原始的事件元数据
  const event = new EventClass({
    ...json.props,
    aggregateId: json.aggregateId,
    _deserializedEventId: json.eventId,
    _deserializedOccurredOn: new Date(json.occurredOn)
  }) as T

  // 覆盖自动生成的 eventId 和 occurredOn
  // 使用类型断言来修改只读属性（仅在反序列化时允许）
  Object.defineProperty(event, 'eventId', {
    value: json.eventId,
    writable: false,
    enumerable: true,
    configurable: false
  })

  Object.defineProperty(event, 'occurredOn', {
    value: new Date(json.occurredOn),
    writable: false,
    enumerable: true,
    configurable: false
  })

  return event
}

/**
 * 创建类型安全的事件注册表
 *
 * 提供类型推导，确保注册表中的事件类型正确
 *
 * @template T - 事件映射类型
 * @param events - 事件类型映射对象
 * @returns 事件注册表
 *
 * @example
 * ```typescript
 * const registry = createEventRegistry({
 *   OrderSubmittedEvent,
 *   OrderPaidEvent
 * })
 *
 * // TypeScript 会推导出：
 * // {
 * //   OrderSubmittedEvent: typeof OrderSubmittedEvent
 * //   OrderPaidEvent: typeof OrderPaidEvent
 * // }
 * ```
 *
 * @remarks
 * **最佳实践：**
 * - 在应用启动时创建一次注册表
 * - 将注册表作为单例使用
 * - 按功能模块组织注册表
 *
 * @example 模块化注册表
 * ```typescript
 * // order-events.ts
 * export const orderEventRegistry = createEventRegistry({
 *   OrderCreatedEvent,
 *   OrderSubmittedEvent,
 *   OrderPaidEvent
 * })
 *
 * // user-events.ts
 * export const userEventRegistry = createEventRegistry({
 *   UserRegisteredEvent,
 *   UserActivatedEvent
 * })
 *
 * // app-events.ts
 * export const appEventRegistry = createEventRegistry({
 *   ...orderEventRegistry,
 *   ...userEventRegistry
 * })
 * ```
 */
export function createEventRegistry<T extends Record<string, EventConstructor>>(events: T): T {
  return events
}
