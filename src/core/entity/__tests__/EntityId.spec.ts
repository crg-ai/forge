import { describe, it, expect, beforeEach } from 'vitest'
import { EntityId } from '../EntityId'

describe('EntityId', () => {
  describe('创建和初始化', () => {
    it('应该创建带有自动生成UUID的EntityId', () => {
      const id = EntityId.create()

      expect(id.getClientId()).toBeDefined()
      expect(id.getClientId()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
      expect(id.getBusinessId()).toBeUndefined()
      expect(id.isNew()).toBe(true)
    })

    it('应该从已有数据恢复EntityId', () => {
      const data = {
        clientId: 'test-client-id',
        businessId: 12345
      }

      const id = EntityId.restore(data)

      expect(id.getClientId()).toBe('test-client-id')
      expect(id.getBusinessId()).toBe(12345)
      expect(id.isNew()).toBe(false)
    })

    it('应该从部分数据恢复EntityId', () => {
      const id = EntityId.restore({ clientId: 'test-id' })

      expect(id.getClientId()).toBe('test-id')
      expect(id.getBusinessId()).toBeUndefined()
      expect(id.isNew()).toBe(true)
    })
  })

  describe('业务ID管理', () => {
    let id: EntityId<number>

    beforeEach(() => {
      id = EntityId.create<number>()
    })

    it('应该设置业务ID', () => {
      expect(id.hasBusinessId()).toBe(false)

      id.setBusinessId(12345)

      expect(id.getBusinessId()).toBe(12345)
      expect(id.hasBusinessId()).toBe(true)
      expect(id.isNew()).toBe(false)
    })

    it('应该只允许设置一次业务ID', () => {
      id.setBusinessId(12345)

      expect(() => {
        id.setBusinessId(67890)
      }).toThrow('Business ID has already been set')
    })

    it('应该拒绝null或undefined的业务ID', () => {
      expect(() => {
        id.setBusinessId(null as any)
      }).toThrow('Business ID cannot be null or undefined')

      expect(() => {
        id.setBusinessId(undefined as any)
      }).toThrow('Business ID cannot be null or undefined')
    })

    it('应该支持字符串类型的业务ID', () => {
      const stringId = EntityId.create<string>()
      stringId.setBusinessId('BIZ-123')

      expect(stringId.getBusinessId()).toBe('BIZ-123')
      expect(stringId.hasBusinessId()).toBe(true)
    })
  })

  describe('值获取', () => {
    it('应该优先返回业务ID', () => {
      const id = EntityId.create<number>()
      const clientId = id.getClientId()

      expect(id.getValue()).toBe(clientId)

      id.setBusinessId(12345)
      expect(id.getValue()).toBe(12345)
    })

    it('应该在没有业务ID时返回客户端ID', () => {
      const id = EntityId.create<string>()
      const clientId = id.getClientId()

      expect(id.getValue()).toBe(clientId)
    })
  })

  describe('相等性判断', () => {
    it('应该在都有业务ID时比较业务ID', () => {
      const id1 = EntityId.create<number>()
      const id2 = EntityId.create<number>()

      id1.setBusinessId(12345)
      id2.setBusinessId(12345)

      expect(id1.equals(id2)).toBe(true)
    })

    it('应该在都有不同业务ID时返回false', () => {
      const id1 = EntityId.create<number>()
      const id2 = EntityId.create<number>()

      id1.setBusinessId(12345)
      id2.setBusinessId(67890)

      expect(id1.equals(id2)).toBe(false)
    })

    it('应该在没有业务ID时比较客户端ID', () => {
      const clientId = 'same-client-id'
      const id1 = EntityId.restore({ clientId })
      const id2 = EntityId.restore({ clientId })

      expect(id1.equals(id2)).toBe(true)
    })

    it('应该在客户端ID不同时返回false', () => {
      const id1 = EntityId.restore({ clientId: 'id1' })
      const id2 = EntityId.restore({ clientId: 'id2' })

      expect(id1.equals(id2)).toBe(false)
    })

    it('应该在一个有业务ID另一个没有时使用客户端ID比较', () => {
      const clientId = 'same-client-id'
      const id1 = EntityId.restore({ clientId })
      const id2 = EntityId.restore({ clientId })

      id1.setBusinessId(12345)

      // 虽然id1有业务ID，但id2没有，所以比较客户端ID
      expect(id1.equals(id2)).toBe(true)
    })

    it('应该对null或undefined返回false', () => {
      const id = EntityId.create()

      expect(id.equals(null as any)).toBe(false)
      expect(id.equals(undefined as any)).toBe(false)
      expect(id.equals()).toBe(false)
    })
  })

  describe('序列化', () => {
    it('应该序列化为JSON', () => {
      const id = EntityId.create<number>()
      const clientId = id.getClientId()
      const createdAt = (id as any).createdAt // 访问私有属性用于测试

      const json = id.toJSON()

      expect(json.clientId).toBe(clientId)
      expect(json.businessId).toBeUndefined()
      expect(json.createdAt).toBe(createdAt)
    })

    it('应该序列化包含业务ID的EntityId', () => {
      const id = EntityId.create<number>()
      id.setBusinessId(12345)

      const json = id.toJSON()

      expect(json.businessId).toBe(12345)
    })

    it('应该转换为字符串', () => {
      const id1 = EntityId.create<number>()
      expect(id1.toString()).toMatch(/^EntityId\(client: [0-9a-f-]+\)$/)

      const id2 = EntityId.create<number>()
      id2.setBusinessId(12345)
      expect(id2.toString()).toMatch(/^EntityId\(business: 12345, client: [0-9a-f-]+\)$/)
    })
  })

  describe('克隆', () => {
    it('应该克隆EntityId', () => {
      const id = EntityId.create<number>()
      id.setBusinessId(12345)

      const cloned = id.clone()

      expect(cloned.getClientId()).toBe(id.getClientId())
      expect(cloned.getBusinessId()).toBe(id.getBusinessId())
      expect(cloned).not.toBe(id) // 不同的实例
    })

    it('应该克隆没有业务ID的EntityId', () => {
      const id = EntityId.create()
      const cloned = id.clone()

      expect(cloned.getClientId()).toBe(id.getClientId())
      expect(cloned.getBusinessId()).toBeUndefined()
      expect(cloned.isNew()).toBe(true)
    })
  })

  describe('UUID生成', () => {
    it('应该生成有效的UUID格式', () => {
      const id = EntityId.create()

      // 应该生成有效的UUID v4格式
      expect(id.getClientId()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    })

    it('应该每次生成不同的UUID', () => {
      const id1 = EntityId.create()
      const id2 = EntityId.create()
      const id3 = EntityId.create()

      // 每个ID的clientId应该是唯一的
      expect(id1.getClientId()).not.toBe(id2.getClientId())
      expect(id2.getClientId()).not.toBe(id3.getClientId())
      expect(id1.getClientId()).not.toBe(id3.getClientId())
    })
  })

  describe('类型安全', () => {
    it('应该支持数字类型的业务ID', () => {
      const id = EntityId.create<number>()
      id.setBusinessId(12345)

      const businessId: number | undefined = id.getBusinessId()
      expect(typeof businessId).toBe('number')
    })

    it('应该支持字符串类型的业务ID', () => {
      const id = EntityId.create<string>()
      id.setBusinessId('BIZ-123')

      const businessId: string | undefined = id.getBusinessId()
      expect(typeof businessId).toBe('string')
    })

    it('应该默认支持字符串类型', () => {
      const id = EntityId.create()
      id.setBusinessId('DEFAULT-123')

      const businessId = id.getBusinessId()
      expect(typeof businessId).toBe('string')
    })
  })
})
