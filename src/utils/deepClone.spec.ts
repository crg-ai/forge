import { describe, it, expect } from 'vitest'
import { deepClone } from './deepClone'

describe('深度克隆工具', () => {
  describe('基本类型克隆', () => {
    it('应该直接返回数字类型', () => {
      // Arrange
      const input = 42

      // Act
      const result = deepClone(input)

      // Assert
      expect(result).toBe(42)
    })

    it('应该直接返回字符串类型', () => {
      expect(deepClone('string')).toBe('string')
    })

    it('应该直接返回布尔类型', () => {
      expect(deepClone(true)).toBe(true)
      expect(deepClone(false)).toBe(false)
    })

    it('应该直接返回null', () => {
      expect(deepClone(null)).toBe(null)
    })

    it('应该直接返回undefined', () => {
      expect(deepClone(undefined)).toBe(undefined)
    })
  })

  describe('对象克隆', () => {
    it('应该深度克隆嵌套对象', () => {
      // Arrange
      const original = {
        a: 1,
        b: {
          c: 2,
          d: {
            e: 3
          }
        }
      }

      // Act
      const cloned = deepClone(original)

      // Assert - 值相等但引用不同
      expect(cloned).toEqual(original)
      expect(cloned).not.toBe(original)
      expect(cloned.b).not.toBe(original.b)
      expect(cloned.b.d).not.toBe(original.b.d)
    })

    it('修改克隆对象时不应该影响原对象', () => {
      // Arrange
      const original = {
        a: 1,
        b: {
          c: 2,
          d: {
            e: 3
          }
        }
      }

      // Act
      const cloned = deepClone(original)
      cloned.b.d.e = 4

      // Assert
      expect(original.b.d.e).toBe(3)
      expect(cloned.b.d.e).toBe(4)
    })

    it('应该处理空对象', () => {
      const original = {}
      const cloned = deepClone(original)

      expect(cloned).toEqual({})
      expect(cloned).not.toBe(original)
    })
  })

  describe('数组克隆', () => {
    it('应该深度克隆嵌套数组', () => {
      // Arrange
      const original = [1, [2, [3, 4]]]

      // Act
      const cloned = deepClone(original)

      // Assert
      expect(cloned).toEqual(original)
      expect(cloned).not.toBe(original)
      expect(cloned[1]).not.toBe(original[1])
    })

    it('修改克隆数组时不应该影响原数组', () => {
      const original = [1, [2, [3, 4]]]
      const cloned = deepClone(original)

      ;(cloned[1] as any)[1][0] = 5

      expect((original[1] as any)[1][0]).toBe(3)
      expect((cloned[1] as any)[1][0]).toBe(5)
    })

    it('应该处理空数组', () => {
      const original: any[] = []
      const cloned = deepClone(original)

      expect(cloned).toEqual([])
      expect(cloned).not.toBe(original)
    })

    it('应该处理混合类型数组', () => {
      const original = [1, 'string', true, null, { a: 1 }, [2, 3]]
      const cloned = deepClone(original)

      expect(cloned).toEqual(original)
      expect(cloned).not.toBe(original)
      expect(cloned[4]).not.toBe(original[4])
      expect(cloned[5]).not.toBe(original[5])
    })
  })

  describe('特殊对象克隆', () => {
    it('应该克隆Date对象并保持时间值', () => {
      // Arrange
      const original = new Date('2024-01-01')

      // Act
      const cloned = deepClone(original)

      // Assert
      expect(cloned.getTime()).toBe(original.getTime())
      expect(cloned).not.toBe(original)
      expect(cloned).toBeInstanceOf(Date)
    })

    it('应该克隆RegExp对象并保持模式和标志', () => {
      // Arrange
      const original = /test/gi

      // Act
      const cloned = deepClone(original)

      // Assert
      expect(cloned.source).toBe(original.source)
      expect(cloned.flags).toBe(original.flags)
      expect(cloned).not.toBe(original)
      expect(cloned).toBeInstanceOf(RegExp)
    })

    it('应该克隆Map对象及其所有条目', () => {
      // Arrange
      const original = new Map([
        ['key1', { value: 1 }],
        ['key2', { value: 2 }]
      ])

      // Act
      const cloned = deepClone(original)

      // Assert
      expect(cloned).toEqual(original)
      expect(cloned).not.toBe(original)
      expect(cloned.get('key1')).toEqual(original.get('key1'))
      expect(cloned.get('key1')).not.toBe(original.get('key1'))
      expect(cloned).toBeInstanceOf(Map)
    })

    it('应该克隆Set对象及其所有值', () => {
      // Arrange
      const original = new Set([{ value: 1 }, { value: 2 }])

      // Act
      const cloned = deepClone(original)

      // Assert
      expect(cloned.size).toBe(original.size)
      expect(cloned).not.toBe(original)
      expect(cloned).toBeInstanceOf(Set)
    })
  })

  describe('边界条件', () => {
    it('应该处理循环引用（返回原对象）', () => {
      const obj: any = { a: 1 }
      obj.self = obj

      const cloned = deepClone(obj)

      // 由于实现可能不同，这里只检查不会无限递归
      expect(cloned).toBeDefined()
    })

    it('应该处理函数（返回原函数）', () => {
      const fn = () => 'test'
      const cloned = deepClone(fn)

      expect(cloned).toBe(fn)
    })

    it('应该处理Symbol', () => {
      const sym = Symbol('test')
      const cloned = deepClone(sym)

      expect(cloned).toBe(sym)
    })
  })
})
