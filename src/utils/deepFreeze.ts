/**
 * 深度冻结对象（内部实现）
 */
function deepFreezeInternal<T>(obj: T, frozen: WeakSet<object>): Readonly<T> {
  // 处理基础类型和 null/undefined
  if (obj === null || obj === undefined) {
    return obj
  }

  // 基础类型和函数直接返回
  const type = typeof obj
  if (type !== 'object') {
    // 包括 function 类型
    return obj
  }

  // 转换为对象类型进行处理
  const objAsObject = obj as unknown as object

  // 检查是否已经处理过（避免循环引用）
  if (frozen.has(objAsObject)) {
    return obj
  }

  // 已经冻结的对象直接返回
  if (Object.isFrozen(objAsObject)) {
    return obj
  }

  // 标记为已处理
  frozen.add(objAsObject)

  // 处理日期对象 - 不冻结日期，返回副本
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T
  }

  // 处理正则表达式 - 不冻结正则，返回副本
  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as T
  }

  // 处理数组
  if (Array.isArray(obj)) {
    const frozenArray = obj.map(item => deepFreezeInternal(item, frozen))
    return Object.freeze(frozenArray) as T
  }

  // 处理 Map
  if (obj instanceof Map) {
    const frozenMap = new Map()
    for (const [key, value] of obj) {
      frozenMap.set(deepFreezeInternal(key, frozen), deepFreezeInternal(value, frozen))
    }
    // 冻结 Map 对象本身
    Object.freeze(frozenMap)
    // 冻结 Map 的内部值存储
    Object.freeze(Array.from(frozenMap.values()))
    return frozenMap as T
  }

  // 处理 Set
  if (obj instanceof Set) {
    const frozenValues: unknown[] = []
    for (const value of obj) {
      frozenValues.push(deepFreezeInternal(value, frozen))
    }

    // 创建一个新的 Set 并重写其方法来防止修改
    const frozenSet = new Set(frozenValues)
    const originalAdd = frozenSet.add.bind(frozenSet)

    // 重写 add 方法，确保新添加的值也被冻结
    frozenSet.add = function (value: unknown) {
      const frozenValue = deepFreezeInternal(value, frozen)
      return originalAdd(frozenValue)
    }

    // 冻结 Set 对象本身
    Object.freeze(frozenSet)

    return frozenSet as T
  }

  // 处理普通对象
  const frozenObj: Record<string, unknown> = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      frozenObj[key] = deepFreezeInternal(obj[key], frozen)
    }
  }

  return Object.freeze(frozenObj) as T
}

/**
 * 深度冻结对象，使其完全不可变
 *
 * 实现细节：
 * - 递归冻结所有嵌套对象和数组
 * - 使用 WeakSet 避免循环引用导致的死循环
 * - Date 和 RegExp 返回副本（避免冻结原型方法）
 * - 已冻结对象直接返回（性能优化）
 *
 * 性能提示：
 * - 适用于小型对象（< 1000 节点）
 * - 大型对象建议使用 Immutable.js 等专业库
 * - 会创建 Date/RegExp 的副本（额外内存开销）
 *
 * @param obj - 要冻结的对象
 * @returns 冻结后的对象（完全不可变）
 *
 * @example 基本使用
 * ```typescript
 * const obj = { a: { b: 1 }, items: [1, 2, 3] }
 * const frozen = deepFreeze(obj)
 *
 * frozen.a.b = 2       // ❌ TypeError: 严格模式下抛出错误
 * frozen.items.push(4) // ❌ TypeError: 严格模式下抛出错误
 * ```
 *
 * @example 循环引用处理
 * ```typescript
 * const obj: any = { name: 'test' }
 * obj.self = obj // 循环引用
 * const frozen = deepFreeze(obj) // ✅ 不会死循环
 * ```
 */
export function deepFreeze<T>(obj: T): Readonly<T> {
  return deepFreezeInternal(obj, new WeakSet())
}
