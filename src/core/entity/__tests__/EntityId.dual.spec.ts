import { describe, it, expect } from 'vitest'
import { EntityId } from '../EntityId'

describe('EntityId 双业务ID支持', () => {
  describe('双业务ID管理', () => {
    it('应该支持设置主业务ID和次要业务ID', () => {
      const id = EntityId.create<string>()

      // 设置主业务ID
      id.setPrimaryBusinessId('USER_123')
      expect(id.getPrimaryBusinessId()).toBe('USER_123')

      // 设置次要业务ID
      id.setSecondaryBusinessId('EMP001')
      expect(id.getSecondaryBusinessId()).toBe('EMP001')

      // isNew() 应该返回 false
      expect(id.isNew()).toBe(false)
    })

    it('应该在没有任何业务ID时返回isNew为true', () => {
      const id = EntityId.create()
      expect(id.isNew()).toBe(true)
      expect(id.hasAnyBusinessId()).toBe(false)
    })

    it('应该在只有主业务ID时返回isNew为false', () => {
      const id = EntityId.create<number>()
      id.setPrimaryBusinessId(123)

      expect(id.isNew()).toBe(false)
      expect(id.hasAnyBusinessId()).toBe(true)
      expect(id.hasPrimaryBusinessId()).toBe(true)
      expect(id.hasSecondaryBusinessId()).toBe(false)
    })

    it('应该在只有次要业务ID时返回isNew为false', () => {
      const id = EntityId.create<string>()
      id.setSecondaryBusinessId('EMP001')

      expect(id.isNew()).toBe(false)
      expect(id.hasAnyBusinessId()).toBe(true)
      expect(id.hasPrimaryBusinessId()).toBe(false)
      expect(id.hasSecondaryBusinessId()).toBe(true)
    })

    it('应该只允许设置一次主业务ID', () => {
      const id = EntityId.create<number>()
      id.setPrimaryBusinessId(123)

      expect(() => {
        id.setPrimaryBusinessId(456)
      }).toThrow('Primary business ID has already been set')
    })

    it('应该拒绝无效的主业务ID', () => {
      const id = EntityId.create<string>()

      expect(() => id.setPrimaryBusinessId(null as any)).toThrow(
        'Primary business ID cannot be null or undefined'
      )
      expect(() => id.setPrimaryBusinessId(undefined as any)).toThrow(
        'Primary business ID cannot be null or undefined'
      )
    })

    it('应该只允许设置一次次要业务ID', () => {
      const id = EntityId.create<string>()
      id.setSecondaryBusinessId('EMP001')

      expect(() => {
        id.setSecondaryBusinessId('EMP002')
      }).toThrow('Secondary business ID has already been set')
    })

    it('应该拒绝无效的次要业务ID', () => {
      const id = EntityId.create<string>()

      expect(() => id.setSecondaryBusinessId(null as any)).toThrow(
        'Secondary business ID cannot be null or undefined'
      )
      expect(() => id.setSecondaryBusinessId(undefined as any)).toThrow(
        'Secondary business ID cannot be null or undefined'
      )
    })

    it('getValue应该按优先级返回ID', () => {
      const id = EntityId.create<string>()
      const clientId = id.getClientId()

      // 初始状态：返回客户端ID
      expect(id.getValue()).toBe(clientId)

      // 设置次要业务ID：返回次要业务ID
      id.setSecondaryBusinessId('EMP001')
      expect(id.getValue()).toBe('EMP001')

      // 设置主业务ID：优先返回主业务ID
      id.setPrimaryBusinessId('USER_123')
      expect(id.getValue()).toBe('USER_123')
    })
  })

  describe('双业务ID的相等性判断', () => {
    it('应该在都有主业务ID时比较主业务ID', () => {
      const id1 = EntityId.create<string>()
      const id2 = EntityId.create<string>()

      id1.setPrimaryBusinessId('USER_123')
      id2.setPrimaryBusinessId('USER_123')

      expect(id1.equals(id2)).toBe(true)
    })

    it('应该在都有次要业务ID时比较次要业务ID', () => {
      const id1 = EntityId.create<string>()
      const id2 = EntityId.create<string>()

      id1.setSecondaryBusinessId('EMP001')
      id2.setSecondaryBusinessId('EMP001')

      expect(id1.equals(id2)).toBe(true)
    })

    it('应该正确处理交叉比较（主业务ID等于次要业务ID）', () => {
      const id1 = EntityId.create<string>()
      const id2 = EntityId.create<string>()

      // id1 有主业务ID: USER_123
      id1.setPrimaryBusinessId('USER_123')

      // id2 有次要业务ID: USER_123（与id1的主业务ID相同）
      id2.setSecondaryBusinessId('USER_123')

      // 应该识别为同一实体
      expect(id1.equals(id2)).toBe(true)
      expect(id2.equals(id1)).toBe(true)
    })

    it('应该处理复杂的实体合并场景', () => {
      // 场景：两个系统的数据合并
      // 系统A使用数据库ID作为主键
      // 系统B使用员工号作为主键

      // 系统A的实体
      const entityFromSystemA = EntityId.restore<string>({
        clientId: 'uuid-a',
        primaryBusinessId: 'DB_ID_123',
        secondaryBusinessId: 'EMP001'
      })

      // 系统B的实体（员工号作为主ID）
      const entityFromSystemB = EntityId.restore<string>({
        clientId: 'uuid-b',
        primaryBusinessId: 'EMP001',
        secondaryBusinessId: 'DB_ID_123'
      })

      // 虽然主次ID相反，但应该识别为同一实体
      expect(entityFromSystemA.equals(entityFromSystemB)).toBe(true)
    })

    it('应该在交叉比较不匹配时返回false', () => {
      const id1 = EntityId.create<string>()
      const id2 = EntityId.create<string>()

      id1.setPrimaryBusinessId('USER_123')
      id2.setSecondaryBusinessId('USER_456')

      expect(id1.equals(id2)).toBe(false)
    })

    it('应该处理一个有双ID另一个只有单ID的情况', () => {
      const fullId = EntityId.restore<string>({
        clientId: 'uuid1',
        primaryBusinessId: 'USER_123',
        secondaryBusinessId: 'EMP001'
      })

      const primaryOnlyId = EntityId.restore<string>({
        clientId: 'uuid2',
        primaryBusinessId: 'USER_123'
      })

      const secondaryOnlyId = EntityId.restore<string>({
        clientId: 'uuid3',
        secondaryBusinessId: 'EMP001'
      })

      // 通过主业务ID匹配
      expect(fullId.equals(primaryOnlyId)).toBe(true)
      expect(primaryOnlyId.equals(fullId)).toBe(true)

      // 通过次要业务ID匹配
      expect(fullId.equals(secondaryOnlyId)).toBe(true)
      expect(secondaryOnlyId.equals(fullId)).toBe(true)

      // 两个不同维度的单ID不应该相等
      expect(primaryOnlyId.equals(secondaryOnlyId)).toBe(false)
    })
  })

  describe('序列化和恢复', () => {
    it('应该正确序列化双业务ID', () => {
      const id = EntityId.create<string>()
      id.setPrimaryBusinessId('USER_123')
      id.setSecondaryBusinessId('EMP001')

      const json = id.toJSON()

      expect(json.primaryBusinessId).toBe('USER_123')
      expect(json.secondaryBusinessId).toBe('EMP001')

      // 兼容性
      expect(json.businessId).toBe('USER_123')
    })

    it('应该正确恢复双业务ID', () => {
      const restored = EntityId.restore<string>({
        clientId: 'test-uuid',
        primaryBusinessId: 'USER_123',
        secondaryBusinessId: 'EMP001'
      })

      expect(restored.getClientId()).toBe('test-uuid')
      expect(restored.getPrimaryBusinessId()).toBe('USER_123')
      expect(restored.getSecondaryBusinessId()).toBe('EMP001')
    })

    it('应该兼容旧版本的数据格式', () => {
      const restored = EntityId.restore<number>({
        clientId: 'test-uuid',
        businessId: 123 // 旧版本格式
      })

      expect(restored.getPrimaryBusinessId()).toBe(123)
      expect(restored.getBusinessId()).toBe(123) // 兼容方法
    })
  })

  describe('toString格式', () => {
    it('应该正确显示双业务ID', () => {
      const id = EntityId.create<string>()
      const clientId = id.getClientId()

      // 只有客户端ID
      expect(id.toString()).toBe(`EntityId(client: ${clientId})`)

      // 添加主业务ID（兼容模式：显示为 business）
      id.setPrimaryBusinessId('USER_123')
      expect(id.toString()).toBe(`EntityId(business: USER_123, client: ${clientId})`)

      // 添加次要业务ID（显示完整的 primary/secondary）
      id.setSecondaryBusinessId('EMP001')
      expect(id.toString()).toBe(
        `EntityId(primary: USER_123, secondary: EMP001, client: ${clientId})`
      )
    })
  })

  describe('实际使用场景', () => {
    it('应该支持用户-员工双重身份场景', () => {
      // 场景：一个人既是系统用户，也是公司员工
      // 用户系统使用 user_id
      // HR系统使用 employee_id

      const person = EntityId.create<string>()

      // 用户注册时生成 user_id
      person.setPrimaryBusinessId('USER_20240101_001')

      // 入职后分配 employee_id
      person.setSecondaryBusinessId('EMP2024001')

      expect(person.isNew()).toBe(false)
      expect(person.getValue()).toBe('USER_20240101_001')

      // 从不同系统查询同一个人
      const fromUserSystem = EntityId.restore<string>({
        clientId: 'other-uuid',
        primaryBusinessId: 'USER_20240101_001'
      })

      const fromHRSystem = EntityId.restore<string>({
        clientId: 'another-uuid',
        secondaryBusinessId: 'EMP2024001'
      })

      // 应该识别为同一个人
      expect(person.equals(fromUserSystem)).toBe(true)
      expect(person.equals(fromHRSystem)).toBe(true)
    })

    it('应该识别主次ID相反的情况（系统合并场景）', () => {
      // 系统A: DB_ID 为主，EMP_ID 为次
      const systemA = EntityId.restore<string>({
        clientId: 'uuid-a',
        primaryBusinessId: 'DB_001',
        secondaryBusinessId: 'EMP_001'
      })

      // 系统B: EMP_ID 为主，DB_ID 为次（主次ID相反）
      const systemB = EntityId.restore<string>({
        clientId: 'uuid-b',
        primaryBusinessId: 'EMP_001',
        secondaryBusinessId: 'DB_001'
      })

      // 应该识别为同一个实体（主次ID相反但值相同）
      expect(systemA.equals(systemB)).toBe(true)
      expect(systemB.equals(systemA)).toBe(true)
    })

    it('应该区分不同的主次ID相反的实体', () => {
      // 实体1
      const entity1 = EntityId.restore<string>({
        clientId: 'uuid-1',
        primaryBusinessId: 'A_001',
        secondaryBusinessId: 'B_001'
      })

      // 实体2（不同的ID）
      const entity2 = EntityId.restore<string>({
        clientId: 'uuid-2',
        primaryBusinessId: 'B_002', // 不同的值
        secondaryBusinessId: 'A_002' // 不同的值
      })

      // 不应该相等
      expect(entity1.equals(entity2)).toBe(false)
      expect(entity2.equals(entity1)).toBe(false)
    })

    it('应该在主次ID部分匹配但不完全相反时正确判断', () => {
      // 实体1: primary=A, secondary=B
      const entity1 = EntityId.restore<string>({
        clientId: 'uuid-1',
        primaryBusinessId: 'A_001',
        secondaryBusinessId: 'B_001'
      })

      // 实体2: primary=B_001 (匹配entity1的secondary), secondary=C_001 (不匹配entity1的primary)
      const entity2 = EntityId.restore<string>({
        clientId: 'uuid-2',
        primaryBusinessId: 'B_001', // 匹配entity1的secondary
        secondaryBusinessId: 'C_001' // 不匹配entity1的primary
      })

      // 应该相等（因为entity2的primary匹配entity1的secondary，这是交叉比较规则）
      expect(entity1.equals(entity2)).toBe(true)
      expect(entity2.equals(entity1)).toBe(true)

      // 实体3: 完全不同的ID
      const entity3 = EntityId.restore<string>({
        clientId: 'uuid-3',
        primaryBusinessId: 'X_001',
        secondaryBusinessId: 'Y_001'
      })

      // 不应该相等（没有任何ID匹配）
      expect(entity1.equals(entity3)).toBe(false)
      expect(entity3.equals(entity1)).toBe(false)

      // 测试308-309行的false分支：primaryBusinessId匹配但secondaryBusinessId不匹配
      const entity4 = EntityId.restore<string>({
        clientId: 'uuid-4',
        primaryBusinessId: 'B_001', // 匹配entity1的secondary
        secondaryBusinessId: 'A_002' // 不匹配entity1的primary (A_002 != A_001)
      })

      // 应该相等（因为entity4的primary匹配entity1的secondary）
      expect(entity1.equals(entity4)).toBe(true)
    })
  })
})
