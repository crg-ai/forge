#!/bin/bash

# Forge 项目全面检查脚本
# 用于在提交或发布前进行完整的质量检查

set -e  # 遇到错误立即退出

echo "🔍 Forge 项目全面检查开始..."
echo "================================"

# 1. 清理之前的构建
echo "🧹 清理构建产物..."
npm run clean

# 2. 安装依赖（确保最新）
echo "📦 检查依赖..."
npm install

# 3. TypeScript 类型检查
echo "📝 TypeScript 类型检查..."
npm run typecheck

# 4. ESLint 代码检查
echo "🔍 ESLint 代码检查..."
npm run lint

# 5. Markdown 文件检查
echo "📄 Markdown 文件检查..."
npm run lint:md

# 6. 运行测试
echo "🧪 运行测试..."
npm run test:run

# 7. 测试覆盖率
echo "📊 生成测试覆盖率报告..."
npm run test:coverage

# 8. 构建项目
echo "🏗️  构建项目..."
npm run build

# 9. 检查包大小
echo "📏 检查包大小..."
npm run size

# 10. 检查导出
echo "📤 检查导出正确性..."
npm run check-exports

echo "================================"
echo "✅ 所有检查通过！项目状态良好。"

# 显示覆盖率摘要
echo ""
echo "📊 测试覆盖率摘要："
if [ -f "coverage/coverage-summary.json" ]; then
    node -e "
    const coverage = require('./coverage/coverage-summary.json');
    const total = coverage.total;
    console.log('  Lines:     ' + total.lines.pct + '%');
    console.log('  Statements:' + total.statements.pct + '%');
    console.log('  Functions: ' + total.functions.pct + '%');
    console.log('  Branches:  ' + total.branches.pct + '%');
    "
fi