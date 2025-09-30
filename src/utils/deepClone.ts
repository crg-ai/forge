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
 * @param obj 要克隆的对象
 * @returns 克隆后的对象
 *
 * @example
 * ```typescript
 * const original = { a: { b: 1 } }
 * const cloned = deepClone(original)
 * cloned.a.b = 2
 * console.log(original.a.b) // 1
 * ```
 */
export function deepClone<T>(obj: T): T {
  return deepCloneInternal(obj, new WeakMap())
}
