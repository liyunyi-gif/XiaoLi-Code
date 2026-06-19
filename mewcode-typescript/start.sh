#!/usr/bin/env bash
# ============================================================
#  XiaoLiCode 启动脚本 (Git Bash / Linux / macOS)
#  使用方法: ./start.sh  或  bash start.sh
# ============================================================
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# ── 1. 检测 bun ──────────────────────────────────────────────
if ! command -v bun &>/dev/null; then
  # Windows 上 npm 全局安装的 bun 可能在此路径
  if [ -f "$APPDATA/npm/bun.exe" ] 2>/dev/null; then
    export PATH="$APPDATA/npm:$PATH"
  elif [ -f "$HOME/AppData/Roaming/npm/bun.exe" ] 2>/dev/null; then
    export PATH="$HOME/AppData/Roaming/npm:$PATH"
  fi
  # 再次确认
  if ! command -v bun &>/dev/null; then
    echo "[❌] 未找到 bun。请先安装: npm install -g bun"
    exit 1
  fi
fi

# ── 2. 加载 API Key ──────────────────────────────────────────
# 优先级: 环境变量 > .env 文件 > 用户输入
if [ -z "${OPENAI_API_KEY:-}" ]; then
  if [ -f ".env" ]; then
    # shellcheck disable=SC1091
    source .env 2>/dev/null || true
    # 如果 source 失败,尝试 grep 提取
    if [ -z "${OPENAI_API_KEY:-}" ]; then
      OPENAI_API_KEY=$(grep -m1 "^OPENAI_API_KEY=" .env 2>/dev/null | cut -d= -f2- || true)
    fi
  fi
fi

if [ -z "${OPENAI_API_KEY:-}" ]; then
  echo ""
  echo "  ╔══════════════════════════════════════════╗"
  echo "  ║   首次运行需要配置 DeepSeek API Key     ║"
  echo "  ║   获取地址: https://platform.deepseek.com║"
  echo "  ╚══════════════════════════════════════════╝"
  echo ""
  read -r -p "  请输入你的 API Key: " API_KEY
  export OPENAI_API_KEY="${API_KEY}"
  # 保存到 .env (git 已忽略)
  echo "OPENAI_API_KEY=${API_KEY}" > .env
  echo ""
  echo "  ✅ Key 已保存到 .env 文件,下次无需再输入"
  echo ""
fi

# ── 3. 启动 ──────────────────────────────────────────────────
echo ""
echo "  🚀 XiaoLiCode 启动中..."
echo ""
exec bun run start
