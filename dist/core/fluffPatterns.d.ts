/**
 * Fluff pattern definitions for Agent-ADHD v2
 *
 * Optimizations over v1:
 * - Fast-path first-char checks before any regex
 * - Precompiled combined regex for intro/exit/middle
 * - No duplicate patterns
 * - Early exit on first match
 * - Compiled pattern cache for reuse
 */
import type { CompiledPattern } from "./types.js";
/** Compiled intro patterns */
export declare const INTRO_PATTERNS: CompiledPattern[];
/** Compiled exit patterns */
export declare const EXIT_PATTERNS: CompiledPattern[];
/** Compiled full-line patterns */
export declare const FULL_LINE_FLUFF: CompiledPattern[];
/** Tool execution patterns — compiled */
export declare const TOOL_EXEC_PATTERNS: CompiledPattern[];
/** Preserve markers — compiled with fast-path first-char */
export declare const PRESERVE_MARKERS: CompiledPattern[];
/**
 * Check if a line should be preserved (never suppressed).
 * Uses fast-path first-char checks to avoid regex on most lines.
 */
export declare function shouldPreserve(line: string): boolean;
/**
 * Check if a line is pure fluff (should be suppressed).
 * Returns true if the line matches fluff patterns and is short enough.
 */
export declare function isPureFluff(line: string): boolean;
/**
 * Check if a line is tool execution noise (suppressable in normal mode).
 * Uses contains checks before regex for speed.
 */
export declare function isToolExec(line: string): boolean;
/**
 * Strip leading fluff from a line, returning the cleaned line.
 * Uses non-anchored versions of intro patterns to strip prefixes.
 * Only matches at the START of the line (index 0).
 * Early exits on first match.
 */
export declare function stripLeadingFluff(line: string): string;
/**
 * Classify a line and return its type and confidence.
 * Uses fast-path checks before regex.
 */
export declare function classifyLine(line: string, verbose?: boolean): {
    type: "fluff" | "tool_exec" | "preserve" | "raw";
    confidence: number;
};
/**
 * Get all patterns as a flat array for scanning.
 */
export declare function getAllPatterns(): CompiledPattern[];
//# sourceMappingURL=fluffPatterns.d.ts.map