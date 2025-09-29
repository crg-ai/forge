import { describe, it, expect } from 'vitest'
import { VERSION } from './index'

describe('Forge Framework', () => {
  describe('Version', () => {
    it('should export correct version', () => {
      expect(VERSION).toBe('0.1.0')
    })

    it('should have version as string type', () => {
      expect(typeof VERSION).toBe('string')
    })

    it('should follow semantic versioning format', () => {
      const semverRegex = /^\d+\.\d+\.\d+$/
      expect(VERSION).toMatch(semverRegex)
    })
  })
})
