import { describe, it, expect } from 'vitest'
import { ValueObjectBuilder, GenericValueObjectBuilder } from './ValueObjectBuilder'
import { ValueObject } from './ValueObject'

// 测试用的值对象
interface AddressProps {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

class Address extends ValueObject<AddressProps> {
  constructor(props: AddressProps) {
    super(props)
  }

  protected validate(props: AddressProps): void {
    if (!props.street || props.street.trim().length === 0) {
      throw new Error('Street is required')
    }
    if (!props.city || props.city.trim().length === 0) {
      throw new Error('City is required')
    }
    if (!props.state || props.state.trim().length === 0) {
      throw new Error('State is required')
    }
    if (!props.zipCode || !/^\d{5}$/.test(props.zipCode)) {
      throw new Error('Invalid zip code')
    }
    if (!props.country || props.country.trim().length === 0) {
      throw new Error('Country is required')
    }
  }

  get street(): string {
    return this.props.street
  }

  get city(): string {
    return this.props.city
  }

  get state(): string {
    return this.props.state
  }

  get zipCode(): string {
    return this.props.zipCode
  }

  get country(): string {
    return this.props.country
  }
}

// 具体的 Builder 实现
class AddressBuilder extends ValueObjectBuilder<Address, AddressProps> {
  street(value: string): this {
    this.props.street = value
    return this
  }

  city(value: string): this {
    this.props.city = value
    return this
  }

  state(value: string): this {
    this.props.state = value
    return this
  }

  zipCode(value: string): this {
    this.props.zipCode = value
    return this
  }

  country(value: string): this {
    this.props.country = value
    return this
  }

  protected validate(): string[] {
    const errors: string[] = []

    if (!this.props.street || this.props.street.trim().length === 0) {
      errors.push('Street is required')
    }
    if (!this.props.city || this.props.city.trim().length === 0) {
      errors.push('City is required')
    }
    if (!this.props.state || this.props.state.trim().length === 0) {
      errors.push('State is required')
    }
    if (!this.props.zipCode) {
      errors.push('Zip code is required')
    } else if (!/^\d{5}$/.test(this.props.zipCode)) {
      errors.push('Zip code must be 5 digits')
    }
    if (!this.props.country || this.props.country.trim().length === 0) {
      errors.push('Country is required')
    }

    return errors
  }

  protected createValueObject(): Address {
    return new Address(this.props as AddressProps)
  }

