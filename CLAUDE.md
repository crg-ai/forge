# Claude Code 项目指南 - Forge DDD Framework

## 项目概述

Forge 是一个轻量级、类型安全的前端领域驱动设计(DDD)框架，专注于：

- 提供 DDD 核心构建块（Entity、ValueObject、AggregateRoot、Repository）
- 完全的 TypeScript 类型支持
- 零外部运行时依赖
- 体积极小（< 10KB）

## 常用命令

```bash
# 开发相关
npm run dev              # 启动开发模式，监听文件变化
npm run build            # 构建项目
npm run build:prod       # 生产环境构建（含压缩）
npm run preview          # 预览构建结果

# 测试相关
npm run test             # 运行测试（watch 模式）
npm run test:ui          # 启动 Vitest UI 界面
npm run test:run         # 运行测试（单次）
npm run test:coverage    # 生成测试覆盖率报告

# 代码质量
npm run lint             # ESLint 检查 TypeScript 代码
npm run lint:md          # 检查 Markdown 文件
npm run lint:all         # 运行所有检查（lint + markdown + typecheck）
npm run typecheck        # TypeScript 类型检查
npm run format           # Prettier 格式化代码
npm run format:all       # 格式化所有文件

# 文档相关
npm run docs             # 生成 TypeDoc 文档
npm run docs:serve       # 生成并预览文档

# 发布相关
npm run commit           # 使用 commitizen 进行规范化提交
npm run release          # 发布新版本
npm run release:patch    # 发布补丁版本
npm run release:minor    # 发布次要版本
npm run release:major    # 发布主要版本

# 分析工具
npm run analyze          # 分析打包结果
npm run size             # 检查包大小
npm run check-exports    # 检查导出正确性
```

## 开发规范

详细的开发规范文档位于 `.claude/rules/` 目录，包含完整的实现标准和代码示例：

- **[code-style.md](.claude/rules/code-style.md)** - 代码风格和命名规范（文件命名、导入导出、注释规范）
- **[ddd-patterns.md](.claude/rules/ddd-patterns.md)** - DDD 模式实现标准（Entity、ValueObject、AggregateRoot 等）
- **[file-organization.md](.claude/rules/file-organization.md)** - 文件组织方式（目录结构、测试文件位置）
- **[typescript.md](.claude/rules/typescript.md)** - TypeScript 编码规范（类型定义、泛型、访问修饰符）
- **[testing.md](.claude/rules/testing.md)** - 测试编写规范（测试结构、覆盖率、Mock 使用）

### 快速参考

**格式化和检查工具：**

- **Prettier**: 自动格式化，配置见 `.prettierrc`
- **ESLint**: 代码质量检查，使用 TypeScript 规则
- **Markdownlint**: Markdown 文件规范检查
- **CommitLint**: Git 提交信息规范（conventional commits）

**提交类型：**

- `feat`: 新功能 | `fix`: 修复 bug | `docs`: 文档更新
- `refactor`: 重构 | `test`: 测试相关 | `chore`: 构建工具变动

**测试要求：**

- 目标覆盖率: 100% | 所有公共 API 必须有单元测试 | 使用 Vitest 框架

## 项目结构

