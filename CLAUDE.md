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
