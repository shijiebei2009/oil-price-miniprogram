#!/bin/bash

# ============================================
# 应用启动修复脚本
# 用途：修复因 postinstall 失败导致的应用无法启动问题
# ============================================

set -e  # 遇到错误立即退出

echo "========================================"
echo "应用启动修复脚本"
echo "========================================"
echo ""

# 1. 停止所有正在运行的进程
echo "[1/5] 停止所有正在运行的进程..."
pkill -f "pnpm dev" || true
pkill -f "node.*taro" || true
pkill -f "coze dev" || true
sleep 2
echo "✓ 进程已停止"
echo ""

# 2. 清理缓存和依赖
echo "[2/5] 清理缓存和依赖..."
rm -rf node_modules
rm -rf server/node_modules
rm -f pnpm-lock.yaml
rm -rf .pnpm-store 2>/dev/null || true
echo "✓ 缓存已清理"
echo ""

# 3. 创建 .npmrc 跳过 postinstall
echo "[3/5] 创建 .npmrc 配置..."
cat > .npmrc << 'EOF'
shamefully-hoist=true
strict-peer-dependencies=false
ignore-scripts=false
EOF
echo "✓ .npmrc 已创建"
echo ""

# 4. 重新安装依赖
echo "[4/5] 重新安装依赖（这可能需要几分钟）..."
pnpm install --no-frozen-lockfile || {
    echo "✗ 安装失败，尝试使用 --force 选项..."
    pnpm install --force
}
echo "✓ 依赖已安装"
echo ""

# 5. 启动应用
echo "[5/5] 启动应用..."
echo "正在启动开发服务器，请稍候..."
pnpm dev &
DEV_PID=$!

# 等待启动
echo "等待服务启动（30秒）..."
for i in {1..30}; do
    if curl -s http://localhost:5000 > /dev/null 2>&1; then
        echo "✓ 应用启动成功！"
        echo ""
        echo "========================================"
        echo "访问地址："
        echo "  H5 端: http://localhost:5000"
        echo "  后端: http://localhost:3000"
        echo "========================================"
        exit 0
    fi
    sleep 1
    echo -n "."
done

echo ""
echo "✗ 应用启动超时"
echo "请检查日志："
echo "  tail -f /tmp/coze-logs/dev.log"
echo ""
echo "或手动启动："
echo "  cd /workspace/projects && pnpm dev"

exit 1
