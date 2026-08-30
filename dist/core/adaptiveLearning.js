/**
 * Adaptive learning system for Agent-ADHD pattern effectiveness tracking.
 *
 * Monitors which patterns actually match against incoming text and
 * automatically suppresses patterns that never match, reducing
 * per-line overhead for large batches.
 */
import { EventEmitter } from 'node:events';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
/**
 * Adaptive learning system that tracks pattern effectiveness.
 * Automatically suppresses patterns that never match, reducing overhead.
 */
export class AdaptiveLearning extends EventEmitter {
    stats = new Map();
    savePath;
    autoSuppressThreshold;
    saveInterval = null;
    constructor(options) {
        super();
        const saveDir = options?.saveDir ?? join(homedir(), '.agent-adhd');
        this.savePath = join(saveDir, 'learning.json');
        this.autoSuppressThreshold = options?.autoSuppressThreshold ?? 10000;
    }
    /**
     * Record a pattern check (whether it matched or not).
     * Increments hits/misses and linesProcessed counters.
     * Auto-suppresses patterns that exceed the threshold with zero hits.
     */
    recordCheck(patternName, matched) {
        let entry = this.stats.get(patternName);
        if (!entry) {
            entry = {
                name: patternName,
                hits: 0,
                misses: 0,
                linesProcessed: 0,
                lastHit: 0,
                suppressed: false,
            };
            this.stats.set(patternName, entry);
        }
        entry.linesProcessed++;
        if (matched) {
            entry.hits++;
            entry.lastHit = Date.now();
            // Unsuppress if it starts matching again
            if (entry.suppressed) {
                entry.suppressed = false;
                entry.suppressedAt = undefined;
                this.emit('unsuppress', patternName);
            }
        }
        else {
            entry.misses++;
        }
        // Auto-suppress if threshold exceeded and zero hits
        if (!entry.suppressed &&
            entry.linesProcessed >= this.autoSuppressThreshold &&
            entry.hits === 0) {
            entry.suppressed = true;
            entry.suppressedAt = Date.now();
            this.emit('suppress', patternName);
        }
    }
    /**
     * Check if a pattern should be skipped (auto-suppressed).
     */
    shouldSkip(patternName) {
        const entry = this.stats.get(patternName);
        return entry?.suppressed ?? false;
    }
    /**
     * Get effectiveness report for all tracked patterns.
     */
    getReport() {
        return Array.from(this.stats.values());
    }
    /**
     * Get summary statistics across all patterns.
     */
    getSummary() {
        const patterns = Array.from(this.stats.values());
        const totalHits = patterns.reduce((sum, p) => sum + p.hits, 0);
        const totalMisses = patterns.reduce((sum, p) => sum + p.misses, 0);
        const suppressed = patterns.filter(p => p.suppressed).length;
        return {
            totalPatterns: patterns.length,
            activePatterns: patterns.length - suppressed,
            suppressedPatterns: suppressed,
            totalHits,
            totalMisses,
            hitRate: totalHits + totalMisses > 0
                ? totalHits / (totalHits + totalMisses)
                : 0,
        };
    }
    /**
     * Reset all stats to defaults.
     */
    reset() {
        this.stats.clear();
    }
    /**
     * Save stats to disk as JSON.
     */
    save() {
        const data = {
            version: 1,
            savedAt: Date.now(),
            stats: Object.fromEntries(this.stats),
        };
        const dir = dirname(this.savePath);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        writeFileSync(this.savePath, JSON.stringify(data, null, 2), 'utf-8');
        this.emit('save');
    }
    /**
     * Load stats from disk.
     * Silently returns if file doesn't exist or is corrupted.
     */
    load() {
        if (!existsSync(this.savePath)) {
            return;
        }
        try {
            const raw = readFileSync(this.savePath, 'utf-8');
            const data = JSON.parse(raw);
            if (data.stats) {
                this.stats.clear();
                for (const [key, value] of Object.entries(data.stats)) {
                    this.stats.set(key, value);
                }
            }
        }
        catch {
            // Corrupted file — start fresh
        }
    }
    /**
     * Start auto-saving at a regular interval.
     */
    startAutoSave(intervalMs) {
        this.stopAutoSave();
        const interval = intervalMs ?? 60000; // default: 1 minute
        this.saveInterval = setInterval(() => {
            this.save();
        }, interval);
    }
    /**
     * Stop auto-saving.
     */
    stopAutoSave() {
        if (this.saveInterval !== null) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }
    }
    /**
     * Destroy the instance: stop auto-save and persist final state.
     */
    destroy() {
        this.stopAutoSave();
        this.save();
    }
}
//# sourceMappingURL=adaptiveLearning.js.map