```
forge/
├── src/                    # 源代码目录
│   ├── core/              # DDD 核心构建块
│   │   ├── entity/        # 实体基类
│   │   ├── value-object/  # 值对象基类
│   │   ├── aggregate/     # 聚合根基类
│   │   ├── repository/    # 仓储接口
│   │   └── domain-event/  # 领域事件
│   ├── application/       # 应用层
│   │   └── services/      # 应用服务
│   ├── infrastructure/    # 基础设施层
│   │   └── event-bus/     # 事件总线实现
│   ├── utils/             # 工具函数
│   │   └── uuid.ts        # UUID 生成器
│   └── index.ts           # 主入口文件
├── tests/                 # 测试文件
├── examples/              # 使用示例
│   ├── e-commerce/        # 电商系统示例（⭐⭐⭐⭐⭐）
│   ├── blog/             # 博客系统示例（⭐⭐⭐⭐☆）
│   └── todo-mvc/         # 任务管理示例（⭐⭐⭐☆☆）
├── docs/                  # 文档目录
│   ├── architecture.md    # 架构指南
│   ├── best-practices.md  # 最佳实践
│   └── migration.md       # 迁移指南
├── site/                  # 文档网站资源
│   └── public/            # 静态资源
├── .claude/               # Claude Code 配置（新增）
│   ├── settings.json      # 钩子和高级配置
│   ├── agents/            # 专业 Agent 定义
│   │   ├── ddd-frontend-expert.md  # DDD 专家
│   │   ├── code-reviewer.md        # 代码审查专家
│   │   ├── test-expert.md          # 测试专家
│   │   └── doc-generator.md        # 文档生成专家
│   ├── commands/          # 工作流命令
│   │   ├── workflow-feature.md     # 功能开发流程
│   │   ├── workflow-bugfix.md      # Bug修复流程
│   │   ├── workflow-refactor.md    # 重构流程
│   │   └── check-all.sh            # 全面检查脚本
│   ├── workflows/         # 工作流配置
│   │   ├── feature-development.json
│   │   ├── bug-fix.json
│   │   └── refactoring.json
│   ├── rules/             # 开发规范
│   │   ├── ddd-patterns.md
│   │   ├── code-style.md
│   │   ├── typescript.md
│   │   ├── testing.md
│   │   └── file-organization.md
│   └── sessions/          # 会话管理
└── .forge/                # 项目配置（新增）
    ├── config.json        # 项目配置
    └── memory/            # 记忆系统
        ├── short-term/    # 短期记忆（7天）
        ├── long-term/     # 长期记忆（90天）
        └── patterns/      # 永久模式库

```

## 开发工作流

### 标准开发流程

1. **阅读规范** - 查看 `.claude/rules/` 中相关规范文档
2. **编写测试** - TDD 方式，先写测试用例（参考 [testing.md](.claude/rules/testing.md)）
3. **实现功能** - 遵循规范实现代码（参考对应的 DDD 模式文档）
4. **运行验证** - `npm run test` 和 `npm run lint:all`
5. **提交代码** - 使用 `npm run commit` 规范化提交

### 🤖 使用专业 Agent 开发

项目现已配备 4 个专业 Agent，可协助完成各种开发任务：

#### 1. @ddd-frontend-expert - DDD 专家

**用途**: DDD 架构设计、领域建模、模式实现

```bash
@ddd-frontend-expert 帮我设计一个购物车聚合
@ddd-frontend-expert 如何处理聚合间的通信
@ddd-frontend-expert 实现 Entity 基类
```

#### 2. @code-reviewer - 代码审查专家

**用途**: 代码质量审查、最佳实践检查

```bash
@code-reviewer 请审查最近的提交
@code-reviewer 审查 src/core/entity/Entity.ts
@code-reviewer 检查这次重构的代码质量
```

#### 3. @test-expert - 测试专家

**用途**: 测试设计、TDD 指导、覆盖率提升

```bash
@test-expert 帮我为 User 类编写测试
@test-expert 如何测试异步的领域事件
@test-expert 提升测试覆盖率
```

#### 4. @doc-generator - 文档生成专家

**用途**: API 文档、架构文档、使用指南

```bash
@doc-generator 为 Entity.ts 生成 TSDoc 注释
@doc-generator 更新 README.md
@doc-generator 创建迁移指南
```

### 📋 使用工作流命令

借鉴 Claude-Flow，我们提供了 3 个标准化工作流：

#### 功能开发流程

```bash
# 查看工作流指南
cat .claude/commands/workflow-feature.md

# 执行步骤：
# 1. 创建功能分支
# 2. 编写测试（TDD）
# 3. 实现功能
# 4. 重构优化
# 5. 运行验证
# 6. 代码审查 (@code-reviewer)
# 7. 提交代码
# 8. 创建 PR
```

