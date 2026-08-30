/**
 * Plugin system for Agent-ADHD v2
 *
 * Full lifecycle management with scoring, hot-reload, and async hooks.
 * Plugins can intercept classification, modify output, and track stats.
 */
import { watch } from "node:fs";
import { readdir } from "node:fs/promises";
import { join, extname } from "node:path";
import { EventEmitter } from "node:events";
import { PLUGIN_DEFAULTS, PLUGIN_EXTENSIONS } from "./constants.js";
/**
 * Plugin Manager - manages plugin lifecycle, scoring, and hot-reload
 */
export class PluginManager extends EventEmitter {
    plugins = new Map();
    scores = new Map();
    stats = new Map();
    config;
    watcher = null;
    reloadTimer = null;
    patterns = [];
    pluginPaths = new Map();
    startTime = Date.now();
    streamOptions;
    constructor(config) {
        super();
        this.config = {
            maxPlugins: config?.maxPlugins ?? PLUGIN_DEFAULTS.maxPlugins,
            timeout: config?.timeout ?? PLUGIN_DEFAULTS.timeout,
            pluginDir: config?.pluginDir,
            hotReload: config?.hotReload ?? false,
            autoReloadMs: config?.autoReloadMs ?? 0,
        };
        this.streamOptions = config?.streamOptions ?? {};
    }
    /**
     * Load a single plugin
     */
    async loadPlugin(path) {
        const start = Date.now();
        // Check plugin count
        if (this.plugins.size >= this.config.maxPlugins) {
            return {
                success: false,
                error: `Maximum plugins (${this.config.maxPlugins}) reached`,
                path,
                loadTimeMs: Date.now() - start,
            };
        }
        try {
            // Dynamic import with timeout
            const plugin = await this.importWithTimeout(path);
            // Validate plugin
            if (!plugin || !plugin.name || !plugin.version) {
                return {
                    success: false,
                    error: "Invalid plugin: missing name or version",
                    path,
                    loadTimeMs: Date.now() - start,
                };
            }
            // Check if already loaded
            if (this.plugins.has(plugin.name)) {
                return {
                    success: false,
                    error: `Plugin '${plugin.name}' already loaded`,
                    path,
                    loadTimeMs: Date.now() - start,
                };
            }
            // Initialize plugin
            if (plugin.onInit) {
                const context = this.createContext();
                await this.withTimeout(Promise.resolve(plugin.onInit(context)), `onInit for ${plugin.name}`);
            }
            // Register
            this.plugins.set(plugin.name, plugin);
            this.pluginPaths.set(plugin.name, path);
            this.scores.set(plugin.name, {
                name: plugin.name,
                linesProcessed: 0,
                linesSuppressed: 0,
                avgProcessingTimeNs: 0,
                totalProcessingTimeNs: 0,
                successRate: 50,
                lastUsed: 0,
            });
            this.stats.set(plugin.name, {
                linesProcessed: 0,
                linesSuppressed: 0,
                avgProcessingTimeNs: 0,
                totalProcessingTimeNs: 0,
            });
            // Compile plugin patterns
            if (plugin.compiledPatterns && plugin.compiledPatterns.length > 0) {
                for (const pattern of plugin.compiledPatterns) {
                    this.patterns.push({
                        ...pattern,
                        name: `${plugin.name}:${pattern.name ?? "unknown"}`,
                    });
                }
            }
            this.emit("plugin:loaded", plugin.name, path);
            return {
                success: true,
                plugin,
                path,
                loadTimeMs: Date.now() - start,
            };
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.emit("plugin:error", path, msg);
            return {
                success: false,
                error: msg,
                path,
                loadTimeMs: Date.now() - start,
            };
        }
    }
    /**
     * Unload a plugin by name
     */
    async unloadPlugin(name) {
        const plugin = this.plugins.get(name);
        if (!plugin)
            return false;
        try {
            if (plugin.onUnload) {
                await this.withTimeout(Promise.resolve(plugin.onUnload()), `onUnload for ${name}`);
            }
        }
        catch {
            // Expected: onUnload failed, continue cleanup anyway
        }
        this.plugins.delete(name);
        this.scores.delete(name);
        this.stats.delete(name);
        this.pluginPaths.delete(name);
        // Remove plugin patterns
        this.patterns = this.patterns.filter(p => !p.name?.startsWith(`${name}:`));
        this.emit("plugin:unloaded", name);
        return true;
    }
    /**
     * Reload a plugin (unload + load)
     */
    async reloadPlugin(name) {
        const path = this.pluginPaths.get(name);
        if (!path) {
            return {
                success: false,
                error: `Plugin '${name}' not found`,
                path: "",
                loadTimeMs: 0,
            };
        }
        await this.unloadPlugin(name);
        this.emit("plugin:hot-reload", name);
        return this.loadPlugin(path);
    }
    /**
     * Scan and load all plugins from a directory
     */
    async loadFromDir(dir) {
        const results = [];
        try {
            const entries = await readdir(dir, { withFileTypes: true });
            const pluginFiles = entries.filter((entry) => entry.isFile() && PLUGIN_EXTENSIONS.some(ext => entry.name.endsWith(ext)));
            for (const entry of pluginFiles) {
                const path = join(dir, entry.name);
                const result = await this.loadPlugin(path);
                results.push(result);
                if (results.length >= this.config.maxPlugins)
                    break;
            }
        }
        catch {
            // Expected: directory doesn't exist or can't be read, return empty results
        }
        return results;
    }
    /**
     * Get all active plugins
     */
    getPlugins() {
        return Array.from(this.plugins.values());
    }
    /**
     * Get a specific plugin by name
     */
    getPlugin(name) {
        return this.plugins.get(name);
    }
    /**
     * Get plugin scores
     */
    getScores() {
        return Array.from(this.scores.values());
    }
    /**
     * Get plugin stats
     */
    getStats() {
        return new Map(this.stats);
    }
    /**
     * Get compiled patterns from all plugins
     */
    getPatterns() {
        return [...this.patterns];
    }
    /**
     * Run classification hook on all plugins
     */
    runClassifyHooks(line, lineNumber, classification) {
        let result = { ...classification };
        for (const [name, plugin] of this.plugins) {
            if (plugin.config?.enabled === false)
                continue;
            const startTime = performance.now();
            try {
                if (plugin.onClassify) {
                    const newResult = plugin.onClassify(line, lineNumber, result);
                    if (newResult) {
                        result = { ...result, ...newResult };
                    }
                }
                // Update stats
                const stats = this.stats.get(name);
                if (stats) {
                    stats.linesProcessed++;
                    const elapsed = performance.now() - startTime;
                    const elapsedNs = elapsed * 1e6;
                    stats.totalProcessingTimeNs += elapsedNs;
                    stats.avgProcessingTimeNs = stats.totalProcessingTimeNs / stats.linesProcessed;
                }
            }
            catch (error) {
                this.handleError(name, "onClassify", error);
            }
        }
        return result;
    }
    /**
     * Run suppress hook on all plugins
     */
    runSuppressHooks(chunk) {
        let result = { ...chunk };
        for (const [name, plugin] of this.plugins) {
            if (plugin.config?.enabled === false)
                continue;
            try {
                if (plugin.onSuppress) {
                    const shouldSuppress = plugin.onSuppress(result);
                    if (shouldSuppress !== null) {
                        result = { ...result, suppressed: shouldSuppress };
                    }
                }
                // Update stats
                const stats = this.stats.get(name);
                if (stats) {
                    if (result.suppressed)
                        stats.linesSuppressed++;
                }
            }
            catch (error) {
                this.handleError(name, "onSuppress", error);
            }
        }
        return result;
    }
    /**
     * Run output hook on all plugins
     */
    runOutputHooks(chunk) {
        let result = { ...chunk };
        for (const [name, plugin] of this.plugins) {
            if (plugin.config?.enabled === false)
                continue;
            try {
                if (plugin.onOutput) {
                    plugin.onOutput(result);
                }
            }
            catch (error) {
                this.handleError(name, "onOutput", error);
            }
        }
        return result;
    }
    /**
     * Run stats hook on all plugins
     */
    runStatsHooks(stats) {
        let result = { ...stats };
        for (const [name, plugin] of this.plugins) {
            if (plugin.config?.enabled === false)
                continue;
            try {
                if (plugin.onStats) {
                    plugin.onStats(result);
                }
            }
            catch (error) {
                this.handleError(name, "onStats", error);
            }
        }
        return result;
    }
    /**
     * Update plugin score after use
     */
    updateScore(name, success, processingTimeNs) {
        const score = this.scores.get(name);
        if (!score)
            return;
        score.linesProcessed++;
        if (success)
            score.linesSuppressed++;
        score.successRate = score.linesProcessed > 0
            ? (score.linesSuppressed / score.linesProcessed) * 100
            : 0;
        score.totalProcessingTimeNs += processingTimeNs;
        score.avgProcessingTimeNs = score.totalProcessingTimeNs / score.linesProcessed;
        score.lastUsed = Date.now();
        this.emit("plugin:scored", name, score);
    }
    /**
     * Enable hot-reload watching
     */
    startHotReload() {
        if (!this.config.pluginDir || this.watcher)
            return;
        this.watcher = watch(this.config.pluginDir, async (_eventType, filename) => {
            if (!filename || !PLUGIN_EXTENSIONS.some(ext => filename.endsWith(ext)))
                return;
            const name = filename.replace(extname(filename), "");
            if (this.plugins.has(name)) {
                await this.reloadPlugin(name);
            }
        });
        if (this.config.autoReloadMs && this.config.autoReloadMs > 0) {
            this.reloadTimer = setInterval(async () => {
                await this.scanAndReload();
            }, this.config.autoReloadMs);
        }
    }
    /**
     * Stop hot-reload watching
     */
    stopHotReload() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
        if (this.reloadTimer) {
            clearInterval(this.reloadTimer);
            this.reloadTimer = null;
        }
    }
    /**
     * Scan directory for new/removed plugins
     */
    async scanAndReload() {
        if (!this.config.pluginDir)
            return;
        try {
            const entries = await readdir(this.config.pluginDir, { withFileTypes: true });
            const pluginFiles = entries
                .filter((e) => e.isFile() && PLUGIN_EXTENSIONS.some(ext => e.name.endsWith(ext)))
                .map((e) => e.name.replace(extname(e.name), ""));
            // Load new plugins
            for (const name of pluginFiles) {
                if (!this.plugins.has(name)) {
                    const matchingEntry = entries.find((e) => e.name.startsWith(name));
                    if (matchingEntry) {
                        const path = join(this.config.pluginDir, matchingEntry.name);
                        await this.loadPlugin(path);
                    }
                }
            }
            // Unload removed plugins
            for (const [name] of this.plugins) {
                if (!pluginFiles.includes(name)) {
                    await this.unloadPlugin(name);
                }
            }
        }
        catch {
            // Expected: directory read failed during scan, skip reload cycle
        }
    }
    /**
     * Destroy all plugins and cleanup
     */
    async destroy() {
        this.stopHotReload();
        for (const [name] of this.plugins) {
            await this.unloadPlugin(name);
        }
        this.removeAllListeners();
    }
    /**
     * Create a plugin context
     */
    createContext() {
        return {
            stats: {
                totalLines: 0,
                suppressedLines: 0,
                outputLines: 0,
                fluffLines: 0,
                toolExecLines: 0,
                errorLines: 0,
                codeDiffLines: 0,
                codeBlockLines: 0,
                otherLines: 0,
                startTime: this.startTime,
            },
            emit: (event, data) => this.emit(event, data),
            addPattern: (pattern) => this.patterns.push(pattern),
            removePattern: (name) => {
                this.patterns = this.patterns.filter(p => p.name !== name);
            },
            options: this.streamOptions,
        };
    }
    /**
     * Import a plugin with timeout
     */
    async importWithTimeout(path) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Plugin import timed out after ${this.config.timeout}ms`));
            }, this.config.timeout);
            import(path)
                .then((mod) => {
                clearTimeout(timer);
                const plugin = mod.default ?? mod;
                if (typeof plugin === "function") {
                    resolve(plugin());
                }
                else {
                    resolve(plugin);
                }
            })
                .catch((err) => {
                clearTimeout(timer);
                reject(err);
            });
        });
    }
    /**
     * Execute a promise with timeout
     */
    async withTimeout(promise, context) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.emit("plugin:timeout", context);
                reject(new Error(`Plugin operation timed out: ${context}`));
            }, this.config.timeout);
            promise
                .then((result) => {
                clearTimeout(timer);
                resolve(result);
            })
                .catch((err) => {
                clearTimeout(timer);
                reject(err);
            });
        });
    }
    /**
     * Handle plugin error
     */
    handleError(pluginName, hook, error) {
        const msg = error instanceof Error ? error.message : String(error);
        this.emit("plugin:error", pluginName, hook, msg);
    }
}
/**
 * Create a plugin manager
 */
export function createPluginManager(config) {
    return new PluginManager(config);
}
/**
 * Create a simple plugin from configuration
 */
export function createPlugin(config) {
    return {
        name: config.name,
        version: config.version,
        description: config.description ?? "",
        author: "user",
        compiledPatterns: config.compiledPatterns ?? [],
        onClassify: config.onClassify,
        onSuppress: config.onSuppress,
        onOutput: config.onOutput,
        config: {
            name: config.name,
            enabled: config.enabled ?? true,
            priority: config.priority,
        },
    };
}
/**
 * Load plugin from a file path
 */
export async function loadPluginFile(path) {
    const mod = await import(path);
    const plugin = mod.default ?? mod;
    if (typeof plugin === "function") {
        return plugin();
    }
    return plugin;
}
/**
 * Get the default plugin directory
 */
export function getDefaultPluginDir() {
    const home = process.env.HOME || process.env.USERPROFILE || "";
    return join(home, ".agent-adhd", "plugins");
}
//# sourceMappingURL=plugins.js.map