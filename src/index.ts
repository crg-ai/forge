/**
 * Forge - 轻量级前端DDD框架
 *
 * @packageDocumentation
 */

/* ============================================
   核心 DDD 构建块
   ============================================ */
export * from './core'

/* ============================================
   工具函数
   ============================================ */
// 重新导出所有工具函数，方便直接从主包导入
export {
  // UUID
  generateUUID,
  isValidUUID,
  // 类型守卫
  isPlainObject,
  isFunction,
  isString,
  isNumber,
  isBoolean,
  isNil,
  isDate,
  isArray,
  isMap,
  isSet,
  // 深度操作
  deepFreeze,
  deepEquals,
  deepClone,
  // 对象操作
  merge,
  pick,
  omit,
  // 字符串化
  safeStringify
} from './utils'

/* ============================================
   版本信息
   ============================================ */
export const VERSION = '0.1.0'
