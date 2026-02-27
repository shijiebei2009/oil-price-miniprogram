#!/bin/bash
# 最简单的修复尝试

echo "Starting minimal fix attempt..."

# 尝试停止进程
pkill -f "pnpm dev" 2>/dev/null || true
pkill -f "node.*taro" 2>/dev/null || true

sleep 2

# 尝试清理
rm -rf node_modules server/node_modules pnpm-lock.yaml 2>/dev/null || true

# 尝试安装
pnpm install --no-frozen-lockfile 2>/dev/null || pnpm install --force 2>/dev/null || true

# 尝试启动
pnpm dev 2>/dev/null &

echo "Fix attempt completed. Check if application is running."
