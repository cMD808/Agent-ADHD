/**
 * Stream sanitizer - public API for Agent-ADHD
 *
 * Provides a higher-level API that wraps the parser with formatting,
 * ANSI preservation, and chunk aggregation.
 */
/** Local global copy for .replace() — replaces ALL ANSI sequences in one call */
const ANSI_GLOBAL = /\x1b\[[0-9;]*m/g;
import { StreamParser } from "./streamParser.js";
/**
 * Sanitize a stream of agent output.
 * Returns cleaned, high-signal output suitable for terminal display.
 */
export class StreamSanitizer {
    parser;
    options;
    chunks = [];
    constructor(options = {}) {
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
        this.parser = new StreamParser(this.options);
    }
    /**
     * Process input and return cleaned output as a string.
     * Does NOT auto-finalize — call finalize() when the stream is complete
     * to flush any remaining buffered content.
     */
    sanitize(input) {
        const chunks = this.parser.process(input);
        this.chunks.push(...chunks);
        return this.formatOutput(chunks);
    }
    /**
     * Finalize and return any remaining output
     */
    finalize() {
        const chunks = this.parser.finalize();
        this.chunks.push(...chunks);
        return this.formatOutput(chunks);
    }
    /**
     * Get the parser's accumulated statistics
     */
    getStats() {
        return this.parser.getStats();
    }
    /**
     * Reset internal state
     */
    reset() {
        this.parser.reset();
        this.chunks.length = 0;
    }
    /**
     * Format chunks into final output string
     */
    formatOutput(chunks) {
        const visible = chunks.filter(c => !c.suppressed);
        const formatted = visible.map(chunk => {
            let content = chunk.content;
            // Strip ANSI if not preserving colors and content is not critical
            if (!this.options.preserveColors) {
                content = content.replace(ANSI_GLOBAL, "");
            }
            return content;
        });
        return formatted.join("\n");
    }
}
/**
 * Convenience function: process a complete input string
 * Auto-finalizes since this is a one-shot API
 */
export function sanitize(input, options) {
    const sanitizer = new StreamSanitizer(options);
    sanitizer.sanitize(input);
    return sanitizer.finalize();
}
/**
 * Convenience function: process input as line array
 */
export function sanitizeLines(lines, options) {
    const sanitizer = new StreamSanitizer(options);
    const input = lines.join("\n");
    const result = sanitizer.sanitize(input);
    return result.split("\n");
}
/**
 * Quick check: is the input mostly fluff?
 * Returns true if > 80% of lines are pure fluff
 */
export function isMostlyFluff(input) {
    const lines = input.split("\n").filter(l => l.trim().length > 0);
    if (lines.length === 0)
        return false;
    const parser = new StreamParser();
    for (const line of lines) {
        parser.process(line + "\n");
    }
    const stats = parser.getStats();
    return stats.totalLines > 0 && (stats.suppressedLines / stats.totalLines) > 0.8;
}
//# sourceMappingURL=sanitizer.js.map