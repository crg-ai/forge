/**
 * 生成 UUID v4（符合 RFC 4122 标准）
 *
 * 实现细节：
 * - 使用 Math.random() 生成随机数（非加密安全）
 * - 格式：xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * - 版本号固定为 4（第 13 位为 '4'）
 * - variant 位固定为 '8', '9', 'a', 'b' 之一（符合 RFC 4122）
 *
 * 注意事项：
 * - 生产环境建议使用 crypto.randomUUID() 或 uuid 库
 * - 此实现适用于非安全场景（如客户端临时ID）
 * - 碰撞概率：约 1/2^122（实际使用中可忽略）
 *
 * @returns UUID v4 字符串（小写，含连字符）
 *
 * @example
 * ```typescript
 * const id = generateUUID()
 * // "3f4a5b6c-1234-4abc-9def-123456789abc"
 * ```
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * 验证是否为有效的 UUID v4
 *
 * 验证规则：
 * - 格式：8-4-4-4-12 位十六进制数字
 * - 版本号必须为 4（第 13 位）
 * - variant 位必须为 8/9/a/b（第 17 位）
 * - 不区分大小写
 *
 * @param uuid - 要验证的字符串
 * @returns 如果是有效的 UUID v4 返回 true，否则返回 false
 *
 * @example
 * ```typescript
 * isValidUUID('3f4a5b6c-1234-4abc-9def-123456789abc') // true
 * isValidUUID('invalid-uuid')                         // false
 * isValidUUID('3f4a5b6c-1234-5abc-9def-123456789abc') // false（版本号不是 4）
 * ```
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}
