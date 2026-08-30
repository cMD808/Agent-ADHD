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
export { 
// Core parser
StreamParser, createParser, processString, 
// High-level sanitizer
StreamSanitizer, sanitize, sanitizeLines, isMostlyFluff, 
// Pattern utilities
classifyLine, isPureFluff, isToolExec, shouldPreserve, stripLeadingFluff, } from "./core/index.js";
export { 
// Performance optimizations
AhoCorasick, } from "./core/ahoCorasick.js";
export { BloomFilter, } from "./core/bloomFilter.js";
export { 
// Plugin system
PluginManager, createPluginManager, createPlugin, loadPluginFile, getDefaultPluginDir, } from "./core/plugins.js";
export { 
// Scaling: Worker pool
WorkerPool, } from "./core/workerPool.js";
export { 
// Scaling: Adaptive learning
AdaptiveLearning, } from "./core/adaptiveLearning.js";
export { 
// Hooks
ClaudeCodeHook, createClaudeCodeHook, wrapWithClaudeCode, OpenCodeHook, createOpenCodeHook, wrapWithOpenCode, detectAndCreateHook, createHook, } from "./hooks/index.js";
// Constants
export { VERSION, DEFAULT_CONFIG, ANSI_REGEX, CRITICAL_ERROR_PREFIXES, TOOL_EXEC_PREFIXES, DIFF_MARKERS, EXIT_CODES, } from "./core/constants.js";
//# sourceMappingURL=index.js.map