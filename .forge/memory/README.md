# Forge Memory System

借鉴 Claude-Flow 的内存系统，实现项目知识的持久化和积累。

## 目录结构

```
memory/
├── short-term/          # 短期记忆（7天）
│   ├── recent-tasks.json
│   ├── recent-errors.json
│   └── current-context.json
├── long-term/           # 长期记忆（90天）
│   ├── project-history.json
│   ├── team-preferences.json
│   └── performance-metrics.json
└── patterns/            # 永久模式库
    ├── common-solutions.md
    ├── best-practices.md
    ├── anti-patterns.md
    └── architectural-decisions.md
```

## 记忆类型

### 1. 短期记忆（Short-Term）

**保留期**: 7天
**用途**: 当前开发上下文

- 最近的任务和决策
- 临时的错误解决方案
- 当前会话的上下文

### 2. 长期记忆（Long-Term）

**保留期**: 90天
**用途**: 项目历史和趋势

- 项目演进历史
- 团队偏好设置
- 性能指标趋势
- 重构历史

### 3. 模式库（Patterns）

**保留期**: 永久
**用途**: 知识沉淀

- 常见问题的解决方案
- 验证过的最佳实践
- 已知的反模式
- 架构决策记录

## 使用方式

### 自动记录

钩子系统会自动记录以下内容：

```json
{
  "post-task-complete": {
    "action": "save-to-memory",
    "targets": ["short-term", "patterns"]
  }
}
```

### 手动查询

```bash
# 查询类似问题的解决方案
@memory-query "如何处理 Entity 的深度克隆"

# 记录新的模式
@memory-save pattern "使用 Builder 模式创建复杂聚合"
```

### 模式示例

#### common-solutions.md

```markdown
# 常见问题解决方案

## Entity 深度克隆问题

**问题**: Entity 包含嵌套的 ValueObject，浅拷贝会导致引用共享

**解决方案**:

- 使用 `structuredClone()` (Node 17+)
- 或实现自定义的 `clone()` 方法
- 在 toJSON/fromJSON 中正确处理嵌套对象

**代码**:
\`\`\`typescript
class User extends Entity<UserProps> {
clone(): User {
return User.reconstitute({
...this.props,
email: this.props.email.clone(),
address: this.props.address.clone()
}, this.id);
}
}
\`\`\`

**相关文件**:

- src/core/entity/Entity.ts
- src/utils/deepClone.ts
```

## 内存清理

```bash
# 清理过期的短期记忆
npm run memory:clean:short-term

# 归档长期记忆
npm run memory:archive:long-term

# 导出模式库
npm run memory:export:patterns
```

## 配置

在 `.claude/settings.json` 中配置：

```json
{
  "memory": {
    "enabled": true,
    "path": ".forge/memory",
    "retention": {
      "shortTerm": "7d",
      "longTerm": "90d",
      "patterns": "permanent"
    }
  }
}
```

## 最佳实践

1. **及时记录**: 解决问题后立即记录到模式库
2. **定期回顾**: 每周回顾短期记忆，提炼到长期记忆
3. **模式提炼**: 发现重复问题时，提炼为通用模式
4. **知识共享**: 定期将模式库同步到团队文档
5. **版本控制**: 重要的模式库文件纳入 Git 管理

## 与 Agent 集成

Agent 可以自动访问记忆系统：

```typescript
// Agent 查询记忆
const solutions = await memory.query('Entity validation patterns')

// Agent 保存新发现
await memory.save({
  category: 'patterns',
  type: 'best-practice',
  content: '使用 Result 模式处理验证错误'
})
```

## 分析和报告

```bash
# 生成记忆统计报告
npm run memory:report

# 分析常见问题
npm run memory:analyze:common-issues

# 导出知识图谱
npm run memory:export:knowledge-graph
```
