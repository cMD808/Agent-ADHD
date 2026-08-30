/**
 * Constants and configuration for Agent-ADHD v2
 *
 * Optimized: no object spreading, frozen objects, const enums where beneficial.
 */
export declare const CLI_ARGS: {
    readonly RAW: readonly ["--raw", "-r"];
    readonly VERBOSE: readonly ["--verbose", "-v"];
    readonly HELP: readonly ["--help", "-h"];
    readonly VERSION: readonly ["--version", "-V"];
    readonly JSON_OUTPUT: readonly ["--json", "-j"];
    readonly CONFIG: readonly ["--config", "-c"];
    readonly NO_COLOR: readonly ["--no-color"];
    readonly HOOK: readonly ["--hook"];
    readonly WRAP: readonly ["--wrap", "-w"];
    readonly PLUGIN: readonly ["--plugin", "-p"];
    readonly BENCHMARK: readonly ["--benchmark", "-b"];
};
export declare const ANSI_RESET = "\u001B[0m";
export declare const ANSI_BOLD = "\u001B[1m";
export declare const ANSI_DIM = "\u001B[2m";
export declare const ANSI_RED = "\u001B[31m";
export declare const ANSI_GREEN = "\u001B[32m";
export declare const ANSI_YELLOW = "\u001B[33m";
export declare const ANSI_BLUE = "\u001B[34m";
export declare const ANSI_MAGENTA = "\u001B[35m";
export declare const ANSI_CYAN = "\u001B[36m";
export declare const ANSI_WHITE = "\u001B[37m";
export declare const ANSI_GRAY = "\u001B[90m";
/** ANSI regex — precompiled for repeated use (non-global to avoid lastIndex statefulness) */
export declare const ANSI_REGEX: RegExp;
export declare const VERSION = "0.2.0";
export declare const DEFAULT_CONFIG: Readonly<{
    raw: false;
    verbose: false;
    preserveColors: true;
    minChunkSize: 0;
    continuousStream: false;
    plugins: true;
    maxBufferSize: 100;
}>;
export declare const PERFORMANCE: Readonly<{
    MAX_STARTUP_MS: 20;
    MIN_THROUGHPUT: 10000;
    FLUSH_INTERVAL_MS: 16;
    FAST_PATH_MIN_LENGTH: 3;
    REGEX_CACHE_SIZE: 256;
}>;
export declare const EXIT_CODES: Readonly<{
    SUCCESS: 0;
    GENERAL_ERROR: 1;
    CONFIG_ERROR: 2;
    PARSE_ERROR: 3;
    HOOK_ERROR: 4;
    PLUGIN_ERROR: 5;
    SIGINT: 130;
    SIGTERM: 143;
}>;
export declare const STREAM: Readonly<{
    DEFAULT_CHUNK_SIZE: number;
    MAX_LINE_LENGTH: 10000;
    LINE_BUFFER_SIZE: 100;
}>;
export declare const CRITICAL_ERROR_PREFIXES: readonly ["Error:", "ERROR:", "error:", "FATAL:", "fatal:", "Exception:", "EXCEPTION:", "Traceback (most recent call last):", "Stack:", "panic:", "PANIC:", "[ERROR]", "[FATAL]", "npm ERR!", "git:", "SyntaxError:", "ReferenceError:", "TypeError:", "RuntimeError:", "ImportError:", "ModuleNotFoundError:", "ENOENT:", "EACCES:", "EPERM:", "Command failed:", "RangeError:", "URIError:", "EvalError:", "UnhandledPromiseRejection", "Unhandled error:", "Segmentation fault", "core dumped"];
/** Quick first-char check: if line doesn't start with any of these, skip regex entirely */
export declare const CRITICAL_ERROR_FIRST_CHARS: Set<string>;
export declare const TOOL_EXEC_PREFIXES: readonly ["Running command:", "Executing:", ">>", "Running:", "Invoking:", "Calling:", "Starting:", "[TOOL] ", "[EXEC] ", "[DEBUG] ", "$ ", "> ", "Reading file", "Writing file", "Creating file", "Updating file", "Deleting file", "Moving file", "Loading", "Initializing", "Connecting to"];
export declare const DIFF_MARKERS: readonly ["+++", "---", "diff ", "index ", "@@", "modified:", "added:", "deleted:", "renamed:", "new file:", "deleted file:"];
export declare const PRESERVE_FIRST_CHARS: Set<string>;
export declare const FLUFF_MAX_LINE_LENGTH = 200;
export declare const PLUGIN_DEFAULTS: Readonly<{
    priority: 100;
    hotReload: false;
    maxPlugins: 50;
    timeout: 5000;
}>;
export declare const PLUGIN_EXTENSIONS: readonly string[];
//# sourceMappingURL=constants.d.ts.map