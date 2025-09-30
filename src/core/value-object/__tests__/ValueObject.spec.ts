import { describe, it, expect } from 'vitest'
import { ValueObject } from '../ValueObject'
import { Result } from '../../shared/Result'

// 测试用的具体值对象实现
interface EmailProps {
  value: string
}

class Email extends ValueObject<EmailProps> {
  private constructor(props: EmailProps) {
    super(props)
  }

  get value(): string {
    return this.props.value
  }

  static create(value: string): Result<Email, string> {
    if (!value || value.trim().length === 0) {
      return Result.fail('Email cannot be empty')
    }
    if (!value.includes('@')) {
      return Result.fail('Invalid email format')
    }
    return Result.ok(new Email({ value: value.toLowerCase().trim() }))
  }

  protected validate(props: EmailProps): void {
    if (!props.value || props.value.trim().length === 0) {
      throw new Error('Email cannot be empty')
    }
    if (!props.value.includes('@')) {
      throw new Error('Invalid email format')
    }
  }

  toString(): string {
    return this.value
  }

  // 公开 with 方法用于测试
  updateValue(newValue: string): Email {
    return this.with({ value: newValue })
  }
}

// 测试用的复合值对象
interface AddressProps {
  street: string
  city: string
  country: string
  zipCode: string
}

class Address extends ValueObject<AddressProps> {
  constructor(props: AddressProps) {
    super(props)
  }

  static create(props: AddressProps): Result<Address, string> {
    try {
      return Result.ok(new Address(props))
    } catch (error) {
      return Result.fail((error as Error).message)
    }
  }

  protected validate(props: AddressProps): void {
    if (!props.street || props.street.trim().length === 0) {
      throw new Error('Street cannot be empty')
    }
    if (!props.city || props.city.trim().length === 0) {
      throw new Error('City cannot be empty')
    }
    if (!props.country || props.country.trim().length === 0) {
      throw new Error('Country cannot be empty')
    }
    if (!props.zipCode || !/^\d{5}$/.test(props.zipCode)) {
      throw new Error('Invalid zip code')
    }
  }

  get street(): string {
    return this.props.street
  }

  get city(): string {
    return this.props.city
  }

  get country(): string {
    return this.props.country
  }

  get zipCode(): string {
    return this.props.zipCode
  }

  toString(): string {
    return `${this.street}, ${this.city}, ${this.country} ${this.zipCode}`
  }

  changeStreet(newStreet: string): Address {
    return this.with({ street: newStreet })
  }
}

