import { describe, it, expect, vi } from 'vitest'
import { Result, isOk, isFail, combineResults, sequence, parallel } from './Result'

describe('结果类型', () => {
  describe('创建', () => {
    it('应该创建成功的结果', () => {
      const result = Result.ok('success')

      expect(result.isSuccess).toBe(true)
      expect(result.isFailure).toBe(false)
      expect(result.value).toBe('success')
    })

    it('应该创建失败的结果', () => {
      const result = Result.fail('error')

      expect(result.isSuccess).toBe(false)
      expect(result.isFailure).toBe(true)
      expect(result.error).toBe('error')
    })

    it('should be immutable', () => {
      const result = Result.ok({ data: 'test' })
      const obj = result as unknown as { _isSuccess: boolean; _value: unknown }

      expect(() => {
        obj._isSuccess = false
      }).toThrow()

      expect(() => {
        obj._value = 'modified'
      }).toThrow()
    })
  })

  describe('值访问', () => {
    it('should get value from successful Result', () => {
      const result = Result.ok(42)
      expect(result.value).toBe(42)
    })

    it('should throw when getting value from failed Result', () => {
      const result = Result.fail('error')
      expect(() => result.value).toThrow('Cannot get value from a failed Result')
    })

    it('should get error from failed Result', () => {
      const result = Result.fail('error message')
      expect(result.error).toBe('error message')
    })

    it('should throw when getting error from successful Result', () => {
      const result = Result.ok('value')
      expect(() => result.error).toThrow('Cannot get error from a successful Result')
    })
  })

  describe('安全访问方法', () => {
    it('should safely get value or undefined', () => {
      const success = Result.ok('value')
      const failure = Result.fail('error')

      expect(success.getValueOrUndefined()).toBe('value')
      expect(failure.getValueOrUndefined()).toBeUndefined()
    })

    it('should safely get error or undefined', () => {
      const success = Result.ok('value')
      const failure = Result.fail('error')

      expect(success.getErrorOrUndefined()).toBeUndefined()
      expect(failure.getErrorOrUndefined()).toBe('error')
    })

    it('should get value or default', () => {
      const success = Result.ok('value')
      const failure: Result<string, string> = Result.fail('error')

      expect(success.getValueOrDefault('default')).toBe('value')
      expect(failure.getValueOrDefault('default')).toBe('default')
    })
  })

  describe('映射', () => {
    it('应该映射成功的值', () => {
      const result = Result.ok(5)
        .map(n => n * 2)
        .map(n => n + 1)

      expect(result.isSuccess).toBe(true)
      expect(result.value).toBe(11)
    })

    it('should not map failed Result', () => {
      const mapFn = vi.fn((n: number) => n * 2)
      const result = Result.fail<string>('error').map(mapFn)

      expect(result.isFailure).toBe(true)
      expect(result.error).toBe('error')
      expect(mapFn).not.toHaveBeenCalled()
    })

    it('should handle different types', () => {
      const result = Result.ok(5).map(n => `Number: ${n}`)

      expect(result.value).toBe('Number: 5')
    })
  })

  describe('mapError', () => {
    it('should map error', () => {
      const result = Result.fail('error').mapError(err => `Error: ${err}`)

      expect(result.isFailure).toBe(true)
      expect(result.error).toBe('Error: error')
    })

    it('should not map successful Result', () => {
      const mapFn = vi.fn((err: string) => `Error: ${err}`)
      const result = Result.ok(5).mapError(mapFn)

      expect(result.isSuccess).toBe(true)
      expect(result.value).toBe(5)
      expect(mapFn).not.toHaveBeenCalled()
    })

    it('should handle different error types', () => {
      const result = Result.fail('error').mapError(err => ({ message: err }))

      expect(result.error).toEqual({ message: 'error' })
    })
  })

  describe('链式调用', () => {
    it('应该链式调用成功的结果', () => {
      const divide = (a: number, b: number): Result<number, string> => {
        if (b === 0) {
          return Result.fail('Division by zero')
        }
        return Result.ok(a / b)
      }

      const result = Result.ok(10)
        .chain(n => divide(n, 2))
        .chain(n => divide(n, 2))

      expect(result.isSuccess).toBe(true)
      expect(result.value).toBe(2.5)
    })

    it('should stop chaining on first failure', () => {
      const divide = (a: number, b: number): Result<number, string> => {
        if (b === 0) {
          return Result.fail('Division by zero')
        }
        return Result.ok(a / b)
      }

      const result = Result.ok(10)
        .chain(n => divide(n, 0))
        .chain(n => divide(n, 2))

      expect(result.isFailure).toBe(true)
      expect(result.error).toBe('Division by zero')
    })

    it('should not chain failed Result', () => {
      const chainFn = vi.fn((n: number) => Result.ok(n * 2))
      const result = Result.fail<string>('error').chain(chainFn)

      expect(result.isFailure).toBe(true)
      expect(result.error).toBe('error')
      expect(chainFn).not.toHaveBeenCalled()
    })
  })

  describe('chainAsync', () => {
    it('should chain async operations', async () => {
      const asyncOperation = async (n: number): Promise<Result<number, string>> => {
        await Promise.resolve() // Add await to satisfy linter
        return Result.ok(n * 2)
      }

      const result = await Result.ok(5).chainAsync(asyncOperation)

      expect(result.isSuccess).toBe(true)
      expect(result.value).toBe(10)
    })

    it('should handle async failures', async () => {
      const asyncOperation = async (_n: number): Promise<Result<number, string>> => {
        await Promise.resolve() // Add await to satisfy linter
        return Result.fail('Async error')
      }

      const result = await Result.ok(5).chainAsync(asyncOperation)

      expect(result.isFailure).toBe(true)
      expect(result.error).toBe('Async error')
    })
  })

  describe('模式匹配', () => {
    it('should match successful Result', () => {
      const result = Result.ok(42)
      const output = result.match({
        ok: value => `Success: ${value}`,
        fail: error => `Error: ${String(error)}`
      })

      expect(output).toBe('Success: 42')
    })

    it('should match failed Result', () => {
      const result = Result.fail('Something went wrong')
      const output = result.match({
        ok: (value: never) => `Success: ${String(value)}`,
        fail: error => `Error: ${String(error)}`
      })

      expect(output).toBe('Error: Something went wrong')
    })

    it('should handle different return types', () => {
      const result = Result.ok(42)
      const output = result.match({
        ok: value => value * 2,
        fail: () => 0
      })

      expect(output).toBe(84)
    })
  })

  describe('tap methods', () => {
    it('should tap successful Result', () => {
      const sideEffect = vi.fn()
      const result = Result.ok(42).tap(sideEffect)

      expect(sideEffect).toHaveBeenCalledWith(42)
      expect(result.value).toBe(42)
    })

    it('should not tap failed Result', () => {
      const sideEffect = vi.fn()
      const result = Result.fail('error').tap(sideEffect)

      expect(sideEffect).not.toHaveBeenCalled()
      expect(result.error).toBe('error')
    })

    it('should tapError failed Result', () => {
      const sideEffect = vi.fn()
      const result = Result.fail('error').tapError(sideEffect)

      expect(sideEffect).toHaveBeenCalledWith('error')
      expect(result.error).toBe('error')
    })

    it('should not tapError successful Result', () => {
      const sideEffect = vi.fn()
      const result = Result.ok(42).tapError(sideEffect)

      expect(sideEffect).not.toHaveBeenCalled()
      expect(result.value).toBe(42)
    })
  })

  describe('toPromise', () => {
    it('should convert successful Result to resolved Promise', async () => {
      const result = Result.ok(42)
      const value = await result.toPromise()

      expect(value).toBe(42)
    })

    it('should convert failed Result to rejected Promise', async () => {
      const result = Result.fail('error')

      await expect(result.toPromise()).rejects.toEqual(new Error('error'))
    })
  })

  describe('组合', () => {
    it('should combine all successful Results', () => {
      const results = [Result.ok(1), Result.ok(2), Result.ok(3)]

      const combined = Result.combine(results)

      expect(combined.isSuccess).toBe(true)
      expect(combined.value).toEqual([1, 2, 3])
    })

    it('should fail on first error', () => {
      const results = [Result.ok(1), Result.fail('first error'), Result.fail('second error')]

      const combined = Result.combine(results)

      expect(combined.isFailure).toBe(true)
      expect(combined.error).toBe('first error')
    })

    it('should handle empty array', () => {
      const combined = Result.combine<number, string>([])

      expect(combined.isSuccess).toBe(true)
      expect(combined.value).toEqual([])
    })
  })

  describe('fromPromise', () => {
    it('should create Result from resolved Promise', async () => {
      const promise = Promise.resolve(42)
      const result = await Result.fromPromise(promise)

      expect(result.isSuccess).toBe(true)
      expect(result.value).toBe(42)
    })

    it('should create Result from rejected Promise', async () => {
      const promise = Promise.reject(new Error('Promise failed'))
      const result = await Result.fromPromise(promise)

      expect(result.isFailure).toBe(true)
      expect((result.error as Error).message).toBe('Promise failed')
    })
  })

  describe('fromThrowable', () => {
    it('should create Result from successful function', () => {
      const fn = () => 42
      const result = Result.fromThrowable(fn)

      expect(result.isSuccess).toBe(true)
      expect(result.value).toBe(42)
    })

    it('should create Result from throwing function', () => {
      const fn = () => {
        throw new Error('Function failed')
      }
      const result = Result.fromThrowable<number, Error>(fn)

      expect(result.isFailure).toBe(true)
      expect(result.error.message).toBe('Function failed')
    })

    it('should handle different error types', () => {
      const fn = () => {
        throw new Error('String error')
      }
      const result = Result.fromThrowable<number, Error>(fn)

      expect(result.isFailure).toBe(true)
      expect(result.error.message).toBe('String error')
    })
  })

  describe('type guards', () => {
    it('should identify successful Result with isOk', () => {
      const success = Result.ok(42)
      const failure = Result.fail('error')

      expect(isOk(success)).toBe(true)
      expect(isOk(failure)).toBe(false)

      if (isOk(success)) {
        expect(success.value).toBe(42)
      }
    })

    it('should identify failed Result with isFail', () => {
      const success = Result.ok(42)
      const failure = Result.fail('error')

      expect(isFail(success)).toBe(false)
      expect(isFail(failure)).toBe(true)

      if (isFail(failure)) {
        expect(failure.error).toBe('error')
      }
    })
  })

  describe('fromCondition', () => {
    it('should create success Result when condition is true', () => {
      const result = Result.fromCondition(true, 'value', 'error')

      expect(result.isSuccess).toBe(true)
      expect(result.value).toBe('value')
    })

    it('should create failed Result when condition is false', () => {
      const result = Result.fromCondition(false, 'value', 'error')

      expect(result.isFailure).toBe(true)
      expect(result.error).toBe('error')
    })
  })

  describe('fromNullable', () => {
    it('should create success Result for non-null values', () => {
      const result = Result.fromNullable('value', 'is null')

      expect(result.isSuccess).toBe(true)
      expect(result.value).toBe('value')
    })

    it('should create failed Result for null', () => {
      const result = Result.fromNullable(null, 'is null')

      expect(result.isFailure).toBe(true)
      expect(result.error).toBe('is null')
    })

    it('should create failed Result for undefined', () => {
      const result = Result.fromNullable(undefined, 'is undefined')

      expect(result.isFailure).toBe(true)
      expect(result.error).toBe('is undefined')
    })

    it('should handle falsy values correctly', () => {
      const zero = Result.fromNullable(0, 'error')
      const empty = Result.fromNullable('', 'error')
      const false_ = Result.fromNullable(false, 'error')

      expect(zero.isSuccess).toBe(true)
      expect(zero.value).toBe(0)
      expect(empty.isSuccess).toBe(true)
      expect(empty.value).toBe('')
      expect(false_.isSuccess).toBe(true)
      expect(false_.value).toBe(false)
    })
  })

  describe('improved type definitions', () => {
    it('should have consistent types for ok and fail', () => {
      const ok = Result.ok(42) // Result<number, never>
      const fail = Result.fail('error') // Result<never, string>

      // Both should be assignable to Result<number, string>
      const results: Result<number, string>[] = [
        ok as Result<number, string>,
        fail as Result<number, string>
      ]

      expect(results.length).toBe(2)
    })

    it('should work well with map and chain', () => {
      const result: Result<number, string> = Result.ok(5)
        .map(n => n * 2)
        .chain(n => (n > 5 ? Result.ok(n) : Result.fail('too small')))

      expect(result.isSuccess).toBe(true)
      expect(result.value).toBe(10)
    })
  })

  describe('utility functions', () => {
    describe('combineResults', () => {
      it('should combine multiple successful Results', () => {
        const results = [Result.ok(1), Result.ok(2), Result.ok(3)]
        const combined = combineResults(results)

        expect(combined.isSuccess).toBe(true)
        expect(combined.value).toEqual([1, 2, 3])
      })

      it('should fail on first error', () => {
        const results = [Result.ok(1), Result.fail('first error'), Result.fail('second error')]
        const combined = combineResults(results)

        expect(combined.isFailure).toBe(true)
        expect(combined.error).toBe('first error')
      })
    })

    describe('sequence', () => {
      it('should execute functions sequentially', () => {
        const fn1 = () => Result.ok(1)
        const fn2 = () => Result.ok(2)
        const fn3 = () => Result.ok(3)

        const result = sequence(fn1, fn2, fn3)

        expect(result.isSuccess).toBe(true)
        expect(result.value).toEqual([1, 2, 3])
      })

      it('should stop on first failure', () => {
        const fn1 = () => Result.ok(1)
        const fn2 = () => Result.fail('error')
        const fn3 = vi.fn(() => Result.ok(3))

        const result = sequence(fn1, fn2, fn3)

        expect(result.isFailure).toBe(true)
        expect(result.error).toBe('error')
        expect(fn3).not.toHaveBeenCalled()
      })
    })

    describe('parallel', () => {
      it('should execute async functions in parallel', async () => {
        const fn1 = async () => {
          await new Promise(resolve => globalThis.setTimeout(resolve, 10))
          return Result.ok(1)
        }
        const fn2 = async () => {
          await new Promise(resolve => globalThis.setTimeout(resolve, 5))
          return Result.ok(2)
        }
        const fn3 = async () => {
          await Promise.resolve()
          return Result.ok(3)
        }

        const result = await parallel(fn1, fn2, fn3)

        expect(result.isSuccess).toBe(true)
        expect(result.value).toEqual([1, 2, 3])
      })

      it('should handle async failures', async () => {
        const fn1 = async () => {
          await Promise.resolve()
          return Result.ok(1)
        }
        const fn2 = async () => {
          await new Promise(resolve => globalThis.setTimeout(resolve, 5))
          return Result.fail('async error')
        }
        const fn3 = async () => {
          await Promise.resolve()
          return Result.ok(3)
        }

        const result = await parallel(fn1, fn2, fn3)

        expect(result.isFailure).toBe(true)
        expect(result.error).toBe('async error')
      })
    })
  })
})
