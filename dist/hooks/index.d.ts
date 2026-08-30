/**
 * Hook adapters for Agent-ADHD
 *
 * Provides STDIO wrapping and plugin hooks for Claude Code and OpenCode.
 */
export { ClaudeCodeHook, createClaudeCodeHook, wrapWithClaudeCode } from "./claudeCode.js";
export { OpenCodeHook, createOpenCodeHook, wrapWithOpenCode } from "./opencode.js";
export type { HookConfig } from "../core/types.js";
import { ClaudeCodeHook } from "./claudeCode.js";
import { OpenCodeHook } from "./opencode.js";
import type { HookConfig } from "../core/types.js";
/**
 * Detect which agentic tool is running and create appropriate hook
 */
export declare function detectAndCreateHook(): ClaudeCodeHook | OpenCodeHook | null;
/**
 * Create a hook by tool name
 */
export declare function createHook(tool: "claude-code" | "opencode" | "custom", config?: Partial<HookConfig>): ClaudeCodeHook | OpenCodeHook | null;
/**
 * Available hook types
 */
export type HookType = "claude-code" | "opencode";
/**
 * Hook factory
 */
export declare const hooks: Record<HookType, (config?: Partial<HookConfig>) => ClaudeCodeHook | OpenCodeHook>;
//# sourceMappingURL=index.d.ts.map