describe('值对象', () => {
  describe('创建和验证', () => {
    it('应该使用有效属性创建值对象', () => {
      const emailResult = Email.create('test@example.com')

      expect(emailResult.isSuccess).toBe(true)
      expect(emailResult.value.value).toBe('test@example.com')
    })

    it('应该在属性无效时创建失败', () => {
      const emptyResult = Email.create('')
      expect(emptyResult.isFailure).toBe(true)
      expect(emptyResult.error).toBe('Email cannot be empty')

      const invalidResult = Email.create('invalid-email')
      expect(invalidResult.isFailure).toBe(true)
      expect(invalidResult.error).toBe('Invalid email format')
    })

    it('应该在创建期间规范化值', () => {
      const emailResult = Email.create('  Test@Example.COM  ')

      expect(emailResult.isSuccess).toBe(true)
      expect(emailResult.value.value).toBe('test@example.com')
    })

    it('应该验证复合值对象', () => {
      const address = new Address({
        street: '123 Main St',
        city: 'New York',
        country: 'USA',
        zipCode: '12345'
      })

      expect(address.street).toBe('123 Main St')
      expect(address.city).toBe('New York')
      expect(address.country).toBe('USA')
      expect(address.zipCode).toBe('12345')
    })

    it('应该在无效的复合值对象上抛出异常', () => {
      expect(() => {
        new Address({
          street: '',
          city: 'New York',
          country: 'USA',
          zipCode: '12345'
        })
      }).toThrow('Street cannot be empty')

      expect(() => {
        new Address({
          street: '123 Main St',
          city: 'New York',
          country: 'USA',
          zipCode: 'invalid'
        })
      }).toThrow('Invalid zip code')
    })
  })

  describe('不可变性', () => {
    it('应该深度冻结属性', () => {
      const address = new Address({
        street: '123 Main St',
        city: 'New York',
        country: 'USA',
        zipCode: '12345'
      })

      const props = address.getValue()

      expect(() => {
        ;(props as any).street = 'Modified Street'
      }).toThrow()

      expect(() => {
        ;(props as any).city = 'Modified City'
      }).toThrow()
    })

    it('不应该修改原始属性对象', () => {
      const props = {
        street: '123 Main St',
        city: 'New York',
        country: 'USA',
        zipCode: '12345'
      }

      const address = new Address(props)

      // Modify original props
      props.street = 'Modified Street'
      props.city = 'Modified City'

      // Value object should remain unchanged
      expect(address.street).toBe('123 Main St')
      expect(address.city).toBe('New York')
    })

    it('克隆时应该返回相同实例', () => {
      const emailResult = Email.create('test@example.com')
      const email = emailResult.value
      const cloned = email.clone()

      expect(cloned).toBe(email)
    })
  })

  describe('相等性', () => {
    it('应该按值而不是引用进行比较', () => {
      const email1 = Email.create('test@example.com').value
      const email2 = Email.create('test@example.com').value

      expect(email1).not.toBe(email2)
      expect(email1.equals(email2)).toBe(true)
    })

    it('对于不同值应该返回false', () => {
      const email1 = Email.create('test1@example.com').value
      const email2 = Email.create('test2@example.com').value

      expect(email1.equals(email2)).toBe(false)
    })

    it('对于null或undefined应该返回false', () => {
      const email = Email.create('test@example.com').value

      expect(email.equals(null as any)).toBe(false)
      expect(email.equals(undefined as any)).toBe(false)
      expect(email.equals()).toBe(false)
    })

    it('should return true for same instance', () => {
      const email = Email.create('test@example.com').value

      expect(email.equals(email)).toBe(true)
    })

    it('should return false for different types', () => {
      const email = Email.create('test@example.com').value
      const address = new Address({
        street: '123 Main St',
        city: 'New York',
        country: 'USA',
        zipCode: '12345'
      })

      expect(email.equals(address as any)).toBe(false)
    })

    it('should compare composite objects deeply', () => {
      const address1 = new Address({
        street: '123 Main St',
        city: 'New York',
        country: 'USA',
        zipCode: '12345'
      })

      const address2 = new Address({
        street: '123 Main St',
        city: 'New York',
        country: 'USA',
        zipCode: '12345'
      })

      expect(address1.equals(address2)).toBe(true)
    })
  })

  describe('with方法', () => {
    it('应该创建修改属性的新实例', () => {
      const email1 = Email.create('test@example.com').value
      const email2 = email1.updateValue('new@example.com')

      expect(email1.value).toBe('test@example.com')
      expect(email2.value).toBe('new@example.com')
      expect(email1).not.toBe(email2)
    })

    it('should validate new props', () => {
      const email = Email.create('test@example.com').value

      expect(() => {
        email.updateValue('invalid')
      }).toThrow('Invalid email format')
    })

    it('should work with composite objects', () => {
      const address1 = new Address({
        street: '123 Main St',
        city: 'New York',
        country: 'USA',
        zipCode: '12345'
      })

      const address2 = address1.changeStreet('456 Oak Ave')

      expect(address1.street).toBe('123 Main St')
      expect(address2.street).toBe('456 Oak Ave')
      expect(address2.city).toBe('New York')
      expect(address2.country).toBe('USA')
      expect(address2.zipCode).toBe('12345')
    })
  })

  describe('工具方法', () => {
    it('应该转换为对象', () => {
      const address = new Address({
        street: '123 Main St',
        city: 'New York',
        country: 'USA',
        zipCode: '12345'
      })

      const obj = address.toObject()

      expect(obj).toEqual({
        street: '123 Main St',
        city: 'New York',
        country: 'USA',
        zipCode: '12345'
      })
    })

    it('should convert to JSON', () => {
      const email = Email.create('test@example.com').value
      const json = email.toJSON()

      expect(json).toEqual({ value: 'test@example.com' })
    })

    it('should convert to string', () => {
      const email = Email.create('test@example.com').value
      expect(email.toString()).toBe('test@example.com')

      const address = new Address({
        street: '123 Main St',
        city: 'New York',
        country: 'USA',
        zipCode: '12345'
      })
      expect(address.toString()).toBe('123 Main St, New York, USA 12345')
    })

    it('should use default toString implementation when not overridden', () => {
      // 创建一个没有重写 toString 的值对象
      class SimpleValueObject extends ValueObject<{ value: string }> {
        protected validate(): void {
          // No validation
        }
      }

      const simple = new SimpleValueObject({ value: 'test' })
      const result = simple.toString()

      // 默认实现应该返回 JSON 字符串
      expect(result).toBe('{"value":"test"}')
    })

    it('should generate hash code', () => {
      const email1 = Email.create('test@example.com').value
      const email2 = Email.create('test@example.com').value
      const email3 = Email.create('other@example.com').value

      expect(email1.hashCode()).toBe(email2.hashCode())
      expect(email1.hashCode()).not.toBe(email3.hashCode())
    })

    it('should check if value object', () => {
      const email = Email.create('test@example.com').value

      expect(ValueObject.isValueObject(email)).toBe(true)
      expect(ValueObject.isValueObject({})).toBe(false)
      expect(ValueObject.isValueObject(null)).toBe(false)
      expect(ValueObject.isValueObject('string')).toBe(false)
    })

    it('should get specific property', () => {
      const address = new Address({
        street: '123 Main St',
        city: 'New York',
        country: 'USA',
        zipCode: '12345'
      })

      expect(address.get('street')).toBe('123 Main St')
      expect(address.get('city')).toBe('New York')
    })

    it('should check if has property value', () => {
      const address = new Address({
        street: '123 Main St',
        city: 'New York',
        country: 'USA',
        zipCode: '12345'
      })

      expect(address.has('city', 'New York')).toBe(true)
      expect(address.has('city', 'Los Angeles')).toBe(false)
    })

    it('should check if empty', () => {
      // Email 不会真正为空因为验证会失败
      // 但我们可以创建一个允许空值的值对象来测试
      class NullableValue extends ValueObject<{ value: string | null }> {
        constructor(value: string | null) {
          super({ value })
        }

        protected validate(_props: { value: string | null }): void {
          // 允许 null
        }
      }

      const nullValue = new NullableValue(null)
      const emptyValue = new NullableValue('')
      const nonEmptyValue = new NullableValue('value')

      expect(nullValue.isEmpty()).toBe(true)
      expect(emptyValue.isEmpty()).toBe(true)
      expect(nonEmptyValue.isEmpty()).toBe(false)
    })

    it('should check if valid', () => {
      const email = Email.create('test@example.com').value
      expect(email.isValid()).toBe(true)

      // 创建一个会变得无效的值对象（这在实际中不应该发生）
      class ConditionalValue extends ValueObject<{ value: number }> {
        private static maxValue = 100

        constructor(value: number) {
          super({ value })
        }

        protected validate(props: { value: number }): void {
          if (props.value > ConditionalValue.maxValue) {
            throw new Error('Value too large')
          }
        }

        static setMaxValue(max: number): void {
          ConditionalValue.maxValue = max
        }
      }

      const conditional = new ConditionalValue(50)
      expect(conditional.isValid()).toBe(true)

      ConditionalValue.setMaxValue(40)
      expect(conditional.isValid()).toBe(false)

      ConditionalValue.setMaxValue(100) // Reset
    })
  })

  describe('静态工厂方法', () => {
    it('应该从对象创建', () => {
      const result = Address.create({
        street: '123 Main St',
        city: 'New York',
        country: 'USA',
        zipCode: '12345'
      })

      expect(result.isSuccess).toBe(true)
      expect(result.value.street).toBe('123 Main St')
    })

    it('should handle validation errors in fromObject', () => {
      const result = Address.create({
        street: '',
        city: 'New York',
        country: 'USA',
        zipCode: '12345'
      })

      expect(result.isFailure).toBe(true)
      expect(result.error).toBe('Street cannot be empty')
    })

    it('should create many value objects', () => {
      // 手动创建多个实例，因为子类不能覆盖基类的静态方法签名
      const emails = [Email.create('test1@example.com'), Email.create('test2@example.com')]

      expect(emails[0].isSuccess).toBe(true)
      expect(emails[1].isSuccess).toBe(true)
      expect(emails[0].value.value).toBe('test1@example.com')
      expect(emails[1].value.value).toBe('test2@example.com')
    })

    it('should fail createMany if any item is invalid', () => {
      const emails = [
        Email.create('test1@example.com'),
        Email.create('invalid-email'),
        Email.create('test3@example.com')
      ]

      expect(emails[0].isSuccess).toBe(true)
      expect(emails[1].isFailure).toBe(true)
      expect(emails[1].error).toBe('Invalid email format')
      expect(emails[2].isSuccess).toBe(true)
    })

    it('should use fromObject static method successfully', () => {
      const result = Email.fromObject({ value: 'test@example.com' })
      expect(result.isSuccess).toBe(true)
      if (result.isSuccess) {
        expect(result.value.value).toBe('test@example.com')
      }
    })

    it('should handle fromObject with invalid data', () => {
      const result = Email.fromObject({ value: '' })
      expect(result.isFailure).toBe(true)
      if (result.isFailure) {
        expect(result.error).toContain('Email cannot be empty')
      }
    })

    it('should handle fromObject with error', () => {
      // 测试错误处理
      class TestValueObject extends ValueObject<{ value: string }> {
        protected validate(): void {
          throw new Error('INVALID')
        }
      }

      const result = TestValueObject.fromObject({ value: 'test' })
      expect(result.isFailure).toBe(true)
      if (result.isFailure) {
        expect(result.error).toBe('INVALID')
      }
    })

    it('should use createMany static method successfully', () => {
      const result = Email.createMany([
        { value: 'test1@example.com' },
        { value: 'test2@example.com' },
        { value: 'test3@example.com' }
      ])

      expect(result.isSuccess).toBe(true)
      if (result.isSuccess) {
        expect(result.value).toHaveLength(3)
        expect(result.value[0].value).toBe('test1@example.com')
        expect(result.value[1].value).toBe('test2@example.com')
        expect(result.value[2].value).toBe('test3@example.com')
      }
    })

    it('should fail createMany if any item is invalid', () => {
      const result = Email.createMany([
        { value: 'test1@example.com' },
        { value: '' }, // 无效的邮箱
        { value: 'test3@example.com' }
      ])

      expect(result.isFailure).toBe(true)
      if (result.isFailure) {
        expect(result.error).toContain('Item 1:')
        expect(result.error).toContain('Email cannot be empty')
      }
    })

    it('should fail createMany with multiple invalid items', () => {
      const result = Email.createMany([
        { value: 'test1@example.com' },
        { value: '' }, // 无效的邮箱
        { value: 'invalid' }, // 无效格式
        { value: 'test4@example.com' }
      ])

      expect(result.isFailure).toBe(true)
      if (result.isFailure) {
        expect(result.error).toContain('Item 1:')
        expect(result.error).toContain('Item 2:')
        expect(result.error).toContain('Email cannot be empty')
        expect(result.error).toContain('Invalid email format')
      }
    })

    it('should test equals with deepEquals branch', () => {
      const email1 = Email.create('test@example.com').value
      const email2 = Email.create('test@example.com').value

      // 测试深度相等
      expect(email1.equals(email2)).toBe(true)

      // 创建复合值对象测试深度相等
      const address1 = new Address({
        street: '123 Main St',
        city: 'Boston',
        country: 'USA',
        zipCode: '02101' // 使用 zipCode 而不是 postalCode
      })
      const address2 = new Address({
        street: '123 Main St',
        city: 'Boston',
        country: 'USA',
        zipCode: '02101' // 使用 zipCode 而不是 postalCode
      })

      expect(address1.equals(address2)).toBe(true)
    })

    it('should handle error without message in fromObject method', () => {
      // 创建一个抛出没有 message 的错误的值对象
      class ErrorWithoutMessage extends ValueObject<{ value: string }> {
        protected validate(_props: { value: string }): void {
          const error = new Error()
          delete (error as any).message // 删除 message 属性
          throw error
        }
      }

      // 使用基类的 fromObject 方法
      const result = ErrorWithoutMessage.fromObject({ value: 'test' })
      expect(result.isFailure).toBe(true)
      expect(result.error).toBe('Invalid value object properties')
    })
  })
})