#### Bug 修复流程

```bash
# 查看工作流指南
cat .claude/commands/workflow-bugfix.md

# 执行步骤：
# 1. 重现 Bug
# 2. 创建 bugfix 分支
# 3. 编写失败的测试
# 4. 修复实现
# 5. 验证修复
# 6. 添加防御性测试
# 7. 提交修复
```

#### 重构流程

```bash
# 查看工作流指南
cat .claude/commands/workflow-refactor.md

# 执行步骤：
# 1. 确保测试覆盖率（100%）
# 2. 创建重构分支
# 3. 识别代码异味
# 4. 选择重构手法
# 5. 小步前进，持续验证
# 6. 代码审查
# 7. 性能验证
# 8. 提交重构
```

### 代码审查要点

- 类型安全性 | 测试覆盖率 | DDD 原则遵循 | 性能考虑 | 文档完整性

### 发布流程

1. 测试通过 → 2. 更新 CHANGELOG → 3. `npm run release` → 4. 推送标签 → 5. 发布 NPM

## 技术栈

- **语言**: TypeScript 5.9+
- **构建工具**: tsup (基于 esbuild)
- **测试框架**: Vitest
- **代码检查**: ESLint 9 + TypeScript ESLint
- **格式化**: Prettier
- **文档生成**: TypeDoc
- **提交规范**: Commitizen + Conventional Commits
- **Git Hooks**: Husky + lint-staged

## 注意事项

### 重要约束

1. **零依赖原则**: 不引入任何运行时外部依赖
2. **类型安全**: 所有公共 API 必须有完整的类型定义
3. **性能优先**: 保持库体积小于 10KB（压缩后）
4. **向后兼容**: 遵循语义化版本控制

### 常见问题

1. **为什么不使用 X 库？** - 保持零依赖是核心设计原则
2. **如何处理异步操作？** - 使用 Promise 和 async/await
3. **支持的环境？** - Node.js >= 14, 现代浏览器（ES2015+）

### 开发技巧

1. 使用 `npm run dev` 进行实时开发
2. 经常运行 `npm run lint:all` 检查代码质量
3. 提交前使用 `npm run test:coverage` 确保覆盖率
4. 使用 `npm run analyze` 检查包大小

## DDD 核心概念（快速参考）

详细实现标准请查看 **[.claude/rules/ddd-patterns.md](.claude/rules/ddd-patterns.md)**

