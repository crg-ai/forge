/**
 * 深度比较两个值是否相等
 *
 * @param a 第一个值
 * @param b 第二个值
 * @returns 如果相等返回 true，否则返回 false
 *
 * @example
 * ```typescript
 * deepEquals({ a: { b: 1 } }, { a: { b: 1 } }) // true
 * deepEquals([1, 2, 3], [1, 2, 3]) // true
 * deepEquals(new Date(2024, 0, 1), new Date(2024, 0, 1)) // true
 * ```
 */
export function deepEquals(a: unknown, b: unknown): boolean {
  return deepEqualsWithSeen(a, b, new WeakSet())
}

function deepEqualsWithSeen(a: unknown, b: unknown, seen: WeakSet<object>): boolean {
  // 引用相等
  if (a === b) {
    return true
  }

  // null/undefined 检查
  if (a === null || a === undefined || b === null || b === undefined) {
    return a === b
  }

  // 类型不同
  const typeA = typeof a
  const typeB = typeof b
  if (typeA !== typeB) {
    return false
  }

  // 基础类型
  if (typeA !== 'object') {
    // 特殊处理 NaN
    if (typeA === 'number' && Number.isNaN(a) && Number.isNaN(b)) {
      return true
    }
    return a === b
  }

  // 从这里开始，a 和 b 都是非 null 的对象
  const objA = a as Record<string, unknown>
  const objB = b as Record<string, unknown>

  // 检查循环引用
  if (seen.has(objA) || seen.has(objB)) {
    return false
  }
  seen.add(objA)
  seen.add(objB)

  // 日期比较
  if (a instanceof Date && b instanceof Date) {
    const timeA = a.getTime()
    const timeB = b.getTime()
    // 特殊处理无效日期 (NaN)
    if (Number.isNaN(timeA) && Number.isNaN(timeB)) {
      return true
    }
    return timeA === timeB
  }

  // 正则表达式比较
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.source === b.source && a.flags === b.flags
  }

  // 数组比较
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false
    }
    for (let i = 0; i < a.length; i++) {
      if (!deepEqualsWithSeen(a[i], b[i], seen)) {
        return false
      }
    }
    return true
  }

  // 确保都是数组或都不是数组
  if (Array.isArray(a) || Array.isArray(b)) {
    return false
  }

  // Map 比较
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) {
      return false
    }
    for (const [key, value] of a) {
      if (!b.has(key) || !deepEqualsWithSeen(value, b.get(key), seen)) {
        return false
      }
    }
    return true
  }

  // Set 比较
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) {
      return false
    }
    for (const value of a) {
      if (!b.has(value)) {
        return false
      }
    }
    return true
  }

  // 对象比较
  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)

  if (keysA.length !== keysB.length) {
    return false
  }

  // 检查所有键是否都存在且值相等
  for (const key of keysA) {
    if (!keysB.includes(key)) {
      return false
    }
    if (!deepEqualsWithSeen(objA[key], objB[key], seen)) {
      return false
    }
  }

  return true
}
