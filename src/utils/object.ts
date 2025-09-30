import { deepClone } from './deepClone'

/**
 * 深度合并多个对象（内部实现）
 */
function mergeInternal<T extends Record<string, unknown>>(
  sources: Partial<T>[],
  seen: WeakMap<object, unknown>
): T {
  const result: Record<string, unknown> = {}

  for (const source of sources) {
    if (source === null || source === undefined) {
      continue
    }

    // 检查循环引用
    if (typeof source === 'object' && seen.has(source as object)) {
      return seen.get(source as object) as T
    }

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key]
        const resultValue = result[key]

        // 标记当前对象为已处理
        if (typeof source === 'object') {
          seen.set(source as object, result)
        }

        // Check if both values are plain objects that should be merged
        const isSourcePlainObject =
          sourceValue !== undefined &&
          sourceValue !== null &&
          typeof sourceValue === 'object' &&
          !Array.isArray(sourceValue) &&
          !((sourceValue as unknown) instanceof Date) &&
          !((sourceValue as unknown) instanceof RegExp) &&
          !((sourceValue as unknown) instanceof Map) &&
          !((sourceValue as unknown) instanceof Set)

        const isResultPlainObject =
          resultValue !== undefined &&
          resultValue !== null &&
          typeof resultValue === 'object' &&
          !Array.isArray(resultValue) &&
          !((resultValue as unknown) instanceof Date) &&
          !((resultValue as unknown) instanceof RegExp) &&
          !((resultValue as unknown) instanceof Map) &&
          !((resultValue as unknown) instanceof Set)

        if (isSourcePlainObject && isResultPlainObject) {
          result[key] = mergeInternal(
            [
              resultValue as Partial<Record<string, unknown>>,
              sourceValue as Partial<Record<string, unknown>>
            ],
            seen
          )
        } else if (sourceValue !== undefined) {
          // Deep clone the value to prevent mutation
          result[key] = deepClone(sourceValue)
        }
      }
    }
  }

  return result as T
}

/**
 * 深度合并多个对象
 *
 * @param sources 要合并的对象列表
 * @returns 合并后的新对象
 *
 * @example
 * ```typescript
 * const obj1 = { a: 1, b: { c: 2 } }
 * const obj2 = { b: { d: 3 }, e: 4 }
 * const result = merge(obj1, obj2)
 * // { a: 1, b: { c: 2, d: 3 }, e: 4 }
 * ```
 */
export function merge<T extends Record<string, unknown>>(...sources: Partial<T>[]): T {
  return mergeInternal(sources, new WeakMap())
}

/**
 * 从对象中选择指定的属性
 *
 * @param obj 源对象
 * @param keys 要选择的属性键列表
 * @returns 只包含指定属性的新对象
 *
 * @example
 * ```typescript
 * const obj = { a: 1, b: 2, c: 3 }
 * const result = pick(obj, ['a', 'c'])
 * // { a: 1, c: 3 }
 * ```
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result: Partial<Pick<T, K>> = {}

  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }

  return result as Pick<T, K>
}

/**
 * 从对象中排除指定的属性
 *
 * @param obj 源对象
 * @param keys 要排除的属性键列表
 * @returns 不包含指定属性的新对象
 *
 * @example
 * ```typescript
 * const obj = { a: 1, b: 2, c: 3 }
 * const result = omit(obj, ['b'])
 * // { a: 1, c: 3 }
 * ```
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }

  for (const key of keys) {
    delete result[key]
  }

  return result as Omit<T, K>
}
