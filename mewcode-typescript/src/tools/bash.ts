import { execSync } from "node:child_process";
import type { Tool, ToolResult, ToolContext } from "./types.js";
import { intArg, strArg } from "./types.js";
import { BashDescription } from "./descriptions.js";

const MAX_TIMEOUT = 600;

// 命令退出码语义映射表：某些命令用非零退出码表示正常结果（如 grep 返回 1 表示未匹配到内容）
// 值为判定"真正出错"的最小退出码阈值
const commandErrorThresholds: Map<string, number> = new Map([
  ["grep", 2],   // exit 1 = 未匹配到内容，不算错误
  ["egrep", 2],
  ["fgrep", 2],
  ["rg", 2],     // ripgrep 同 grep 语义
  ["diff", 2],   // exit 1 = 文件有差异，不算错误
  ["test", 2],   // exit 1 = 条件为假，不算错误
  ["[", 2],      // test 的另一种写法
  ["find", 2],   // exit 1 = 部分成功，不算错误
]);

/**
 * 根据命令语义判断退出码是否表示错误。
 * 管道命令取最后一段（bash 默认返回管道最后一个命令的退出码）。
 */
function interpretExitCode(command: string, exitCode: number): boolean {
  // 按管道符拆分，取最后一段命令
  const lastSegment = command.split("|").pop()?.trim() ?? command;
  // 提取基础命令名：跳过 env 变量赋值和路径前缀
  const tokens = lastSegment.split(/\s+/);
  let baseCmd = "";
  for (const token of tokens) {
    // 跳过形如 VAR=value 的环境变量设置
    if (token.includes("=") && !token.startsWith("-")) continue;
    // 去掉路径前缀，只保留命令名
    baseCmd = token.split("/").pop() ?? token;
    break;
  }

  const threshold = commandErrorThresholds.get(baseCmd);
  if (threshold !== undefined) {
    return exitCode >= threshold;
  }
  // 默认规则：非零即错误
  return exitCode !== 0;
}

export class BashTool implements Tool {
  name = "Bash";
  description = BashDescription;
  category = "command" as const;

  schema(): Record<string, unknown> {
    return {
      name: this.name,
      description: this.description,
      input_schema: {
        type: "object",
        properties: {
          command: { type: "string", description: "Shell command to execute" },
          timeout: { type: "integer", description: "Timeout in seconds (max 600)", default: 120 },
        },
        required: ["command"],
      },
    };
  }

  async execute(args: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
    const command = strArg(args, "command");
    if (!command) {
      return { output: "Error: command is required", isError: true };
    }

    let timeout = intArg(args, "timeout", 120);
    if (timeout > MAX_TIMEOUT) timeout = MAX_TIMEOUT;

    try {
      const result = execSync(command, {
        shell: "bash",
        cwd: ctx.workDir,
        timeout: timeout * 1000,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
        maxBuffer: 10 * 1024 * 1024,
      });

      return {
        output: `$ ${command}\n${result}(exit code 0)`,
        isError: false,
      };
    } catch (err: unknown) {
      const e = err as {
        status?: number;
        stdout?: string;
        stderr?: string;
        killed?: boolean;
        message?: string;
      };

      if (e.killed) {
        return {
          output: `Error: command timed out after ${timeout}s`,
          isError: true,
        };
      }

      const exitCode = e.status ?? 1;
      let output = `$ ${command}\n`;
      if (e.stdout) output += e.stdout;
      if (e.stderr) output += `STDERR: ${e.stderr}`;
      output += `(exit code ${exitCode})`;

      return { output, isError: interpretExitCode(command, exitCode) };
    }
  }
}
