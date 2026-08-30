/**
 * Plugin system for Agent-ADHD v2
 *
 * Full lifecycle management with scoring, hot-reload, and async hooks.
 * Plugins can intercept classification, modify output, and track stats.
 */
import { EventEmitter } from "node:events";
import type { AgentADHDPlugin, PluginScore, CompiledPattern, PluginStats, ParsedChunk, ParseStats, LineClassification, StreamParserOptions } from "./types.js";
/** Plugin manager configuration */
export interface PluginManagerConfig {
    /** Maximum number of plugins to load */
    maxPlugins: number;
    /** Plugin timeout in milliseconds */
    timeout: number;
    /** Directory to scan for plugins */
    pluginDir?: string;
    /** Enable hot-reload on file changes */
    hotReload?: boolean;
    /** Auto-reload interval in ms (0 = disabled) */
    autoReloadMs?: number;
    /** Stream parser options to expose via plugin context */
    streamOptions?: StreamParserOptions;
}
/** Plugin load result */
export interface PluginLoadResult {
    success: boolean;
    plugin?: AgentADHDPlugin;
    error?: string;
    path: string;
    loadTimeMs: number;
}
/**
 * Plugin Manager - manages plugin lifecycle, scoring, and hot-reload
 */
export declare class PluginManager extends EventEmitter {
    private plugins;
    private scores;
    private stats;
    private config;
    private watcher;
    private reloadTimer;
    private patterns;
    private pluginPaths;
    private startTime;
    private streamOptions;
    constructor(config?: Partial<PluginManagerConfig>);
    /**
     * Load a single plugin
     */
    loadPlugin(path: string): Promise<PluginLoadResult>;
    /**
     * Unload a plugin by name
     */
    unloadPlugin(name: string): Promise<boolean>;
    /**
     * Reload a plugin (unload + load)
     */
    reloadPlugin(name: string): Promise<PluginLoadResult>;
    /**
     * Scan and load all plugins from a directory
     */
    loadFromDir(dir: string): Promise<PluginLoadResult[]>;
    /**
     * Get all active plugins
     */
    getPlugins(): AgentADHDPlugin[];
    /**
     * Get a specific plugin by name
     */
    getPlugin(name: string): AgentADHDPlugin | undefined;
    /**
     * Get plugin scores
     */
    getScores(): PluginScore[];
    /**
     * Get plugin stats
     */
    getStats(): Map<string, PluginStats>;
    /**
     * Get compiled patterns from all plugins
     */
    getPatterns(): CompiledPattern[];
    /**
     * Run classification hook on all plugins
     */
    runClassifyHooks(line: string, lineNumber: number, classification: LineClassification): LineClassification;
    /**
     * Run suppress hook on all plugins
     */
    runSuppressHooks(chunk: ParsedChunk): ParsedChunk;
    /**
     * Run output hook on all plugins
     */
    runOutputHooks(chunk: ParsedChunk): ParsedChunk;
    /**
     * Run stats hook on all plugins
     */
    runStatsHooks(stats: ParseStats): ParseStats;
    /**
     * Update plugin score after use
     */
    updateScore(name: string, success: boolean, processingTimeNs: number): void;
    /**
     * Enable hot-reload watching
     */
    startHotReload(): void;
    /**
     * Stop hot-reload watching
     */
    stopHotReload(): void;
    /**
     * Scan directory for new/removed plugins
     */
    scanAndReload(): Promise<void>;
    /**
     * Destroy all plugins and cleanup
     */
    destroy(): Promise<void>;
    /**
     * Create a plugin context
     */
    private createContext;
    /**
     * Import a plugin with timeout
     */
    private importWithTimeout;
    /**
     * Execute a promise with timeout
     */
    private withTimeout;
    /**
     * Handle plugin error
     */
    private handleError;
}
/**
 * Create a plugin manager
 */
export declare function createPluginManager(config?: Partial<PluginManagerConfig>): PluginManager;
/**
 * Create a simple plugin from configuration
 */
export declare function createPlugin(config: {
    name: string;
    version: string;
    description?: string;
    compiledPatterns?: CompiledPattern[];
    onClassify?: AgentADHDPlugin["onClassify"];
    onSuppress?: AgentADHDPlugin["onSuppress"];
    onOutput?: AgentADHDPlugin["onOutput"];
    priority?: number;
    enabled?: boolean;
}): AgentADHDPlugin;
/**
 * Load plugin from a file path
 */
export declare function loadPluginFile(path: string): Promise<AgentADHDPlugin>;
/**
 * Get the default plugin directory
 */
export declare function getDefaultPluginDir(): string;
//# sourceMappingURL=plugins.d.ts.map