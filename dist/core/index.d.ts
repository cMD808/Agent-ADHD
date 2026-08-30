/**
 * Public API exports for Agent-ADHD core
 */
export { StreamParser, createParser, processString } from "./streamParser.js";
export { StreamSanitizer, sanitize, sanitizeLines, isMostlyFluff } from "./sanitizer.js";
export { classifyLine, isPureFluff, isToolExec, shouldPreserve, stripLeadingFluff, } from "./fluffPatterns.js";
export { INTRO_PATTERNS, EXIT_PATTERNS, FULL_LINE_FLUFF, TOOL_EXEC_PATTERNS, PRESERVE_MARKERS, getAllPatterns, } from "./fluffPatterns.js";
export { PluginManager, createPluginManager, createPlugin, loadPluginFile, getDefaultPluginDir, } from "./plugins.js";
export type { PluginManagerConfig, PluginLoadResult } from "./plugins.js";
export { ANSI_REGEX, CRITICAL_ERROR_PREFIXES, TOOL_EXEC_PREFIXES, DIFF_MARKERS, VERSION, DEFAULT_CONFIG, } from "./constants.js";
export type { ParsedChunk, ChunkType, LineClassification, ParseStats, StreamParserOptions, OutputMode, StreamEvent, HookConfig, AgentADHDPlugin, PluginConfig, PluginScore, PluginContext, CompiledPattern, PluginStats, Metrics, AgentADHDConfig, } from "./types.js";
//# sourceMappingURL=index.d.ts.map