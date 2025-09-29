# 安全指南

## 🔐 NPM Token 安全配置

### ⛔ 绝对禁止的做法

```yaml
# ❌ 永远不要在工作流文件中硬编码 token
env:
  NODE_AUTH_TOKEN: "npm_xxxxxxxxxxxxx"  # 危险！会暴露 token

# ❌ 永远不要在代码中包含 token
const token = "npm_xxxxxxxxxxxxx"  // 危险！

# ❌ 永远不要在 .env 文件中提交 token
NPM_TOKEN=npm_xxxxxxxxxxxxx  # 如果提交到 Git 就会泄露
```

### ✅ 正确的做法

#### 1. 生成 NPM Token

1. 登录 <https://www.npmjs.com>
2. 点击头像 → Access Tokens
3. Generate New Token → Classic Token
4. 选择 **Automation** 类型（用于 CI/CD）
5. 复制 token（只显示一次！）

#### 2. 配置到 GitHub Secrets

1. 打开你的 GitHub 仓库
2. Settings → Secrets and variables → Actions
3. 点击 "New repository secret"
4. 填写：
   - Name: `NPM_TOKEN`
   - Value: 粘贴你的 npm token
5. 点击 "Add secret"

#### 3. 在工作流中使用

```yaml
# ✅ 正确：通过 secrets 引用
- name: Publish to npm
  run: npm publish
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }} # 从 GitHub Secrets 读取
```

## 🛡️ 安全检查清单

- [ ] Token 已存储在 GitHub Secrets 中
- [ ] 工作流文件中没有硬编码的 token
- [ ] `.env` 文件已加入 `.gitignore`
- [ ] 没有在日志中打印 token
- [ ] 使用最小权限的 token（Automation 而非 Admin）
- [ ] 定期轮换 token（建议每 3-6 个月）

## 🚨 如果 Token 泄露了

如果你不小心泄露了 token：

1. **立即撤销** - 在 npm 网站上撤销该 token
2. **生成新 token** - 创建一个新的 token
3. **更新 GitHub Secrets** - 用新 token 更新 GitHub Secrets
4. **检查日志** - 检查 npm 账户是否有异常发布
5. **清理历史** - 如果 token 被提交到 Git：
   - 使用 `git filter-branch` 或 BFG Repo-Cleaner 清理历史
   - Force push 到远程仓库
   - 通知所有协作者重新克隆仓库

## 🔍 依赖安全

### 自动化安全检查

```bash
# 检查已知漏洞
npm audit

# 自动修复漏洞
npm audit fix

# 强制修复（谨慎使用）
npm audit fix --force
```

### 依赖管理最佳实践

1. **定期更新依赖**

   ```bash
   # 查看过期包
   npm outdated

   # 更新依赖
   npm update
   ```

2. **使用 lock 文件**
   - 始终提交 `package-lock.json`
   - CI/CD 中使用 `npm ci` 而非 `npm install`

3. **最小化依赖**
   - 仅安装必要的依赖
   - 定期审查并移除未使用的包

## 🔒 代码安全

### 敏感信息处理

1. **环境变量**

   ```typescript
   // ❌ 错误
   const apiKey = 'sk-xxxxx'

   // ✅ 正确
   const apiKey = process.env.API_KEY
   ```

2. **配置文件**
   - 使用 `.env.example` 提供模板
   - 实际 `.env` 文件加入 `.gitignore`

### 输入验证

```typescript
// 实体中的输入验证示例
class Email extends ValueObject<{ value: string }> {
  validate(): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(this.props.value)) {
      throw new Error('Invalid email format')
    }
    // 防止注入攻击
    if (this.props.value.includes('<script>')) {
      throw new Error('Invalid email content')
    }
  }
}
```

## 🐛 漏洞报告

### 报告流程

1. **请勿公开披露** - 不要在公开的 Issue 中报告安全漏洞
2. **发送邮件** - 将漏洞详情发送至: <security@forge-ddd.com>
3. **包含信息**：
   - 漏洞描述
   - 复现步骤
   - 潜在影响
   - 建议的修复方案（如有）

### 响应时间

- **确认收到**: 24 小时内
- **初步评估**: 48 小时内
- **修复计划**: 7 天内
- **修复发布**: 基于严重程度，通常 30 天内

## 🎯 安全开发实践

### 开发阶段

1. **代码审查**
   - 所有 PR 必须经过审查
   - 特别关注安全相关的更改

2. **测试覆盖**
   - 为安全相关功能编写测试
   - 包含边界情况和异常输入

3. **类型安全**

   ```typescript
   // 使用 TypeScript 严格模式
   // tsconfig.json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true
     }
   }
   ```

### CI/CD 安全

1. **最小权限原则**
   - 为不同阶段使用不同的 token
   - 限制 token 的作用域

2. **安全扫描**

   ```yaml
   # GitHub Actions 示例
   - name: Run security audit
     run: npm audit --audit-level=moderate
   ```

## 📚 更多资源

- [GitHub Secrets 文档](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [npm Token 管理](https://docs.npmjs.com/creating-and-viewing-access-tokens)
- [GitHub Actions 安全最佳实践](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js 安全最佳实践](https://nodejs.org/en/docs/guides/security/)
