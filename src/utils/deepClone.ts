/**
 * 深度克隆对象（内部实现）
 */
function deepCloneInternal<T>(obj: T, visited: WeakMap<object, unknown>): T {
  // 处理基础类型和 null/undefined
  if (obj === null || obj === undefined) {
    return obj
  }

  // 基础类型直接返回
  const type = typeof obj
  if (type !== 'object') {
    return obj
  }

  // 检查循环引用
  const objAsObject = obj as unknown as object
  if (visited.has(objAsObject)) {
    return visited.get(objAsObject) as T
  }

  // 处理日期
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T
  }

  // 处理正则表达式
  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as T
  }

  // 处理数组
  if (Array.isArray(obj)) {
    const cloned: unknown[] = []
    visited.set(objAsObject, cloned)
    for (let i = 0; i < obj.length; i++) {
      cloned[i] = deepCloneInternal(obj[i], visited)
    }
    return cloned as T
  }

  // 处理 Map
  if (obj instanceof Map) {
    const cloned = new Map()
    visited.set(objAsObject, cloned)
    for (const [key, value] of obj) {
      cloned.set(deepCloneInternal(key, visited), deepCloneInternal(value, visited))
    }
    return cloned as T
  }

  // 处理 Set
  if (obj instanceof Set) {
    const cloned = new Set()
    visited.set(objAsObject, cloned)
    for (const value of obj) {
      cloned.add(deepCloneInternal(value, visited))
    }
    return cloned as T
  }

  // 处理普通对象
  const cloned: Record<string, unknown> = {}
  visited.set(objAsObject, cloned)
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepCloneInternal(obj[key], visited)
    }
  }

  return cloned as T
}

/**
 * 深度克隆对象
 *
 * 实现细节：
 * - 递归克隆所有嵌套对象和数组
 * - 使用 WeakMap 避免循环引用死循环
 * - 支持 Date、RegExp、Map、Set、Array、Object
 * - 保持对象属性的顺序
 *
 * 边界条件处理：
 * - null/undefined 直接返回
 * - 基础类型（string、number、boolean）直接返回
 * - 循环引用返回已克隆的引用（避免死循环）
 *
 * 性能提示：
 * - 复杂度 O(n)，n 为所有节点数
 * - 循环引用检测有额外内存开销
 * - 适用于中小型对象（< 10000 节点）
 * - 不支持克隆函数、Symbol、WeakMap、WeakSet
 *
 * @param obj - 要克隆的对象
 * @returns 克隆后的对象（完全独立的副本）
 *
 * @example 基本使用
 * ```typescript
 * const original = { a: { b: 1 }, items: [1, 2, 3] }
 * const cloned = deepClone(original)
 * cloned.a.b = 2
 * console.log(original.a.b) // 1（原对象不变）
 * ```
 *
 * @example 复杂类型
 * ```typescript
 * const original = {
 *   date: new Date('2024-01-01'),
 *   regex: /test/gi,
 *   map: new Map([['key', 'value']]),
 *   set: new Set([1, 2, 3])
 * }
 * const cloned = deepClone(original)
 * cloned.date.setFullYear(2025)
 * console.log(original.date.getFullYear()) // 2024（原对象不变）
 * ```
 *
 * @example 循环引用处理
 * ```typescript
 * const obj: any = { name: 'test' }
 * obj.self = obj // 循环引用
 * const cloned = deepClone(obj) // ✅ 不会死循环
 * cloned.self === cloned // true（保持循环引用结构）
 * ```
 */
export function deepClone<T>(obj: T): T {
  return deepCloneInternal(obj, new WeakMap())
}
