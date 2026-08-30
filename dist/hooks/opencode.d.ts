/**
 * OpenCode hook adapter for Agent-ADHD
 *
 * Provides integration with OpenCode's STDIO protocol.
 * OpenCode uses a message-based protocol over stdin/stdout similar to Claude Code.
 */
import { ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import type { HookConfig } from "../core/types.js";
/** OpenCode message types */
interface OpenCodeMessage {
    type: string;
    content?: string;
    [key: string]: unknown;
}
/**
 * OpenCode hook adapter
 *
 * Intercepts OpenCode's output stream, parses messages,
 * and strips conversational filler while preserving code and errors.
 */
export declare class OpenCodeHook extends EventEmitter {
    private state;
    constructor(config?: Partial<HookConfig>);
    /**
     * Start OpenCode with Agent-ADHD filtering
     */
    start(command?: string[], options?: {
        cwd?: string;
        env?: NodeJS.ProcessEnv;
    }): ChildProcess;
    /**
     * Send a message to OpenCode's stdin
     */
    send(message: OpenCodeMessage): boolean;
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
     * Handle stdout data from OpenCode
     */
    private handleStdout;
    /**
     * Handle a parsed OpenCode message
     */
    private handleOpenCodeMessage;
    /**
     * Handle raw text output
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
     * Stop the OpenCode process
     */
    stop(): void;
}
/**
 * Create an OpenCode hook instance
 */
export declare function createOpenCodeHook(config?: Partial<HookConfig>): OpenCodeHook;
/**
 * Wrap an existing command with OpenCode hook
 */
export declare function wrapWithOpenCode(command: string[], options?: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
}): ChildProcess;
export {};
//# sourceMappingURL=opencode.d.ts.map