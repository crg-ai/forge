/**
 * 安全地将对象转换为 JSON 字符串，处理循环引用
 *
 * @param obj 要序列化的对象
 * @param replacer 可选的替换函数
 * @param space 可选的缩进空格数
 * @returns JSON 字符串
 *
 * @example
 * ```typescript
 * const obj: any = { a: 1 }
 * obj.self = obj // 循环引用
 * const json = safeStringify(obj)
 * // {"a":1,"self":"[Circular ~]"}
 * ```
 */
export function safeStringify(
  obj: unknown,
  replacer?: (key: string, value: unknown) => unknown,
  space?: string | number
): string {
  const seen = new WeakSet()

  const defaultReplacer = (_key: string, value: unknown) => {
    // Handle BigInt
    if (typeof value === 'bigint') {
      return value.toString()
    }

    // Handle circular references
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular ~]'
      }
      seen.add(value)

      // Handle special types
      if (value instanceof RegExp) {
        return value.toString()
      }

      if (value instanceof Map) {
        return {
          _type: 'Map',
          entries: Array.from(value.entries())
        }
      }

      if (value instanceof Set) {
        return {
          _type: 'Set',
          values: Array.from(value.values())
        }
      }
    }

    return value
  }

  const finalReplacer = replacer
    ? (key: string, value: unknown) => {
        const replaced = defaultReplacer(key, value)
        if (replaced === '[Circular ~]') {
          return replaced
        }
        return replacer(key, replaced)
      }
    : defaultReplacer

  try {
    return JSON.stringify(obj, finalReplacer, space)
  } catch {
    return '[Unable to stringify]'
  }
}
