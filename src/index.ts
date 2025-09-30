/**
 * Forge - 轻量级前端DDD框架
 */

// 核心模块导出
export * from './core'

// 工具函数导出
export { generateUUID, isValidUUID } from './utils/uuid'
export { deepFreeze } from './utils/deepFreeze'
export { deepEquals } from './utils/deepEquals'
export { deepClone } from './utils/deepClone'
export { merge, pick, omit } from './utils/object'
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
} from './utils/typeGuards'
export { safeStringify } from './utils/safeStringify'

// 版本信息
export const VERSION = '0.1.0'
