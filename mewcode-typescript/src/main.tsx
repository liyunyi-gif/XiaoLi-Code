#!/usr/bin/env bun

import React from "react";
import { render } from "ink";
import { loadConfig } from "./config/config.js";
import { App } from "./tui/app.js";
import { parsePrintFlags, runPrintMode } from "./print-mode.js";

async function main() {
  const args = process.argv.slice(2);

  // -p 模式：非交互式执行，输出结果到 stdout 后退出
  const printArgs = parsePrintFlags(args);
  if (printArgs) {
    try {
      await runPrintMode(printArgs);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
    return;
  }

  let cfg;
  try {
    cfg = loadConfig();
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
    process.exit(1);
  }

  // Patch cli-cursor to write hide/show to the actual TTY, not stderr
  const { openSync, writeSync, closeSync } = await import("node:fs");
  let ttyFd: number | null = null;
  try { ttyFd = openSync("/dev/tty", "w"); } catch {}

  const writeTty = (seq: string) => {
    if (ttyFd !== null) writeSync(ttyFd, seq);
    process.stdout.write(seq);
    process.stderr.write(seq);
  };

  // Intercept cli-cursor to prevent Ink from re-showing cursor
  const cliCursor = await import("cli-cursor");
  const origShow = cliCursor.default.show;
  cliCursor.default.show = () => {};

  writeTty("\x1b[?25l");

  const restoreCursor = () => {
    cliCursor.default.show = origShow;
    writeTty("\x1b[?25h");
    if (ttyFd !== null) { try { closeSync(ttyFd); } catch {} ttyFd = null; }
  };
  process.on("exit", restoreCursor);

  const instance = render(
    <App
      providers={cfg.providers}
      mcpServers={cfg.mcp_servers}
      hooks={cfg.hooks}
    />,
    { exitOnCtrlC: false }
  );
  await instance.waitUntilExit();
  restoreCursor();
}

main();
