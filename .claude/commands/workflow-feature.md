# Feature Development Workflow

启动完整的功能开发工作流。

## 执行步骤

请按照以下步骤完成功能开发：

### 1. 创建功能分支

- 从 main 分支创建新的 feature 分支
- 命名规范：`feature/[feature-name]`
- 例如：`feature/add-repository-pattern`

### 2. 编写测试（TDD）

- 先编写测试用例（Test-First）
- 覆盖所有核心场景和边界情况
- 确保测试失败（Red）
- 参考：`.claude/rules/testing.md`

### 3. 实现功能

- 遵循 DDD 模式实现代码
- 参考：`.claude/rules/ddd-patterns.md`
- 遵循代码风格规范：`.claude/rules/code-style.md`
- 使用 TypeScript 最佳实践：`.claude/rules/typescript.md`
- 确保测试通过（Green）

### 4. 重构优化（可选）

- 优化代码结构
- 消除重复
- 提高可读性
- 确保测试仍然通过（Refactor）

### 5. 运行完整验证

```bash
# TypeScript 类型检查
npm run typecheck

# 代码风格检查
npm run lint:all

# 运行所有测试
npm run test:run

# 生成覆盖率报告
npm run test:coverage

# 构建项目
npm run build

# 检查包大小
npm run size
```

### 6. 提交代码

```bash
# 查看变更
git status
git diff

# 暂存变更
git add .

# 规范化提交
npm run commit
# 或
git commit -m "feat: 描述你的新功能

详细说明功能的作用和实现方式

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 7. 创建 Pull Request（可选）

```bash
# 推送到远程
git push -u origin feature/[feature-name]

# 使用 gh CLI 创建 PR
gh pr create --title "feat: [功能描述]" --body "
## Summary
- 实现了 XXX 功能
- 添加了 XXX 特性

## Changes
- 新增 XXX 模块
- 修改 XXX 接口

## Test Plan
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 覆盖率达标
- [ ] 构建成功

🤖 Generated with [Claude Code](https://claude.com/claude-code)
"
```

## 注意事项

1. **测试覆盖率**：必须达到 100%
2. **代码审查**：提交前使用 `@code-reviewer` Agent 进行审查
3. **文档更新**：如需要，更新相关文档
4. **Breaking Changes**：如有破坏性变更，必须在提交信息中说明
5. **性能考虑**：确保新功能不影响包体积（< 10KB）

## 相关规范文档

- [DDD 模式](.claude/rules/ddd-patterns.md)
- [代码风格](.claude/rules/code-style.md)
- [TypeScript 规范](.claude/rules/typescript.md)
- [测试规范](.claude/rules/testing.md)
- [文件组织](.claude/rules/file-organization.md)

## 示例

如需参考，查看 `examples/` 目录中的完整示例项目。
