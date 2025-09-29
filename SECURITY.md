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

## 📚 更多资源

- [GitHub Secrets 文档](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [npm Token 管理](https://docs.npmjs.com/creating-and-viewing-access-tokens)
- [GitHub Actions 安全最佳实践](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
