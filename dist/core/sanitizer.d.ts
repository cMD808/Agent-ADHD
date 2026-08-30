/**
 * Stream sanitizer - public API for Agent-ADHD
 *
 * Provides a higher-level API that wraps the parser with formatting,
 * ANSI preservation, and chunk aggregation.
 */
import type { ParseStats, StreamParserOptions } from "./types.js";
/**
 * Sanitize a stream of agent output.
 * Returns cleaned, high-signal output suitable for terminal display.
 */
export declare class StreamSanitizer {
    private readonly parser;
    private readonly options;
    private readonly chunks;
    constructor(options?: StreamParserOptions);
    /**
     * Process input and return cleaned output as a string.
     * Does NOT auto-finalize — call finalize() when the stream is complete
     * to flush any remaining buffered content.
     */
    sanitize(input: string | Buffer): string;
    /**
     * Finalize and return any remaining output
     */
    finalize(): string;
    /**
     * Get the parser's accumulated statistics
     */
    getStats(): ParseStats;
    /**
     * Reset internal state
     */
    reset(): void;
    /**
     * Format chunks into final output string
     */
    private formatOutput;
}
/**
 * Convenience function: process a complete input string
 * Auto-finalizes since this is a one-shot API
 */
export declare function sanitize(input: string, options?: StreamParserOptions): string;
/**
 * Convenience function: process input as line array
 */
export declare function sanitizeLines(lines: string[], options?: StreamParserOptions): string[];
/**
 * Quick check: is the input mostly fluff?
 * Returns true if > 80% of lines are pure fluff
 */
export declare function isMostlyFluff(input: string): boolean;
//# sourceMappingURL=sanitizer.d.ts.map