| 模式              | 关键特性               | 详细文档                                                     |
| ----------------- | ---------------------- | ------------------------------------------------------------ |
| **Entity**        | 唯一标识符、身份一致性 | [查看详情](.claude/rules/ddd-patterns.md#entity-模式)        |
| **ValueObject**   | 不可变性、值相等       | [查看详情](.claude/rules/ddd-patterns.md#valueobject-模式)   |
| **AggregateRoot** | 事务边界、领域事件     | [查看详情](.claude/rules/ddd-patterns.md#aggregateroot-模式) |
| **Repository**    | 抽象持久化、集合语义   | [查看详情](.claude/rules/ddd-patterns.md#repository-模式)    |
| **DomainEvent**   | 记录事实、解耦聚合     | [查看详情](.claude/rules/ddd-patterns.md#domainevent-模式)   |

## 专用 Agent 使用

### DDD 前端专家 Agent

我们提供了一个专门的 DDD 前端专家 Agent，可以帮助你：

- **架构设计**：设计符合 DDD 的前端架构
- **模式实现**：正确实现实体、值对象、聚合等模式
- **状态管理**：将 DDD 与前端状态管理工具结合
- **最佳实践**：提供前端 DDD 实践的具体建议

#### 使用示例

```bash
# 设计电商系统的购物车聚合
@ddd-frontend-expert 帮我设计一个购物车聚合，需要支持添加商品、修改数量、计算总价等功能

# 解决状态管理问题
@ddd-frontend-expert 如何将订单聚合与 Zustand 状态管理结合？

# 处理表单验证
@ddd-frontend-expert 如何将用户注册的领域规则与 React Hook Form 集成？

# 实现事件驱动
@ddd-frontend-expert 如何实现一个基于领域事件的实时协作系统？
```

#### Agent 特色功能

1. **理论与实践结合**：深入理解 DDD 理论，同时精通前端技术
2. **具体代码示例**：提供可直接使用的 TypeScript 代码
3. **架构方案**：给出完整的分层架构建议
4. **问题解决**：针对前端 DDD 的特殊挑战提供解决方案
5. **渐进式应用**：根据项目复杂度建议合适的 DDD 实践程度

## 故障排查指南

### 常见问题及解决方案

#### 构建失败

```bash
# 清理缓存和重新安装
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 测试失败

```bash
# 查看详细测试输出
npm run test:run -- --reporter=verbose
# 只运行失败的测试
npm run test -- --run --failed
# 检查测试覆盖率缺口
npm run test:coverage
```

#### TypeScript 类型错误

```bash
# 检查类型错误详情
npm run typecheck -- --listFilesOnly
# 生成类型声明文件检查
tsc --noEmit --declaration
```

#### Git Hooks 问题

```bash
# 重新安装 hooks
npx husky install
# 跳过 hooks (紧急情况)
git commit --no-verify -m "emergency fix"
```

### 性能优化注意事项

1. **包体积监控**
   - 运行 `npm run size` 检查包大小
   - 运行 `npm run analyze` 分析依赖
   - 目标：压缩后 < 10KB

2. **代码优化**
   - 避免循环依赖
   - 使用 Tree-shaking 友好的导出
   - 延迟加载非核心功能

3. **测试性能**
   - 单个测试文件执行时间 < 100ms
   - 总测试时间 < 5s
   - 使用 `vitest bench` 进行性能测试

### 安全最佳实践

1. **依赖管理**

   ```bash
   # 检查安全漏洞
   npm audit
   # 自动修复
   npm audit fix
   # 检查过期依赖
   npm outdated
   ```

2. **代码安全**
   - 不要硬编码敏感信息
   - 使用环境变量管理配置
   - 定期更新依赖版本

3. **提交安全**
   - 不提交 .env 文件
   - 使用 .gitignore 排除敏感文件
   - Review 代码变更避免意外泄露

## 错误处理模式

### 领域层错误

```typescript
// 使用自定义领域异常
class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message)
  }
}

// 在实体中使用
class User extends Entity {
  changeEmail(email: string) {
    if (!email.includes('@')) {
      throw new DomainException('Invalid email', 'INVALID_EMAIL')
    }
  }
}
```

### 应用层错误

```typescript
// 使用 Result 模式
type Result<T, E = Error> = { success: true; value: T } | { success: false; error: E }

// 服务中使用
class UserService {
  async createUser(data: CreateUserDto): Promise<Result<User>> {
    try {
      const user = User.create(data)
      return { success: true, value: user }
    } catch (error) {
      return { success: false, error }
    }
  }
}
```

## 测试策略

### 单元测试

- 覆盖所有公共 API
- 测试边界条件
- Mock 外部依赖

### 集成测试

- 测试模块间交互
- 验证事件流
- 测试仓储实现

### 性能测试

```bash
# 运行基准测试
npm run bench
# 生成性能报告
npm run bench -- --reporter=html
```

## 调试技巧

### VS Code 调试

1. 使用断点调试测试
2. 配置 launch.json (见 .vscode/launch.json)
3. 使用条件断点

### 日志调试

```typescript
// 使用 console.trace 追踪调用栈
console.trace('Entity created:', entity)

// 使用 console.time 测量性能
console.time('repository-save')
await repository.save(entity)
console.timeEnd('repository-save')
```

## 联系方式

- GitHub Issues: <https://github.com/crg-ai/forge/issues>
- 贡献指南: CONTRIBUTING.md
- 安全问题: SECURITY.md
