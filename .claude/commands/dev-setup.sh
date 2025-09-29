#!/bin/bash

# Forge 开发环境设置脚本
# 用于快速搭建开发环境

set -e  # 遇到错误立即退出

echo "🛠️  Forge 开发环境设置"
echo "================================"

# 1. 检查 Node.js 版本
echo "📋 检查环境要求..."
NODE_VERSION=$(node -v)
REQUIRED_NODE_VERSION="14.0.0"

echo "  Node.js 版本: $NODE_VERSION"

# 简单的版本比较
NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1 | cut -dv -f2)
if [ "$NODE_MAJOR" -lt "14" ]; then
    echo "❌ 错误: Node.js 版本必须 >= 14.0.0"
    exit 1
fi

# 2. 检查 npm 版本
NPM_VERSION=$(npm -v)
echo "  npm 版本: $NPM_VERSION"

# 3. 清理旧的安装
if [ -d "node_modules" ]; then
    echo "🧹 清理旧的 node_modules..."
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    echo "🔒 发现 package-lock.json"
fi

# 4. 安装依赖
echo ""
echo "📦 安装项目依赖..."
npm install

# 5. 设置 Git Hooks
echo "🔗 设置 Git Hooks..."
npm run prepare

# 6. 初始构建
echo "🏗️  执行初始构建..."
npm run build

# 7. 运行初始测试
echo "🧪 运行测试验证环境..."
npm run test:run

# 8. 生成初始文档
echo "📚 生成 API 文档..."
npm run docs

# 9. 创建本地配置文件（如果需要）
if [ ! -f ".env.local" ]; then
    echo "📝 创建本地配置文件模板..."
    cat > .env.local.example << EOF
# 本地开发环境配置
# 复制此文件为 .env.local 并根据需要修改

# 开发服务器端口
PORT=3000

# 日志级别 (debug, info, warn, error)
LOG_LEVEL=debug

# 其他本地配置...
EOF
    echo "  已创建 .env.local.example"
fi

# 10. 显示可用命令
echo ""
echo "================================"
echo "✅ 开发环境设置完成！"
echo ""
echo "📋 项目信息:"
echo "  名称: $(node -p "require('./package.json').name")"
echo "  版本: $(node -p "require('./package.json').version")"
echo "  描述: $(node -p "require('./package.json').description")"
echo ""
echo "🚀 快速开始:"
echo "  npm run dev       - 启动开发模式"
echo "  npm run test      - 运行测试（watch 模式）"
echo "  npm run test:ui   - 打开测试 UI 界面"
echo "  npm run lint:all  - 检查代码质量"
echo ""
echo "📚 文档:"
echo "  查看 CLAUDE.md 了解项目指南"
echo "  查看 CONTRIBUTING.md 了解贡献指南"
echo "  运行 'npm run docs:serve' 查看 API 文档"
echo ""
echo "💡 提示:"
echo "  - 使用 'npm run commit' 进行规范化提交"
echo "  - 提交前会自动运行 lint-staged 检查"
echo "  - 保持测试覆盖率 100%"

# 11. 可选：立即启动开发模式
echo ""
read -p "是否立即启动开发模式? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 启动开发模式..."
    npm run dev
fi