/**
 * 检查值是否为纯对象（非数组、非 null、非日期等）
 *
 * @param value 要检查的值
 * @returns 如果是纯对象返回 true，否则返回 false
 *
 * @example
 * ```typescript
 * isPlainObject({}) // true
 * isPlainObject({ a: 1 }) // true
 * isPlainObject([]) // false
 * isPlainObject(null) // false
 * isPlainObject(new Date()) // false
 * ```
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  // 检查是否是纯对象（不是数组、Date、RegExp 等内置对象）
  const proto = Object.getPrototypeOf(value) as object | null
  if (proto === null) {
    return true
  }

  // 检查是否有 constructor 属性，并且 constructor 是 Object
  const protoWithConstructor = proto as { constructor?: unknown }
  return (
    proto === Object.prototype ||
    (protoWithConstructor.constructor === Object && Object.getPrototypeOf(proto) === null)
  )
}

/**
 * 检查值是否为函数
 *
 * @param value 要检查的值
 * @returns 如果是函数返回 true，否则返回 false
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function'
}

/**
 * 检查值是否为字符串
 *
 * @param value 要检查的值
 * @returns 如果是字符串返回 true，否则返回 false
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * 检查值是否为数字
 *
 * @param value 要检查的值
 * @returns 如果是数字返回 true，否则返回 false
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

/**
 * 检查值是否为布尔值
 *
 * @param value 要检查的值
 * @returns 如果是布尔值返回 true，否则返回 false
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

/**
 * 检查值是否为 null 或 undefined
 *
 * @param value 要检查的值
 * @returns 如果是 null 或 undefined 返回 true，否则返回 false
 */
export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined
}

/**
 * 检查值是否为日期对象
 *
 * @param value 要检查的值
 * @returns 如果是日期对象返回 true，否则返回 false
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime())
}

/**
 * 检查值是否为数组
 *
 * @param value 要检查的值
 * @returns 如果是数组返回 true，否则返回 false
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

/**
 * 检查值是否为 Map
 *
 * @param value 要检查的值
 * @returns 如果是 Map 返回 true，否则返回 false
 */
export function isMap(value: unknown): value is Map<unknown, unknown> {
  return value instanceof Map
}

/**
 * 检查值是否为 Set
 *
 * @param value 要检查的值
 * @returns 如果是 Set 返回 true，否则返回 false
 */
export function isSet(value: unknown): value is Set<unknown> {
  return value instanceof Set
}
