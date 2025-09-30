/**
 * Result 模式实现 - 用于优雅地处理成功和失败情况
 *
 * 避免抛出异常，使用类型安全的方式处理错误
 *
 * @template Value 成功时的值类型
 * @template Error 失败时的错误类型，默认为 string
 *
 * @example
 * ```typescript
 * // 基础使用
 * const success = Result.ok(42)
 * const failure = Result.fail('Something went wrong')
 *
 * // 链式操作
 * const result = Result.ok(5)
 *   .map(n => n * 2)
 *   .map(n => n + 1)
 *   .mapError(err => `Error: ${err}`)
 *
 * // 模式匹配
 * const value = result.match({
 *   ok: value => `Success: ${value}`,
 *   fail: error => `Failed: ${error}`
 * })
 * ```
 */
export class Result<Value, Error = string> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: Value,
    private readonly _error?: Error
  ) {
    Object.freeze(this)
  }

  /**
   * 创建成功的 Result
   *
   * @param value 成功的值
   * @returns 包含成功值的 Result
   */
  static ok<Value>(value: Value): Result<Value, never> {
    return new Result<Value, never>(true, value)
  }

  /**
   * 创建失败的 Result
   *
   * @param error 错误信息或错误对象
   * @returns 包含错误的 Result
   */
  static fail<Error = string>(error: Error): Result<never, Error> {
    return new Result<never, Error>(false, undefined as never, error)
  }

  /**
   * 创建一个 Result，基于条件判断成功或失败
   *
   * @param condition 条件
   * @param value 成功时的值
   * @param error 失败时的错误
   * @returns Result
   */
  static fromCondition<Value, Error = string>(
    condition: boolean,
    value: Value,
    error: Error
  ): Result<Value, Error> {
    return condition
      ? (Result.ok(value) as Result<Value, Error>)
      : (Result.fail(error) as Result<Value, Error>)
  }

  /**
   * 创建一个 Result，基于可空值
   *
   * @param value 可能为 null 或 undefined 的值
   * @param error 值为空时的错误
   * @returns Result
   */
  static fromNullable<Value, Error = string>(
    value: Value | null | undefined,
    error: Error
  ): Result<Value, Error> {
    return value !== null && value !== undefined
      ? (Result.ok(value) as Result<Value, Error>)
      : (Result.fail(error) as Result<Value, Error>)
  }

  /**
   * 判断是否成功
   */
  get isSuccess(): boolean {
    return this._isSuccess
  }

  /**
   * 判断是否失败
   */
  get isFailure(): boolean {
    return !this._isSuccess
  }

  /**
   * 获取成功的值
   *
   * @throws 如果 Result 是失败状态，抛出错误
   */
  get value(): Value {
    if (!this._isSuccess) {
      throw new Error('Cannot get value from a failed Result')
    }
    return this._value as Value
  }

  /**
   * 获取错误
   *
   * @throws 如果 Result 是成功状态，抛出错误
   */
  get error(): Error {
    if (this._isSuccess) {
      throw new Error('Cannot get error from a successful Result')
    }
    return this._error as Error
  }

  /**
   * 安全获取值，如果失败返回 undefined
   */
  getValueOrUndefined(): Value | undefined {
    return this._isSuccess ? this._value : undefined
  }

  /**
   * 安全获取错误，如果成功返回 undefined
   */
  getErrorOrUndefined(): Error | undefined {
    return this._isSuccess ? undefined : this._error
  }

  /**
   * 获取值，如果失败返回默认值
   *
   * @param defaultValue 失败时返回的默认值
   */
  getValueOrDefault(defaultValue: Value): Value {
    return this._isSuccess ? (this._value as Value) : defaultValue
  }

  /**
   * 转换成功的值
   *
   * @param fn 转换函数
   * @returns 新的 Result
   */
  map<NewValue>(fn: (value: Value) => NewValue): Result<NewValue, Error> {
    if (this._isSuccess) {
      return Result.ok(fn(this._value as Value))
    }
    return Result.fail(this._error as Error)
  }

  /**
   * 转换失败的错误
   *
   * @param fn 转换函数
   * @returns 新的 Result
   */
  mapError<NewError>(fn: (error: Error) => NewError): Result<Value, NewError> {
    if (!this._isSuccess) {
      return Result.fail(fn(this._error as Error))
    }
    return Result.ok(this._value as Value)
  }

  /**
   * 链式操作，类似 flatMap
   *
   * @param fn 返回新 Result 的函数
   * @returns 新的 Result
   */
  chain<NewValue, NewError>(
    fn: (value: Value) => Result<NewValue, NewError>
  ): Result<NewValue, Error | NewError> {
    if (this._isSuccess) {
      return fn(this._value as Value)
    }
    return Result.fail(this._error as Error)
  }

  /**
   * 异步链式操作
   *
   * @param fn 返回 Promise<Result> 的函数
   * @returns Promise<Result>
   */
  async chainAsync<NewValue, NewError>(
    fn: (value: Value) => Promise<Result<NewValue, NewError>>
  ): Promise<Result<NewValue, Error | NewError>> {
    if (this._isSuccess) {
      return fn(this._value as Value)
    }
    return Result.fail(this._error as Error)
  }

  /**
   * 模式匹配
   *
   * @param handlers 成功和失败的处理函数
   * @returns 处理函数的返回值
   */
  match<T>(handlers: { ok: (value: Value) => T; fail: (error: Error) => T }): T {
    if (this._isSuccess) {
      return handlers.ok(this._value as Value)
    }
    return handlers.fail(this._error as Error)
  }

  /**
   * 如果成功执行副作用
   *
   * @param fn 副作用函数
   * @returns 原始 Result
   */
  tap(fn: (value: Value) => void): Result<Value, Error> {
    if (this._isSuccess) {
      fn(this._value as Value)
    }
    return this
  }

  /**
   * 如果失败执行副作用
   *
   * @param fn 副作用函数
   * @returns 原始 Result
   */
  tapError(fn: (error: Error) => void): Result<Value, Error> {
    if (!this._isSuccess) {
      fn(this._error as Error)
    }
    return this
  }

  /**
   * 转换为 Promise
   *
   * @returns 成功时 resolve，失败时 reject
   */
  toPromise(): Promise<Value> {
    if (this._isSuccess) {
      return Promise.resolve(this._value as Value)
    }
    return Promise.reject(new Error(String(this._error)))
  }

  /**
   * 合并多个 Result
   *
   * @param results Result 数组
   * @returns 如果全部成功返回值数组，否则返回第一个错误
   */
  static combine<TValue, TError>(results: Result<TValue, TError>[]): Result<TValue[], TError> {
    const values: TValue[] = []

    for (const result of results) {
      if (result.isFailure) {
        return Result.fail(result.error)
      }
      values.push(result.value)
    }

    return Result.ok(values)
  }

  /**
   * 从 Promise 创建 Result
   *
   * @param promise 要转换的 Promise
   * @returns Promise<Result>
   */
  static async fromPromise<TValue>(promise: Promise<TValue>): Promise<Result<TValue, unknown>> {
    try {
      const value = await promise
      return Result.ok(value)
    } catch (error) {
      return Result.fail(error)
    }
  }

  /**
   * 从可能抛出异常的函数创建 Result
   *
   * @param fn 可能抛出异常的函数
   * @returns Result
   */
  static fromThrowable<TValue, TError = unknown>(fn: () => TValue): Result<TValue, TError> {
    try {
      return Result.ok(fn())
    } catch (error) {
      return Result.fail(error as TError)
    }
  }
}

