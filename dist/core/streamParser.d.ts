/**
 * Core stream parser for Agent-ADHD v2
 *
 * Rewritten with:
 * - EventEmitter for streaming consumers
 * - Fixed double-count bug
 * - Applied customFluffPatterns option
 * - Fast-path string checks before regex
 * - Plugin system integration
 * - Performance optimizations
 */
import { Transform } from "node:stream";
import { EventEmitter } from "node:events";
import type { LineClassification, ParseStats, ParsedChunk, StreamParserOptions } from "./types.js";
import type { PluginManager } from "./plugins.js";
/** Events emitted by StreamParser */
export interface StreamParserEvents {
    chunk: (chunk: ParsedChunk) => void;
    stats: (stats: ParseStats) => void;
    error: (error: Error) => void;
    complete: (stats: ParseStats) => void;
    suppressed: (chunk: ParsedChunk) => void;
    output: (chunk: ParsedChunk) => void;
    line: (line: string, classification: LineClassification) => void;
}
/**
 * The main stream parser class v2.
 *
 * Reads input line by line, classifies each line, and decides whether to
 * pass through, suppress, or transform it based on options.
 *
 * Fixes from v1:
 * - No double-counting of suppressed lines
 * - customFluffPatterns actually applied
 * - EventEmitter for streaming consumers
 * - Plugin system integration
 * - Fast-path string checks before regex
 */
export declare class StreamParser extends EventEmitter {
    private readonly options;
    private buffer;
    private lineNumber;
    private stats;
    private insideCodeBlock;
    private codeBlockFence;
    private totalBytes;
    private inMultilineStackTrace;
    private pluginManager;
    private allChunks;
    private compiledCustomPatterns;
    /** Index alias for pluginManager (used by setPluginManager) */
    get _pluginManager(): PluginManager | null;
    constructor(options?: StreamParserOptions);
    /**
     * Create initial empty stats
     */
    private createEmptyStats;
    /**
     * Attach a plugin manager for plugin hooks
     */
    setPluginManager(pm: PluginManager): void;
    /**
     * Process a single chunk of input and return output chunks
     */
    process(chunk: string | Buffer): ParsedChunk[];
    /**
     * Finalize processing and return all accumulated chunks plus any remaining buffered content
     */
    finalize(): ParsedChunk[];
    /**
     * Get current parsing statistics
     */
    getStats(): ParseStats;
    /**
     * Reset parser state for reuse
     */
    reset(): void;
    /**
     * Convert chunk to string
     */
    private toString;
    /**
     * Extract complete lines from the buffer
     */
    private extractLines;
    /**
     * Classify a single line with fast-path checks
     */
    private classifyLine;
    /**
     * Process a classified line and return the output chunk (or null)
     */
    private processLine;
    /**
     * Check if a line is the start of a stack trace
     */
    private isStackTraceStart;
    /**
     * Check if a line contains a critical error that must NEVER be suppressed
     */
    private isCriticalError;
    /**
     * Check if a line is a code diff line
     */
    private isCodeDiffLine;
    /**
     * Create a parsed chunk object — SINGLE increment point
     */
    private makeChunk;
    /**
     * Estimate tokens saved (rough heuristic)
     */
    private estimateTokensSaved;
    /**
     * Create a Transform stream for use in pipe chains
     */
    createTransform(): Transform;
}
/**
 * Create a new StreamParser with options
 */
export declare function createParser(options?: StreamParserOptions): StreamParser;
/**
 * Process a complete string of input and return cleaned output
 * Convenience function for one-shot processing
 */
export declare function processString(input: string, options?: StreamParserOptions): string;
//# sourceMappingURL=streamParser.d.ts.map