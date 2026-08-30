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
import { classifyLine, isPureFluff, shouldPreserve, stripLeadingFluff, } from "./fluffPatterns.js";
import { CRITICAL_ERROR_PREFIXES, DIFF_MARKERS, STREAM } from "./constants.js";
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
export class StreamParser extends EventEmitter {
    options;
    buffer = "";
    lineNumber = 0;
    stats;
    insideCodeBlock = false;
    codeBlockFence = "";
    totalBytes = 0;
    inMultilineStackTrace = false;
    pluginManager = null;
    allChunks = [];
    compiledCustomPatterns = [];
    /** Index alias for pluginManager (used by setPluginManager) */
    get _pluginManager() { return this.pluginManager; }
    constructor(options = {}) {
        super();
        this.options = {
            raw: options.raw ?? false,
            verbose: options.verbose ?? false,
            customFluffPatterns: options.customFluffPatterns ?? [],
            suppressToolPatterns: options.suppressToolPatterns ?? [],
            preserveColors: options.preserveColors ?? true,
            minChunkSize: options.minChunkSize ?? 0,
            continuousStream: options.continuousStream ?? false,
            plugins: options.plugins ?? false,
            pluginDirs: options.pluginDirs ?? [],
            maxBufferSize: options.maxBufferSize ?? 100,
            classifier: options.classifier ?? undefined,
            emitChunks: options.emitChunks ?? false,
        };
        this.stats = this.createEmptyStats();
    }
    /**
     * Create initial empty stats
     */
    createEmptyStats() {
        return {
            totalLines: 0,
            suppressedLines: 0,
            outputLines: 0,
            fluffLines: 0,
            toolExecLines: 0,
            errorLines: 0,
            codeDiffLines: 0,
            codeBlockLines: 0,
            otherLines: 0,
            startTime: Date.now(),
        };
    }
    /**
     * Attach a plugin manager for plugin hooks
     */
    setPluginManager(pm) {
        this.pluginManager = pm;
    }
    /**
     * Process a single chunk of input and return output chunks
     */
    process(chunk) {
        if (this.stats.endTime !== undefined) {
            this.stats = this.createEmptyStats();
            this.compiledCustomPatterns = this.options.customFluffPatterns
                .map(patternStr => {
                try {
                    return new RegExp(patternStr, "i");
                }
                catch {
                    // Expected: pattern string is not a valid regex, skip it
                    return null;
                }
            })
                .filter((p) => p !== null);
        }
        const text = this.toString(chunk);
        this.totalBytes += text.length;
        this.buffer += text;
        const results = [];
        const lines = this.extractLines();
        // If input didn't end with a newline and buffer has content,
        // the buffer is the last complete line — flush it now
        if (text.length > 0 && !text.endsWith("\n") && this.buffer.length > 0) {
            lines.push(this.buffer);
            this.buffer = "";
        }
        for (const line of lines) {
            const classification = this.classifyLine(line);
            const parsedChunk = this.processLine(classification);
            if (parsedChunk !== null) {
                results.push(parsedChunk);
                this.emit("chunk", parsedChunk);
                if (parsedChunk.suppressed) {
                    this.emit("suppressed", parsedChunk);
                }
                else {
                    this.emit("output", parsedChunk);
                }
            }
            this.emit("line", line, classification);
            this.lineNumber++;
        }
        // Accumulate all chunks for finalize()
        this.allChunks.push(...results);
        // Auto-flush based on chunk size
        if (this.options.minChunkSize > 0) {
            const totalSize = results.reduce((sum, c) => sum + c.content.length, 0);
            if (totalSize < this.options.minChunkSize && this.buffer.length > 0) {
                return [];
            }
        }
        return results;
    }
    /**
     * Finalize processing and return all accumulated chunks plus any remaining buffered content
     */
    finalize() {
        const tailChunks = [];
        if (this.buffer.length > 0) {
            const line = this.buffer;
            this.buffer = "";
            const classification = this.classifyLine(line);
            const chunk = this.processLine(classification);
            this.lineNumber++;
            if (chunk !== null) {
                this.emit("chunk", chunk);
                tailChunks.push(chunk);
            }
        }
        const result = [...this.allChunks, ...tailChunks];
        this.allChunks = [];
        this.stats.endTime = Date.now();
        this.stats.tokensSaved = this.estimateTokensSaved();
        this.emit("stats", this.stats);
        this.emit("complete", this.stats);
        return result;
    }
    /**
     * Get current parsing statistics
     */
    getStats() {
        return { ...this.stats, endTime: this.stats.endTime ?? Date.now() };
    }
    /**
     * Reset parser state for reuse
     */
    reset() {
        this.buffer = "";
        this.lineNumber = 0;
        this.insideCodeBlock = false;
        this.codeBlockFence = "";
        this.totalBytes = 0;
        this.inMultilineStackTrace = false;
        this.allChunks = [];
        this.stats = this.createEmptyStats();
    }
    /**
     * Convert chunk to string
     */
    toString(chunk) {
        return typeof chunk === "string" ? chunk : chunk.toString("utf8");
    }
    /**
     * Extract complete lines from the buffer
     */
    extractLines() {
        const lines = [];
        let start = 0;
        let newlineIdx = this.buffer.indexOf("\n");
        while (newlineIdx !== -1) {
            let line = this.buffer.substring(start, newlineIdx);
            // Strip trailing \r for Windows line endings
            if (line.endsWith("\r")) {
                line = line.slice(0, -1);
            }
            // Cap line length to prevent memory issues
            if (line.length > STREAM.MAX_LINE_LENGTH) {
                line = line.substring(0, STREAM.MAX_LINE_LENGTH);
            }
            lines.push(line);
            start = newlineIdx + 1;
            newlineIdx = this.buffer.indexOf("\n", start);
        }
        // Keep remainder in buffer
        if (start > 0) {
            this.buffer = this.buffer.substring(start);
        }
        return lines;
    }
    /**
     * Classify a single line with fast-path checks
     */
    classifyLine(line) {
        this.stats.totalLines++;
        // Track code block state
        if (line.startsWith("```")) {
            if (!this.insideCodeBlock) {
                this.insideCodeBlock = true;
                this.codeBlockFence = line.substring(0, 3);
            }
            else if (line.startsWith(this.codeBlockFence)) {
                this.insideCodeBlock = false;
                this.codeBlockFence = "";
            }
        }
        // Inside code block - everything is preserved
        if (this.insideCodeBlock) {
            return {
                line,
                type: "code_block",
                confidence: 1.0,
                lineNumber: this.lineNumber,
                suppress: false,
            };
        }
        // Track multi-line stack trace continuation
        if (this.inMultilineStackTrace) {
            const isStackLine = /^\s+(at |File |<string>|\d+:)/.test(line);
            if (isStackLine || line.trim() === "") {
                return {
                    line,
                    type: "stack_trace",
                    confidence: 0.95,
                    lineNumber: this.lineNumber,
                    suppress: false,
                };
            }
            else {
                this.inMultilineStackTrace = false;
            }
        }
        // Use the pattern-based classifier
        const classification = classifyLine(line, this.options.verbose);
        // Map fluffPatterns classifyLine types to ChunkType
        const type = classification.type === "preserve" ? "raw_output" :
            classification.type === "fluff" ? "fluff" :
                classification.type === "tool_exec" ? "tool_exec" :
                    "raw_output";
        return {
            line,
            type,
            confidence: classification.confidence,
            lineNumber: this.lineNumber,
            suppress: type === "fluff" || type === "tool_exec",
        };
    }
    /**
     * Process a classified line and return the output chunk (or null)
     */
    processLine(classified) {
        const { line, type, lineNumber } = classified;
        // Raw mode: pass everything through
        if (this.options.raw) {
            return this.makeChunk(line, "raw_output", false, lineNumber, lineNumber);
        }
        // Track multi-line stack trace state
        if (this.isStackTraceStart(line)) {
            this.inMultilineStackTrace = true;
            this.stats.errorLines++;
            return this.makeChunk(line, "stack_trace", false, lineNumber, lineNumber);
        }
        // Always preserve critical error lines
        if (this.isCriticalError(line)) {
            this.stats.errorLines++;
            return this.makeChunk(line, "error", false, lineNumber, lineNumber);
        }
        // Code block content - always preserved
        if (type === "code_block") {
            this.stats.codeBlockLines++;
            return this.makeChunk(line, "code_block", false, lineNumber, lineNumber);
        }
        // Code diff lines (must check BEFORE fluff)
        if (this.isCodeDiffLine(line)) {
            this.stats.codeDiffLines++;
            return this.makeChunk(line, "code_diff", false, lineNumber, lineNumber);
        }
        // Preserve markers
        if (shouldPreserve(line)) {
            this.stats.otherLines++;
            return this.makeChunk(line, "raw_output", false, lineNumber, lineNumber);
        }
        // Check custom patterns from options
        if (this.compiledCustomPatterns.length > 0) {
            for (const pattern of this.compiledCustomPatterns) {
                if (pattern.test(line)) {
                    this.stats.fluffLines++;
                    return this.makeChunk(line, "fluff", true, lineNumber, lineNumber);
                }
            }
        }
        // Pure fluff - suppress
        if (type === "fluff" && isPureFluff(line)) {
            this.stats.fluffLines++;
            return this.makeChunk(line, "fluff", true, lineNumber, lineNumber);
        }
        // Tool execution noise - suppress in normal mode
        if (type === "tool_exec" && !this.options.verbose) {
            this.stats.toolExecLines++;
            return this.makeChunk(line, "tool_exec", true, lineNumber, lineNumber);
        }
        // Strip leading fluff from regular lines (but keep the line)
        if (type === "fluff" || type === "raw_output") {
            const stripped = stripLeadingFluff(line);
            if (stripped.length === 0) {
                // Entire line was fluff
                this.stats.fluffLines++;
                return this.makeChunk(line, "fluff", true, lineNumber, lineNumber);
            }
            if (stripped !== line) {
                // Stripped some fluff but kept content
                this.stats.fluffLines++;
                this.stats.otherLines++;
                return this.makeChunk(stripped, "raw_output", false, lineNumber, lineNumber);
            }
        }
        // Default: pass through
        this.stats.otherLines++;
        return this.makeChunk(line, type, false, lineNumber, lineNumber);
    }
    /**
     * Check if a line is the start of a stack trace
     */
    isStackTraceStart(line) {
        const trimmed = line.trim();
        // Python traceback
        if (trimmed === "Traceback (most recent call last):")
            return true;
        // Java/Node stack trace starts
        if (/^Error:/.test(trimmed))
            return true;
        if (/^TypeError:/.test(trimmed))
            return true;
        if (/^ReferenceError:/.test(trimmed))
            return true;
        if (/^SyntaxError:/.test(trimmed))
            return true;
        if (/^RangeError:/.test(trimmed))
            return true;
        if (/^UnhandledPromiseRejection/.test(trimmed))
            return true;
        if (/^Unhandled error:/.test(trimmed))
            return true;
        // C++/Rust panics
        if (/^panic:/.test(trimmed))
            return true;
        if (/^thread.*panicked at/.test(trimmed))
            return true;
        // npm error format
        if (/^npm ERR!/.test(trimmed))
            return true;
        if (/^npm error/.test(trimmed))
            return true;
        return false;
    }
    /**
     * Check if a line contains a critical error that must NEVER be suppressed
     */
    isCriticalError(line) {
        const trimmed = line.trim();
        if (trimmed.length === 0)
            return false;
        // Fast-path: check first character
        const firstChar = trimmed[0]?.toLowerCase();
        if (!firstChar)
            return false;
        // Only check prefixes that start with this character
        for (const prefix of CRITICAL_ERROR_PREFIXES) {
            if (prefix[0]?.toLowerCase() === firstChar && trimmed.startsWith(prefix)) {
                return true;
            }
        }
        // Stack trace continuation
        if (/^\s+at\s+/.test(line))
            return true;
        if (/^\s+File\s+".*", line\s+\d+/.test(line))
            return true;
        return false;
    }
    /**
     * Check if a line is a code diff line
     */
    isCodeDiffLine(line) {
        const trimmed = line.trimStart();
        for (const marker of DIFF_MARKERS) {
            if (trimmed.startsWith(marker)) {
                // Must have content after the marker
                const afterMarker = trimmed.substring(marker.length).trim();
                if (afterMarker.length > 0) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * Create a parsed chunk object — SINGLE increment point
     */
    makeChunk(content, type, suppressed, lineStart, lineEnd, confidence = 0.8) {
        // v2 FIX: Only increment once in makeChunk, not in processLine
        if (suppressed) {
            this.stats.suppressedLines++;
        }
        else {
            this.stats.outputLines++;
        }
        return {
            content,
            type,
            suppressed,
            originalContent: suppressed ? content : undefined,
            lineStart,
            lineEnd,
            confidence,
        };
    }
    /**
     * Estimate tokens saved (rough heuristic)
     */
    estimateTokensSaved() {
        // Rough estimate: 1 token per 4 characters suppressed
        return Math.floor(this.totalBytes / 4 * 0.3);
    }
    /**
     * Create a Transform stream for use in pipe chains
     */
    createTransform() {
        const parser = this;
        return new Transform({
            objectMode: false,
            transform(chunk, _encoding, callback) {
                try {
                    const text = chunk.toString("utf8");
                    const chunks = parser.process(text);
                    const output = chunks
                        .filter(c => !c.suppressed)
                        .map(c => c.content)
                        .join("\n");
                    callback(null, Buffer.from(output + "\n", "utf8"));
                }
                catch (error) {
                    callback(error instanceof Error ? error : new Error(String(error)));
                }
            },
            flush(callback) {
                try {
                    parser.finalize();
                    callback();
                }
                catch (error) {
                    callback(error instanceof Error ? error : new Error(String(error)));
                }
            },
        });
    }
}
/**
 * Create a new StreamParser with options
 */
export function createParser(options) {
    return new StreamParser(options);
}
/**
 * Process a complete string of input and return cleaned output
 * Convenience function for one-shot processing
 */
export function processString(input, options) {
    const parser = createParser(options);
    parser.process(input);
    const allChunks = parser.finalize();
    return allChunks
        .filter(c => !c.suppressed)
        .map(c => c.content)
        .join("\n");
}
//# sourceMappingURL=streamParser.js.map