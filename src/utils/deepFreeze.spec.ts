import { describe, it, expect } from 'vitest'
import { deepFreeze } from './deepFreeze'

describe('深度冻结', () => {
  describe('基本类型处理', () => {
    it('应该直接返回基本类型值', () => {
      // Arrange & Act & Assert
      expect(deepFreeze(42)).toBe(42)
      expect(deepFreeze('string')).toBe('string')
      expect(deepFreeze(true)).toBe(true)
      expect(deepFreeze(false)).toBe(false)
      expect(deepFreeze(null)).toBe(null)
      expect(deepFreeze(undefined)).toBe(undefined)
    })

    it('应该直接返回特殊数值', () => {
      // Arrange & Act & Assert
      expect(deepFreeze(0)).toBe(0)
      expect(deepFreeze(-0)).toBe(-0)
      expect(deepFreeze(NaN)).toBe(NaN)
      expect(deepFreeze(Infinity)).toBe(Infinity)
      expect(deepFreeze(-Infinity)).toBe(-Infinity)
    })

    it('应该直接返回符号值', () => {
      // Arrange
      const symbol = Symbol('test')

      // Act
      const frozen = deepFreeze(symbol)

      // Assert
      expect(frozen).toBe(symbol)
    })

    it('应该直接返回函数', () => {
      // Arrange
      const func = () => 'test'

      // Act
      const frozen = deepFreeze(func)

      // Assert
      expect(frozen).toBe(func)
    })
  })

  describe('对象冻结', () => {
    it('应该深度冻结简单对象', () => {
      // Arrange
      const obj = { a: 1, b: 'string', c: true }

      // Act
      const frozen = deepFreeze(obj)

      // Assert
      expect(Object.isFrozen(frozen)).toBe(true)
      expect(() => {
        ;(frozen as any).a = 2
      }).toThrow()
      expect(() => {
        ;(frozen as any).d = 4
      }).toThrow()
      expect(() => {
        delete (frozen as any).a
      }).toThrow()
    })

    it('应该深度冻结嵌套对象', () => {
      // Arrange
      const obj = {
        a: 1,
        b: {
          c: 2,
          d: {
            e: 3,
            f: 4
          }
        }
      }

      // Act
      const frozen = deepFreeze(obj)

      // Assert
      expect(Object.isFrozen(frozen)).toBe(true)
      expect(Object.isFrozen(frozen.b)).toBe(true)
      expect(Object.isFrozen(frozen.b.d)).toBe(true)

      expect(() => {
        ;(frozen as any).a = 2
      }).toThrow()

      expect(() => {
        ;(frozen as any).b.c = 3
      }).toThrow()

      expect(() => {
        ;(frozen as any).b.d.e = 4
      }).toThrow()
    })

    it('应该冻结空对象', () => {
      // Arrange
      const obj = {}

      // Act
      const frozen = deepFreeze(obj)

      // Assert
      expect(Object.isFrozen(frozen)).toBe(true)
      expect(() => {
        ;(frozen as any).a = 1
      }).toThrow()
    })

    it('应该处理包含 null 和 undefined 的对象', () => {
      // Arrange
      const obj = { a: null, b: undefined, c: 1 }

      // Act
      const frozen = deepFreeze(obj)

      // Assert
      expect(Object.isFrozen(frozen)).toBe(true)
      expect(frozen.a).toBe(null)
      expect(frozen.b).toBe(undefined)
      expect(() => {
        ;(frozen as any).a = 'changed'
      }).toThrow()
    })

    it('应该返回已经冻结的对象', () => {
      // Arrange
      const obj = Object.freeze({ a: 1 })

      // Act
      const frozen = deepFreeze(obj)

      // Assert
      expect(frozen).toBe(obj)
    })
  })

  describe('数组冻结', () => {
    it('应该深度冻结简单数组', () => {
      // Arrange
      const arr = [1, 2, 3]

      // Act
      const frozen = deepFreeze(arr)

      // Assert
      expect(Object.isFrozen(frozen)).toBe(true)
      expect(() => {
        ;(frozen as any)[0] = 2
      }).toThrow()
      expect(() => {
        ;(frozen as any).push(4)
      }).toThrow()
      expect(() => {
        ;(frozen as any).pop()
      }).toThrow()
    })

    it('应该深度冻结嵌套数组', () => {
      // Arrange
      const arr = [1, [2, [3, 4]], 5]

      // Act
      const frozen = deepFreeze(arr)

      // Assert
      expect(Object.isFrozen(frozen)).toBe(true)
      expect(Object.isFrozen(frozen[1])).toBe(true)
      expect(Object.isFrozen((frozen[1] as any[])[1])).toBe(true)

      expect(() => {
        ;(frozen as any)[0] = 2
      }).toThrow()

      expect(() => {
        ;(frozen[1] as any)[0] = 3
      }).toThrow()

      expect(() => {
        ;(frozen[1] as any[])[1][0] = 5
      }).toThrow()
    })

    it('应该冻结空数组', () => {
      // Arrange
      const arr: unknown[] = []

      // Act
      const frozen = deepFreeze(arr)

      // Assert
      expect(Object.isFrozen(frozen)).toBe(true)
      expect(() => {
        ;(frozen as any).push(1)
      }).toThrow()
    })

    it('应该深度冻结包含对象的数组', () => {
      // Arrange
      const arr = [{ a: 1 }, { b: 2 }]

      // Act
      const frozen = deepFreeze(arr)

      // Assert
      expect(Object.isFrozen(frozen)).toBe(true)
      expect(Object.isFrozen(frozen[0])).toBe(true)
      expect(Object.isFrozen(frozen[1])).toBe(true)

      expect(() => {
        ;(frozen[0] as any).a = 2
      }).toThrow()
    })
  })

  describe('日期对象处理', () => {
    it('应该返回日期对象的副本', () => {
      // Arrange
      const date = new Date('2024-01-01T00:00:00.000Z')

      // Act
      const frozen = deepFreeze(date)

      // Assert
      expect(frozen).toEqual(date)
      expect(frozen).not.toBe(date)
      expect(frozen.getTime()).toBe(date.getTime())
    })

    it('应该处理无效的日期', () => {
      // Arrange
      const invalidDate = new Date('invalid')

      // Act
      const frozen = deepFreeze(invalidDate)

      // Assert
      expect(frozen).toEqual(invalidDate)
      expect(frozen).not.toBe(invalidDate)
      expect(isNaN(frozen.getTime())).toBe(true)
    })

    it('应该保持原始日期不变', () => {
      // Arrange
      const date = new Date('2024-01-01')
      const originalTime = date.getTime()

      // Act
      const frozen = deepFreeze(date)
      date.setFullYear(2025)

      // Assert
      expect(frozen.getTime()).toBe(originalTime)
      expect(date.getTime()).not.toBe(originalTime)
    })
  })

  describe('正则表达式处理', () => {
    it('应该返回正则表达式的副本', () => {
      // Arrange
      const regex = /test/gi

      // Act
      const frozen = deepFreeze(regex)

      // Assert
      expect(frozen.source).toBe(regex.source)
      expect(frozen.flags).toBe(regex.flags)
      expect(frozen).not.toBe(regex)
    })

    it('应该正确复制复杂的正则表达式', () => {
      // Arrange
      const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i

      // Act
      const frozen = deepFreeze(regex)

      // Assert
      expect(frozen.source).toBe(regex.source)
      expect(frozen.flags).toBe(regex.flags)
      expect(frozen.test('test@example.com')).toBe(true)
    })

    it('应该处理没有标志的正则表达式', () => {
      // Arrange
      const regex = /simple/

      // Act
      const frozen = deepFreeze(regex)

      // Assert
      expect(frozen.source).toBe(regex.source)
      expect(frozen.flags).toBe('')
    })
  })

  describe('Map 对象处理', () => {
    it('应该深度冻结 Map 的内容', () => {
      // Arrange
      const map = new Map([
        ['key1', { value: 1 }],
        ['key2', { value: 2 }]
      ])

      // Act
      const frozen = deepFreeze(map)

      // Assert
      expect(frozen).not.toBe(map)
      expect(frozen.size).toBe(2)

      // Map 本身可以添加新项，但内容应该被冻结
      frozen.set('key3', { value: 3 })
      expect(frozen.size).toBe(3)

      // 但是内容应该被冻结
      const frozenValue = frozen.get('key1') as any
      expect(Object.isFrozen(frozenValue)).toBe(true)
      expect(() => {
        frozenValue.value = 10
      }).toThrow()
    })

    it('应该处理空 Map', () => {
      // Arrange
      const map = new Map()

      // Act
      const frozen = deepFreeze(map)

      // Assert
      expect(frozen).not.toBe(map)
      expect(frozen.size).toBe(0)
    })

    it('应该深度冻结 Map 中的复杂值', () => {
      // Arrange
      const map = new Map([['nested', { a: { b: { c: 1 } } }]])

      // Act
      const frozen = deepFreeze(map)

      // Assert
      const value = frozen.get('nested') as any
      expect(Object.isFrozen(value)).toBe(true)
      expect(Object.isFrozen(value.a)).toBe(true)
      expect(Object.isFrozen(value.a.b)).toBe(true)

      expect(() => {
        value.a.b.c = 2
      }).toThrow()
    })

    it('应该深度冻结 Map 的键', () => {
      // Arrange
      const keyObj = { id: 'key' }
      const map = new Map([[keyObj, 'value']])

      // Act
      const frozen = deepFreeze(map)

      // Assert
      const frozenKeys = Array.from(frozen.keys())
      expect(Object.isFrozen(frozenKeys[0])).toBe(true)
      expect(() => {
        ;(frozenKeys[0] as any).id = 'changed'
      }).toThrow()
    })
  })

  describe('Set 对象处理', () => {
    it('应该深度冻结 Set 的内容', () => {
      // Arrange
      const set = new Set([{ value: 1 }, { value: 2 }])

      // Act
      const frozen = deepFreeze(set)

      // Assert
      expect(frozen).not.toBe(set)
      expect(frozen.size).toBe(2)

      // Set 本身可以添加新项，但内容应该被冻结
      frozen.add({ value: 3 })
      expect(frozen.size).toBe(3)

      // 但是内容应该被冻结
      const values = Array.from(frozen.values())
      values.forEach(value => {
        expect(Object.isFrozen(value)).toBe(true)
        expect(() => {
          ;(value as any).value = 10
        }).toThrow()
      })
    })

    it('应该处理空 Set', () => {
      // Arrange
      const set = new Set()

      // Act
      const frozen = deepFreeze(set)

      // Assert
      expect(frozen).not.toBe(set)
      expect(frozen.size).toBe(0)
    })

    it('应该深度冻结 Set 中的复杂值', () => {
      // Arrange
      const set = new Set([{ a: { b: { c: 1 } } }])

      // Act
      const frozen = deepFreeze(set)

      // Assert
      const value = Array.from(frozen.values())[0] as any
      expect(Object.isFrozen(value)).toBe(true)
      expect(Object.isFrozen(value.a)).toBe(true)
      expect(Object.isFrozen(value.a.b)).toBe(true)

      expect(() => {
        value.a.b.c = 2
      }).toThrow()
    })

    it('应该处理包含基本类型的 Set', () => {
      // Arrange
      const set = new Set([1, 'string', true, null])

      // Act
      const frozen = deepFreeze(set)

      // Assert
      expect(frozen.has(1)).toBe(true)
      expect(frozen.has('string')).toBe(true)
      expect(frozen.has(true)).toBe(true)
      expect(frozen.has(null)).toBe(true)
    })
  })

  describe('边界条件处理', () => {
    it('应该处理循环引用对象', () => {
      // Arrange
      const obj: any = { a: 1 }
      obj.self = obj

      // Act & Assert
      // 由于循环引用，deepFreeze 可能会遇到问题，但不应该崩溃
      expect(() => deepFreeze(obj)).not.toThrow()
    })

    it('应该处理复杂的循环引用', () => {
      // Arrange
      const obj1: any = { name: 'obj1' }
      const obj2: any = { name: 'obj2' }
      obj1.ref = obj2
      obj2.ref = obj1

      // Act & Assert
      expect(() => deepFreeze(obj1)).not.toThrow()
    })

    it('应该处理包含多种类型的对象', () => {
      // Arrange
      const obj = {
        number: 42,
        string: 'test',
        boolean: true,
        null: null,
        undefined: undefined,
        array: [1, 2, { nested: true }],
        object: { a: 1, b: { c: 2 } },
        date: new Date('2024-01-01'),
        regex: /test/gi,
        map: new Map([['key', { value: 1 }]]),
        set: new Set([{ item: 1 }])
      }

      // Act
      const frozen = deepFreeze(obj)

      // Assert
      expect(Object.isFrozen(frozen)).toBe(true)
      expect(Object.isFrozen(frozen.array)).toBe(true)
      expect(Object.isFrozen(frozen.object)).toBe(true)
      expect(frozen.date).not.toBe(obj.date)
      expect(frozen.regex).not.toBe(obj.regex)
      expect(frozen.map).not.toBe(obj.map)
      expect(frozen.set).not.toBe(obj.set)
    })

    it('应该处理原型链上的属性', () => {
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

      // Act
      const frozen = deepFreeze(instance)

      // Assert
      expect(Object.isFrozen(frozen)).toBe(true)
      expect(() => {
        ;(frozen as any).childProp = 'changed'
      }).toThrow()
    })

    it('应该保持不可变性', () => {
      // Arrange
      const original = {
        a: 1,
        b: [1, 2, 3],
        c: { d: 4 }
      }

      // Act
      const frozen = deepFreeze(original)

      // 尝试修改原始对象
      original.a = 999
      original.b.push(4)
      original.c.d = 999

      // Assert
      // frozen 对象应该保持不变
      expect(frozen.a).toBe(1)
      expect(frozen.b).toHaveLength(3)
      expect(frozen.c.d).toBe(4)
    })
  })

  describe('性能和内存', () => {
    it('应该只创建必要的副本', () => {
      // Arrange
      const obj = {
        primitive: 42,
        nested: { a: 1 }
      }

      // Act
      const frozen = deepFreeze(obj)

      // Assert
      // 基本类型应该保持相同的引用
      expect(frozen.primitive).toBe(obj.primitive)
      // 对象应该是新的副本
      expect(frozen.nested).not.toBe(obj.nested)
    })

    it('应该处理大型对象结构', () => {
      // Arrange
      const largeObj: Record<string, any> = {}
      for (let i = 0; i < 100; i++) {
        largeObj[`key${i}`] = {
          value: i,
          nested: { deep: i * 2 }
        }
      }

      // Act & Assert
      expect(() => deepFreeze(largeObj)).not.toThrow()
      const frozen = deepFreeze(largeObj)

      expect(Object.isFrozen(frozen)).toBe(true)
      expect(Object.isFrozen(frozen.key0)).toBe(true)
      expect(Object.isFrozen(frozen.key0.nested)).toBe(true)
    })
  })
})
