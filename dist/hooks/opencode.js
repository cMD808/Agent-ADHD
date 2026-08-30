/**
 * OpenCode hook adapter for Agent-ADHD
 *
 * Provides integration with OpenCode's STDIO protocol.
 * OpenCode uses a message-based protocol over stdin/stdout similar to Claude Code.
 */
import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import { StreamParser } from "../core/streamParser.js";
/**
 * OpenCode hook adapter
 *
 * Intercepts OpenCode's output stream, parses messages,
 * and strips conversational filler while preserving code and errors.
 */
export class OpenCodeHook extends EventEmitter {
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
     * Start OpenCode with Agent-ADHD filtering
     */
    start(command, options) {
        const cmd = command?.[0] ?? "opencode";
        const args = command?.slice(1) ?? [];
        // Set environment variable to indicate Agent-ADHD is active
        const env = {
            ...process.env,
            ...options?.env,
            AGENT_ADHD_ACTIVE: "1",
            AGENT_ADHD_TOOL: "opencode",
        };
        const proc = spawn(cmd, args, {
            cwd: options?.cwd ?? process.cwd(),
            env,
            stdio: ["pipe", "pipe", "pipe"],
        });
        this.state.process = proc;
        // Handle stdout
        proc.stdout?.on("data", (chunk) => {
            this.handleStdout(chunk);
        });
        // Handle stderr
        proc.stderr?.on("data", (chunk) => {
            this.handleStderr(chunk);
        });
        proc.on("error", (err) => {
            console.error("[Agent-ADHD] OpenCode process error:", err.message);
        });
        proc.on("exit", (code, signal) => {
            this.handleExit(code ?? 0, signal ?? "SIGTERM");
        });
        return proc;
    }
    /**
     * Send a message to OpenCode's stdin
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
     * Handle stdout data from OpenCode
     */
    handleStdout(chunk) {
        const text = chunk.toString("utf8");
        if (!this.state.enabled) {
            process.stdout.write(chunk);
            return;
        }
        // Try to parse as JSON messages
        try {
            const lines = text.split("\n").filter(l => l.trim().length > 0);
            for (const line of lines) {
                try {
                    const msg = JSON.parse(line);
                    this.handleOpenCodeMessage(msg);
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
     * Handle a parsed OpenCode message
     */
    handleOpenCodeMessage(msg) {
        // For now, just pass through the message
        // Content filtering happens when the terminal displays it
        process.stdout.write(JSON.stringify(msg) + "\n");
    }
    /**
     * Handle raw text output
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
     * Stop the OpenCode process
     */
    stop() {
        if (this.state.process) {
            this.state.process.kill("SIGTERM");
            this.state.process = null;
        }
    }
}
/**
 * Create an OpenCode hook instance
 */
export function createOpenCodeHook(config) {
    return new OpenCodeHook(config);
}
/**
 * Wrap an existing command with OpenCode hook
 */
export function wrapWithOpenCode(command, options) {
    const hook = new OpenCodeHook({ enabled: true });
    return hook.start(command, options);
}
//# sourceMappingURL=opencode.js.map