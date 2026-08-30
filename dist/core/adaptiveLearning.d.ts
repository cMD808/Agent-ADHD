/**
 * Adaptive learning system for Agent-ADHD pattern effectiveness tracking.
 *
 * Monitors which patterns actually match against incoming text and
 * automatically suppresses patterns that never match, reducing
 * per-line overhead for large batches.
 */
import { EventEmitter } from 'node:events';
/**
 * Statistics for a single pattern.
 */
interface PatternStats {
    name: string;
    hits: number;
    misses: number;
    linesProcessed: number;
    lastHit: number;
    suppressed: boolean;
    suppressedAt?: number;
}
/**
 * Configuration options for the adaptive learning system.
 */
interface AdaptiveLearningOptions {
    saveDir?: string;
    autoSuppressThreshold?: number;
    autoSaveIntervalMs?: number;
}
/**
 * Summary statistics returned by getSummary().
 */
interface LearningSummary {
    totalPatterns: number;
    activePatterns: number;
    suppressedPatterns: number;
    totalHits: number;
    totalMisses: number;
    hitRate: number;
}
/**
 * Adaptive learning system that tracks pattern effectiveness.
 * Automatically suppresses patterns that never match, reducing overhead.
 */
export declare class AdaptiveLearning extends EventEmitter {
    private stats;
    private readonly savePath;
    private readonly autoSuppressThreshold;
    private saveInterval;
    constructor(options?: AdaptiveLearningOptions);
    /**
     * Record a pattern check (whether it matched or not).
     * Increments hits/misses and linesProcessed counters.
     * Auto-suppresses patterns that exceed the threshold with zero hits.
     */
    recordCheck(patternName: string, matched: boolean): void;
    /**
     * Check if a pattern should be skipped (auto-suppressed).
     */
    shouldSkip(patternName: string): boolean;
    /**
     * Get effectiveness report for all tracked patterns.
     */
    getReport(): PatternStats[];
    /**
     * Get summary statistics across all patterns.
     */
    getSummary(): LearningSummary;
    /**
     * Reset all stats to defaults.
     */
    reset(): void;
    /**
     * Save stats to disk as JSON.
     */
    save(): void;
    /**
     * Load stats from disk.
     * Silently returns if file doesn't exist or is corrupted.
     */
    load(): void;
    /**
     * Start auto-saving at a regular interval.
     */
    startAutoSave(intervalMs?: number): void;
    /**
     * Stop auto-saving.
     */
    stopAutoSave(): void;
    /**
     * Destroy the instance: stop auto-save and persist final state.
     */
    destroy(): void;
}
export {};
//# sourceMappingURL=adaptiveLearning.d.ts.map