import { describe, it, expect } from 'vitest'
import * as sharedExports from './index'
import { Result, isOk, isFail, combineResults, sequence, parallel } from './Result'
import { deepFreeze } from '../../utils/deepFreeze'
import { deepEquals } from '../../utils/deepEquals'
import { deepClone } from '../../utils/deepClone'
import { isPlainObject } from '../../utils/typeGuards'
import { safeStringify } from '../../utils/safeStringify'
import { merge, pick, omit } from '../../utils/object'

describe('共享模块导出', () => {
  it('应该导出Result相关功能', () => {
    expect(sharedExports.Result).toBe(Result)
    expect(sharedExports.isOk).toBe(isOk)
    expect(sharedExports.isFail).toBe(isFail)
    expect(sharedExports.combineResults).toBe(combineResults)
    expect(sharedExports.sequence).toBe(sequence)
    expect(sharedExports.parallel).toBe(parallel)
  })

  it('应该导出工具函数', () => {
    expect(sharedExports.deepFreeze).toBe(deepFreeze)
    expect(sharedExports.deepEquals).toBe(deepEquals)
    expect(sharedExports.deepClone).toBe(deepClone)
    expect(sharedExports.isPlainObject).toBe(isPlainObject)
    expect(sharedExports.safeStringify).toBe(safeStringify)
    expect(sharedExports.merge).toBe(merge)
    expect(sharedExports.pick).toBe(pick)
    expect(sharedExports.omit).toBe(omit)
  })
})
