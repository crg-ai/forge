/**
 * 共享工具模块导出
 */

export { Result, isOk, isFail, combineResults, sequence, parallel } from './Result'
export { deepFreeze } from '../../utils/deepFreeze'
export { deepEquals } from '../../utils/deepEquals'
export { deepClone } from '../../utils/deepClone'
export { isPlainObject } from '../../utils/typeGuards'
export { safeStringify } from '../../utils/safeStringify'
export { merge, pick, omit } from '../../utils/object'
