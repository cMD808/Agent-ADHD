/**
 * Aho-Corasick multi-pattern matcher.
 * Finds ALL pattern matches in a single pass through the input string.
 * Time complexity: O(n + m + z) where n = text length, m = total pattern length, z = number of matches
 *
 * Case-insensitive: all patterns and text are lowercased during matching.
 */
export class AhoCorasick {
    /** goto table: state -> (char -> next state) */
    goto = new Map();
    /** failure function: state -> fallback state */
    fail = [];
    /** output function: state -> list of pattern indices that end at this state */
    output = new Map();
    /** total number of states in the automaton */
    stateCount = 0;
    /** original patterns stored for match results */
    patterns;
    constructor(patterns) {
        this.patterns = patterns;
        this.build();
    }
    /**
     * Build the trie and failure function (BFS).
     * Phase 1: Insert all patterns into a trie.
     * Phase 2: Compute failure links via BFS.
     * Phase 3: Merge output links so suffixes are propagated.
     */
    build() {
        const numPatterns = this.patterns.length;
        if (numPatterns === 0)
            return;
        // Phase 1: Build trie from all patterns (case-insensitive)
        this.goto.set(0, new Map());
        this.stateCount = 1;
        for (let i = 0; i < numPatterns; i++) {
            const pattern = this.patterns[i];
            const lower = pattern.toLowerCase();
            let current = 0;
            for (let j = 0; j < lower.length; j++) {
                const ch = lower[j];
                const stateMap = this.goto.get(current);
                if (stateMap.has(ch)) {
                    current = stateMap.get(ch);
                }
                else {
                    const newState = this.stateCount++;
                    this.goto.set(newState, new Map());
                    stateMap.set(ch, newState);
                    current = newState;
                }
            }
            // Mark pattern i as ending at current state
            if (!this.output.has(current)) {
                this.output.set(current, []);
            }
            this.output.get(current).push(i);
        }
        // Initialize failure array
        this.fail = new Array(this.stateCount);
        this.fail[0] = 0;
        // Phase 2: Compute failure links via BFS
        const queue = [];
        // Initialize depth-1 states: fail to root (0)
        const rootMap = this.goto.get(0);
        for (const [, nextState] of rootMap) {
            this.fail[nextState] = 0;
            queue.push(nextState);
        }
        while (queue.length > 0) {
            const currentState = queue.shift();
            const stateMap = this.goto.get(currentState);
            for (const [ch, nextState] of stateMap) {
                queue.push(nextState);
                let failState = this.fail[currentState];
                while (failState !== 0 && !this.goto.has(failState)) {
                    failState = this.fail[failState];
                }
                const failMap = this.goto.get(failState);
                if (failMap && failMap.has(ch)) {
                    this.fail[nextState] = failMap.get(ch);
                }
                else {
                    this.fail[nextState] = 0;
                }
                // Merge output: add patterns from failure state
                const failOutput = this.output.get(this.fail[nextState]);
                if (failOutput && failOutput.length > 0) {
                    const currentOutput = this.output.get(nextState);
                    if (currentOutput) {
                        for (const idx of failOutput) {
                            if (!currentOutput.includes(idx)) {
                                currentOutput.push(idx);
                            }
                        }
                    }
                    else {
                        this.output.set(nextState, [...failOutput]);
                    }
                }
            }
        }
    }
    /**
     * Search text for all pattern matches.
     * Walks the text once, following goto/failure transitions, and collects all matches.
     */
    search(text) {
        const results = [];
        if (text.length === 0 || this.stateCount === 0)
            return results;
        let currentState = 0;
        const lowerText = text.toLowerCase();
        for (let i = 0; i < lowerText.length; i++) {
            const ch = lowerText[i];
            // Follow failure links until we find a goto for ch or reach root
            while (currentState !== 0 && !this.goto.get(currentState)?.has(ch)) {
                currentState = this.fail[currentState];
            }
            // Check if current state has a goto for ch
            const stateMap = this.goto.get(currentState);
            if (stateMap?.has(ch)) {
                currentState = stateMap.get(ch);
            }
            else {
                currentState = 0;
            }
            // Collect any matches at this state
            const outputPatterns = this.output.get(currentState);
            if (outputPatterns) {
                for (const patternIdx of outputPatterns) {
                    const pattern = this.patterns[patternIdx];
                    results.push({
                        pattern,
                        index: i - pattern.length + 1,
                        length: pattern.length,
                    });
                }
            }
        }
        return results;
    }
    /**
     * Check if any pattern matches at the start of text.
     * Optimized for first-char fast path: check first char, then walk only the relevant branch.
     * Returns the first matching pattern string or null.
     */
    matchStart(text) {
        if (text.length === 0 || this.stateCount === 0)
            return null;
        const lowerText = text.toLowerCase();
        let currentState = 0;
        for (let i = 0; i < lowerText.length; i++) {
            const ch = lowerText[i];
            // Follow failure links until we find a goto for ch or reach root
            while (currentState !== 0 && !this.goto.get(currentState)?.has(ch)) {
                currentState = this.fail[currentState];
            }
            // Check if current state has a goto for ch
            const stateMap = this.goto.get(currentState);
            if (stateMap?.has(ch)) {
                currentState = stateMap.get(ch);
            }
            else {
                return null; // No continuation from root — no prefix match
            }
            // Check if any pattern ends here
            const outputPatterns = this.output.get(currentState);
            if (outputPatterns && outputPatterns.length > 0) {
                // Return the first matching pattern
                return this.patterns[outputPatterns[0]];
            }
        }
        return null;
    }
    /**
     * Check if any pattern appears anywhere in text.
     * Optimized for simple existence checks — returns true on first match found.
     */
    containsAny(text) {
        if (text.length === 0 || this.stateCount === 0)
            return false;
        const lowerText = text.toLowerCase();
        let currentState = 0;
        for (let i = 0; i < lowerText.length; i++) {
            const ch = lowerText[i];
            // Follow failure links until we find a goto for ch or reach root
            while (currentState !== 0 && !this.goto.get(currentState)?.has(ch)) {
                currentState = this.fail[currentState];
            }
            // Check if current state has a goto for ch
            const stateMap = this.goto.get(currentState);
            if (stateMap?.has(ch)) {
                currentState = stateMap.get(ch);
            }
            else {
                currentState = 0;
            }
            if (this.output.has(currentState)) {
                return true;
            }
        }
        return false;
    }
}
//# sourceMappingURL=ahoCorasick.js.map