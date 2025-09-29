import { describe, it, expect } from 'vitest'
import { generateUUID, isValidUUID } from './uuid'

describe('UUID Utils', () => {
  describe('generateUUID', () => {
    it('should generate a valid UUID v4', () => {
      const uuid = generateUUID()
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID()
      const uuid2 = generateUUID()
      const uuid3 = generateUUID()

      expect(uuid1).not.toBe(uuid2)
      expect(uuid2).not.toBe(uuid3)
      expect(uuid1).not.toBe(uuid3)
    })

    it('should have correct format with hyphens', () => {
      const uuid = generateUUID()
      const parts = uuid.split('-')

      expect(parts).toHaveLength(5)
      expect(parts[0]).toHaveLength(8)
      expect(parts[1]).toHaveLength(4)
      expect(parts[2]).toHaveLength(4)
      expect(parts[3]).toHaveLength(4)
      expect(parts[4]).toHaveLength(12)
    })
  })

  describe('isValidUUID', () => {
    it('should return true for valid UUID', () => {
      const validUUIDs = [
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'F47AC10B-58CC-4372-A567-0E02B2C3D479',
        '6ba7b810-9dad-41d1-80b4-00c04fd430c8'
      ]

      validUUIDs.forEach(uuid => {
        expect(isValidUUID(uuid)).toBe(true)
      })
    })

    it('should return false for invalid UUID', () => {
      const invalidUUIDs = [
        '123456',
        'not-a-uuid',
        'f47ac10b-58cc-3372-a567-0e02b2c3d479', // wrong version (3 instead of 4)
        'f47ac10b58cc4372a5670e02b2c3d479', // missing hyphens
        'f47ac10b-58cc-4372-a567-0e02b2c3d47', // too short
        'f47ac10b-58cc-4372-a567-0e02b2c3d479-extra', // too long
        ''
      ]

      invalidUUIDs.forEach(uuid => {
        expect(isValidUUID(uuid)).toBe(false)
      })
    })
  })
})
