/**
 * Agent-ADHD v2 - Real-time CLI output parser for agentic tools
 *
 * A lightweight, fast tool that strips conversational filler from
 * agent responses in real time, saving tokens and reducing noise.
 *
 * @example
 * // One-shot sanitization
 * import { sanitize } from 'agent-adhd';
 * const clean = sanitize("Sure, I can help! Here's what I found...");
 *
 * @example
 * // Streaming with plugins
 * import { StreamParser, PluginManager } from 'agent-adhd';
 * const parser = new StreamParser();
 * const pm = new PluginManager();
 * parser.setPluginManager(pm);
 */
export { StreamParser, createParser, processString, StreamSanitizer, sanitize, sanitizeLines, isMostlyFluff, classifyLine, isPureFluff, isToolExec, shouldPreserve, stripLeadingFluff, } from "./core/index.js";
export { AhoCorasick, } from "./core/ahoCorasick.js";
export { BloomFilter, } from "./core/bloomFilter.js";
export { PluginManager, createPluginManager, createPlugin, loadPluginFile, getDefaultPluginDir, } from "./core/plugins.js";
export { WorkerPool, } from "./core/workerPool.js";
export { AdaptiveLearning, } from "./core/adaptiveLearning.js";
export { ClaudeCodeHook, createClaudeCodeHook, wrapWithClaudeCode, OpenCodeHook, createOpenCodeHook, wrapWithOpenCode, detectAndCreateHook, createHook, type HookType, } from "./hooks/index.js";
export type { ParsedChunk, ChunkType, LineClassification, ParseStats, StreamParserOptions, OutputMode, StreamEvent, HookConfig, AgentADHDPlugin, PluginConfig, PluginScore, PluginContext, CompiledPattern, PluginStats, PluginManagerEvents, LineClassifier, Metrics, AgentADHDConfig, } from "./core/types.js";
export type { PluginManagerConfig, PluginLoadResult, } from "./core/plugins.js";
export type { StreamParserEvents, } from "./core/streamParser.js";
export { VERSION, DEFAULT_CONFIG, ANSI_REGEX, CRITICAL_ERROR_PREFIXES, TOOL_EXEC_PREFIXES, DIFF_MARKERS, EXIT_CODES, } from "./core/constants.js";
//# sourceMappingURL=index.d.ts.map