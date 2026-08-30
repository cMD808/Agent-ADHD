/**
 * Aho-Corasick multi-pattern matcher.
 * Finds ALL pattern matches in a single pass through the input string.
 * Time complexity: O(n + m + z) where n = text length, m = total pattern length, z = number of matches
 *
 * Case-insensitive: all patterns and text are lowercased during matching.
 */
interface MatchResult {
    /** The matched pattern string (original case) */
    pattern: string;
    /** Start index in the text where the match begins */
    index: number;
    /** Length of the matched pattern */
    length: number;
}
export declare class AhoCorasick {
    /** goto table: state -> (char -> next state) */
    private goto;
    /** failure function: state -> fallback state */
    private fail;
    /** output function: state -> list of pattern indices that end at this state */
    private output;
    /** total number of states in the automaton */
    private stateCount;
    /** original patterns stored for match results */
    private patterns;
    constructor(patterns: string[]);
    /**
     * Build the trie and failure function (BFS).
     * Phase 1: Insert all patterns into a trie.
     * Phase 2: Compute failure links via BFS.
     * Phase 3: Merge output links so suffixes are propagated.
     */
    private build;
    /**
     * Search text for all pattern matches.
     * Walks the text once, following goto/failure transitions, and collects all matches.
     */
    search(text: string): MatchResult[];
    /**
     * Check if any pattern matches at the start of text.
     * Optimized for first-char fast path: check first char, then walk only the relevant branch.
     * Returns the first matching pattern string or null.
     */
    matchStart(text: string): string | null;
    /**
     * Check if any pattern appears anywhere in text.
     * Optimized for simple existence checks — returns true on first match found.
     */
    containsAny(text: string): boolean;
}
export {};
//# sourceMappingURL=ahoCorasick.d.ts.map