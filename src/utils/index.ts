/**
 * 工具函数统一导出
 *
 * 提供常用的工具函数，包括类型守卫、对象操作、深度操作等
 */

// UUID 相关
export { generateUUID, isValidUUID } from './uuid'

// 类型守卫
export {
  isPlainObject,
  isFunction,
  isString,
  isNumber,
  isBoolean,
  isNil,
  isDate,
  isArray,
  isMap,
  isSet
} from './typeGuards'

// 深度操作
export { deepFreeze } from './deepFreeze'
export { deepEquals } from './deepEquals'
export { deepClone } from './deepClone'

// 对象操作
export { merge, pick, omit } from './object'

// 字符串化
export { safeStringify } from './safeStringify'
