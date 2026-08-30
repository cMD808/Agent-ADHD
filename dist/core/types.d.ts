/**
 * Core type definitions for Agent-ADHD v2
 *
 * Full plugin API, event system, and streaming consumer support.
 */
/** A chunk of parsed output from an agent */
export interface ParsedChunk {
    /** The processed text content */
    content: string;
    /** Chunk type classification */
    type: ChunkType;
    /** Whether this chunk was suppressed (filtered out) */
    suppressed: boolean;
    /** Original raw content (only when suppressed) */
    originalContent?: string;
    /** Line number where chunk started (0-indexed) */
    lineStart: number;
    /** Line number where chunk ended (0-indexed) */
    lineEnd: number;
    /** Plugin that made the suppression decision (if any) */
    suppressor?: string;
    /** Confidence of the classification 0-1 */
    confidence: number;
    /** Timestamp of processing (performance tracking) */
    processedAt?: number;
}
/** Classification of output chunk types */
export type ChunkType = "fluff" | "tool_exec" | "error" | "code_diff" | "code_block" | "bullet_point" | "status_update" | "raw_output" | "json_response" | "stack_trace" | "progress" | "empty" | "command_output";
/** Options for the stream parser */
export interface StreamParserOptions {
    /** Enable raw mode — no filtering */
    raw?: boolean;
    /** Enable verbose mode — minimal filtering */
    verbose?: boolean;
    /** Custom fluff patterns (regex strings) */
    customFluffPatterns?: string[];
    /** Custom tool patterns to suppress */
    suppressToolPatterns?: string[];
    /** Preserve colors/ANSI sequences */
    preserveColors?: boolean;
    /** Minimum chunk size before outputting (bytes) */
    minChunkSize?: number;
    /** Treat stdin as continuous stream */
    continuousStream?: boolean;
    /** Enable plugin system */
    plugins?: boolean;
    /** Plugin directories to scan */
    pluginDirs?: string[];
    /** Max lines to buffer before emitting */
    maxBufferSize?: number;
    /** Custom classification function override */
    classifier?: LineClassifier;
    /** Emit mode for event-driven consumers */
    emitChunks?: boolean;
}
/** A single line of input being classified */
export interface LineClassification {
    /** The raw line text */
    line: string;
    /** Detected type */
    type: ChunkType;
    /** Confidence score 0-1 */
    confidence: number;
    /** Matched pattern index if applicable */
    patternIndex?: number;
    /** Line number in original stream */
    lineNumber: number;
    /** Whether this line should be suppressed */
    suppress: boolean;
    /** Plugin that classified this line (if any) */
    classifiedBy?: string;
}
/** Classification function signature for custom classifiers */
export type LineClassifier = (line: string, lineNumber: number, options: StreamParserOptions) => LineClassification;
/** Statistics collected during parsing */
export interface ParseStats {
    totalLines: number;
    suppressedLines: number;
    outputLines: number;
    fluffLines: number;
    toolExecLines: number;
    errorLines: number;
    codeDiffLines: number;
    codeBlockLines: number;
    otherLines: number;
    startTime: number;
    endTime?: number;
    tokensSaved?: number;
    bytesProcessed?: number;
    peakBufferSize?: number;
    /** Per-plugin stats */
    pluginStats?: Record<string, PluginStats>;
}
/** Per-plugin statistics */
export interface PluginStats {
    linesProcessed: number;
    linesSuppressed: number;
    avgProcessingTimeNs: number;
    totalProcessingTimeNs: number;
}
/** Output mode for the CLI */
export type OutputMode = "normal" | "raw" | "verbose" | "json";
/** Stream event emitted during processing */
export interface StreamEvent {
    type: "chunk" | "stats" | "error" | "complete" | "mode_change" | "plugin_loaded" | "plugin_error";
    data: ParsedChunk | ParseStats | string | OutputMode;
}
/** Plugin lifecycle hooks */
export interface PluginLifecycle {
    /** Called when plugin is loaded */
    onInit?: (context: PluginContext) => void | Promise<void>;
    /** Called before a line is classified — can override classification */
    onClassify?: (line: string, lineNumber: number, classification: LineClassification) => LineClassification | null;
    /** Called when a line is about to be suppressed — can veto */
    onSuppress?: (chunk: ParsedChunk) => boolean | null;
    /** Called when output is emitted */
    onOutput?: (chunk: ParsedChunk) => void;
    /** Called when stats are collected */
    onStats?: (stats: ParseStats) => void;
    /** Called when plugin is unloaded */
    onUnload?: () => void;
}
/** Plugin scoring metadata */
export interface PluginScore {
    /** Plugin name */
    name: string;
    /** Lines processed by this plugin */
    linesProcessed: number;
    /** Lines suppressed by this plugin */
    linesSuppressed: number;
    /** Average processing time per line in nanoseconds */
    avgProcessingTimeNs: number;
    /** Total processing time in nanoseconds */
    totalProcessingTimeNs: number;
    /** Success rate (percentage of lines correctly classified) */
    successRate: number;
    /** Last time the plugin was used */
    lastUsed: number;
}
/** Plugin configuration */
export interface PluginConfig {
    /** Plugin name */
    name: string;
    /** Whether plugin is enabled */
    enabled: boolean;
    /** Plugin priority (lower = runs first) */
    priority?: number;
    /** Plugin-specific options */
    options?: Record<string, unknown>;
    /** Hot-reload: watch file changes and reload plugin */
    hotReload?: boolean;
    /** File path to the plugin module */
    path?: string;
}
/** Full plugin definition */
export interface AgentADHDPlugin extends PluginLifecycle {
    /** Unique plugin name */
    name: string;
    /** Plugin version */
    version: string;
    /** Human-readable description */
    description?: string;
    /** Plugin author */
    author?: string;
    /** Plugin dependencies */
    dependencies?: string[];
    /** Plugin configuration */
    config?: PluginConfig;
    /** Compiled regex patterns for fast matching */
    compiledPatterns?: CompiledPattern[];
}
/** A compiled regex with fast-path checks */
export interface CompiledPattern {
    /** The regex */
    regex: RegExp;
    /** Fast-path: first character to check before regex */
    firstChar?: string;
    /** Fast-path: contains check (substring) */
    contains?: string;
    /** The type this pattern matches */
    type: ChunkType;
    /** Whether to suppress on match */
    suppress: boolean;
    /** Pattern name for debugging */
    name?: string;
}
/** Context passed to plugin lifecycle hooks */
export interface PluginContext {
    /** Access to parser stats */
    stats: ParseStats;
    /** Emit a custom event */
    emit: (event: string, data: unknown) => void;
    /** Register a new pattern */
    addPattern: (pattern: CompiledPattern) => void;
    /** Remove a pattern */
    removePattern: (name: string) => void;
    /** Access current options */
    options: StreamParserOptions;
}
/** Hook configuration for integrating with agentic tools */
export interface HookConfig {
    /** Tool name: 'claude-code' | 'opencode' | 'custom' */
    tool: string;
    /** Whether hook is active */
    enabled: boolean;
    /** Command to wrap */
    command?: string;
    /** Arguments passed to wrapped command */
    args?: string[];
    /** Environment variables to set */
    env?: Record<string, string>;
    /** Working directory */
    cwd?: string;
    /** Custom options for the hook */
    hookOptions?: Record<string, unknown>;
}
/** Configuration file schema (~/.agent-adhdrc) */
export interface AgentADHDConfig {
    version: 1 | 2;
    defaults: {
        raw?: boolean;
        verbose?: boolean;
        preserveColors?: boolean;
        plugins?: boolean;
    };
    patterns: {
        fluff?: string[];
        suppressTool?: string[];
        preserve?: string[];
    };
    plugins: PluginConfig[];
    hooks: {
        claudeCode?: HookConfig;
        opencode?: HookConfig;
    };
    performance: {
        maxBufferSize?: number;
        enableMetrics?: boolean;
    };
}
/** Events emitted by PluginManager */
export interface PluginManagerEvents {
    "plugin:loaded": [name: string, path: string];
    "plugin:unloaded": [name: string];
    "plugin:error": [source: string, hookOrMsg: string, msg?: string];
    "plugin:scored": [name: string, score: PluginScore];
    "plugin:hot-reload": [name: string];
    "plugin:timeout": [context: string];
}
/** OpenTelemetry-style metrics */
export interface Metrics {
    /** Parser throughput (lines/sec) */
    throughput: number;
    /** Suppression ratio (0-1) */
    suppressionRatio: number;
    /** Average classification latency in ns */
    classificationLatencyNs: number;
    /** Memory usage in bytes */
    memoryUsageBytes: number;
    /** Uptime in ms */
    uptimeMs: number;
    /** Total chunks processed */
    totalChunks: number;
    /** Total chunks suppressed */
    totalSuppressed: number;
    /** Total bytes processed */
    totalBytes: number;
}
//# sourceMappingURL=types.d.ts.map