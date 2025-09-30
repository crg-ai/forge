import { describe, it, expect } from 'vitest'
import { merge, pick, omit } from './object'

describe('对象工具函数', () => {
  describe('merge 函数', () => {
    describe('基本合并功能', () => {
      it('应该合并两个简单对象', () => {
        // Arrange
        const obj1 = { a: 1, b: 2 }
        const obj2 = { b: 3, c: 4 }

        // Act
        const result = merge(obj1, obj2)

        // Assert
        expect(result).toEqual({ a: 1, b: 3, c: 4 })
      })

      it('应该合并多个对象', () => {
        // Arrange
        const obj1 = { a: 1 }
        const obj2 = { b: 2 }
        const obj3 = { c: 3 }
        const obj4 = { d: 4 }

        // Act
        const result = merge(obj1, obj2, obj3, obj4)

        // Assert
        expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4 })
      })

      it('应该正确处理空对象', () => {
        // Arrange
        const obj1 = { a: 1, b: 2 }
        const obj2 = {}

        // Act
        const result = merge(obj1, obj2)

        // Assert
        expect(result).toEqual({ a: 1, b: 2 })
      })

      it('应该处理单个对象', () => {
        // Arrange
        const obj = { a: 1, b: 2 }

        // Act
        const result = merge(obj)

        // Assert
        expect(result).toEqual({ a: 1, b: 2 })
        expect(result).not.toBe(obj) // 应该是新对象
      })

      it('应该处理空参数列表', () => {
        // Arrange & Act
        const result = merge()

        // Assert
        expect(result).toEqual({})
      })
    })

    describe('深度合并功能', () => {
      it('应该深度合并嵌套对象', () => {
        // Arrange
        const obj1 = { a: { b: 1, c: 2 } }
        const obj2 = { a: { c: 3, d: 4 } }

        // Act
        const result = merge(obj1, obj2 as any)

        // Assert
        expect(result).toEqual({ a: { b: 1, c: 3, d: 4 } })
      })

      it('应该处理多层嵌套的对象', () => {
        // Arrange
        const obj1 = {
          a: {
            b: {
              c: 1,
              d: 2
            },
            e: 3
          }
        }
        const obj2 = {
          a: {
            b: {
              d: 4,
              f: 5
            },
            g: 6
          }
        }

        // Act
        const result = merge(obj1, obj2)

        // Assert
        expect(result).toEqual({
          a: {
            b: {
              c: 1,
              d: 4,
              f: 5
            },
            e: 3,
            g: 6
          }
        })
      })

      it('应该正确处理嵌套对象与基本类型的冲突', () => {
        // Arrange
        const obj1 = { a: { b: 1 } }
        const obj2 = { a: 'string' }

        // Act
        const result = merge(obj1, obj2)

        // Assert
        expect(result).toEqual({ a: 'string' })
      })

      it('应该正确处理基本类型与嵌套对象的冲突', () => {
        // Arrange
        const obj1 = { a: 'string' }
        const obj2 = { a: { b: 1 } }

        // Act
        const result = merge(obj1, obj2)

        // Assert
        expect(result).toEqual({ a: { b: 1 } })
      })
    })

    describe('null 和 undefined 处理', () => {
      it('应该忽略 null 参数', () => {
        // Arrange
        const obj1 = { a: 1 }
        const obj2 = { b: 2 }

        // Act
        const result = merge(obj1, null as any, obj2)

        // Assert
        expect(result).toEqual({ a: 1, b: 2 })
      })

      it('应该忽略 undefined 参数', () => {
        // Arrange
        const obj1 = { a: 1 }
        const obj2 = { b: 2 }

        // Act
        const result = merge(obj1, undefined as any, obj2)

        // Assert
        expect(result).toEqual({ a: 1, b: 2 })
      })

      it('应该正确处理包含 null 值的属性', () => {
        // Arrange
        const obj1 = { a: 1, b: null }
        const obj2 = { b: 2, c: null }

        // Act
        const result = merge(obj1, obj2)

        // Assert
        expect(result).toEqual({ a: 1, b: 2, c: null })
      })

      it('应该正确处理包含 undefined 值的属性', () => {
        // Arrange
        const obj1 = { a: 1, b: undefined }
        const obj2 = { b: 2, c: undefined }

        // Act
        const result = merge(obj1, obj2)

        // Assert
        expect(result).toEqual({ a: 1, b: 2, c: undefined })
      })
    })

    describe('数组处理', () => {
      it('应该覆盖而不是合并数组', () => {
        // Arrange
        const obj1 = { arr: [1, 2] }
        const obj2 = { arr: [3, 4, 5] }

        // Act
        const result = merge(obj1, obj2)

        // Assert
        expect(result.arr).toEqual([3, 4, 5])
      })

      it('应该正确处理嵌套数组', () => {
        // Arrange
        const obj1 = { data: { items: [1, 2] } }
        const obj2 = { data: { items: [3, 4] } }

        // Act
        const result = merge(obj1, obj2)

        // Assert
        expect(result.data.items).toEqual([3, 4])
      })

      it('应该处理数组与对象的冲突', () => {
        // Arrange
        const obj1 = { a: [1, 2, 3] }
        const obj2 = { a: { b: 1 } }

        // Act
        const result = merge(obj1, obj2)

        // Assert
        expect(result.a).toEqual({ b: 1 })
      })
    })

    describe('特殊对象处理', () => {
      it('应该正确处理日期对象', () => {
        // Arrange
        const date1 = new Date('2024-01-01')
        const date2 = new Date('2024-12-31')
        const obj1 = { date: date1 }
        const obj2 = { date: date2 }

        // Act
        const result = merge(obj1, obj2)

        // Assert
        expect(result.date).toEqual(date2)
        expect(result.date).not.toBe(date2) // 应该是深拷贝
      })

      it('应该正确处理正则表达式', () => {
        // Arrange
        const regex1 = /test1/g
        const regex2 = /test2/i
        const obj1 = { regex: regex1 }
        const obj2 = { regex: regex2 }

        // Act
        const result = merge(obj1, obj2)

        // Assert
        expect(result.regex).toEqual(regex2)
        expect(result.regex).not.toBe(regex2) // 应该是深拷贝
      })

      it('应该正确处理 Map 和 Set', () => {
        // Arrange
        const map1 = new Map([['key1', 'value1']])
        const map2 = new Map([['key2', 'value2']])
        const set1 = new Set([1, 2])
        const set2 = new Set([3, 4])
        const obj1 = { map: map1, set: set1 }
        const obj2 = { map: map2, set: set2 }

        // Act
        const result = merge(obj1, obj2)

        // Assert
        expect(result.map).toEqual(map2)
        expect(result.set).toEqual(set2)
        expect(result.map).not.toBe(map2)
        expect(result.set).not.toBe(set2)
      })
    })

    describe('不可变性', () => {
      it('应该创建新对象而不修改原对象', () => {
        // Arrange
        const obj1 = { a: 1, b: { c: 2 } }
        const obj2 = { b: { d: 3 }, e: 4 }

        // Act
        const result = merge(obj1, obj2)

        // Assert
        expect(result).not.toBe(obj1)
        expect(result).not.toBe(obj2)
        expect(obj1).toEqual({ a: 1, b: { c: 2 } }) // 原对象不变
        expect(obj2).toEqual({ b: { d: 3 }, e: 4 }) // 原对象不变
      })

      it('应该深度克隆嵌套对象', () => {
        // Arrange
        const nested = { value: 1 }
        const obj1 = { a: nested }

        // Act
        const result = merge(obj1)

        // Assert
        expect(result.a).toEqual(nested)
        expect(result.a).not.toBe(nested) // 应该是新对象

        // 修改原嵌套对象不应该影响结果
        nested.value = 2
        expect(result.a.value).toBe(1)
      })

      it('应该避免共享嵌套引用', () => {
        // Arrange
        const obj1 = { a: { b: 1 } }
        const obj2 = { c: 2 }

        // Act
        const result = merge(obj1, obj2)

        // Assert
        // 修改原对象的嵌套属性不应该影响结果
        obj1.a.b = 999
        expect(result.a.b).toBe(1)
      })
    })

    describe('边界条件', () => {
      it('应该处理包含原型链属性的对象', () => {
        // Arrange
        function Parent() {
          // @ts-expect-error - 测试原型链
          this.parentProp = 'parent'
        }
        Parent.prototype.protoMethod = function () {
          return 'proto'
        }

        function Child() {
          Parent.call(this)
          // @ts-expect-error - 测试原型链
          this.childProp = 'child'
        }
        Child.prototype = Object.create(Parent.prototype)

        const instance = new Child()
        const obj = { other: 'value' }

        // Act
        const result = merge(instance, obj)

        // Assert
        expect(result.other).toBe('value')
        expect(result.parentProp).toBe('parent')
        expect(result.childProp).toBe('child')
      })

      it('应该处理循环引用对象', () => {
        // Arrange
        const obj1: any = { a: 1 }
        const obj2 = { b: 2 }
        obj1.self = obj1

        // Act & Assert
        expect(() => merge(obj1, obj2)).not.toThrow()
      })

      it('应该处理大型对象', () => {
        // Arrange
        const obj1: Record<string, any> = {}
        const obj2: Record<string, any> = {}
        for (let i = 0; i < 100; i++) {
          obj1[`key${i}`] = { value: i }
          obj2[`key${i + 50}`] = { value: i + 50 }
        }

        // Act
        const result = merge(obj1, obj2)

        // Assert
        expect(Object.keys(result)).toHaveLength(150)
        expect(result.key0.value).toBe(0)
        expect(result.key99.value).toBe(99)
        expect(result.key149.value).toBe(149)
      })
    })
  })

  describe('pick 函数', () => {
    describe('基本选择功能', () => {
      it('应该选择指定的属性', () => {
        // Arrange
        const obj = { a: 1, b: 2, c: 3, d: 4 }
        const keys = ['a', 'c'] as const

        // Act
        const result = pick(obj, keys)

        // Assert
        expect(result).toEqual({ a: 1, c: 3 })
      })

      it('应该处理单个属性选择', () => {
        // Arrange
        const obj = { a: 1, b: 2, c: 3 }
        const keys = ['b'] as const

        // Act
        const result = pick(obj, keys)

        // Assert
        expect(result).toEqual({ b: 2 })
      })

      it('应该处理所有属性选择', () => {
        // Arrange
        const obj = { a: 1, b: 2 }
        const keys = ['a', 'b'] as const

        // Act
        const result = pick(obj, keys)

        // Assert
        expect(result).toEqual({ a: 1, b: 2 })
      })

      it('应该创建新对象', () => {
        // Arrange
        const obj = { a: 1, b: 2, c: 3 }
        const keys = ['a', 'b'] as const

        // Act
        const result = pick(obj, keys)

        // Assert
        expect(result).not.toBe(obj)
      })
    })

    describe('边界条件处理', () => {
      it('应该忽略不存在的属性', () => {
        // Arrange
        const obj = { a: 1, b: 2 }
        const keys = ['a', 'c'] as (keyof typeof obj)[]

        // Act
        const result = pick(obj, keys)

        // Assert
        expect(result).toEqual({ a: 1 })
        expect('c' in result).toBe(false)
      })

      it('应该处理空属性列表', () => {
        // Arrange
        const obj = { a: 1, b: 2 }
        const keys: (keyof typeof obj)[] = []

        // Act
        const result = pick(obj, keys)

        // Assert
        expect(result).toEqual({})
      })

      it('应该处理空对象', () => {
        // Arrange
        const obj = {}
        const keys = ['a'] as any[]

        // Act
        const result = pick(obj, keys)

        // Assert
        expect(result).toEqual({})
      })

      it('应该正确处理包含特殊值的属性', () => {
        // Arrange
        const obj = {
          a: null,
          b: undefined,
          c: 0,
          d: false,
          e: '',
          f: NaN
        }
        const keys = ['a', 'b', 'c', 'd', 'e', 'f'] as const

        // Act
        const result = pick(obj, keys)

        // Assert
        expect(result).toEqual({
          a: null,
          b: undefined,
          c: 0,
          d: false,
          e: '',
          f: NaN
        })
      })
    })

    describe('复杂对象处理', () => {
      it('应该正确处理包含对象的属性', () => {
        // Arrange
        const nested = { x: 1, y: 2 }
        const obj = { a: nested, b: 'string', c: [1, 2, 3] }
        const keys = ['a', 'c'] as const

        // Act
        const result = pick(obj, keys)

        // Assert
        expect(result).toEqual({ a: nested, c: [1, 2, 3] })
        expect(result.a).toBe(nested) // 应该保持引用
      })

      it('应该正确处理日期和正则表达式', () => {
        // Arrange
        const date = new Date('2024-01-01')
        const regex = /test/g
        const obj = { date, regex, other: 'value' }
        const keys = ['date', 'regex'] as const

        // Act
        const result = pick(obj, keys)

        // Assert
        expect(result).toEqual({ date, regex })
        expect(result.date).toBe(date)
        expect(result.regex).toBe(regex)
      })

      it('应该正确处理函数属性', () => {
        // Arrange
        const func = () => 'test'
        const obj = { func, value: 1 }
        const keys = ['func'] as const

        // Act
        const result = pick(obj, keys)

        // Assert
        expect(result).toEqual({ func })
        expect(result.func).toBe(func)
      })
    })

    describe('类型安全性', () => {
      it('应该保持类型安全', () => {
        // Arrange
        const obj = { a: 1, b: 'string', c: true }
        const keys = ['a', 'b'] as const

        // Act
        const result = pick(obj, keys)

        // Assert - TypeScript 应该推断出正确的类型
        expect(typeof result.a).toBe('number')
        expect(typeof result.b).toBe('string')
        // @ts-expect-error - c 属性不应该存在
        expect(result.c).toBeUndefined()
      })
    })
  })

  describe('omit 函数', () => {
    describe('基本排除功能', () => {
      it('应该排除指定的属性', () => {
        // Arrange
        const obj = { a: 1, b: 2, c: 3, d: 4 }
        const keys = ['b', 'd'] as const

        // Act
        const result = omit(obj, keys)

        // Assert
        expect(result).toEqual({ a: 1, c: 3 })
      })

      it('应该处理单个属性排除', () => {
        // Arrange
        const obj = { a: 1, b: 2, c: 3 }
        const keys = ['b'] as const

        // Act
        const result = omit(obj, keys)

        // Assert
        expect(result).toEqual({ a: 1, c: 3 })
      })

      it('应该处理全部属性排除', () => {
        // Arrange
        const obj = { a: 1, b: 2 }
        const keys = ['a', 'b'] as const

        // Act
        const result = omit(obj, keys)

        // Assert
        expect(result).toEqual({})
      })

      it('应该创建新对象', () => {
        // Arrange
        const obj = { a: 1, b: 2, c: 3 }
        const keys = ['b'] as const

        // Act
        const result = omit(obj, keys)

        // Assert
        expect(result).not.toBe(obj)
      })
    })

    describe('边界条件处理', () => {
      it('应该忽略不存在的属性', () => {
        // Arrange
        const obj = { a: 1, b: 2 }
        const keys = ['c'] as (keyof typeof obj)[]

        // Act
        const result = omit(obj, keys)

        // Assert
        expect(result).toEqual({ a: 1, b: 2 })
      })

      it('应该处理空排除列表', () => {
        // Arrange
        const obj = { a: 1, b: 2 }
        const keys: (keyof typeof obj)[] = []

        // Act
        const result = omit(obj, keys)

        // Assert
        expect(result).toEqual({ a: 1, b: 2 })
      })

      it('应该处理空对象', () => {
        // Arrange
        const obj = {}
        const keys = ['a'] as any[]

        // Act
        const result = omit(obj, keys)

        // Assert
        expect(result).toEqual({})
      })

      it('应该正确处理包含特殊值的属性', () => {
        // Arrange
        const obj = {
          a: null,
          b: undefined,
          c: 0,
          d: false,
          e: '',
          f: NaN,
          g: 'keep'
        }
        const keys = ['a', 'b', 'c'] as const

        // Act
        const result = omit(obj, keys)

        // Assert
        expect(result).toEqual({
          d: false,
          e: '',
          f: NaN,
          g: 'keep'
        })
      })
    })

    describe('复杂对象处理', () => {
      it('应该正确处理包含对象的属性', () => {
        // Arrange
        const nested = { x: 1, y: 2 }
        const obj = { a: nested, b: 'string', c: [1, 2, 3] }
        const keys = ['b'] as const

        // Act
        const result = omit(obj, keys)

        // Assert
        expect(result).toEqual({ a: nested, c: [1, 2, 3] })
        expect(result.a).toBe(nested) // 应该保持引用
      })

      it('应该正确处理日期和正则表达式', () => {
        // Arrange
        const date = new Date('2024-01-01')
        const regex = /test/g
        const obj = { date, regex, other: 'value' }
        const keys = ['other'] as const

        // Act
        const result = omit(obj, keys)

        // Assert
        expect(result).toEqual({ date, regex })
        expect(result.date).toBe(date)
        expect(result.regex).toBe(regex)
      })

      it('应该正确处理函数属性', () => {
        // Arrange
        const func = () => 'test'
        const obj = { func, value: 1 }
        const keys = ['value'] as const

        // Act
        const result = omit(obj, keys)

        // Assert
        expect(result).toEqual({ func })
        expect(result.func).toBe(func)
      })
    })

    describe('类型安全性', () => {
      it('应该保持类型安全', () => {
        // Arrange
        const obj = { a: 1, b: 'string', c: true }
        const keys = ['b'] as const

        // Act
        const result = omit(obj, keys)

        // Assert - TypeScript 应该推断出正确的类型
        expect(typeof result.a).toBe('number')
        expect(typeof result.c).toBe('boolean')
        // @ts-expect-error - b 属性不应该存在
        expect(result.b).toBeUndefined()
      })
    })

    describe('不可变性', () => {
      it('应该不修改原对象', () => {
        // Arrange
        const originalObj = { a: 1, b: 2, c: 3 }
        const keys = ['b'] as const

        // Act
        const result = omit(originalObj, keys)

        // Assert
        expect(originalObj).toEqual({ a: 1, b: 2, c: 3 }) // 原对象不变
        expect(result).toEqual({ a: 1, c: 3 })
        expect(result).not.toBe(originalObj)
      })

      it('应该保持嵌套对象的引用', () => {
        // Arrange
        const nested = { x: 1 }
        const obj = { a: nested, b: 'remove' }
        const keys = ['b'] as const

        // Act
        const result = omit(obj, keys)

        // Assert
        expect(result.a).toBe(nested) // 应该保持引用
      })
    })
  })

  describe('函数组合使用', () => {
    it('应该支持 pick 和 omit 的组合使用', () => {
      // Arrange
      const obj = { a: 1, b: 2, c: 3, d: 4, e: 5 }

      // Act
      const picked = pick(obj, ['a', 'b', 'c'])
      const result = omit(picked, ['b'])

      // Assert
      expect(result).toEqual({ a: 1, c: 3 })
    })

    it('应该支持 merge 和 pick 的组合使用', () => {
      // Arrange
      const obj1 = { a: 1, b: 2 }
      const obj2 = { c: 3, d: 4 }

      // Act
      const merged = merge(obj1, obj2)
      const result = pick(merged, ['a', 'c'])

      // Assert
      expect(result).toEqual({ a: 1, c: 3 })
    })

    it('应该支持 merge 和 omit 的组合使用', () => {
      // Arrange
      const obj1 = { a: 1, b: 2 }
      const obj2 = { c: 3, d: 4 }

      // Act
      const merged = merge(obj1, obj2)
      const result = omit(merged, ['b', 'd'])

      // Assert
      expect(result).toEqual({ a: 1, c: 3 })
    })

    it('应该支持复杂的函数链式调用', () => {
      // Arrange
      const base = { a: 1, b: 2 }
      const extension = { c: 3, d: 4, e: 5 }
      const override = { b: 20, f: 6 }

      // Act
      const step1 = merge(base, extension)
      const step2 = merge(step1, override)
      const step3 = omit(step2, ['d', 'e'])
      const result = pick(step3, ['a', 'b', 'c'])

      // Assert
      expect(result).toEqual({ a: 1, b: 20, c: 3 })
    })
  })

  describe('性能测试', () => {
    it('应该高效处理大型对象的 merge 操作', () => {
      // Arrange
      const obj1: Record<string, any> = {}
      const obj2: Record<string, any> = {}
      for (let i = 0; i < 1000; i++) {
        obj1[`key${i}`] = { value: i }
        obj2[`key${i + 500}`] = { value: i + 500 }
      }

      // Act
      const startTime = Date.now()
      const result = merge(obj1, obj2)
      const endTime = Date.now()

      // Assert
      expect(endTime - startTime).toBeLessThan(100) // 应该在100ms内完成
      expect(Object.keys(result)).toHaveLength(1500)
    })

    it('应该高效处理大型对象的 pick 操作', () => {
      // Arrange
      const obj: Record<string, number> = {}
      const keys: string[] = []
      for (let i = 0; i < 1000; i++) {
        obj[`key${i}`] = i
        if (i % 2 === 0) {
          keys.push(`key${i}`)
        }
      }

      // Act
      const startTime = Date.now()
      const result = pick(obj, keys)
      const endTime = Date.now()

      // Assert
      expect(endTime - startTime).toBeLessThan(50) // 应该在50ms内完成
      expect(Object.keys(result)).toHaveLength(500)
    })

    it('应该高效处理大型对象的 omit 操作', () => {
      // Arrange
      const obj: Record<string, number> = {}
      const keys: string[] = []
      for (let i = 0; i < 1000; i++) {
        obj[`key${i}`] = i
        if (i % 2 === 0) {
          keys.push(`key${i}`)
        }
      }

      // Act
      const startTime = Date.now()
      const result = omit(obj, keys)
      const endTime = Date.now()

      // Assert
      expect(endTime - startTime).toBeLessThan(50) // 应该在50ms内完成
      expect(Object.keys(result)).toHaveLength(500)
    })
  })
})
