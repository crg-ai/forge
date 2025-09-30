import { describe, it, expect } from 'vitest'
import * as coreExports from './index'
import * as sharedExports from './shared'
import * as valueObjectExports from './value-object'

describe('核心模块导出', () => {
  it('应该导出共享模块', () => {
    expect(coreExports.Result).toBeDefined()
    expect(coreExports.Result).toBe(sharedExports.Result)
    expect(coreExports.isOk).toBeDefined()
    expect(coreExports.isFail).toBeDefined()
    expect(coreExports.combineResults).toBeDefined()
    expect(coreExports.sequence).toBeDefined()
    expect(coreExports.parallel).toBeDefined()
    expect(coreExports.deepFreeze).toBeDefined()
    expect(coreExports.deepEquals).toBeDefined()
    expect(coreExports.deepClone).toBeDefined()
    expect(coreExports.isPlainObject).toBeDefined()
    expect(coreExports.safeStringify).toBeDefined()
    expect(coreExports.merge).toBeDefined()
    expect(coreExports.pick).toBeDefined()
    expect(coreExports.omit).toBeDefined()
  })

  it('应该导出值对象模块', () => {
    expect(coreExports.ValueObject).toBeDefined()
    expect(coreExports.ValueObject).toBe(valueObjectExports.ValueObject)
    expect(coreExports.ValueObjectBuilder).toBeDefined()
    expect(coreExports.ValueObjectBuilder).toBe(valueObjectExports.ValueObjectBuilder)
    expect(coreExports.GenericValueObjectBuilder).toBeDefined()
    expect(coreExports.GenericValueObjectBuilder).toBe(valueObjectExports.GenericValueObjectBuilder)
  })
})
