# XiaoLiCode - AI 编程助手

一个运行在终端中的 AI 编程助手,能读写文件、执行命令、搜索代码,通过自然语言对话帮你完成软件工程任务。

## 技术栈

- **语言**: TypeScript
- **运行时**: Bun
- **终端 UI**: Ink (React for CLI)
- **大模型**: 支持 Anthropic / OpenAI / OpenAI 兼容协议

## 快速开始

### 1. 安装依赖

```bash
bun install
```

### 2. 配置

项目已包含 `.mewcode/config.local.yaml`,默认使用 **DeepSeek 官方 API**。

**需要你提供 API Key**(任选一种方式):

**方式 A — 环境变量(推荐)**:
```bash
export OPENAI_API_KEY="你的DeepSeek-API-Key"
```

**方式 B — 创建 `.env` 文件**(已加入 .gitignore,不会提交):
```
OPENAI_API_KEY=你的DeepSeek-API-Key
```

### 3. 启动

**双击 `start.bat`**(Windows),或在终端运行:

```bash
./start.sh       # Git Bash / WSL
# 或
bun run start    # 直接启动
```

启动后看到猫咪 ASCII art 和 `XiaoLiCode v0.1.0` 标题即表示成功。

## 使用示例

进入交互界面后,直接输入自然语言。常用操作:

```
# 探索代码
帮我分析 src/agent/agent.ts 的核心逻辑

# 文件操作
在当前目录创建一个 hello.py

# 代码搜索
搜索项目中所有使用 ToolRegistry 的地方

# 执行命令
列出当前目录的文件

# Plan 模式(先规划再执行)
/plan 帮我重构 src/llm 模块
```

## 斜杠命令

| 命令 | 说明 |
|------|------|
| `/help` | 查看所有命令 |
| `/status` | 查看当前状态(模型/Token/内存) |
| `/plan` | 进入 Plan 模式(只读规划) |
| `/compact` | 手动触发上下文压缩 |
| `/memory` | 查看/清空持久记忆 |
| `/resume <id>` | 恢复历史会话 |
| `/rewind` | 回溯到之前的检查点 |
| `/review` | 审查未提交的代码改动 |
| `/mcp` | 查看 MCP 服务器状态 |
| `/clear` | 清空当前对话 |
| `/quit` | 退出 |

## 权限模式

按 `Shift+Tab` 循环切换(状态栏会实时显示):

| 模式 | 说明 |
|------|------|
| `default` | 写操作需人工确认 |
| `acceptEdits` | 编辑文件自动批准 |
| `plan` | 只读,只能编辑计划文件 |
| `bypassPermissions` | 全自动(谨慎使用) |

## 项目结构

```
src/
├── agent/         ← Agent 主循环(对话→LLM→执行工具→循环)
├── tools/         ← 工具系统(读写文件/命令/搜索)
├── llm/           ← LLM 客户端(Anthropic/OpenAI/兼容协议)
├── tui/           ← 终端 UI(Ink/React)
├── permissions/   ← 权限检查(4 种安全模式)
├── compact/       ← 上下文压缩
├── conversation/  ← 对话管理
├── memory/        ← 持久记忆(自动提取并召回)
├── hooks/         ← 生命周期钩子
├── mcp/           ← MCP 协议(扩展外部工具)
├── config/        ← 配置加载
├── session/       ← 会话持久化与恢复
├── filehistory/   ← 文件快照与回溯
├── todo/          ← 任务跟踪
├── planfile/      ← Plan 模式
└── prompt/        ← 系统提示词
```

## 切换模型

编辑 `.mewcode/config.local.yaml`:

```yaml
providers:
  - name: 你的模型名
    protocol: openai-compat   # 或 anthropic / openai
    base_url: https://api.example.com/v1
    model: 模型ID
```

Key 通过环境变量传入即可。

## 常见问题

**Q: 启动报 "Raw mode is not supported"** — 在管道/重定向中运行了 TUI。请在真实终端直接运行。

**Q: 接口报错** — 检查 API Key 是否正确,网络是否连通。

**Q: 上下文太长卡住** — 用 `/compact` 手动压缩。

**Q: 想恢复误删** — 用 `/rewind` 回溯到检查点。
