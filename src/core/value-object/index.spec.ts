import { describe, it, expect } from 'vitest'
import * as valueObjectExports from './index'
import { ValueObject } from './ValueObject'
import { ValueObjectBuilder, GenericValueObjectBuilder } from './ValueObjectBuilder'

describe('值对象模块导出', () => {
  it('应该导出ValueObject类', () => {
    expect(valueObjectExports.ValueObject).toBe(ValueObject)
    expect(valueObjectExports.ValueObject).toBeDefined()
  })

  it('应该导出ValueObjectBuilder类', () => {
    expect(valueObjectExports.ValueObjectBuilder).toBe(ValueObjectBuilder)
    expect(valueObjectExports.ValueObjectBuilder).toBeDefined()
  })

  it('应该导出GenericValueObjectBuilder类', () => {
    expect(valueObjectExports.GenericValueObjectBuilder).toBe(GenericValueObjectBuilder)
    expect(valueObjectExports.GenericValueObjectBuilder).toBeDefined()
  })
})
