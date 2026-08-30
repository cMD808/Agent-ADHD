/**
 * Claude Code hook adapter for Agent-ADHD
 *
 * Provides integration with Claude Code's STDIO protocol.
 * Claude Code uses a JSON-based protocol over stdin/stdout.
 */
import { ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import type { HookConfig } from "../core/types.js";
/** Claude Code message types */
interface ClaudeCodeMessage {
    type: string;
    [key: string]: unknown;
}
/**
 * Claude Code hook adapter
 *
 * Claude Code communicates via JSON messages over STDIO.
 * This hook intercepts the output stream, parses it, and strips fluff.
 */
export declare class ClaudeCodeHook extends EventEmitter {
    private state;
    constructor(config?: Partial<HookConfig>);
    /**
     * Start Claude Code with Agent-ADHD filtering
     */
    start(command?: string[], options?: {
        cwd?: string;
        env?: NodeJS.ProcessEnv;
    }): ChildProcess;
    /**
     * Send a message to Claude Code's stdin
     */
    send(message: ClaudeCodeMessage): boolean;
    /**
     * Enable/disable filtering
     */
    setEnabled(enabled: boolean): void;
    /**
     * Check if hook is active
     */
    isActive(): boolean;
    /**
     * Get the underlying process
     */
    getProcess(): ChildProcess | null;
    /**
     * Handle stdout data from Claude Code
     */
    private handleStdout;
    /**
     * Handle a parsed Claude Code message
     */
    private handleClaudeMessage;
    /**
     * Handle raw text output (e.g., from tools)
     */
    private handleTextOutput;
    /**
     * Handle stderr data
     */
    private handleStderr;
    /**
     * Handle process exit
     */
    private handleExit;
    /**
     * Stop the Claude Code process
     */
    stop(): void;
}
/**
 * Create a Claude Code hook instance
 */
export declare function createClaudeCodeHook(config?: Partial<HookConfig>): ClaudeCodeHook;
/**
 * Wrap an existing command with Claude Code hook
 */
export declare function wrapWithClaudeCode(command: string[], options?: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
}): ChildProcess;
export {};
//# sourceMappingURL=claudeCode.d.ts.map