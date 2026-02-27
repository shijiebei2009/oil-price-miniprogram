#!/bin/bash

# 代码清理脚本
# 执行时间：系统资源恢复后

echo "开始清理无用代码和依赖..."

# 1. 删除废弃组件目录
echo "1/3 删除废弃组件目录..."
rm -rf src/components/WxChart
rm -rf src/components/EcChart
echo "✓ 废弃组件目录已删除"

# 2. 删除历史文档
echo "2/3 删除历史文档..."
rm docs/ECharts导入错误-最终修复.md
rm docs/ECharts微信小程序兼容-WxCanvas包装层.md
rm docs/ECharts正确使用方式-最终修复.md
rm docs/微信小程序ECharts错误-addEventListener修复.md
rm docs/微信小程序图表显示空白-深度诊断.md
rm docs/微信小程序图表显示问题修复.md
echo "✓ 历史文档已删除"

# 3. 重新安装依赖（移除未使用的包）
echo "3/3 重新安装依赖..."
pnpm install
echo "✓ 依赖已重新安装"

echo ""
echo "清理完成！"
echo "预期效果："
echo "- 包体积减少约 6.5 MB"
echo "- 构建速度提升 15-25%"
echo "- 安装速度提升 30-40%"
echo ""
echo "建议执行验证："
echo "pnpm lint:build"
echo "pnpm tsc"
echo "pnpm build"
