# 贡献指南

感谢您对 Forge DDD Framework 的关注！我们欢迎所有形式的贡献。

## 开发环境设置

### 前置要求

- Node.js >= 14.0.0 (推荐使用 `.nvmrc` 中指定的版本)
- npm >= 7.0.0

### 环境准备

```bash
# 克隆仓库
git clone https://github.com/crg-ai/forge.git
cd forge

# 使用正确的 Node 版本 (如果使用 nvm)
nvm use

# 安装依赖
npm install

# 运行测试确保环境正常
npm test
```

## 开发流程

### 1. 创建分支

```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

### 2. 开发

```bash
# 启动开发模式 (监听文件变化)
npm run dev

# 运行测试
npm test

# 运行类型检查
npm run typecheck

# 运行代码风格检查
npm run lint
```

### 3. 提交代码

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

```bash
# 使用交互式提交工具
npm run commit
```

提交类型：

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行的变动）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 4. 推送和创建 PR

```bash
git push origin feature/your-feature-name
```

然后在 GitHub 上创建 Pull Request。

## 代码规范

### TypeScript

- 使用严格模式 (`strict: true`)
- 显式声明函数返回类型
- 避免使用 `any`，必要时使用 `unknown`
- 优先使用 type imports

### 测试

- 每个新功能都需要相应的测试
- 测试覆盖率不低于 80%
- 使用描述性的测试名称

```typescript
describe('Entity', () => {
  it('should generate unique id when not provided', () => {
    // test implementation
  })
})
```

### 文档

- 为公开 API 添加 JSDoc 注释
- 更新 README.md 中的相关示例
- 必要时更新 TypeDoc 配置

## 可用脚本

```bash
# 开发
npm run dev          # 开发模式
npm run build        # 构建
npm run build:prod   # 生产构建（含压缩）

# 测试
npm test            # 运行测试
npm run test:ui     # 测试 UI 界面
npm run test:coverage # 生成覆盖率报告

# 代码质量
npm run lint        # ESLint 检查
npm run typecheck   # TypeScript 类型检查
npm run format      # 格式化代码

# 文档
npm run docs        # 生成 API 文档
npm run docs:serve  # 生成并预览文档

# 分析
npm run analyze     # 分析包体积
npm run size        # 检查包大小限制
```

## 项目结构

```
forge/
├── src/              # 源代码
│   ├── domain/       # 领域层
│   ├── application/  # 应用层
│   ├── infrastructure/ # 基础设施层
│   └── index.ts      # 入口文件
├── tests/            # 测试文件
├── docs/             # 文档
└── dist/             # 构建输出
```

## 寻求帮助

如果您有任何问题，请：

1. 查看现有的 [Issues](https://github.com/crg-ai/forge/issues)
2. 创建新的 Issue 描述您的问题
3. 在 PR 中直接提问

## License

通过贡献代码，您同意您的贡献将按照 MIT 许可证进行授权。
