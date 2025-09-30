import { describe, it, expect } from 'vitest'
import { safeStringify } from './safeStringify'

describe('安全字符串化', () => {
  describe('基本类型处理', () => {
    it('应该正确序列化基本类型', () => {
      // Arrange & Act & Assert
      expect(safeStringify(42)).toBe('42')
      expect(safeStringify('string')).toBe('"string"')
      expect(safeStringify(true)).toBe('true')
      expect(safeStringify(false)).toBe('false')
      expect(safeStringify(null)).toBe('null')
    })

    it('应该正确处理 undefined', () => {
      // Arrange & Act & Assert
      expect(safeStringify(undefined)).toBe(undefined)
    })

    it('应该正确处理特殊数值', () => {
      // Arrange & Act & Assert
      expect(safeStringify(0)).toBe('0')
      expect(safeStringify(-0)).toBe('0')
      expect(safeStringify(Infinity)).toBe('null')
      expect(safeStringify(-Infinity)).toBe('null')
      expect(safeStringify(NaN)).toBe('null')
    })

    it('应该正确处理特殊字符串', () => {
      // Arrange & Act & Assert
      expect(safeStringify('')).toBe('""')
      expect(safeStringify('hello\nworld')).toBe('"hello\\nworld"')
      expect(safeStringify('hello\tworld')).toBe('"hello\\tworld"')
      expect(safeStringify('hello"world')).toBe('"hello\\"world"')
      expect(safeStringify('hello\\world')).toBe('"hello\\\\world"')
    })
  })

  describe('简单对象处理', () => {
    it('应该正确序列化空对象', () => {
      // Arrange
      const obj = {}

      // Act
      const result = safeStringify(obj)

      // Assert
      expect(result).toBe('{}')
      expect(JSON.parse(result)).toEqual(obj)
    })

    it('应该正确序列化简单对象', () => {
      // Arrange
      const obj = { a: 1, b: 'string', c: true, d: null }

      // Act
      const result = safeStringify(obj)

      // Assert
      expect(JSON.parse(result)).toEqual(obj)
    })

    it('应该正确序列化嵌套对象', () => {
      // Arrange
      const obj = {
        a: 1,
        b: {
          c: 2,
          d: {
            e: 3,
            f: 'nested'
          }
        }
      }

      // Act
      const result = safeStringify(obj)

      // Assert
      expect(JSON.parse(result)).toEqual(obj)
    })

    it('应该正确处理包含 undefined 的对象', () => {
      // Arrange
      const obj = { a: 1, b: undefined, c: 'string' }

      // Act
      const result = safeStringify(obj)

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed.a).toBe(1)
      expect(parsed.c).toBe('string')
      expect('b' in parsed).toBe(false) // undefined 属性应该被忽略
    })

    it('应该正确处理包含函数的对象', () => {
      // Arrange
      const obj = { a: 1, b: () => 'test', c: 'string' }

      // Act
      const result = safeStringify(obj)

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed.a).toBe(1)
      expect(parsed.c).toBe('string')
      expect('b' in parsed).toBe(false) // 函数属性应该被忽略
    })
  })

  describe('数组处理', () => {
    it('应该正确序列化空数组', () => {
      // Arrange
      const arr: unknown[] = []

      // Act
      const result = safeStringify(arr)

      // Assert
      expect(result).toBe('[]')
      expect(JSON.parse(result)).toEqual(arr)
    })

    it('应该正确序列化简单数组', () => {
      // Arrange
      const arr = [1, 'string', true, null]

      // Act
      const result = safeStringify(arr)

      // Assert
      expect(JSON.parse(result)).toEqual(arr)
    })

    it('应该正确序列化嵌套数组', () => {
      // Arrange
      const arr = [1, [2, [3, 4]], 5]

      // Act
      const result = safeStringify(arr)

      // Assert
      expect(JSON.parse(result)).toEqual(arr)
    })

    it('应该正确处理包含对象的数组', () => {
      // Arrange
      const arr = [{ a: 1 }, { b: 2 }, { c: { d: 3 } }]

      // Act
      const result = safeStringify(arr)

      // Assert
      expect(JSON.parse(result)).toEqual(arr)
    })

    it('应该正确处理稀疏数组', () => {
      // Arrange
      const arr = [1, , , 4] // eslint-disable-line no-sparse-arrays

      // Act
      const result = safeStringify(arr)

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed).toEqual([1, null, null, 4])
    })
  })

  describe('循环引用处理', () => {
    it('应该处理简单的循环引用', () => {
      // Arrange
      const obj: any = { a: 1 }
      obj.self = obj

      // Act
      const result = safeStringify(obj)

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed.a).toBe(1)
      expect(parsed.self).toBe('[Circular ~]')
    })

    it('应该处理嵌套的循环引用', () => {
      // Arrange
      const obj: any = { a: 1, b: { c: 2 } }
      obj.b.parent = obj

      // Act
      const result = safeStringify(obj)

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed.a).toBe(1)
      expect(parsed.b.c).toBe(2)
      expect(parsed.b.parent).toBe('[Circular ~]')
    })

    it('应该处理数组中的循环引用', () => {
      // Arrange
      const arr: any[] = [1, 2]
      arr.push(arr)

      // Act
      const result = safeStringify(arr)

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed[0]).toBe(1)
      expect(parsed[1]).toBe(2)
      expect(parsed[2]).toBe('[Circular ~]')
    })

    it('应该处理复杂的循环引用结构', () => {
      // Arrange
      const obj1: any = { name: 'obj1' }
      const obj2: any = { name: 'obj2' }
      obj1.ref = obj2
      obj2.ref = obj1

      // Act
      const result = safeStringify(obj1)

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed.name).toBe('obj1')
      expect(parsed.ref.name).toBe('obj2')
      expect(parsed.ref.ref).toBe('[Circular ~]')
    })

    it('应该处理多层嵌套的循环引用', () => {
      // Arrange
      const obj: any = {
        a: {
          b: {
            c: {}
          }
        }
      }
      obj.a.b.c.root = obj

      // Act
      const result = safeStringify(obj)

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed.a.b.c.root).toBe('[Circular ~]')
    })
  })

  describe('日期对象处理', () => {
    it('应该正确序列化有效日期', () => {
      // Arrange
      const date = new Date('2024-01-01T00:00:00.000Z')

      // Act
      const result = safeStringify({ date })

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed.date).toBe('2024-01-01T00:00:00.000Z')
    })

    it('应该正确序列化当前日期', () => {
      // Arrange
      const now = new Date()
      const obj = { timestamp: now }

      // Act
      const result = safeStringify(obj)

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed.timestamp).toBe(now.toISOString())
    })

    it('应该正确处理无效日期', () => {
      // Arrange
      const invalidDate = new Date('invalid')
      const obj = { date: invalidDate }

      // Act
      const result = safeStringify(obj)

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed.date).toBe(null) // 无效日期会被转换为 null
    })

    it('应该正确处理日期数组', () => {
      // Arrange
      const dates = [new Date('2024-01-01'), new Date('2024-12-31'), new Date('invalid')]

      // Act
      const result = safeStringify(dates)

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed[0]).toMatch(/^2024-01-01T/)
      expect(parsed[1]).toMatch(/^2024-12-31T/)
      expect(parsed[2]).toBe(null)
    })
  })

  describe('正则表达式处理', () => {
    it('应该正确序列化正则表达式', () => {
      // Arrange
      const regex = /test/gi
      const obj = { regex }

      // Act
      const result = safeStringify(obj)

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed.regex).toBe('/test/gi')
    })

    it('应该正确处理复杂的正则表达式', () => {
      // Arrange
      const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i
      const obj = { emailRegex: regex }

      // Act
      const result = safeStringify(obj)

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed.emailRegex).toBe('/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/i')
    })

    it('应该正确处理没有标志的正则表达式', () => {
      // Arrange
      const regex = /simple/
      const obj = { regex }

      // Act
      const result = safeStringify(obj)

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed.regex).toBe('/simple/')
    })

    it('应该正确处理正则表达式数组', () => {
      // Arrange
      const regexes = [/test/g, /example/i, /pattern/gi]

      // Act
      const result = safeStringify(regexes)

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed[0]).toBe('/test/g')
      expect(parsed[1]).toBe('/example/i')
      expect(parsed[2]).toBe('/pattern/gi')
    })
  })

  describe('Map 对象处理', () => {
    it('应该正确序列化空 Map', () => {
      // Arrange
      const map = new Map()
      const obj = { map }

      // Act
      const result = safeStringify(obj)

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed.map._type).toBe('Map')
      expect(parsed.map.entries).toEqual([])
    })

    it('应该正确序列化简单 Map', () => {
      // Arrange
      const map = new Map([
        ['key1', 'value1'],
        ['key2', 'value2']
      ])
      const obj = { map }

      // Act
      const result = safeStringify(obj)

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed.map._type).toBe('Map')
      expect(parsed.map.entries).toEqual([
        ['key1', 'value1'],
        ['key2', 'value2']
      ])
    })

    it('应该正确序列化包含对象的 Map', () => {
      // Arrange
      const map = new Map([
        ['user1', { name: 'Alice', age: 30 }],
        ['user2', { name: 'Bob', age: 25 }]
      ])
      const obj = { users: map }

      // Act
      const result = safeStringify(obj)

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed.users._type).toBe('Map')
      expect(parsed.users.entries).toEqual([
        ['user1', { name: 'Alice', age: 30 }],
        ['user2', { name: 'Bob', age: 25 }]
      ])
    })

    it('应该正确序列化包含复杂键的 Map', () => {
      // Arrange
      const objKey = { id: 1 }
      const map = new Map([
        [objKey, 'object key'],
        ['string', 'string key'],
        [42, 'number key']
      ])

      // Act
      const result = safeStringify({ map })

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed.map._type).toBe('Map')
      expect(parsed.map.entries).toEqual([
        [{ id: 1 }, 'object key'],
        ['string', 'string key'],
        [42, 'number key']
      ])
    })
  })

  describe('Set 对象处理', () => {
    it('应该正确序列化空 Set', () => {
      // Arrange
      const set = new Set()
      const obj = { set }

      // Act
      const result = safeStringify(obj)

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed.set._type).toBe('Set')
      expect(parsed.set.values).toEqual([])
    })

    it('应该正确序列化简单 Set', () => {
      // Arrange
      const set = new Set([1, 2, 3])
      const obj = { set }

      // Act
      const result = safeStringify(obj)

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed.set._type).toBe('Set')
      expect(parsed.set.values).toEqual([1, 2, 3])
    })

    it('应该正确序列化包含对象的 Set', () => {
      // Arrange
      const set = new Set([{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlie' }])
      const obj = { users: set }

      // Act
      const result = safeStringify(obj)

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed.users._type).toBe('Set')
      expect(parsed.users.values).toEqual([{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlie' }])
    })

    it('应该正确处理包含重复值的 Set', () => {
      // Arrange
      const set = new Set([1, 1, 2, 2, 3, 3])
      const obj = { set }

      // Act
      const result = safeStringify(obj)

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed.set._type).toBe('Set')
      expect(parsed.set.values).toEqual([1, 2, 3]) // 重复值应该被去除
    })
  })

  describe('格式化选项', () => {
    it('应该支持缩进格式化', () => {
      // Arrange
      const obj = { a: 1, b: { c: 2 } }

      // Act
      const result = safeStringify(obj, undefined, 2)

      // Assert
      expect(result).toContain('\n')
      expect(result).toContain('  ')
      expect(JSON.parse(result)).toEqual(obj)
    })

    it('应该支持自定义缩进字符', () => {
      // Arrange
      const obj = { a: 1, b: 2 }

      // Act
      const result = safeStringify(obj, undefined, '\t')

      // Assert
      expect(result).toContain('\n')
      expect(result).toContain('\t')
      expect(JSON.parse(result)).toEqual(obj)
    })

    it('应该支持数字缩进', () => {
      // Arrange
      const obj = { a: { b: { c: 1 } } }

      // Act
      const result = safeStringify(obj, undefined, 4)

      // Assert
      expect(result).toContain('\n')
      expect(result.includes('    ')).toBe(true) // 4个空格
      expect(JSON.parse(result)).toEqual(obj)
    })
  })

  describe('自定义替换函数', () => {
    it('应该支持自定义替换函数', () => {
      // Arrange
      const obj = { a: 1, b: 'secret', c: 3 }
      const replacer = (key: string, value: unknown) => {
        if (key === 'b') return '[REDACTED]'
        return value
      }

      // Act
      const result = safeStringify(obj, replacer)

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed.a).toBe(1)
      expect(parsed.b).toBe('[REDACTED]')
      expect(parsed.c).toBe(3)
    })

    it('应该在循环引用处理后应用自定义替换函数', () => {
      // Arrange
      const obj: any = { a: 1, b: 'test' }
      obj.self = obj
      const replacer = (key: string, value: unknown) => {
        if (typeof value === 'string' && value !== '[Circular ~]') {
          return value.toUpperCase()
        }
        return value
      }

      // Act
      const result = safeStringify(obj, replacer)

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed.a).toBe(1)
      expect(parsed.b).toBe('TEST')
      expect(parsed.self).toBe('[Circular ~]') // 循环引用标记不应该被替换
    })

    it('应该支持过滤属性的替换函数', () => {
      // Arrange
      const obj = { public: 'visible', private: 'hidden', protected: 'internal' }
      const replacer = (key: string, value: unknown) => {
        if (key.startsWith('private')) return undefined
        return value
      }

      // Act
      const result = safeStringify(obj, replacer)

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed.public).toBe('visible')
      expect(parsed.protected).toBe('internal')
      expect('private' in parsed).toBe(false)
    })
  })

  describe('错误处理', () => {
    it('应该处理无法序列化的值', () => {
      // Arrange
      const obj = {
        func: () => 'test',
        symbol: Symbol('test'),
        bigint: BigInt(123)
      }

      // Act
      const result = safeStringify(obj)

      // Assert - 函数和符号会被忽略，BigInt 可能导致错误但应该被处理
      expect(() => JSON.parse(result)).not.toThrow()
    })

    it('应该在序列化失败时返回错误标识', () => {
      // Arrange
      // 创建一个会导致 JSON.stringify 失败的对象
      const problematicObj = {}
      Object.defineProperty(problematicObj, 'prop', {
        get() {
          throw new Error('Cannot access this property')
        },
        enumerable: true
      })

      // Act
      const result = safeStringify(problematicObj)

      // Assert
      expect(result).toBe('[Unable to stringify]')
    })

    it('应该处理深度嵌套对象', () => {
      // Arrange
      let deepObj: any = {}
      let current = deepObj
      for (let i = 0; i < 100; i++) {
        current.next = { value: i }
        current = current.next
      }

      // Act & Assert
      expect(() => safeStringify(deepObj)).not.toThrow()
    })
  })

  describe('复杂场景', () => {
    it('应该处理包含所有类型的复杂对象', () => {
      // Arrange
      const complexObj = {
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
        set: new Set([1, 2, 3]),
        func: () => 'ignored'
      }

      // Act
      const result = safeStringify(complexObj)

      // Assert
      expect(() => JSON.parse(result)).not.toThrow()
      const parsed = JSON.parse(result)
      expect(parsed.number).toBe(42)
      expect(parsed.string).toBe('test')
      expect(parsed.boolean).toBe(true)
      expect(parsed.null).toBe(null)
      expect('undefined' in parsed).toBe(false)
      expect(parsed.array).toEqual([1, 2, { nested: true }])
      expect(parsed.object).toEqual({ a: 1, b: { c: 2 } })
      expect(parsed.date).toBe('2024-01-01T00:00:00.000Z')
      expect(parsed.regex).toBe('/test/gi')
      expect(parsed.map._type).toBe('Map')
      expect(parsed.set._type).toBe('Set')
      expect('func' in parsed).toBe(false)
    })

    it('应该处理循环引用和特殊类型的组合', () => {
      // Arrange
      const obj: any = {
        id: 1,
        date: new Date('2024-01-01'),
        regex: /test/,
        map: new Map([['self', null]]),
        set: new Set(['value'])
      }
      obj.self = obj
      obj.map.set('self', obj)

      // Act
      const result = safeStringify(obj)

      // Assert
      const parsed = JSON.parse(result)
      expect(parsed.id).toBe(1)
      expect(parsed.date).toBe('2024-01-01T00:00:00.000Z')
      expect(parsed.regex).toBe('/test/')
      expect(parsed.self).toBe('[Circular ~]')
      expect(parsed.map._type).toBe('Map')
      expect(parsed.set._type).toBe('Set')
    })

    it('应该保持性能在可接受范围内', () => {
      // Arrange
      const largeObj: Record<string, any> = {}
      for (let i = 0; i < 1000; i++) {
        largeObj[`key${i}`] = {
          value: i,
          nested: { deep: i * 2 }
        }
      }

      // Act
      const startTime = Date.now()
      const result = safeStringify(largeObj)
      const endTime = Date.now()

      // Assert
      expect(endTime - startTime).toBeLessThan(1000) // 应该在1秒内完成
      expect(() => JSON.parse(result)).not.toThrow()
    })
  })
})
