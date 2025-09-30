import { describe, it, expect } from 'vitest'
import {
  isPlainObject,
  isFunction,
  isString,
  isNumber,
  isBoolean,
  isNil,
  isDate,
  isArray,
  isMap,
  isSet
} from '../typeGuards'

describe('类型守卫函数', () => {
  describe('isPlainObject', () => {
    describe('应该识别为纯对象', () => {
      it('应该识别空对象', () => {
        // Arrange & Act & Assert
        expect(isPlainObject({})).toBe(true)
      })

      it('应该识别普通对象', () => {
        // Arrange
        const obj = { a: 1, b: 'string', c: true }

        // Act & Assert
        expect(isPlainObject(obj)).toBe(true)
      })

      it('应该识别通过 Object.create(null) 创建的对象', () => {
        // Arrange
        const obj = Object.create(null)
        obj.prop = 'value'

        // Act & Assert
        expect(isPlainObject(obj)).toBe(true)
      })

      it('应该识别嵌套的普通对象', () => {
        // Arrange
        const obj = { a: { b: { c: 1 } } }

        // Act & Assert
        expect(isPlainObject(obj)).toBe(true)
        expect(isPlainObject(obj.a)).toBe(true)
        expect(isPlainObject(obj.a.b)).toBe(true)
      })

      it('应该识别通过字面量创建的对象', () => {
        // Arrange
        const obj1 = { prop: 'value' }
        const obj2 = new Object()
        obj2.prop = 'value'

        // Act & Assert
        expect(isPlainObject(obj1)).toBe(true)
        expect(isPlainObject(obj2)).toBe(true)
      })
    })

    describe('应该识别为非纯对象', () => {
      it('应该拒绝 null 和 undefined', () => {
        // Arrange & Act & Assert
        expect(isPlainObject(null)).toBe(false)
        expect(isPlainObject(undefined)).toBe(false)
      })

      it('应该拒绝基本类型', () => {
        // Arrange & Act & Assert
        expect(isPlainObject(42)).toBe(false)
        expect(isPlainObject('string')).toBe(false)
        expect(isPlainObject(true)).toBe(false)
        expect(isPlainObject(false)).toBe(false)
        expect(isPlainObject(Symbol('test'))).toBe(false)
      })

      it('应该拒绝数组', () => {
        // Arrange
        const arr = [1, 2, 3]
        const emptyArr: unknown[] = []

        // Act & Assert
        expect(isPlainObject(arr)).toBe(false)
        expect(isPlainObject(emptyArr)).toBe(false)
      })

      it('应该拒绝内置对象', () => {
        // Arrange & Act & Assert
        expect(isPlainObject(new Date())).toBe(false)
        expect(isPlainObject(/regex/)).toBe(false)
        expect(isPlainObject(new Map())).toBe(false)
        expect(isPlainObject(new Set())).toBe(false)
        expect(isPlainObject(new Error())).toBe(false)
        expect(isPlainObject(new Promise(resolve => resolve(1)))).toBe(false)
      })

      it('应该拒绝函数', () => {
        // Arrange
        const func1 = () => 'test'
        const func2 = function () {
          return 'test'
        }
        function func3() {
          return 'test'
        }

        // Act & Assert
        expect(isPlainObject(func1)).toBe(false)
        expect(isPlainObject(func2)).toBe(false)
        expect(isPlainObject(func3)).toBe(false)
      })

      it('应该拒绝自定义类实例', () => {
        // Arrange
        class CustomClass {
          prop = 'value'
        }
        const instance = new CustomClass()

        // Act & Assert
        expect(isPlainObject(instance)).toBe(false)
      })

      it('应该拒绝使用构造函数创建的对象', () => {
        // Arrange
        function Constructor() {
          // @ts-expect-error - 测试构造函数
          this.prop = 'value'
        }
        const instance = new Constructor()

        // Act & Assert
        expect(isPlainObject(instance)).toBe(false)
      })
    })

    describe('边界条件', () => {
      it('应该处理原型链的复杂情况', () => {
        // Arrange
        const parent = { parentProp: 'parent' }
        const child = Object.create(parent)
        child.childProp = 'child'

        // Act & Assert
        expect(isPlainObject(child)).toBe(false)
      })

      it('应该处理冻结的对象', () => {
        // Arrange
        const obj = Object.freeze({ a: 1 })

        // Act & Assert
        expect(isPlainObject(obj)).toBe(true)
      })

      it('应该处理密封的对象', () => {
        // Arrange
        const obj = Object.seal({ a: 1 })

        // Act & Assert
        expect(isPlainObject(obj)).toBe(true)
      })
    })
  })

  describe('isFunction', () => {
    describe('应该识别为函数', () => {
      it('应该识别箭头函数', () => {
        // Arrange
        const arrowFunc = () => 'test'
        const arrowFuncWithParams = (a: number, b: number) => a + b

        // Act & Assert
        expect(isFunction(arrowFunc)).toBe(true)
        expect(isFunction(arrowFuncWithParams)).toBe(true)
      })

      it('应该识别函数表达式', () => {
        // Arrange
        const funcExpression = function () {
          return 'test'
        }

        // Act & Assert
        expect(isFunction(funcExpression)).toBe(true)
      })

      it('应该识别函数声明', () => {
        // Arrange
        function funcDeclaration() {
          return 'test'
        }

        // Act & Assert
        expect(isFunction(funcDeclaration)).toBe(true)
      })

      it('应该识别异步函数', () => {
        // Arrange
        const asyncFunc = async () => 'test'
        async function asyncFuncDeclaration() {
          return 'test'
        }

        // Act & Assert
        expect(isFunction(asyncFunc)).toBe(true)
        expect(isFunction(asyncFuncDeclaration)).toBe(true)
      })

      it('应该识别生成器函数', () => {
        // Arrange
        function* generatorFunc() {
          yield 1
        }

        // Act & Assert
        expect(isFunction(generatorFunc)).toBe(true)
      })

      it('应该识别内置函数', () => {
        // Arrange & Act & Assert
        expect(isFunction(console.log)).toBe(true)
        expect(isFunction(Array.isArray)).toBe(true)
        expect(isFunction(Object.keys)).toBe(true)
        expect(isFunction(JSON.parse)).toBe(true)
      })

      it('应该识别构造函数', () => {
        // Arrange
        function Constructor() {
          // @ts-expect-error - 测试构造函数
          this.prop = 'value'
        }
        class ClassConstructor {
          prop = 'value'
        }

        // Act & Assert
        expect(isFunction(Constructor)).toBe(true)
        expect(isFunction(ClassConstructor)).toBe(true)
      })
    })

    describe('应该识别为非函数', () => {
      it('应该拒绝基本类型', () => {
        // Arrange & Act & Assert
        expect(isFunction(42)).toBe(false)
        expect(isFunction('string')).toBe(false)
        expect(isFunction(true)).toBe(false)
        expect(isFunction(null)).toBe(false)
        expect(isFunction(undefined)).toBe(false)
        expect(isFunction(Symbol('test'))).toBe(false)
      })

      it('应该拒绝对象', () => {
        // Arrange & Act & Assert
        expect(isFunction({})).toBe(false)
        expect(isFunction([])).toBe(false)
        expect(isFunction(new Date())).toBe(false)
        expect(isFunction(/regex/)).toBe(false)
      })

      it('应该拒绝可调用对象', () => {
        // Arrange
        const callableObject = {
          call: () => 'test',
          apply: () => 'test'
        }

        // Act & Assert
        expect(isFunction(callableObject)).toBe(false)
      })
    })
  })

  describe('isString', () => {
    describe('应该识别为字符串', () => {
      it('应该识别普通字符串', () => {
        // Arrange & Act & Assert
        expect(isString('hello')).toBe(true)
        expect(isString('world')).toBe(true)
        expect(isString('test string')).toBe(true)
      })

      it('应该识别空字符串', () => {
        // Arrange & Act & Assert
        expect(isString('')).toBe(true)
      })

      it('应该识别包含特殊字符的字符串', () => {
        // Arrange & Act & Assert
        expect(isString('hello\nworld')).toBe(true)
        expect(isString('hello\tworld')).toBe(true)
        expect(isString('hello world')).toBe(true)
        expect(isString('🚀 rocket')).toBe(true)
      })

      it('应该识别模板字符串', () => {
        // Arrange
        const name = 'world'
        const templateString = `hello ${name}`

        // Act & Assert
        expect(isString(templateString)).toBe(true)
      })
    })

    describe('应该识别为非字符串', () => {
      it('应该拒绝其他基本类型', () => {
        // Arrange & Act & Assert
        expect(isString(42)).toBe(false)
        expect(isString(true)).toBe(false)
        expect(isString(null)).toBe(false)
        expect(isString(undefined)).toBe(false)
        expect(isString(Symbol('test'))).toBe(false)
      })

      it('应该拒绝对象类型', () => {
        // Arrange & Act & Assert
        expect(isString({})).toBe(false)
        expect(isString([])).toBe(false)
        expect(isString(new Date())).toBe(false)
        expect(isString(/regex/)).toBe(false)
      })

      it('应该拒绝 String 对象', () => {
        // Arrange
        const stringObject = new String('test')

        // Act & Assert
        expect(isString(stringObject)).toBe(false)
      })
    })
  })

  describe('isNumber', () => {
    describe('应该识别为数字', () => {
      it('应该识别整数', () => {
        // Arrange & Act & Assert
        expect(isNumber(42)).toBe(true)
        expect(isNumber(0)).toBe(true)
        expect(isNumber(-42)).toBe(true)
      })

      it('应该识别小数', () => {
        // Arrange & Act & Assert
        expect(isNumber(3.14)).toBe(true)
        expect(isNumber(-3.14)).toBe(true)
        expect(isNumber(0.1)).toBe(true)
      })

      it('应该识别特殊数值', () => {
        // Arrange & Act & Assert
        expect(isNumber(Infinity)).toBe(true)
        expect(isNumber(-Infinity)).toBe(true)
        expect(isNumber(Number.MAX_VALUE)).toBe(true)
        expect(isNumber(Number.MIN_VALUE)).toBe(true)
      })

      it('应该识别科学计数法', () => {
        // Arrange & Act & Assert
        expect(isNumber(1e10)).toBe(true)
        expect(isNumber(1e-10)).toBe(true)
        expect(isNumber(2.5e5)).toBe(true)
      })
    })

    describe('应该识别为非数字', () => {
      it('应该拒绝 NaN', () => {
        // Arrange & Act & Assert
        expect(isNumber(NaN)).toBe(false)
        expect(isNumber(Number.NaN)).toBe(false)
        expect(isNumber(parseInt('abc'))).toBe(false)
      })

      it('应该拒绝其他基本类型', () => {
        // Arrange & Act & Assert
        expect(isNumber('42')).toBe(false)
        expect(isNumber(true)).toBe(false)
        expect(isNumber(null)).toBe(false)
        expect(isNumber(undefined)).toBe(false)
        expect(isNumber(Symbol('test'))).toBe(false)
      })

      it('应该拒绝对象类型', () => {
        // Arrange & Act & Assert
        expect(isNumber({})).toBe(false)
        expect(isNumber([])).toBe(false)
        expect(isNumber(new Date())).toBe(false)
      })

      it('应该拒绝 Number 对象', () => {
        // Arrange
        const numberObject = new Number(42)

        // Act & Assert
        expect(isNumber(numberObject)).toBe(false)
      })
    })
  })

  describe('isBoolean', () => {
    describe('应该识别为布尔值', () => {
      it('应该识别 true', () => {
        // Arrange & Act & Assert
        expect(isBoolean(true)).toBe(true)
      })

      it('应该识别 false', () => {
        // Arrange & Act & Assert
        expect(isBoolean(false)).toBe(true)
      })

      it('应该识别布尔表达式结果', () => {
        // Arrange & Act & Assert
        expect(isBoolean(1 > 0)).toBe(true)
        expect(isBoolean(1 < 0)).toBe(true)
        expect(isBoolean(!true)).toBe(true)
        expect(isBoolean(!!0)).toBe(true)
      })
    })

    describe('应该识别为非布尔值', () => {
      it('应该拒绝其他基本类型', () => {
        // Arrange & Act & Assert
        expect(isBoolean(42)).toBe(false)
        expect(isBoolean('true')).toBe(false)
        expect(isBoolean('false')).toBe(false)
        expect(isBoolean(null)).toBe(false)
        expect(isBoolean(undefined)).toBe(false)
        expect(isBoolean(Symbol('test'))).toBe(false)
      })

      it('应该拒绝假值', () => {
        // Arrange & Act & Assert
        expect(isBoolean(0)).toBe(false)
        expect(isBoolean('')).toBe(false)
        expect(isBoolean(NaN)).toBe(false)
      })

      it('应该拒绝对象类型', () => {
        // Arrange & Act & Assert
        expect(isBoolean({})).toBe(false)
        expect(isBoolean([])).toBe(false)
        expect(isBoolean(new Date())).toBe(false)
      })

      it('应该拒绝 Boolean 对象', () => {
        // Arrange
        const booleanObject = new Boolean(true)

        // Act & Assert
        expect(isBoolean(booleanObject)).toBe(false)
      })
    })
  })

  describe('isNil', () => {
    describe('应该识别为空值', () => {
      it('应该识别 null', () => {
        // Arrange & Act & Assert
        expect(isNil(null)).toBe(true)
      })

      it('应该识别 undefined', () => {
        // Arrange & Act & Assert
        expect(isNil(undefined)).toBe(true)
      })

      it('应该识别未定义的变量', () => {
        // Arrange
        let undefinedVar
        const obj: Record<string, unknown> = {}

        // Act & Assert
        expect(isNil(undefinedVar)).toBe(true)
        expect(isNil(obj.nonExistentProp)).toBe(true)
      })
    })

    describe('应该识别为非空值', () => {
      it('应该拒绝假值', () => {
        // Arrange & Act & Assert
        expect(isNil(0)).toBe(false)
        expect(isNil('')).toBe(false)
        expect(isNil(false)).toBe(false)
        expect(isNil(NaN)).toBe(false)
      })

      it('应该拒绝真值', () => {
        // Arrange & Act & Assert
        expect(isNil(1)).toBe(false)
        expect(isNil('string')).toBe(false)
        expect(isNil(true)).toBe(false)
        expect(isNil({})).toBe(false)
        expect(isNil([])).toBe(false)
      })
    })
  })

  describe('isDate', () => {
    describe('应该识别为日期', () => {
      it('应该识别有效的日期对象', () => {
        // Arrange
        const date1 = new Date()
        const date2 = new Date('2024-01-01')
        const date3 = new Date(2024, 0, 1)

        // Act & Assert
        expect(isDate(date1)).toBe(true)
        expect(isDate(date2)).toBe(true)
        expect(isDate(date3)).toBe(true)
      })

      it('应该识别特殊的有效日期', () => {
        // Arrange
        const epoch = new Date(0)
        const futureDate = new Date('2100-01-01')

        // Act & Assert
        expect(isDate(epoch)).toBe(true)
        expect(isDate(futureDate)).toBe(true)
      })
    })

    describe('应该识别为非日期', () => {
      it('应该拒绝无效的日期对象', () => {
        // Arrange
        const invalidDate1 = new Date('invalid')
        const invalidDate2 = new Date('not a date')

        // Act & Assert
        expect(isDate(invalidDate1)).toBe(false)
        expect(isDate(invalidDate2)).toBe(false)
      })

      it('应该拒绝其他类型', () => {
        // Arrange & Act & Assert
        expect(isDate('2024-01-01')).toBe(false)
        expect(isDate(1640995200000)).toBe(false) // timestamp
        expect(isDate({})).toBe(false)
        expect(isDate([])).toBe(false)
        expect(isDate(null)).toBe(false)
        expect(isDate(undefined)).toBe(false)
      })

      it('应该拒绝日期字符串', () => {
        // Arrange & Act & Assert
        expect(isDate('2024-01-01T00:00:00.000Z')).toBe(false)
        expect(isDate('January 1, 2024')).toBe(false)
        expect(isDate('01/01/2024')).toBe(false)
      })
    })
  })

  describe('isArray', () => {
    describe('应该识别为数组', () => {
      it('应该识别空数组', () => {
        // Arrange
        const emptyArray: unknown[] = []

        // Act & Assert
        expect(isArray(emptyArray)).toBe(true)
      })

      it('应该识别普通数组', () => {
        // Arrange
        const numberArray = [1, 2, 3]
        const stringArray = ['a', 'b', 'c']
        const mixedArray = [1, 'a', true, null]

        // Act & Assert
        expect(isArray(numberArray)).toBe(true)
        expect(isArray(stringArray)).toBe(true)
        expect(isArray(mixedArray)).toBe(true)
      })

      it('应该识别嵌套数组', () => {
        // Arrange
        const nestedArray = [
          [1, 2],
          [3, 4]
        ]
        const deepArray = [1, [2, [3, [4]]]]

        // Act & Assert
        expect(isArray(nestedArray)).toBe(true)
        expect(isArray(deepArray)).toBe(true)
      })

      it('应该识别稀疏数组', () => {
        // Arrange
        const sparseArray = [1, , , 4] // eslint-disable-line no-sparse-arrays

        // Act & Assert
        expect(isArray(sparseArray)).toBe(true)
      })

      it('应该识别 Array 构造函数创建的数组', () => {
        // Arrange
        const arrayFromConstructor = [1, 2, 3]
        const arrayWithLength = new Array(5)

        // Act & Assert
        expect(isArray(arrayFromConstructor)).toBe(true)
        expect(isArray(arrayWithLength)).toBe(true)
      })
    })

    describe('应该识别为非数组', () => {
      it('应该拒绝类数组对象', () => {
        // Arrange
        const arrayLike = { 0: 'a', 1: 'b', length: 2 }
        const argumentsLike = (function () {
          return arguments
        })('a', 'b')

        // Act & Assert
        expect(isArray(arrayLike)).toBe(false)
        expect(isArray(argumentsLike)).toBe(false)
      })

      it('应该拒绝其他类型', () => {
        // Arrange & Act & Assert
        expect(isArray({})).toBe(false)
        expect(isArray('string')).toBe(false)
        expect(isArray(42)).toBe(false)
        expect(isArray(true)).toBe(false)
        expect(isArray(null)).toBe(false)
        expect(isArray(undefined)).toBe(false)
      })

      it('应该拒绝字符串（即使可以索引）', () => {
        // Arrange
        const string = 'hello'

        // Act & Assert
        expect(isArray(string)).toBe(false)
      })
    })
  })

  describe('isMap', () => {
    describe('应该识别为 Map', () => {
      it('应该识别空 Map', () => {
        // Arrange
        const emptyMap = new Map()

        // Act & Assert
        expect(isMap(emptyMap)).toBe(true)
      })

      it('应该识别普通 Map', () => {
        // Arrange
        const map = new Map([
          ['key1', 'value1'],
          ['key2', 'value2']
        ])

        // Act & Assert
        expect(isMap(map)).toBe(true)
      })

      it('应该识别包含复杂键值的 Map', () => {
        // Arrange
        const complexMap = new Map([
          [{ id: 1 }, { name: 'object key' }],
          [new Date(), 'date key'],
          [Symbol('sym'), 'symbol key']
        ])

        // Act & Assert
        expect(isMap(complexMap)).toBe(true)
      })
    })

    describe('应该识别为非 Map', () => {
      it('应该拒绝其他类型', () => {
        // Arrange & Act & Assert
        expect(isMap({})).toBe(false)
        expect(isMap([])).toBe(false)
        expect(isMap(new Set())).toBe(false)
        expect(isMap(new WeakMap())).toBe(false)
        expect(isMap(null)).toBe(false)
        expect(isMap(undefined)).toBe(false)
      })

      it('应该拒绝类 Map 对象', () => {
        // Arrange
        const mapLike = {
          set: () => undefined,
          get: () => undefined,
          has: () => false,
          delete: () => false,
          clear: () => undefined,
          size: 0
        }

        // Act & Assert
        expect(isMap(mapLike)).toBe(false)
      })
    })
  })

  describe('isSet', () => {
    describe('应该识别为 Set', () => {
      it('应该识别空 Set', () => {
        // Arrange
        const emptySet = new Set()

        // Act & Assert
        expect(isSet(emptySet)).toBe(true)
      })

      it('应该识别普通 Set', () => {
        // Arrange
        const set = new Set([1, 2, 3])

        // Act & Assert
        expect(isSet(set)).toBe(true)
      })

      it('应该识别包含复杂值的 Set', () => {
        // Arrange
        const complexSet = new Set([{ id: 1 }, new Date(), Symbol('sym'), [1, 2, 3]])

        // Act & Assert
        expect(isSet(complexSet)).toBe(true)
      })

      it('应该识别有重复值的 Set', () => {
        // Arrange
        const set = new Set([1, 1, 2, 2, 3, 3])

        // Act & Assert
        expect(isSet(set)).toBe(true)
        expect(set.size).toBe(3) // 确保去重
      })
    })

    describe('应该识别为非 Set', () => {
      it('应该拒绝其他类型', () => {
        // Arrange & Act & Assert
        expect(isSet({})).toBe(false)
        expect(isSet([])).toBe(false)
        expect(isSet(new Map())).toBe(false)
        expect(isSet(new WeakSet())).toBe(false)
        expect(isSet(null)).toBe(false)
        expect(isSet(undefined)).toBe(false)
      })

      it('应该拒绝类 Set 对象', () => {
        // Arrange
        const setLike = {
          add: () => undefined,
          has: () => false,
          delete: () => false,
          clear: () => undefined,
          size: 0
        }

        // Act & Assert
        expect(isSet(setLike)).toBe(false)
      })
    })
  })

  describe('类型守卫的类型推断', () => {
    it('应该正确进行类型收窄', () => {
      // Arrange
      const unknownValue: unknown = { a: 1 }

      // Act & Assert
      if (isPlainObject(unknownValue)) {
        // TypeScript 应该推断出 unknownValue 是 Record<string, unknown>
        expect(typeof unknownValue).toBe('object')
        expect('a' in unknownValue).toBe(true)
      }
    })

    it('应该在联合类型中正确工作', () => {
      // Arrange
      const value: string | number | boolean = 'test'

      // Act & Assert
      if (isString(value)) {
        // TypeScript 应该推断出 value 是 string
        expect(value.length).toBeGreaterThan(0)
      }
    })

    it('应该处理可空类型', () => {
      // Arrange
      const value: string | null | undefined = 'test'

      // Act & Assert
      if (!isNil(value)) {
        // TypeScript 应该推断出 value 是 string
        expect(value.charAt(0)).toBe('t')
      }
    })
  })
})
