import { describe, it, expect } from 'vitest'
import { deepEquals } from '../deepEquals'

describe('深度相等比较', () => {
  describe('基本类型比较', () => {
    it('应该正确比较相同的基本类型值', () => {
      // Arrange & Act & Assert
      expect(deepEquals(42, 42)).toBe(true)
      expect(deepEquals('string', 'string')).toBe(true)
      expect(deepEquals(true, true)).toBe(true)
      expect(deepEquals(false, false)).toBe(true)
      expect(deepEquals(null, null)).toBe(true)
      expect(deepEquals(undefined, undefined)).toBe(true)
    })

    it('应该正确比较不同的基本类型值', () => {
      // Arrange & Act & Assert
      expect(deepEquals(42, 43)).toBe(false)
      expect(deepEquals('string', 'other')).toBe(false)
      expect(deepEquals(true, false)).toBe(false)
      expect(deepEquals(null, undefined)).toBe(false)
    })

    it('应该正确比较不同类型的值', () => {
      // Arrange & Act & Assert
      expect(deepEquals(42, '42')).toBe(false)
      expect(deepEquals(true, 1)).toBe(false)
      expect(deepEquals(0, false)).toBe(false)
      expect(deepEquals('', false)).toBe(false)
      expect(deepEquals(null, 0)).toBe(false)
      expect(deepEquals(undefined, null)).toBe(false)
    })

    it('应该正确比较特殊数值', () => {
      // Arrange & Act & Assert
      expect(deepEquals(0, -0)).toBe(true)
      expect(deepEquals(NaN, NaN)).toBe(true)
      expect(deepEquals(Infinity, Infinity)).toBe(true)
      expect(deepEquals(-Infinity, -Infinity)).toBe(true)
      expect(deepEquals(Infinity, -Infinity)).toBe(false)
    })
  })

  describe('对象比较', () => {
    it('应该正确比较相同的对象', () => {
      // Arrange
      const obj1 = { a: 1, b: 'string', c: true }
      const obj2 = { a: 1, b: 'string', c: true }

      // Act & Assert
      expect(deepEquals(obj1, obj2)).toBe(true)
    })

    it('应该正确比较不同的对象', () => {
      // Arrange
      const obj1 = { a: 1, b: 'string' }
      const obj2 = { a: 1, b: 'other' }

      // Act & Assert
      expect(deepEquals(obj1, obj2)).toBe(false)
    })

    it('应该正确比较属性数量不同的对象', () => {
      // Arrange
      const obj1 = { a: 1, b: 2 }
      const obj2 = { a: 1, b: 2, c: 3 }

      // Act & Assert
      expect(deepEquals(obj1, obj2)).toBe(false)
    })

    it('应该正确比较深度嵌套的对象', () => {
      // Arrange
      const obj1 = { a: 1, b: { c: 2, d: { e: 3, f: 4 } } }
      const obj2 = { a: 1, b: { c: 2, d: { e: 3, f: 4 } } }
      const obj3 = { a: 1, b: { c: 2, d: { e: 3, f: 5 } } }

      // Act & Assert
      expect(deepEquals(obj1, obj2)).toBe(true)
      expect(deepEquals(obj1, obj3)).toBe(false)
    })

    it('应该正确比较空对象', () => {
      // Arrange
      const obj1 = {}
      const obj2 = {}

      // Act & Assert
      expect(deepEquals(obj1, obj2)).toBe(true)
    })

    it('应该正确比较有相同引用的对象', () => {
      // Arrange
      const obj = { a: 1 }

      // Act & Assert
      expect(deepEquals(obj, obj)).toBe(true)
    })
  })

  describe('数组比较', () => {
    it('应该正确比较相同的数组', () => {
      // Arrange
      const arr1 = [1, 2, 3]
      const arr2 = [1, 2, 3]

      // Act & Assert
      expect(deepEquals(arr1, arr2)).toBe(true)
    })

    it('应该正确比较不同的数组', () => {
      // Arrange
      const arr1 = [1, 2, 3]
      const arr2 = [1, 2, 4]

      // Act & Assert
      expect(deepEquals(arr1, arr2)).toBe(false)
    })

    it('应该正确比较长度不同的数组', () => {
      // Arrange
      const arr1 = [1, 2]
      const arr2 = [1, 2, 3]

      // Act & Assert
      expect(deepEquals(arr1, arr2)).toBe(false)
    })

    it('应该正确比较深度嵌套的数组', () => {
      // Arrange
      const arr1 = [1, [2, [3, 4]], 5]
      const arr2 = [1, [2, [3, 4]], 5]
      const arr3 = [1, [2, [3, 5]], 5]

      // Act & Assert
      expect(deepEquals(arr1, arr2)).toBe(true)
      expect(deepEquals(arr1, arr3)).toBe(false)
    })

    it('应该正确比较空数组', () => {
      // Arrange
      const arr1: unknown[] = []
      const arr2: unknown[] = []

      // Act & Assert
      expect(deepEquals(arr1, arr2)).toBe(true)
    })

    it('应该正确区分数组和对象', () => {
      // Arrange
      const arr = [1, 2, 3]
      const obj = { 0: 1, 1: 2, 2: 3, length: 3 }

      // Act & Assert
      expect(deepEquals(arr, obj)).toBe(false)
    })
  })

  describe('日期对象比较', () => {
    it('应该正确比较相同的日期', () => {
      // Arrange
      const date1 = new Date('2024-01-01T00:00:00.000Z')
      const date2 = new Date('2024-01-01T00:00:00.000Z')

      // Act & Assert
      expect(deepEquals(date1, date2)).toBe(true)
    })

    it('应该正确比较不同的日期', () => {
      // Arrange
      const date1 = new Date('2024-01-01')
      const date2 = new Date('2024-01-02')

      // Act & Assert
      expect(deepEquals(date1, date2)).toBe(false)
    })

    it('应该正确比较无效的日期', () => {
      // Arrange
      const date1 = new Date('invalid')
      const date2 = new Date('invalid')

      // Act & Assert
      expect(deepEquals(date1, date2)).toBe(true)
    })

    it('应该正确区分有效和无效的日期', () => {
      // Arrange
      const validDate = new Date('2024-01-01')
      const invalidDate = new Date('invalid')

      // Act & Assert
      expect(deepEquals(validDate, invalidDate)).toBe(false)
    })
  })

  describe('正则表达式比较', () => {
    it('应该正确比较相同的正则表达式', () => {
      // Arrange
      const regex1 = /test/gi
      const regex2 = /test/gi

      // Act & Assert
      expect(deepEquals(regex1, regex2)).toBe(true)
    })

    it('应该正确比较不同标志的正则表达式', () => {
      // Arrange
      const regex1 = /test/gi
      const regex2 = /test/i

      // Act & Assert
      expect(deepEquals(regex1, regex2)).toBe(false)
    })

    it('应该正确比较不同模式的正则表达式', () => {
      // Arrange
      const regex1 = /test/gi
      const regex2 = /other/gi

      // Act & Assert
      expect(deepEquals(regex1, regex2)).toBe(false)
    })

    it('应该正确比较空正则表达式', () => {
      // Arrange
      const regex1 = /(?:)/
      const regex2 = /(?:)/

      // Act & Assert
      expect(deepEquals(regex1, regex2)).toBe(true)
    })
  })

  describe('Map 对象比较', () => {
    it('应该正确比较相同的 Map', () => {
      // Arrange
      const map1 = new Map([
        ['key1', { value: 1 }],
        ['key2', { value: 2 }]
      ])
      const map2 = new Map([
        ['key1', { value: 1 }],
        ['key2', { value: 2 }]
      ])

      // Act & Assert
      expect(deepEquals(map1, map2)).toBe(true)
    })

    it('应该正确比较不同的 Map', () => {
      // Arrange
      const map1 = new Map([
        ['key1', { value: 1 }],
        ['key2', { value: 2 }]
      ])
      const map2 = new Map([
        ['key1', { value: 1 }],
        ['key2', { value: 3 }]
      ])

      // Act & Assert
      expect(deepEquals(map1, map2)).toBe(false)
    })

    it('应该正确比较大小不同的 Map', () => {
      // Arrange
      const map1 = new Map([['key1', 1]])
      const map2 = new Map([
        ['key1', 1],
        ['key2', 2]
      ])

      // Act & Assert
      expect(deepEquals(map1, map2)).toBe(false)
    })

    it('应该正确比较空 Map', () => {
      // Arrange
      const map1 = new Map()
      const map2 = new Map()

      // Act & Assert
      expect(deepEquals(map1, map2)).toBe(true)
    })

    it('应该正确比较键不同的 Map', () => {
      // Arrange
      const map1 = new Map([['key1', 1]])
      const map2 = new Map([['key2', 1]])

      // Act & Assert
      expect(deepEquals(map1, map2)).toBe(false)
    })
  })

  describe('Set 对象比较', () => {
    it('应该正确比较相同的 Set', () => {
      // Arrange
      const set1 = new Set([1, 2, 3])
      const set2 = new Set([1, 2, 3])

      // Act & Assert
      expect(deepEquals(set1, set2)).toBe(true)
    })

    it('应该正确比较不同的 Set', () => {
      // Arrange
      const set1 = new Set([1, 2, 3])
      const set2 = new Set([1, 2, 4])

      // Act & Assert
      expect(deepEquals(set1, set2)).toBe(false)
    })

    it('应该正确比较大小不同的 Set', () => {
      // Arrange
      const set1 = new Set([1, 2])
      const set2 = new Set([1, 2, 3])

      // Act & Assert
      expect(deepEquals(set1, set2)).toBe(false)
    })

    it('应该正确比较空 Set', () => {
      // Arrange
      const set1 = new Set()
      const set2 = new Set()

      // Act & Assert
      expect(deepEquals(set1, set2)).toBe(true)
    })

    it('应该正确比较顺序不同的 Set', () => {
      // Arrange
      const set1 = new Set([1, 2, 3])
      const set2 = new Set([3, 1, 2])

      // Act & Assert
      expect(deepEquals(set1, set2)).toBe(true)
    })
  })

  describe('循环引用处理', () => {
    it('应该正确处理相同对象的循环引用', () => {
      // Arrange
      const obj: any = { a: 1 }
      obj.self = obj

      // Act & Assert
      expect(deepEquals(obj, obj)).toBe(true)
    })

    it('应该正确处理不同对象的循环引用', () => {
      // Arrange
      const obj1: any = { a: 1 }
      obj1.self = obj1
      const obj2: any = { a: 1 }
      obj2.self = obj2

      // Act & Assert
      expect(deepEquals(obj1, obj2)).toBe(false)
    })

    it('应该正确处理复杂的循环引用', () => {
      // Arrange
      const obj1: any = { a: 1, b: { c: 2 } }
      obj1.b.parent = obj1
      const obj2: any = { a: 1, b: { c: 2 } }
      obj2.b.parent = obj2

      // Act & Assert
      expect(deepEquals(obj1, obj2)).toBe(false)
    })

    it('应该正确处理数组中的循环引用', () => {
      // Arrange
      const arr1: any[] = [1, 2]
      arr1.push(arr1)
      const arr2: any[] = [1, 2]
      arr2.push(arr2)

      // Act & Assert
      expect(deepEquals(arr1, arr2)).toBe(false)
    })
  })

  describe('边界条件', () => {
    it('应该正确处理 null 和 undefined', () => {
      // Arrange & Act & Assert
      expect(deepEquals(null, null)).toBe(true)
      expect(deepEquals(undefined, undefined)).toBe(true)
      expect(deepEquals(null, undefined)).toBe(false)
      expect(deepEquals(null, 0)).toBe(false)
      expect(deepEquals(undefined, '')).toBe(false)
    })

    it('应该正确处理函数', () => {
      // Arrange
      const func1 = () => 1
      const func2 = () => 1
      const func3 = func1

      // Act & Assert
      expect(deepEquals(func1, func1)).toBe(true)
      expect(deepEquals(func1, func3)).toBe(true)
      expect(deepEquals(func1, func2)).toBe(false)
    })

    it('应该正确处理符号值', () => {
      // Arrange
      const sym1 = Symbol('test')
      const sym2 = Symbol('test')
      const sym3 = sym1

      // Act & Assert
      expect(deepEquals(sym1, sym1)).toBe(true)
      expect(deepEquals(sym1, sym3)).toBe(true)
      expect(deepEquals(sym1, sym2)).toBe(false)
    })

    it('应该正确处理包含特殊属性的对象', () => {
      // Arrange
      const obj1 = { hasOwnProperty: 'custom' }
      const obj2 = { hasOwnProperty: 'custom' }

      // Act & Assert
      expect(deepEquals(obj1, obj2)).toBe(true)
    })
  })

  describe('混合类型比较', () => {
    it('应该正确比较包含多种类型的复杂对象', () => {
      // Arrange
      const obj1 = {
        number: 42,
        string: 'test',
        boolean: true,
        null: null,
        undefined: undefined,
        array: [1, 2, { nested: true }],
        object: { a: 1, b: { c: 2 } },
        date: new Date('2024-01-01'),
        regex: /test/gi,
        map: new Map([['key', 'value']]),
        set: new Set([1, 2, 3])
      }
      const obj2 = {
        number: 42,
        string: 'test',
        boolean: true,
        null: null,
        undefined: undefined,
        array: [1, 2, { nested: true }],
        object: { a: 1, b: { c: 2 } },
        date: new Date('2024-01-01'),
        regex: /test/gi,
        map: new Map([['key', 'value']]),
        set: new Set([1, 2, 3])
      }

      // Act & Assert
      expect(deepEquals(obj1, obj2)).toBe(true)
    })

    it('应该正确比较属性顺序不同的对象', () => {
      // Arrange
      const obj1 = { a: 1, b: 2, c: 3 }
      const obj2 = { c: 3, a: 1, b: 2 }

      // Act & Assert
      expect(deepEquals(obj1, obj2)).toBe(true)
    })

    it('应该检测对象键不匹配', () => {
      // 测试第二个对象缺少第一个对象的键的情况
      const obj1 = { a: 1, b: 2, c: 3 }
      const obj2 = { a: 1, b: 2 }

      expect(deepEquals(obj1, obj2)).toBe(false)
    })

    it('应该检测复杂对象键不匹配', () => {
      // 测试嵌套对象中键不匹配的情况
      const obj1 = {
        a: 1,
        nested: {
          x: 10,
          y: 20,
          z: 30
        }
      }
      const obj2 = {
        a: 1,
        nested: {
          x: 10,
          y: 20
        }
      }

      expect(deepEquals(obj1, obj2)).toBe(false)
    })

    it('应该检测对象键存在性不同的情况', () => {
      // 测试键在一个对象中存在但在另一个对象中不存在的情况（行127-129）
      const obj1 = { a: 1, b: 2, c: 3 }
      const obj2 = { a: 1, b: 2, d: 3 } // 有 d 但没有 c

      expect(deepEquals(obj1, obj2)).toBe(false)

      // 测试相反的情况
      expect(deepEquals(obj2, obj1)).toBe(false)

      // 测试多个键不匹配
      const obj3 = { a: 1, b: 2, c: 3, d: 4 }
      const obj4 = { a: 1, b: 2, e: 3, f: 4 }

      expect(deepEquals(obj3, obj4)).toBe(false)
    })
  })
})
