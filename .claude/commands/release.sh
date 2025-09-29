#!/bin/bash

# Forge 项目发布脚本
# 用于发布新版本到 NPM

set -e  # 遇到错误立即退出

echo "🚀 Forge 版本发布流程"
echo "================================"

# 1. 检查 Git 状态
echo "📋 检查 Git 状态..."
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ 错误: 工作目录不干净，请先提交或暂存更改"
    git status --short
    exit 1
fi

# 2. 确保在主分支
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    echo "⚠️  警告: 当前不在主分支 ($CURRENT_BRANCH)"
    read -p "是否继续? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 3. 拉取最新代码
echo "🔄 同步远程代码..."
git pull origin $CURRENT_BRANCH

# 4. 运行完整检查
echo "🔍 运行项目检查..."
npm run lint:all
npm run test:coverage

# 5. 构建生产版本
echo "🏗️  构建生产版本..."
npm run build:prod

# 6. 选择版本类型
echo ""
echo "选择发布版本类型:"
echo "  1) patch (补丁版本，如: 1.0.0 → 1.0.1)"
echo "  2) minor (次要版本，如: 1.0.0 → 1.1.0)"
echo "  3) major (主要版本，如: 1.0.0 → 2.0.0)"
echo "  4) 自定义版本"
echo "  5) 预发布版本 (alpha/beta/rc)"
read -p "请选择 (1-5): " VERSION_TYPE

case $VERSION_TYPE in
    1)
        npm run release:patch
        ;;
    2)
        npm run release:minor
        ;;
    3)
        npm run release:major
        ;;
    4)
        read -p "输入版本号 (如 1.2.3): " CUSTOM_VERSION
        npm version $CUSTOM_VERSION
        ;;
    5)
        echo "选择预发布类型:"
        echo "  1) alpha"
        echo "  2) beta"
        echo "  3) rc (release candidate)"
        read -p "请选择 (1-3): " PRERELEASE_TYPE

        case $PRERELEASE_TYPE in
            1) PREID="alpha" ;;
            2) PREID="beta" ;;
            3) PREID="rc" ;;
            *) echo "无效选择"; exit 1 ;;
        esac

        npm run release -- --prerelease $PREID
        ;;
    *)
        echo "无效选择"
        exit 1
        ;;
esac

# 7. 推送到远程
echo "📤 推送到远程仓库..."
git push --follow-tags origin $CURRENT_BRANCH

# 8. 发布到 NPM（如果配置了）
echo ""
read -p "是否发布到 NPM? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 发布到 NPM..."
    npm publish --access public
    echo "✅ 发布成功！"
else
    echo "⏭️  跳过 NPM 发布"
fi

# 9. 显示发布信息
echo ""
echo "================================"
echo "✅ 发布流程完成！"
echo ""
echo "📋 发布信息:"
echo "  版本: $(node -p "require('./package.json').version")"
echo "  分支: $CURRENT_BRANCH"
echo "  时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "📝 后续步骤:"
echo "  1. 在 GitHub 上创建 Release"
echo "  2. 更新文档网站"
echo "  3. 通知用户更新"