/**
 * 类型守卫：判断是否为成功的 Result
 */
export function isOk<T, E>(result: Result<T, E>): result is Result<T, never> {
  return result.isSuccess
}

/**
 * 类型守卫：判断是否为失败的 Result
 */
export function isFail<T, E>(result: Result<T, E>): result is Result<never, E> {
  return result.isFailure
}

/**
 * 组合多个 Result，全部成功返回值数组，任一失败返回第一个错误
 *
 * @param results Result 数组
 * @returns 组合后的 Result
 */
export function combineResults<T, E>(results: Result<T, E>[]): Result<T[], E> {
  return Result.combine(results)
}

/**
 * 顺序执行多个返回 Result 的函数
 *
 * @param fns 函数数组
 * @returns 组合后的 Result
 */
export function sequence<T, E>(...fns: Array<() => Result<T, E>>): Result<T[], E> {
  const results: T[] = []

  for (const fn of fns) {
    const result = fn()
    if (result.isFailure) {
      return Result.fail(result.error)
    }
    results.push(result.value)
  }

  return Result.ok(results) as Result<T[], E>
}

/**
 * 并行执行多个返回 Promise<Result> 的函数
 *
 * @param fns 异步函数数组
 * @returns 组合后的 Promise<Result>
 */
export async function parallel<T, E>(
  ...fns: Array<() => Promise<Result<T, E>>>
): Promise<Result<T[], E>> {
  const results = await Promise.all(fns.map(fn => fn()))
  return Result.combine(results)
}