  // 静态工厂方法
  static create(): AddressBuilder {
    return new AddressBuilder()
  }
}

describe('值对象构建器', () => {
  describe('基础构建', () => {
    it('应该使用流式 API 构建值对象', () => {
      const result = new AddressBuilder()
        .street('123 Main St')
        .city('New York')
        .state('NY')
        .zipCode('10001')
        .country('USA')
        .build()

      expect(result.isSuccess).toBe(true)
      expect(result.value.street).toBe('123 Main St')
      expect(result.value.city).toBe('New York')
      expect(result.value.state).toBe('NY')
      expect(result.value.zipCode).toBe('10001')
      expect(result.value.country).toBe('USA')
    })

    it('缺少必填字段时应该失败', () => {
      const result = new AddressBuilder().street('123 Main St').city('New York').build()

      expect(result.isFailure).toBe(true)
      expect(result.error).toContain('State is required')
      expect(result.error).toContain('Zip code is required')
      expect(result.error).toContain('Country is required')
    })

    it('应该验证字段格式', () => {
      const result = new AddressBuilder()
        .street('123 Main St')
        .city('New York')
        .state('NY')
        .zipCode('invalid')
        .country('USA')
        .build()

      expect(result.isFailure).toBe(true)
      expect(result.error).toContain('Zip code must be 5 digits')
    })
  })

  describe('从对象构建', () => {
    it('应该从对象设置属性', () => {
      const result = new AddressBuilder()
        .fromObject({
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        })
        .build()

      expect(result.isSuccess).toBe(true)
      expect(result.value.street).toBe('123 Main St')
      expect(result.value.city).toBe('New York')
    })

    it('应该与现有属性合并', () => {
      const result = new AddressBuilder()
        .street('123 Main St')
        .city('New York')
        .fromObject({
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        })
        .build()

      expect(result.isSuccess).toBe(true)
      expect(result.value.street).toBe('123 Main St')
      expect(result.value.state).toBe('NY')
    })
  })

  describe('设置和获取方法', () => {
    it('应该设置和获取单个属性', () => {
      const builder = new AddressBuilder().set('street', '123 Main St').set('city', 'New York')

      expect(builder.get('street')).toBe('123 Main St')
      expect(builder.get('city')).toBe('New York')
      expect(builder.get('state')).toBeUndefined()
    })

    it('应该检查是否拥有属性', () => {
      const builder = new AddressBuilder().street('123 Main St').city('New York')

      expect(builder.has('street')).toBe(true)
      expect(builder.has('city')).toBe(true)
      expect(builder.has('state')).toBe(false)
    })
  })

  describe('清除方法', () => {
    it('应该清除单个属性', () => {
      const builder = new AddressBuilder().street('123 Main St').city('New York').clear('street')

      expect(builder.has('street')).toBe(false)
      expect(builder.has('city')).toBe(true)
    })

    it('应该清除所有属性', () => {
      const builder = new AddressBuilder()
        .street('123 Main St')
        .city('New York')
        .state('NY')
        .clearAll()

      expect(builder.has('street')).toBe(false)
      expect(builder.has('city')).toBe(false)
      expect(builder.has('state')).toBe(false)
    })
  })

  describe('验证方法', () => {
    it('应该检查是否有效', () => {
      const builder = new AddressBuilder()

      expect(builder.isValid()).toBe(false)

      builder.street('123 Main St').city('New York').state('NY').zipCode('10001').country('USA')

      expect(builder.isValid()).toBe(true)
    })

    it('应该获取验证错误', () => {
      const builder = new AddressBuilder().street('123 Main St').city('New York')

      const errors = builder.getErrors()

      expect(errors).toContain('State is required')
      expect(errors).toContain('Zip code is required')
      expect(errors).toContain('Country is required')
    })
  })

  describe('尝试构建', () => {
    it('失败时应该返回单个错误字符串', () => {
      const result = new AddressBuilder().street('123 Main St').tryBuild()

      expect(result.isFailure).toBe(true)
      expect(typeof result.error).toBe('string')
      expect(result.error).toContain('City is required')
      expect(result.error).toContain(';')
    })

    it('成功时应该返回值对象', () => {
      const result = new AddressBuilder()
        .street('123 Main St')
        .city('New York')
        .state('NY')
        .zipCode('10001')
        .country('USA')
        .tryBuild()

      expect(result.isSuccess).toBe(true)
      expect(result.value.street).toBe('123 Main St')
    })
  })

  describe('克隆', () => {
    it('应该创建构建器的副本', () => {
      const builder1 = new AddressBuilder().street('123 Main St').city('New York')

      const builder2 = builder1.clone().state('NY').zipCode('10001').country('USA')

      expect(builder1.has('state')).toBe(false)
      expect(builder2.has('state')).toBe(true)

      const result1 = builder1.build()
      const result2 = builder2.build()

      expect(result1.isFailure).toBe(true)
      expect(result2.isSuccess).toBe(true)
    })
  })

  describe('条件方法', () => {
    it('应该根据条件使用when应用设置', () => {
      const isUSA = true
      const isCanada = false

      const result = new AddressBuilder()
        .street('123 Main St')
        .city('New York')
        .when(isUSA, builder => {
          builder.state('NY').country('USA')
        })
        .when(isCanada, builder => {
          builder.state('ON').country('Canada')
        })
        .zipCode('10001')
        .build()

      expect(result.isSuccess).toBe(true)
      expect(result.value.country).toBe('USA')
      expect(result.value.state).toBe('NY')
    })
  })

  describe('管道和应用', () => {
    it('应该使用pipe转换构建器', () => {
      const addUSADefaults = (builder: AddressBuilder): AddressBuilder => {
        return builder.state('NY').country('USA')
      }

      const result = new AddressBuilder()
        .street('123 Main St')
        .city('New York')
        .pipe(addUSADefaults)
        .zipCode('10001')
        .build()

      expect(result.isSuccess).toBe(true)
      expect(result.value.country).toBe('USA')
    })

    it('应该应用多个设置器', () => {
      const setStreet = (b: AddressBuilder) => b.street('123 Main St')
      const setCity = (b: AddressBuilder) => b.city('New York')
      const setStateAndCountry = (b: AddressBuilder) => b.state('NY').country('USA')

      const result = new AddressBuilder()
        .apply(setStreet, setCity, setStateAndCountry)
        .zipCode('10001')
        .build()

      expect(result.isSuccess).toBe(true)
      expect(result.value.street).toBe('123 Main St')
      expect(result.value.city).toBe('New York')
    })
  })

  describe('获取属性', () => {
    it('应该返回当前属性', () => {
      const builder = new AddressBuilder().street('123 Main St').city('New York')

      const props = builder.getProps()

      expect(props).toEqual({
        street: '123 Main St',
        city: 'New York'
      })

      // Should return a copy, not the original
      props.street = 'Modified'
      expect(builder.get('street')).toBe('123 Main St')
    })
  })
})

describe('通用值对象构建器', () => {
  it('应该使用工厂和验证器创建构建器', () => {
    const factory = (props: AddressProps) => new Address(props)

    const validator = (props: Partial<AddressProps>): string[] => {
      const errors: string[] = []
      if (!props.street) errors.push('Street is required')
      if (!props.city) errors.push('City is required')
      if (!props.state) errors.push('State is required')
      if (!props.zipCode) errors.push('Zip code is required')
      if (!props.country) errors.push('Country is required')
      return errors
    }

    const result = GenericValueObjectBuilder.create(factory, validator)
      .set('street', '123 Main St')
      .set('city', 'New York')
      .set('state', 'NY')
      .set('zipCode', '10001')
      .set('country', 'USA')
      .build()

    expect(result.isSuccess).toBe(true)
    expect(result.value.street).toBe('123 Main St')
  })

  it('应该与初始属性一起工作', () => {
    const factory = (props: AddressProps) => new Address(props)
    const validator = (): string[] => []

    const initialProps = {
      street: '123 Main St',
      city: 'New York'
    }

    const builder = GenericValueObjectBuilder.create(factory, validator, initialProps)
      .set('state', 'NY')
      .set('zipCode', '10001')
      .set('country', 'USA')

    const result = builder.build()

    expect(result.isSuccess).toBe(true)
    expect(result.value.street).toBe('123 Main St')
    expect(result.value.state).toBe('NY')
  })

  it('应该使用提供的验证器进行验证', () => {
    const factory = (props: AddressProps) => new Address(props)

    const validator = (props: Partial<AddressProps>): string[] => {
      const errors: string[] = []
      if (!props.zipCode || !/^\d{5}$/.test(props.zipCode)) {
        errors.push('Invalid zip code')
      }
      return errors
    }

    const result = GenericValueObjectBuilder.create(factory, validator)
      .set('street', '123 Main St')
      .set('city', 'New York')
      .set('state', 'NY')
      .set('zipCode', 'invalid')
      .set('country', 'USA')
      .build()

    expect(result.isFailure).toBe(true)
    expect(result.error).toContain('Invalid zip code')
  })

  it('应该处理构造函数抛出的非标准错误', () => {
    // 创建一个会抛出非标准错误的工厂函数
    const factory = (_props: { value: string }) => {
      // 抛出一个Error对象
      throw new Error('CUSTOM_ERROR')
    }

    const builder = new GenericValueObjectBuilder(
      factory,
      () => [] // 空验证器
    )

    const result = builder.set('value', 'test').build()

    expect(result.isFailure).toBe(true)
    expect(result.error).toEqual(['CUSTOM_ERROR'])
  })

  it('应该处理构造函数抛出的未知错误', () => {
    // 创建一个会抛出没有message的Error的工厂函数
    const factory = (_props: { value: string }) => {
      const error = new Error()

      delete (error as any).message
      throw error
    }

    const builder = new GenericValueObjectBuilder(
      factory,
      () => [] // 空验证器
    )

    const result = builder.set('value', 'test').build()

    expect(result.isFailure).toBe(true)
    expect(result.error).toEqual(['Unknown error'])
  })
})
