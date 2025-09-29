# GitHub Actions Workflows

本项目使用 GitHub Actions 进行持续集成和部署。

## 工作流说明

### 1. CI (`ci.yml`)

**触发条件：**

- 推送到 `main` 或 `develop` 分支
- 向 `main` 或 `develop` 分支提交 PR

**功能：**

- 运行代码检查（lint）
- 运行类型检查（typecheck）
- 运行测试
- 生成测试覆盖率报告
- 构建项目

### 2. 发布到 npm (`publish.yml`)

**触发条件：**

- 创建 GitHub Release（`published` 事件）
- 手动触发（可选择版本类型：patch/minor/major）

**功能：**

- 运行完整测试套件
- 构建生产版本
- 自动版本升级（仅手动触发时）
- 发布到 npm registry

**需要的 Secrets：**

- `NPM_TOKEN`: npm 发布令牌

### 3. 创建 Release (`release.yml`)

**触发条件：**

- 手动触发

**功能：**

- 运行测试确保代码质量
- 生成 changelog
- 创建 GitHub Release
- 支持预发布版本

## 使用流程

### 正常开发流程

1. 开发者创建功能分支
2. 提交 PR 到 `develop` 分支
3. CI 自动运行测试和检查
4. 合并到 `develop` 分支
5. 最终合并到 `main` 分支

### 发布流程

#### 方式一：通过 GitHub Release

1. 在 GitHub 上手动创建 Release
2. `publish.yml` 自动触发
3. 自动发布到 npm

#### 方式二：通过 Actions 手动触发

1. 进入 Actions 页面
2. 选择 "Publish to npm" 工作流
3. 点击 "Run workflow"
4. 选择版本类型（patch/minor/major）
5. 自动更新版本号并发布

## 配置 NPM_TOKEN

`NPM_TOKEN` 是用于发布包到 npm 的认证令牌，必须安全地存储在 GitHub Secrets 中。

### 获取 NPM Token

1. 登录 [npmjs.com](https://www.npmjs.com/)
2. 点击右上角头像 → **Access Tokens**
3. 点击 **Generate New Token** → **Classic Token**
4. 选择类型：
   - **Automation** - 推荐用于 CI/CD
   - 或 **Publish** - 仅发布权限
5. 复制生成的 token

### 配置 GitHub Secrets

1. 进入 GitHub 仓库页面
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 添加 secret：
   - **Name**: `NPM_TOKEN`
   - **Value**: 粘贴你的 npm token
5. 点击 **Add secret**

### 安全注意事项

- ⚠️ **永远不要**将 token 直接写在代码或工作流文件中
- ⚠️ **永远不要**将 token 提交到版本控制
- ✅ 只通过 GitHub Secrets 使用 token
- ✅ 定期轮换 token
- ✅ 使用最小权限原则（Automation token 而非 Admin token）

## 其他注意事项

1. 推送到 `main` 分支**不会**自动发布到 npm
2. 只有创建 Release 或手动触发才会发布
3. 使用 `[skip ci]` 在提交消息中可跳过 CI
4. 发布失败时检查 Actions 日志和 NPM_TOKEN 是否正确配置
