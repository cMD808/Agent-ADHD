/**
 * CLI entry point for Agent-ADHD v2
 *
 * Usage:
 *   agent-adhd [options] [command...]
 *   cat file.txt | agent-adhd [options]
 *   agent-adhd --wrap claude-code [args]
 *   agent-adhd --config ~/.agent-adhdrc
 */
import type { AgentADHDConfig } from "../core/types.js";
/** Parsed CLI arguments */
interface CLIArgs {
    raw: boolean;
    verbose: boolean;
    json: boolean;
    noColor: boolean;
    help: boolean;
    version: boolean;
    hook?: string;
    wrap?: string;
    config?: string;
    plugins?: string;
    benchmark?: boolean;
    quiet: boolean;
    dryRun?: boolean;
    command?: string[];
    input?: string;
}
/**
 * Parse command line arguments
 */
declare function parseCLIArgs(args: string[]): CLIArgs;
/**
 * Load config file from default locations
 */
declare function loadConfig(configPath?: string): Partial<AgentADHDConfig> | null;
export { parseCLIArgs, loadConfig };
//# sourceMappingURL=index.d.ts.map