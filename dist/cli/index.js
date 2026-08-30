/**
 * CLI entry point for Agent-ADHD v2
 *
 * Usage:
 *   agent-adhd [options] [command...]
 *   cat file.txt | agent-adhd [options]
 *   agent-adhd --wrap claude-code [args]
 *   agent-adhd --config ~/.agent-adhdrc
 */
import { readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { stdin, stdout, stderr, exit } from "node:process";
import { parseArgs } from "node:util";
import { VERSION, EXIT_CODES } from "../core/constants.js";
import { StreamParser } from "../core/streamParser.js";
import { createClaudeCodeHook, createOpenCodeHook } from "../hooks/index.js";
/**
 * Parse command line arguments
 */
function parseCLIArgs(args) {
    const config = {
        args,
        options: {
            raw: { short: "r", type: "boolean", default: false },
            verbose: { short: "v", type: "boolean", default: false },
            json: { short: "j", type: "boolean", default: false },
            "no-color": { type: "boolean", default: false },
            help: { short: "h", type: "boolean", default: false },
            version: { short: "V", type: "boolean", default: false },
            hook: { type: "string" },
            wrap: { short: "w", type: "string" },
            config: { short: "c", type: "string" },
            plugins: { short: "p", type: "string" },
            benchmark: { short: "b", type: "boolean", default: false },
            quiet: { short: "q", type: "boolean", default: false },
            "dry-run": { type: "boolean", default: false },
        },
        allowPositionals: true,
        strict: false,
    };
    const parsed = parseArgs(config);
    return {
        raw: parsed.values.raw,
        verbose: parsed.values.verbose,
        json: parsed.values.json,
        noColor: parsed.values["no-color"],
        help: parsed.values.help,
        version: parsed.values.version,
        hook: parsed.values.hook,
        wrap: parsed.values.wrap,
        config: parsed.values.config,
        plugins: parsed.values.plugins,
        benchmark: parsed.values.benchmark,
        quiet: parsed.values.quiet,
        dryRun: parsed.values["dry-run"],
        command: parsed.positionals,
    };
}
/**
 * Load config file from default locations
 */
function loadConfig(configPath) {
    const paths = [
        configPath,
        join(process.cwd(), "agent-adhd.config.json"),
        join(process.cwd(), ".agent-adhdrc"),
        join(process.env.HOME || process.env.USERPROFILE || "", ".agent-adhdrc"),
        join(process.env.HOME || process.env.USERPROFILE || "", ".agent-adhdrc.json"),
        join(process.env.HOME || process.env.USERPROFILE || "", ".config", "agent-adhd", "config.json"),
    ].filter(Boolean);
    for (const path of paths) {
        if (existsSync(path)) {
            try {
                const content = readFileSync(path, "utf8");
                return JSON.parse(content);
            }
            catch {
                // Expected: config file has invalid JSON, skip silently
            }
        }
    }
    return null;
}
/**
 * Print help text
 */
function printHelp() {
    const help = `
╔═══════════════════════════════════════════════════════════════╗
║                    Agent-ADHD v${VERSION.padEnd(30)}║
║        Real-time CLI output parser for agentic tools            ║
╚═══════════════════════════════════════════════════════════════╝

USAGE
  agent-adhd [options] [command...]
  cat file.txt | agent-adhd [options]
  agent-adhd --wrap claude-code [args]

OPTIONS
  -r, --raw            Pass through all output without filtering
  -v, --verbose        Show tool execution logs (normally suppressed)
  -j, --json           Output parse statistics as JSON
  -q, --quiet          Suppress all output (useful for testing)
  --dry-run            Show what would be suppressed without filtering
  --no-color           Strip ANSI color codes
  -h, --help           Show this help message
  -V, --version        Show version number

HOOKS
  -w, --wrap <tool>    Wrap a specific agentic tool
                        Supported: claude-code, opencode
  --hook <name>        Enable specific hook by name

PLUGINS
  -p, --plugins <dir>  Load plugins from directory
  --config <path>      Use a specific config file

BENCHMARK
  -b, --benchmark      Run built-in benchmark suite

EXAMPLES
  # Filter piped input
  cat output.log | agent-adhd

  # Wrap Claude Code with filtering
  agent-adhd --wrap claude-code

  # Show verbose output (including tool execution)
  cat output.log | agent-adhd --verbose

  # Get JSON statistics
  cat output.log | agent-adhd --json

  # Load plugins
  cat output.log | agent-adhd --plugins ~/.agent-adhd/plugins

  # Run benchmark
  agent-adhd --benchmark

CONFIGURATION
  Config file: ~/.agent-adhdrc (JSON or YAML)
  Environment: AGENT_ADHD_RAW, AGENT_ADHD_VERBOSE, AGENT_ADHD_TOOL

WEBSITE
  https://github.com/agent-adhd/agent-adhd
`;
    stdout.write(help + "\n");
}
/**
 * Print version
 */
function printVersion() {
    stdout.write(`agent-adhd ${VERSION}\n`);
}
/**
 * Print JSON statistics
 */
function printStats(stats) {
    stdout.write(JSON.stringify({
        version: VERSION,
        stats: {
            totalLines: stats.totalLines,
            suppressedLines: stats.suppressedLines,
            outputLines: stats.outputLines,
            fluffLines: stats.fluffLines,
            toolExecLines: stats.toolExecLines,
            errorLines: stats.errorLines,
            codeDiffLines: stats.codeDiffLines,
            codeBlockLines: stats.codeBlockLines,
            otherLines: stats.otherLines,
            tokensSaved: stats.tokensSaved,
            processingTimeMs: (stats.endTime ?? Date.now()) - stats.startTime,
        }
    }, null, 2) + "\n");
}
/**
 * Run the built-in benchmark
 */
async function runBenchmark() {
    const { processString } = await import("../core/streamParser.js");
    const testCases = [
        {
            name: "Simple fluff removal",
            input: "Sure, I can help with that!\nHere's what I found:\nconst x = 42;\nDone! Hope this helps!",
            expected: "const x = 42",
        },
        {
            name: "Error preservation",
            input: "Sure, here's the error:\nError: file not found\nDone.",
            expected: "Error: file not found",
        },
        {
            name: "Code block preservation",
            input: "Sure, here's the code:\n```javascript\nconst x = 42;\n```\nDone.",
            expected: "```javascript",
        },
        {
            name: "Stack trace preservation",
            input: "Traceback (most recent call last):\n  File \"test.py\", line 5\n    x = 1 / 0\nZeroDivisionError: division by zero",
            expected: "Traceback",
        },
        {
            name: "Diff preservation",
            input: "diff --git a/file.txt b/file.txt\n--- a/file.txt\n+++ b/file.txt\n-old\n+new",
            expected: "diff --git",
        },
    ];
    stdout.write(`\n╔═══════════════════════════════════════════════════════╗\n║              Agent-ADHD Benchmark Suite              ║\n╚═══════════════════════════════════════════════════════╝\n\n`);
    const iterations = 10000;
    let totalPassed = 0;
    let totalTime = 0;
    for (const tc of testCases) {
        const start = performance.now();
        let result = "";
        for (let i = 0; i < iterations; i++) {
            result = processString(tc.input);
        }
        const elapsed = performance.now() - start;
        const opsPerSec = Math.round(iterations / (elapsed / 1000));
        const passed = result.includes(tc.expected);
        if (passed)
            totalPassed++;
        totalTime += elapsed;
        const status = passed ? "✓" : "✗";
        stdout.write(`  ${status} ${tc.name}\n`);
        stdout.write(`    Result: ${result.replace(/\n/g, " | ").substring(0, 80)}\n`);
        stdout.write(`    Speed:  ${opsPerSec.toLocaleString()} ops/sec (${(elapsed / iterations).toFixed(3)}ms/op)\n\n`);
    }
    stdout.write(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    stdout.write(`  Total: ${totalPassed}/${testCases.length} passed | ${totalTime.toFixed(0)}ms total | ${Math.round(iterations * testCases.length / (totalTime / 1000)).toLocaleString()} ops/sec avg\n\n`);
}
/**
 * Process input from stdin
 */
async function processStdin(options, jsonOutput, quiet, dryRun) {
    return new Promise((resolve, reject) => {
        const parser = new StreamParser(options);
        stdin.setEncoding("utf8");
        stdin.on("readable", () => {
            let chunk;
            while ((chunk = stdin.read()) !== null) {
                const chunks = parser.process(chunk);
                const finalChunks = [];
                const allChunks = [...chunks, ...finalChunks];
                if (dryRun) {
                    for (const c of allChunks) {
                        const prefix = c.suppressed ? "[-]" : "[+]";
                        stdout.write(`${prefix} ${c.content}\n`);
                    }
                }
                else {
                    const output = allChunks
                        .filter(c => !c.suppressed)
                        .map(c => c.content)
                        .join("\n");
                    if (!quiet && output.length > 0) {
                        stdout.write(output + "\n");
                    }
                }
            }
        });
        stdin.on("end", () => {
            try {
                // Flush any remaining buffer
                const finalChunks = parser.finalize();
                if (dryRun) {
                    for (const c of finalChunks) {
                        const prefix = c.suppressed ? "[-]" : "[+]";
                        stdout.write(`${prefix} ${c.content}\n`);
                    }
                }
                else {
                    const output = finalChunks
                        .filter(c => !c.suppressed)
                        .map(c => c.content)
                        .join("\n");
                    if (!quiet && output.length > 0) {
                        stdout.write(output + "\n");
                    }
                }
                if (jsonOutput) {
                    printStats(parser.getStats());
                }
                resolve();
            }
            catch (err) {
                reject(err);
            }
        });
        stdin.on("error", reject);
    });
}
/**
 * Process input from a file
 */
async function processFile(path, options, jsonOutput, quiet, dryRun) {
    try {
        const stat = statSync(path);
        if (!stat.isFile()) {
            stderr.write(`Error: ${path} is not a file\n`);
            exit(EXIT_CODES.GENERAL_ERROR);
            return;
        }
        const content = readFileSync(path, "utf8");
        const parser = new StreamParser(options);
        const chunks = parser.process(content);
        const finalChunks = parser.finalize();
        const allChunks = [...chunks, ...finalChunks];
        if (dryRun) {
            for (const c of allChunks) {
                const prefix = c.suppressed ? "[-]" : "[+]";
                stdout.write(`${prefix} ${c.content}\n`);
            }
        }
        else {
            const output = allChunks
                .filter(c => !c.suppressed)
                .map(c => c.content)
                .join("\n");
            if (!quiet && output.length > 0) {
                stdout.write(output + "\n");
            }
        }
        if (jsonOutput) {
            printStats(parser.getStats());
        }
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        stderr.write(`Error reading file ${path}: ${msg}\n`);
        exit(EXIT_CODES.GENERAL_ERROR);
    }
}
/**
 * Wrap an agentic tool with filtering
 */
async function wrapTool(tool, args) {
    const command = args.length > 0 ? args : undefined;
    let hook = null;
    switch (tool.toLowerCase()) {
        case "claude-code":
        case "claude":
            hook = createClaudeCodeHook();
            break;
        case "opencode":
            hook = createOpenCodeHook();
            break;
        default:
            stderr.write(`Error: Unknown tool "${tool}". Supported: claude-code, opencode\n`);
            exit(EXIT_CODES.HOOK_ERROR);
            return;
    }
    if (!hook) {
        stderr.write("Error: Failed to create hook\n");
        exit(EXIT_CODES.HOOK_ERROR);
        return;
    }
    hook.start(command);
    // Handle signals
    process.on("SIGINT", () => {
        hook.stop();
        exit(EXIT_CODES.SIGINT);
    });
    process.on("SIGTERM", () => {
        hook.stop();
        exit(EXIT_CODES.SIGTERM);
    });
}
/**
 * Main CLI entry point
 */
async function main() {
    const args = parseCLIArgs(process.argv.slice(2));
    // Handle help
    if (args.help) {
        printHelp();
        exit(EXIT_CODES.SUCCESS);
        return;
    }
    // Handle version
    if (args.version) {
        printVersion();
        exit(EXIT_CODES.SUCCESS);
        return;
    }
    // Handle benchmark
    if (args.benchmark) {
        await runBenchmark();
        exit(EXIT_CODES.SUCCESS);
        return;
    }
    // Load config
    const fileConfig = loadConfig(args.config);
    // Merge options: CLI args > env vars > config file > defaults
    const parserOptions = {
        raw: args.raw || process.env.AGENT_ADHD_RAW === "1" || process.env.AGENT_ADHD_RAW === "true",
        verbose: args.verbose || process.env.AGENT_ADHD_VERBOSE === "1" || process.env.AGENT_ADHD_VERBOSE === "true",
        preserveColors: !args.noColor,
        customFluffPatterns: fileConfig?.patterns?.fluff ?? [],
    };
    // Check for wrap mode
    if (args.wrap) {
        await wrapTool(args.wrap, args.command ?? []);
        return;
    }
    // Check for hook mode
    if (args.hook) {
        await processStdin(parserOptions, args.json, args.quiet, args.dryRun);
        return;
    }
    // Check for file input
    if (args.command && args.command.length > 0) {
        const firstArg = args.command[0];
        // Check if it's a file path
        try {
            const stat = statSync(firstArg);
            if (stat.isFile()) {
                await processFile(firstArg, parserOptions, args.json, args.quiet, args.dryRun);
                return;
            }
        }
        catch {
            // Expected: firstArg is not a file path, treat as inline content
        }
        // Treat as inline content
        const input = args.command.join(" ");
        const parser = new StreamParser(parserOptions);
        const chunks = parser.process(input);
        const finalChunks = parser.finalize();
        const allChunks = [...chunks, ...finalChunks];
        if (args.dryRun) {
            for (const c of allChunks) {
                const prefix = c.suppressed ? "[-]" : "[+]";
                stdout.write(`${prefix} ${c.content}\n`);
            }
        }
        else {
            const output = allChunks
                .filter(c => !c.suppressed)
                .map(c => c.content)
                .join("\n");
            if (!args.quiet && output.length > 0) {
                stdout.write(output + "\n");
            }
        }
        if (args.json) {
            printStats(parser.getStats());
        }
        return;
    }
    // Otherwise, read from stdin
    if (stdin.isTTY) {
        printHelp();
        exit(EXIT_CODES.SUCCESS);
        return;
    }
    await processStdin(parserOptions, args.json, args.quiet, args.dryRun);
}
// Run main
main().catch((err) => {
    const msg = err instanceof Error ? err.message : String(err);
    stderr.write(`Fatal error: ${msg}\n`);
    exit(EXIT_CODES.GENERAL_ERROR);
});
export { parseCLIArgs, loadConfig };
//# sourceMappingURL=index.js.map