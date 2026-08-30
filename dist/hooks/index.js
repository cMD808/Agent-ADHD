/**
 * Hook adapters for Agent-ADHD
 *
 * Provides STDIO wrapping and plugin hooks for Claude Code and OpenCode.
 */
export { ClaudeCodeHook, createClaudeCodeHook, wrapWithClaudeCode } from "./claudeCode.js";
export { OpenCodeHook, createOpenCodeHook, wrapWithOpenCode } from "./opencode.js";
import { ClaudeCodeHook } from "./claudeCode.js";
import { OpenCodeHook } from "./opencode.js";
/**
 * Detect which agentic tool is running and create appropriate hook
 */
export function detectAndCreateHook() {
    // Check environment variables first
    const activeTool = process.env.AGENT_ADHD_TOOL;
    if (activeTool === "claude-code") {
        return new ClaudeCodeHook();
    }
    if (activeTool === "opencode") {
        return new OpenCodeHook();
    }
    // Try to detect from process arguments
    const args = process.argv;
    if (args.includes("claude") || args.some(a => a.includes("claude-code"))) {
        return new ClaudeCodeHook();
    }
    if (args.includes("opencode") || args.some(a => a.includes("opencode"))) {
        return new OpenCodeHook();
    }
    return null;
}
/**
 * Create a hook by tool name
 */
export function createHook(tool, config) {
    switch (tool) {
        case "claude-code":
            return new ClaudeCodeHook(config);
        case "opencode":
            return new OpenCodeHook(config);
        default:
            return null;
    }
}
/**
 * Hook factory
 */
export const hooks = {
    "claude-code": (config) => new ClaudeCodeHook(config),
    "opencode": (config) => new OpenCodeHook(config),
};
//# sourceMappingURL=index.js.map