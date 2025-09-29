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

## 代码规范

### 格式化和检查

- **Prettier**: 自动格式化，配置见 `.prettierrc`
- **ESLint**: 代码质量检查，使用 TypeScript 规则
- **Markdownlint**: Markdown 文件规范检查
- **CommitLint**: Git 提交信息规范（conventional commits）

### 提交规范

使用 conventional commits 规范：

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建工具或辅助工具变动

### 测试要求

- 目标覆盖率: 100%
- 所有公共 API 必须有单元测试
- 复杂逻辑需要集成测试
- 使用 Vitest 作为测试框架

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
│   ├── e-commerce/        # 电商系统示例
│   ├── blog/             # 博客系统示例
│   └── todo/             # 任务管理示例
├── docs/                  # 文档目录
│   ├── architecture.md    # 架构指南
│   ├── best-practices.md  # 最佳实践
│   └── migration.md       # 迁移指南
└── site/                  # 文档网站资源
    └── public/            # 静态资源

```

## 开发工作流

### 1. 功能开发流程

1. 创建功能分支
2. 编写测试用例（TDD）
3. 实现功能代码
4. 运行测试确保通过
5. 运行 lint 和 typecheck
6. 提交代码（使用 `npm run commit`）

### 2. 代码审查要点

- 类型安全性
- 测试覆盖率
- DDD 原则遵循
- 性能考虑
- 文档完整性

### 3. 发布流程

1. 确保所有测试通过
2. 更新 CHANGELOG
3. 运行 `npm run release`
4. 推送标签到远程
5. 发布到 NPM（准备就绪后）

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

## DDD 特定指南

### 实体（Entity）

- 必须有唯一标识符
- 生命周期内身份不变
- 包含业务逻辑

### 值对象（Value Object）

- 不可变性
- 通过值判断相等性
- 可以包含验证逻辑

### 聚合根（Aggregate Root）

- 事务边界
- 保证一致性
- 对外暴露操作接口

### 仓储（Repository）

- 抽象持久化细节
- 提供查询接口
- 保持领域层纯净

### 领域事件（Domain Event）

- 记录业务发生的事实
- 用于解耦聚合
- 支持事件溯源

## 与 Claude 协作建议

### 探索代码

- 使用 Grep 搜索关键实现
- 使用 Glob 查找特定文件
- 阅读测试了解使用方式

### 编写代码

- 先看现有代码风格
- 保持一致的命名规范
- 遵循 DDD 设计原则

### 测试驱动

- 先写测试，后写实现
- 关注边界条件
- 保证测试独立性

### 重构优化

- 小步迭代
- 保持测试通过
- 及时更新文档

## 联系方式

- GitHub Issues: <https://github.com/crg-ai/forge/issues>
- 贡献指南: CONTRIBUTING.md
- 安全问题: SECURITY.md
