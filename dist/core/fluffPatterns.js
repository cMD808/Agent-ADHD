/**
 * Fluff pattern definitions for Agent-ADHD v2
 *
 * Optimizations over v1:
 * - Fast-path first-char checks before any regex
 * - Precompiled combined regex for intro/exit/middle
 * - No duplicate patterns
 * - Early exit on first match
 * - Compiled pattern cache for reuse
 */
import { FLUFF_MAX_LINE_LENGTH, PRESERVE_FIRST_CHARS, } from "./constants.js";
/* ──────────────────────────── Intro Fluff Patterns ──────────────────────────── */
const INTRO_RAW = [
    // Standard openers
    ["intro_sure", /^(?:Sure,?\s*(?:here(?:'s| is) (?:what I found|the answer|the result|the solution|a test|my findings)|(?:I can (?:help|assist|do that))|I(?:'ll| will) (?:help|assist))?[!?.]?\s*)$/i],
    ["intro_of_course", /^(?:Of course,?\s*(?:here(?:'s| is)\s+\w.*|(?:yes|sure|absolutely|I (?:can|will)|let me))?!?\s*)$/i],
    ["intro_certainly", /^(?:Certainly,?\s*(?:here(?:'s| is)|(?:I can (?:help|assist))?)?\.?\s*)$/i],
    ["intro_absolutely", /^(?:Absolutely!?,?\s*(?:here(?:'s| is)?)?\.?\s*)$/i],
    ["intro_sure_thing", /^(?:Sure thing!?\s*)$/i],
    ["intro_no_problem", /^(?:No problem!?\s*)$/i],
    ["intro_happy_to_help", /^(?:Happy to help!?\s*)$/i],
    ["intro_id_be_happy", /^(?:I'd be happy to\s+)/i],
    ["intro_can_help", /^(?:I can help (?:you with |)(?:that |)(?:this |))/i],
    ["intro_let_me_help", /^(?:Let me help you with that\.?\s*)$/i],
    ["intro_let_me_look", /^(?:Let me (?:take a look|check|look into) at (?:that|this)\.?\s*)$/i],
    ["intro_ill_help", /^(?:I(?:'ll| will) (?:be happy to |)(?:help|assist|take care of|handle) (?:that|this)\.?\s*)$/i],
    ["intro_going_to", /^(?:I(?:'m| am) going to (?:help you with |)(?:that|this|the following)\.?\s*)$/i],
    ["intro_glad_to_help", /^(?:I(?:'m| am) (?:glad|happy) to (?:help|assist)\.?\s*)$/i],
    ["intro_been_able", /^(?:I(?:'ve| have) (?:been able to |)(?:figure out|found|solved) (?:the|that)\.?\s*)$/i],
    ["intro_okay", /^(?:Okay,?\s*(?:here(?:'s| is)|let me give you))/i],
    ["intro_right", /^(?:Right,?\s*(?:here(?:'s| is)|let me))/i],
    ["intro_alright", /^(?:Alright,?\s*(?:here(?:'s| is)|let me))/i],
    ["intro_all_right", /^(?:All right,?\s*(?:here(?:'s| is)|let me))/i],
    ["intro_got_it", /^(?:Got it!?\s*)$/i],
    ["intro_understood", /^(?:Understood!?\s*)$/i],
    // Apologies
    ["intro_apologize", /^(?:I apologize (?:for (?:the |)(?:inconvenience|confusion|error|mistake)|that )?\.?\s*)$/i],
    ["intro_sorry", /^(?:Sorry,?\s*(?:about that\.?|for (?:the |)(?:inconvenience|confusion|error)\.?|I(?:'m| am) not |let me )?\s*)$/i],
    ["intro_my_apologies", /^(?:My apologies?\.?\s*)$/i],
    ["intro_im_sorry", /^(?:I(?:'m| am) sorry,?\s*)$/i],
    ["intro_oops", /^(?:Oops,?\s*)$/i],
    ["intro_whoops", /^(?:Whoops,?\s*)$/i],
    // Meta-commentary
    ["intro_here_is", /^(?:Here(?:'s| is) (?:what I found|the answer|my (?:response|suggestion|recommendation)):?\s*)$/i],
    ["intro_here_is_solution", /^(?:Here(?:'s| is) (?:a |)(?:complete |)(?:solution|answer|example|explanation):?\s*)$/i],
    ["intro_here_is_code", /^(?:Here(?:'s| is) (?:the |)(?:code|file|output|result|information) (?:you requested|requested|for you):?\s*)$/i],
    ["intro_here_is_info", /^(?:Here(?:'s| is) (?:the |)(?:information|details|breakdown):?\s*)$/i],
    ["intro_to_answer", /^(?:To (?:answer your|address) (?:question|the request),?\s*)$/i],
    ["intro_in_response", /^(?:In response to (?:your|their) (?:question|request),?\s*)$/i],
    // Confirmations
    ["intro_yes", /^(?:Yes,?\s+(?:I can|of course|absolutely|sure|I(?:'ll| will))\.?\s*)$/i],
    ["intro_indeed", /^(?:Indeed,?\s*)$/i],
    ["intro_correct", /^(?:Correct,?\s*)$/i],
    // Progress indicators
    ["intro_looking", /^(?:Looking (?:into|at|through) (?:that|this|the )?\s*)$/i],
    ["intro_let_me_search", /^(?:Let me (?:search|find|check|examine|analyze|review) (?:for|that|this|the )?\s*)$/i],
    ["intro_currently", /^(?:I(?:'m| am) (?:currently |)(?:searching|looking|checking|analyzing|working on) (?:for|this|that|the )?\s*)$/i],
    ["intro_ive_searched", /^(?:I(?:'ve| have) (?:searched|looked|checked|founded|analyzed|reviewed) (?:for|through) (?:that|this|the )?\s*)$/i],
];
/* ──────────────────────────── Exit Fluff Patterns ──────────────────────────── */
const EXIT_RAW = [
    ["exit_please_let_me", /^(?:Please let me know if you need anything else\.?\s*)$/i],
    ["exit_let_me_know", /^(?:Let me know if you have any questions?\.?\s*)$/i],
    ["exit_feel_free", /^(?:Feel free to ask if you need help with anything else\.?\s*)$/i],
    ["exit_dont_hesitate", /^(?:Don'?t hesitate to ask if you need further assistance\.?\s*)$/i],
    ["exit_i_hope", /^(?:I hope (?:this |)(?:helps|solves|answers) (?:your|that) (?:question|request|problem)\.?\s*)$/i],
    ["exit_hope_helps", /^(?:Hope (?:this |)(?:helps|works)!\s*)$/i],
    ["exit_hope_it", /^(?:Hope (?:it|that) helps!?\s*)$/i],
    ["exit_if_you_have", /^(?:If you have any more questions?, feel free to ask\.?\s*)$/i],
    ["exit_is_there", /^(?:Is there anything else I can help you with\??)\s*$/i],
    ["exit_would_you_like", /^(?:Would you like me to (?:explain|elaborate) further\??)\s*$/i],
    ["exit_can_i_clarify", /^(?:Can I clarify anything further\??)\s*$/i],
    ["exit_let_me_know_if", /^(?:Let me know if this works for you\.?\s*)$/i],
    ["exit_have_a_great", /^(?:Have a great (?:day|rest of your day)!\s*)$/i],
    ["exit_good_luck", /^(?:Good luck!?\s*)$/i],
    ["exit_happy_coding", /^(?:Happy coding!?\s*)$/i],
    ["exit_best_regards", /^(?:Best regards?,?\s*)$/i],
    ["exit_thanks_for", /^(?:Thanks (?:for|for using) (?:your|the) (?:time|patience|question)\.?\s*)$/i],
    ["exit_thank_you", /^(?:Thank you for (?:your|the) (?:question|request|patience)\.?\s*)$/i],
    ["exit_that_should", /^(?:That (?:should|would|might) be (?:all|everything|it)\.?\s*)$/i],
    ["exit_this_should", /^(?:This (?:should|would|might) (?:solve|fix|address|handle) (?:your|the|that) (?:issue|problem|request)\.?\s*)$/i],
    ["exit_youre_all_set", /^(?:You(?:'re| are) all set!?\s*)$/i],
    ["exit_thats_it", /^(?:That'?s (?:it|all|everything|done)!\s*)$/i],
];
/* ──────────────────────────── Full-Line Fluff ──────────────────────────── */
const FULL_LINE_RAW = [
    ["fline_sure", /^(?:Sure)[!?.]?$/i],
    ["fline_okay", /^(?:Okay|Ok)[!?.]?$/i],
    ["fline_yes", /^(?:Yes)[!?.]?$/i],
    ["fline_no", /^(?:No)[!?.]?$/i],
    ["fline_correct", /^(?:Correct)[!?.]?$/i],
    ["fline_indeed", /^(?:Indeed)[!?.]?$/i],
    ["fline_absolutely", /^(?:Absolutely)[!?.]?$/i],
    ["fline_here_it", /^(?:Here(?:'s| is) it[!?.]?)$/i],
    ["fline_done", /^(?:Done[!?.]?|Complete[dt]?[!?.]?|Finished[!?.]?)$/i],
    ["fline_let_me_check", /^(?:Let me check[!?.]?)$/i],
    ["fline_ill_look", /^(?:I(?:'ll| will) look into it[!?.]?)$/i],
    ["fline_im_on_it", /^(?:I(?:'m| am) on it[!?.]?)$/i],
    ["fline_working", /^(?:Working on it[!?.]?)$/i],
    ["fline_processing", /^(?:Processing[!?.]?)$/i],
    ["fline_analyzing", /^(?:Analyzing[!?.]?)$/i],
    ["fline_searching", /^(?:Searching[!?.]?)$/i],
    ["fline_looking_up", /^(?:Looking up[!?.]?)$/i],
    ["fline_give_moment", /^(?:Give me a moment[!?.]?)$/i],
    ["fline_one_moment", /^(?:One moment[!?.]?)$/i],
    ["fline_just_second", /^(?:Just a (?:second|minute|moment)[!?.]?)$/i],
    ["fline_hold_on", /^(?:Hold on[!?.]?)$/i],
    ["fline_let_me_find", /^(?:Let me find that[!?.]?)$/i],
    ["fline_found_it", /^(?:Found it![!?.]?)$/i],
    ["fline_easy", /^(?:Easy![!?.]?)$/i],
    ["fline_simple", /^(?:Simple![!?.]?)$/i],
];
/* ──────────────────────────── Compiled Pattern Cache ──────────────────────────── */
/** Precompiled intro combined regex (fast check before individual) */
const INTRO_FIRST_CHARS = new Set([
    "s", "o", "c", "a", "n", "h", "l", "i", "u", "g", "y", "e", "w", "m", "b", "d", "f",
]);
const EXIT_FIRST_CHARS = new Set([
    "p", "l", "f", "d", "i", "h", "c", "w", "t", "g", "b", "y",
]);
const FULL_LINE_FIRST_CHARS = new Set([
    "s", "o", "y", "n", "c", "i", "h", "d", "w", "p", "a", "l", "e", "f", "j", "g",
]);
/* ──────────────────────────── Exported Compiled Patterns ──────────────────────────── */
/** Compiled intro patterns */
export const INTRO_PATTERNS = INTRO_RAW.map(([name, regex]) => ({
    regex,
    firstChar: name.split("_")[1]?.[0]?.toLowerCase(),
    type: "fluff",
    suppress: true,
    name,
}));
/** Pre-compiled non-anchored copies of intro patterns for stripLeadingFluff */
const STRIP_PATTERNS = INTRO_PATTERNS.map(p => {
    let source = p.regex.source;
    if (source.startsWith('^'))
        source = source.slice(1);
    if (source.endsWith('$'))
        source = source.slice(0, -1);
    return new RegExp(source, p.regex.flags);
});
/** Compiled exit patterns */
export const EXIT_PATTERNS = EXIT_RAW.map(([name, regex]) => ({
    regex,
    firstChar: name.split("_")[1]?.[0]?.toLowerCase(),
    type: "fluff",
    suppress: true,
    name,
}));
/** Compiled full-line patterns */
export const FULL_LINE_FLUFF = FULL_LINE_RAW.map(([name, regex]) => ({
    regex,
    firstChar: name.split("_")[1]?.[0]?.toLowerCase(),
    type: "fluff",
    suppress: true,
    name,
}));
/** Tool execution patterns — compiled */
export const TOOL_EXEC_PATTERNS = [
    { regex: /^>?\s*\$\s+.*$/, suppress: true, type: "tool_exec", name: "tool_shell", contains: "$" },
    { regex: /^>\s+.+$/, suppress: true, type: "tool_exec", name: "tool_shell_prompt", firstChar: ">" },
    { regex: /^>?\s*Running command:\s*.*$/, suppress: true, type: "tool_exec", name: "tool_running", contains: "Running" },
    { regex: /^>?\s*Executing:\s*.*$/, suppress: true, type: "tool_exec", name: "tool_executing", contains: "Executing" },
    { regex: /^\[TOOL\]\s+/, suppress: true, type: "tool_exec", name: "tool_bracket", contains: "[TOOL]" },
    { regex: /^\[EXEC\]\s+/, suppress: true, type: "tool_exec", name: "tool_exec_bracket", contains: "[EXEC]" },
    { regex: /^\[DEBUG\]\s+/, suppress: true, type: "tool_exec", name: "tool_debug", contains: "[DEBUG]" },
    { regex: /^>>>.*$/, suppress: true, type: "tool_exec", name: "tool_triple_gt" },
    { regex: /^---.*$/, suppress: true, type: "tool_exec", name: "tool_separator" },
    { regex: /^\s*\|.*$/, suppress: true, type: "tool_exec", name: "tool_table_border", contains: "|" },
    { regex: /^Reading file.*$/, suppress: true, type: "tool_exec", name: "tool_reading", contains: "Reading" },
    { regex: /^Writing file.*$/, suppress: true, type: "tool_exec", name: "tool_writing", contains: "Writing" },
    { regex: /^Creating file.*$/, suppress: true, type: "tool_exec", name: "tool_creating", contains: "Creating" },
    { regex: /^Updating file.*$/, suppress: true, type: "tool_exec", name: "tool_updating", contains: "Updating" },
    { regex: /^Deleting file.*$/, suppress: true, type: "tool_exec", name: "tool_deleting", contains: "Deleting" },
    { regex: /^Moving file.*$/, suppress: true, type: "tool_exec", name: "tool_moving", contains: "Moving" },
    { regex: /^Copying file.*$/, suppress: true, type: "tool_exec", name: "tool_copying", contains: "Copying" },
    { regex: /^Running.*in.*$/, suppress: true, type: "tool_exec", name: "tool_running_in", contains: "Running" },
    { regex: /^Spawning.*$/, suppress: true, type: "tool_exec", name: "tool_spawning", contains: "Spawning" },
    { regex: /^Loading.*$/, suppress: true, type: "tool_exec", name: "tool_loading", contains: "Loading" },
    { regex: /^Initializing.*$/, suppress: true, type: "tool_exec", name: "tool_initializing", contains: "Initializing" },
    { regex: /^Connecting to.*$/, suppress: true, type: "tool_exec", name: "tool_connecting", contains: "Connecting" },
    { regex: /^Connected\.$/, suppress: true, type: "tool_exec", name: "tool_connected" },
    { regex: /^Disconnected\.$/, suppress: true, type: "tool_exec", name: "tool_disconnected" },
];
/** Preserve markers — compiled with fast-path first-char */
export const PRESERVE_MARKERS = [
    // Code blocks
    { regex: /^```/, type: "code_block", suppress: false, name: "preserve_fenced", firstChar: "`" },
    { regex: /^```\w+/, type: "code_block", suppress: false, name: "preserve_fenced_lang", firstChar: "`" },
    { regex: /^```$/, type: "code_block", suppress: false, name: "preserve_fenced_end", firstChar: "`" },
    { regex: /^\s{4}/, type: "code_block", suppress: false, name: "preserve_indented", firstChar: " " },
    { regex: /^\t/, type: "code_block", suppress: false, name: "preserve_tab", firstChar: "\t" },
    // Diffs
    { regex: /^[+\-][+\-][+\-]\s+/, type: "code_diff", suppress: false, name: "preserve_diff_header" },
    { regex: /^diff\s+/, type: "code_diff", suppress: false, name: "preserve_diff", firstChar: "d", contains: "diff " },
    { regex: /^index\s+/, type: "code_diff", suppress: false, name: "preserve_index", firstChar: "i", contains: "index " },
    { regex: /^@@\s+/, type: "code_diff", suppress: false, name: "preserve_hunk", firstChar: "@" },
    { regex: /^--- a\//, type: "code_diff", suppress: false, name: "preserve_old_file", firstChar: "-" },
    { regex: /^\+\+\+ b\//, type: "code_diff", suppress: false, name: "preserve_new_file", firstChar: "+" },
    { regex: /^renamed:/, type: "code_diff", suppress: false, name: "preserve_renamed", firstChar: "r" },
    { regex: /^new file:/, type: "code_diff", suppress: false, name: "preserve_new_file", firstChar: "n" },
    { regex: /^deleted file:/, type: "code_diff", suppress: false, name: "preserve_deleted_file", firstChar: "d" },
    { regex: /^[ACDMRTUX]\d+\s+/, type: "code_diff", suppress: false, name: "preserve_short_status" },
    // Errors and stack traces
    { regex: /^(?:Error|ERROR|FATAL|Exception|Traceback|Stack)\b[:\s]/i, type: "error", suppress: false, name: "preserve_error" },
    { regex: /^\s+at\s+/, type: "stack_trace", suppress: false, name: "preserve_stack_at" },
    { regex: /^\s+File\s+/, type: "stack_trace", suppress: false, name: "preserve_stack_file" },
    { regex: /^\s+<string>/, type: "stack_trace", suppress: false, name: "preserve_stack_string" },
    // Structured data
    { regex: /^\s*\{/, type: "json_response", suppress: false, name: "preserve_json", firstChar: "{" },
    { regex: /^\s*\[/, type: "json_response", suppress: false, name: "preserve_array", firstChar: "[" },
    { regex: /^\s*"/, type: "json_response", suppress: false, name: "preserve_json_string", firstChar: "\"" },
    { regex: /^\s*\w+:\s*\w/, type: "raw_output", suppress: false, name: "preserve_yaml" },
    // Bullets
    { regex: /^[-*+]\s+(?!\s*$)/, type: "bullet_point", suppress: false, name: "preserve_bullet" },
    { regex: /^\d+\.\s+(?!\s*$)/, type: "bullet_point", suppress: false, name: "preserve_numbered" },
    { regex: /^>\s+/, type: "raw_output", suppress: false, name: "preserve_blockquote", firstChar: ">" },
    { regex: /^\[x\]\s+/i, type: "bullet_point", suppress: false, name: "preserve_checkbox_done", firstChar: "[" },
    { regex: /^\[ \]\s+/i, type: "bullet_point", suppress: false, name: "preserve_checkbox_empty", firstChar: "[" },
    // Important markers
    { regex: /^(?:FIXME|TODO|HACK|XXX|NOTE|WARNING|BREAKING):/i, type: "status_update", suppress: false, name: "preserve_marker" },
    { regex: /^(?:IMPORTANT|CRITICAL|URGENT):/i, type: "error", suppress: false, name: "preserve_critical" },
];
/** Module-level Set for fast first-char check in isToolExec */
const TOOL_EXEC_FIRST_CHARS = new Set(["$", ">", "[", "r", "w", "c", "d", "l", "i", "s", "m", "f"]);
/**
 * Check if a line should be preserved (never suppressed).
 * Uses fast-path first-char checks to avoid regex on most lines.
 */
export function shouldPreserve(line) {
    if (line.length === 0)
        return false;
    const trimmed = line.length > 200 ? line.substring(0, 200) : line;
    const firstChar = trimmed[0].toLowerCase();
    // Fast-path: skip regex entirely if first char is not in any preserve pattern
    if (!PRESERVE_FIRST_CHARS.has(firstChar)) {
        return false;
    }
    // Now check individual patterns (still fast because we only match known types)
    for (const pattern of PRESERVE_MARKERS) {
        if (pattern.firstChar && firstChar !== pattern.firstChar.toLowerCase()) {
            continue; // Skip — first char doesn't match
        }
        if (pattern.contains && !line.includes(pattern.contains)) {
            continue; // Skip — required substring not present
        }
        if (pattern.regex.test(trimmed)) {
            return true;
        }
    }
    return false;
}
/**
 * Check if a line is pure fluff (should be suppressed).
 * Returns true if the line matches fluff patterns and is short enough.
 */
export function isPureFluff(line) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.length > FLUFF_MAX_LINE_LENGTH)
        return false;
    // Fast-path: check first char against known fluff starters
    const firstChar = trimmed[0].toLowerCase();
    const isIntroStart = INTRO_FIRST_CHARS.has(firstChar);
    const isExitStart = EXIT_FIRST_CHARS.has(firstChar);
    const isFullLineStart = FULL_LINE_FIRST_CHARS.has(firstChar);
    if (!isIntroStart && !isExitStart && !isFullLineStart)
        return false;
    // Check intro patterns (line must be ENTIRELY fluff)
    if (isIntroStart) {
        for (const pattern of INTRO_PATTERNS) {
            if (pattern.regex.test(trimmed)) {
                // Verify the pattern matches the ENTIRE line, not just starts
                const match = trimmed.match(pattern.regex);
                if (match && match[0].length >= trimmed.length - 1) {
                    return true;
                }
            }
        }
    }
    // Check exit patterns (always full-line match)
    if (isExitStart) {
        for (const pattern of EXIT_PATTERNS) {
            if (pattern.regex.test(trimmed))
                return true;
        }
    }
    // Check full-line fluff
    if (isFullLineStart) {
        for (const pattern of FULL_LINE_FLUFF) {
            if (pattern.regex.test(trimmed))
                return true;
        }
    }
    return false;
}
/**
 * Check if a line is tool execution noise (suppressable in normal mode).
 * Uses contains checks before regex for speed.
 */
export function isToolExec(line) {
    const trimmed = line.trim();
    if (trimmed.length === 0)
        return false;
    const firstChar = trimmed[0].toLowerCase();
    // Quick check: tool exec starts with specific chars
    if (!TOOL_EXEC_FIRST_CHARS.has(firstChar)) {
        return false;
    }
    for (const pattern of TOOL_EXEC_PATTERNS) {
        if (pattern.contains && !line.includes(pattern.contains)) {
            continue;
        }
        if (pattern.regex.test(trimmed))
            return true;
    }
    return false;
}
/**
 * Strip leading fluff from a line, returning the cleaned line.
 * Uses non-anchored versions of intro patterns to strip prefixes.
 * Only matches at the START of the line (index 0).
 * Early exits on first match.
 */
export function stripLeadingFluff(line) {
    const trimmed = line.trim();
    if (trimmed.length === 0)
        return line;
    // Try intro patterns — strip the fluff prefix
    for (let i = 0; i < STRIP_PATTERNS.length; i++) {
        const prefixRegex = STRIP_PATTERNS[i];
        const match = trimmed.match(prefixRegex);
        // Only strip if match starts at position 0 (beginning of line)
        if (match && match.index === 0 && match[0].length > 2 && match[0].length >= trimmed.length * 0.6) {
            let result = trimmed.substring(match[0].length);
            // Clean up artifacts: leading colon, comma, space, semicolon
            result = result.replace(/^[,:;]\s*/, "").trim();
            if (result.length > 0)
                return result;
            return trimmed; // Entire line was fluff
        }
    }
    return line;
}
/**
 * Classify a line and return its type and confidence.
 * Uses fast-path checks before regex.
 */
export function classifyLine(line, verbose = false) {
    const trimmed = line.trim();
    if (trimmed.length === 0)
        return { type: "raw", confidence: 1.0 };
    // Check if it should be preserved
    if (shouldPreserve(line))
        return { type: "preserve", confidence: 0.95 };
    // Check for pure fluff
    if (isPureFluff(line))
        return { type: "fluff", confidence: 0.85 };
    // Check for tool execution noise (suppressable)
    if (!verbose && isToolExec(line))
        return { type: "tool_exec", confidence: 0.7 };
    return { type: "raw", confidence: 0.5 };
}
/**
 * Get all patterns as a flat array for scanning.
 */
export function getAllPatterns() {
    return [
        ...PRESERVE_MARKERS,
        ...TOOL_EXEC_PATTERNS,
        ...INTRO_PATTERNS,
        ...EXIT_PATTERNS,
        ...FULL_LINE_FLUFF,
    ];
}
//# sourceMappingURL=fluffPatterns.js.map