# Bug Fix Workflow

系统化的 Bug 修复工作流程。

## 执行步骤

### 1. 重现 Bug

- 理解 Bug 的现象和影响范围
- 创建最小化的复现用例
- 记录当前行为和期望行为
- 分析根本原因

### 2. 创建 Bug 分支

```bash
# 从 main 分支创建 bugfix 分支
git checkout main
git pull origin main
git checkout -b bugfix/[issue-number]-[brief-description]

# 例如：
git checkout -b bugfix/123-entity-equals-null-check
```

### 3. 编写失败的测试

- 先写一个能重现 Bug 的测试用例
- 运行测试，确保它失败
- 测试应该清晰地展示 Bug 的行为

```typescript
// 示例：针对 Entity equals 方法的 Bug
describe('Entity.equals', () => {
  it('should handle null comparison without throwing', () => {
    const user = User.create({ name: 'Alice' })

    // Bug: 当传入 null 时会抛出错误
    expect(() => user.equals(null)).not.toThrow()
    expect(user.equals(null)).toBe(false)
  })
})
```

### 4. 修复实现

- 定位到问题代码
- 实施最小化的修复
- 避免引入新的问题
- 遵循现有代码风格

```typescript
// 修复示例
class Entity<T> {
  equals(other: Entity<T> | null | undefined): boolean {
    // 添加 null 检查
    if (other === null || other === undefined) {
      return false
    }

    if (!(other instanceof Entity)) {
      return false
    }

    return this.id.equals(other.id)
  }
}
```

### 5. 验证修复

```bash
# 运行失败的测试，确保现在通过
npm run test -- --run [test-file]

# 运行所有测试，确保没有破坏其他功能
npm run test:run

# 检查测试覆盖率
npm run test:coverage

# TypeScript 类型检查
npm run typecheck

# 代码检查
npm run lint:all
```

### 6. 回归测试

- 测试相关功能是否正常
- 检查边界情况
- 确保修复没有引入新的 Bug

### 7. 添加防御性测试

- 为相关场景添加更多测试
- 覆盖类似的边界情况
- 防止将来再次出现

```typescript
describe('Entity.equals - edge cases', () => {
  it('should handle null', () => {
    expect(entity.equals(null)).toBe(false)
  })

  it('should handle undefined', () => {
    expect(entity.equals(undefined)).toBe(false)
  })

  it('should handle non-Entity objects', () => {
    expect(entity.equals({} as any)).toBe(false)
  })
})
```

### 8. 更新文档（如需要）

- 如果是文档错误，更新文档
- 如果是 API 行为变更，更新 CHANGELOG
- 添加代码注释说明特殊处理

### 9. 提交修复

```bash
# 查看变更
git status
git diff

# 暂存变更
git add .

# 提交修复（使用规范格式）
git commit -m "fix: handle null in Entity.equals method

修复了 Entity.equals 方法在传入 null 时抛出错误的问题。
现在会正确返回 false。

Fixes #123

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 10. 创建 Pull Request

```bash
# 推送到远程
git push -u origin bugfix/[issue-number]-[brief-description]

# 创建 PR
gh pr create --title "fix: handle null in Entity.equals" --body "
## Bug Description
Entity.equals 方法在接收 null 参数时会抛出 TypeError。

## Root Cause
方法内部没有对 null/undefined 进行检查就直接访问了属性。

## Solution
- 添加了 null/undefined 检查
- 在类型检查前先进行空值判断
- 添加了完整的边界情况测试

## Test Plan
- [x] 添加了失败的测试用例
- [x] 修复后测试通过
- [x] 所有现有测试仍然通过
- [x] 添加了额外的边界测试
- [x] 覆盖率保持 100%

## Related Issue
Fixes #123

🤖 Generated with [Claude Code](https://claude.com/claude-code)
"
```

## Bug 修复检查清单

- [ ] ✅ 理解并能重现 Bug
- [ ] ✅ 创建了 bugfix 分支
- [ ] ✅ 编写了失败的测试
- [ ] ✅ 实施了最小化修复
- [ ] ✅ 测试现在通过
- [ ] ✅ 所有测试仍然通过
- [ ] ✅ 添加了防御性测试
- [ ] ✅ 类型检查通过
- [ ] ✅ 代码检查通过
- [ ] ✅ 覆盖率达标
- [ ] ✅ 更新了文档（如需要）
- [ ] ✅ 提交信息规范
- [ ] ✅ 创建了 PR（如需要）

## 注意事项

1. **最小化修改**：只修改必要的代码，避免顺手重构
2. **测试优先**：先写失败的测试，再修复
3. **回归测试**：确保修复没有破坏其他功能
4. **根本原因**：理解为什么会出现 Bug，而不只是症状
5. **文档更新**：如果是文档错误或行为变更，必须更新文档

## 相关工具

- `@code-reviewer` - 审查修复的代码
- `@test-expert` - 优化测试用例
- `npm run test -- --watch` - 监控测试

## 参考

- [测试规范](.claude/rules/testing.md)
- [代码风格](.claude/rules/code-style.md)
