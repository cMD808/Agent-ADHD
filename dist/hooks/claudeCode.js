/**
 * Claude Code hook adapter for Agent-ADHD
 *
 * Provides integration with Claude Code's STDIO protocol.
 * Claude Code uses a JSON-based protocol over stdin/stdout.
 */
import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import { StreamParser } from "../core/streamParser.js";
/**
 * Claude Code hook adapter
 *
 * Claude Code communicates via JSON messages over STDIO.
 * This hook intercepts the output stream, parses it, and strips fluff.
 */
export class ClaudeCodeHook extends EventEmitter {
    state;
    constructor(config) {
        super();
        this.state = {
            process: null,
            parser: new StreamParser({
                raw: false,
                verbose: false,
                preserveColors: true,
            }),
            buffer: "",
            enabled: config?.enabled ?? true,
        };
    }
    /**
     * Start Claude Code with Agent-ADHD filtering
     */
    start(command, options) {
        const cmd = command?.[0] ?? "claude";
        const args = command?.slice(1) ?? [];
        // Set environment variable to indicate Agent-ADHD is active
        const env = {
            ...process.env,
            ...options?.env,
            AGENT_ADHD_ACTIVE: "1",
            AGENT_ADHD_TOOL: "claude-code",
        };
        const proc = spawn(cmd, args, {
            cwd: options?.cwd ?? process.cwd(),
            env,
            stdio: ["pipe", "pipe", "pipe"],
        });
        this.state.process = proc;
        // Handle stdout (Claude Code responses)
        proc.stdout?.on("data", (chunk) => {
            this.handleStdout(chunk);
        });
        // Handle stderr (typically errors)
        proc.stderr?.on("data", (chunk) => {
            this.handleStderr(chunk);
        });
        proc.on("error", (err) => {
            console.error("[Agent-ADHD] Claude Code process error:", err.message);
        });
        proc.on("exit", (code, signal) => {
            this.handleExit(code ?? 0, signal ?? "SIGTERM");
        });
        return proc;
    }
    /**
     * Send a message to Claude Code's stdin
     */
    send(message) {
        if (!this.state.process?.stdin)
            return false;
        try {
            const json = JSON.stringify(message) + "\n";
            this.state.process.stdin.write(json);
            return true;
        }
        catch {
            // Expected: stdin write failed (process may have closed)
            return false;
        }
    }
    /**
     * Enable/disable filtering
     */
    setEnabled(enabled) {
        this.state.enabled = enabled;
    }
    /**
     * Check if hook is active
     */
    isActive() {
        return this.state.enabled && this.state.process !== null;
    }
    /**
     * Get the underlying process
     */
    getProcess() {
        return this.state.process;
    }
    /**
     * Handle stdout data from Claude Code
     */
    handleStdout(chunk) {
        const text = chunk.toString("utf8");
        if (!this.state.enabled) {
            process.stdout.write(chunk);
            return;
        }
        // Try to parse as JSON (Claude Code protocol)
        try {
            const lines = text.split("\n").filter(l => l.trim().length > 0);
            for (const line of lines) {
                try {
                    const msg = JSON.parse(line);
                    this.handleClaudeMessage(msg);
                }
                catch {
                    // Expected: line is not valid JSON, treat as regular text output
                    this.handleTextOutput(line + "\n");
                }
            }
        }
        catch {
            // Expected: text was not parseable line-by-line, pass through as raw text
            this.handleTextOutput(text);
        }
    }
    /**
     * Handle a parsed Claude Code message
     */
    handleClaudeMessage(msg) {
        // For now, just pass through the message
        // The content within messages will be filtered when written to terminal
        process.stdout.write(JSON.stringify(msg) + "\n");
    }
    /**
     * Handle raw text output (e.g., from tools)
     */
    handleTextOutput(text) {
        const chunks = this.state.parser.process(text);
        const filtered = chunks
            .filter((c) => !c.suppressed)
            .map((c) => c.content)
            .join("");
        if (filtered.length > 0) {
            process.stdout.write(filtered);
        }
    }
    /**
     * Handle stderr data
     */
    handleStderr(chunk) {
        // Stderr is typically errors - always pass through
        process.stderr.write(chunk);
    }
    /**
     * Handle process exit
     */
    handleExit(code, _signal) {
        const stats = this.state.parser.getStats();
        // Print stats in debug mode
        if (process.env.AGENT_ADHD_DEBUG) {
            console.error(`[Agent-ADHD] Stats: ${JSON.stringify(stats)}`);
        }
        this.state.process = null;
        this.emit("exit", code);
    }
    /**
     * Stop the Claude Code process
     */
    stop() {
        if (this.state.process) {
            this.state.process.kill("SIGTERM");
            this.state.process = null;
        }
    }
}
/**
 * Create a Claude Code hook instance
 */
export function createClaudeCodeHook(config) {
    return new ClaudeCodeHook(config);
}
/**
 * Wrap an existing command with Claude Code hook
 */
export function wrapWithClaudeCode(command, options) {
    const hook = new ClaudeCodeHook({ enabled: true });
    return hook.start(command, options);
}
//# sourceMappingURL=claudeCode.js.map