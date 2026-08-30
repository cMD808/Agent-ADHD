/**
 * Constants and configuration for Agent-ADHD v2
 *
 * Optimized: no object spreading, frozen objects, const enums where beneficial.
 */
/* ──────────────────────────── CLI ──────────────────────────── */
export const CLI_ARGS = {
    RAW: ["--raw", "-r"],
    VERBOSE: ["--verbose", "-v"],
    HELP: ["--help", "-h"],
    VERSION: ["--version", "-V"],
    JSON_OUTPUT: ["--json", "-j"],
    CONFIG: ["--config", "-c"],
    NO_COLOR: ["--no-color"],
    HOOK: ["--hook"],
    WRAP: ["--wrap", "-w"],
    PLUGIN: ["--plugin", "-p"],
    BENCHMARK: ["--benchmark", "-b"],
};
/* ──────────────────────────── ANSI ──────────────────────────── */
export const ANSI_RESET = "\x1b[0m";
export const ANSI_BOLD = "\x1b[1m";
export const ANSI_DIM = "\x1b[2m";
export const ANSI_RED = "\x1b[31m";
export const ANSI_GREEN = "\x1b[32m";
export const ANSI_YELLOW = "\x1b[33m";
export const ANSI_BLUE = "\x1b[34m";
export const ANSI_MAGENTA = "\x1b[35m";
export const ANSI_CYAN = "\x1b[36m";
export const ANSI_WHITE = "\x1b[37m";
export const ANSI_GRAY = "\x1b[90m";
/** ANSI regex — precompiled for repeated use (non-global to avoid lastIndex statefulness) */
export const ANSI_REGEX = /\x1b\[[0-9;]*m/;
/* ──────────────────────────── Version ──────────────────────────── */
export const VERSION = "0.2.0";
/* ──────────────────────────── Default Config ──────────────────────────── */
export const DEFAULT_CONFIG = Object.freeze({
    raw: false,
    verbose: false,
    preserveColors: true,
    minChunkSize: 0,
    continuousStream: false,
    plugins: true,
    maxBufferSize: 100,
});
/* ──────────────────────────── Performance Targets ──────────────────────────── */
export const PERFORMANCE = Object.freeze({
    MAX_STARTUP_MS: 20,
    MIN_THROUGHPUT: 10_000,
    FLUSH_INTERVAL_MS: 16,
    FAST_PATH_MIN_LENGTH: 3,
    REGEX_CACHE_SIZE: 256,
});
/* ──────────────────────────── Exit Codes ──────────────────────────── */
export const EXIT_CODES = Object.freeze({
    SUCCESS: 0,
    GENERAL_ERROR: 1,
    CONFIG_ERROR: 2,
    PARSE_ERROR: 3,
    HOOK_ERROR: 4,
    PLUGIN_ERROR: 5,
    SIGINT: 130,
    SIGTERM: 143,
});
/* ──────────────────────────── Stream ──────────────────────────── */
export const STREAM = Object.freeze({
    DEFAULT_CHUNK_SIZE: 64 * 1024,
    MAX_LINE_LENGTH: 10_000,
    LINE_BUFFER_SIZE: 100,
});
/* ──────────────────────────── Error Prefixes (NEVER suppress) ──────────────────────────── */
export const CRITICAL_ERROR_PREFIXES = [
    "Error:", "ERROR:", "error:", "FATAL:", "fatal:",
    "Exception:", "EXCEPTION:", "Traceback (most recent call last):",
    "Stack:", "panic:", "PANIC:", "[ERROR]", "[FATAL]",
    "npm ERR!", "git:", "SyntaxError:", "ReferenceError:",
    "TypeError:", "RuntimeError:", "ImportError:", "ModuleNotFoundError:",
    "ENOENT:", "EACCES:", "EPERM:", "Command failed:",
    "RangeError:", "URIError:", "EvalError:",
    "UnhandledPromiseRejection", "Unhandled error:",
    "Segmentation fault", "core dumped",
];
/** Quick first-char check: if line doesn't start with any of these, skip regex entirely */
export const CRITICAL_ERROR_FIRST_CHARS = new Set(CRITICAL_ERROR_PREFIXES.map((p) => p[0].toLowerCase()));
/* ──────────────────────────── Tool Exec Prefixes (suppressable) ──────────────────────────── */
export const TOOL_EXEC_PREFIXES = [
    "Running command:", "Executing:", ">>", "Running:",
    "Invoking:", "Calling:", "Starting:", "[TOOL] ",
    "[EXEC] ", "[DEBUG] ", "$ ", "> ",
    "Reading file", "Writing file", "Creating file",
    "Updating file", "Deleting file", "Moving file",
    "Loading", "Initializing", "Connecting to",
];
/* ──────────────────────────── Diff Markers ──────────────────────────── */
export const DIFF_MARKERS = [
    "+++", "---", "diff ", "index ",
    "@@", "modified:", "added:", "deleted:", "renamed:",
    "new file:", "deleted file:",
];
/* ──────────────────────────── Preserved Content Prefixes ──────────────────────────── */
export const PRESERVE_FIRST_CHARS = new Set([
    "`", // code blocks
    "{", // JSON objects
    "-", // diffs, bullets
    "+", // diffs
    "*", // bullets
    ">", // blockquotes
    "#", // errors like # ERROR
    "[", // [ERROR], [x], etc.
    "d", // diff
    "i", // index
    "@", // @@ hunk
    " ", // indented code (4+ spaces, checked separately)
    "\t", // tab-indented
    "t", // Traceback, TypeError
    "e", // Error, ENOENT, EACCES, EvalError
    "r", // ReferenceError, RuntimeError, RangeError
    "s", // SyntaxError, Stack, Segmentation
    "f", // Fatal, File
    "p", // Panic, PANIC
    "n", // npm ERR
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", // numbered lists
]);
/* ──────────────────────────── Max Line Lengths ──────────────────────────── */
export const FLUFF_MAX_LINE_LENGTH = 200;
/* ──────────────────────────── Plugin ──────────────────────────── */
export const PLUGIN_DEFAULTS = Object.freeze({
    priority: 100,
    hotReload: false,
    maxPlugins: 50,
    timeout: 5000,
});
export const PLUGIN_EXTENSIONS = [".mjs", ".cjs", ".js", ".ts"];
//# sourceMappingURL=constants.js.map