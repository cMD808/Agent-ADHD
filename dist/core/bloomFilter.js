/**
 * Bloom filter for fast negative lookups.
 * Used to skip expensive regex checks for lines that CANNOT match any pattern.
 * False positives are safe (we'd check anyway); false negatives are impossible.
 *
 * Uses double hashing (Kirsch-Mitzenmacker) for efficiency:
 *   h_i(x) = h1(x) + i * h2(x)
 * where h1 and h2 are derived from FNV-1a hash with different seeds.
 */
export class BloomFilter {
    bits;
    size;
    hashCount;
    /**
     * @param expectedItems  Expected number of items to insert
     * @param falsePositiveRate  Desired false positive probability (0 < rate < 1)
     */
    constructor(expectedItems = 1000, falsePositiveRate = 0.01) {
        // Optimal bit array size: m = -n * ln(p) / (ln(2))^2
        const ln2 = Math.LN2;
        this.size = Math.ceil((-expectedItems * Math.log(falsePositiveRate)) / (ln2 * ln2));
        // Ensure minimum size
        this.size = Math.max(this.size, 64);
        // Optimal number of hash functions: k = (m/n) * ln(2)
        this.hashCount = Math.ceil((this.size / expectedItems) * ln2);
        this.hashCount = Math.max(1, Math.min(this.hashCount, 30)); // Clamp to reasonable range
        this.bits = new Uint8Array(this.size);
    }
    /**
     * FNV-1a hash variant.
     * Returns an unsigned 32-bit integer.
     */
    fnv1a(data, seed) {
        let hash = seed;
        for (let i = 0; i < data.length; i++) {
            hash ^= data.charCodeAt(i);
            hash = Math.imul(hash, 0x01000193); // FNV prime
        }
        return hash >>> 0; // Ensure unsigned
    }
    /**
     * Compute the i-th hash value using double hashing.
     * h_i(x) = h1(x) + i * h2(x), mod size
     */
    getHashIndex(item, i) {
        const h1 = this.fnv1a(item, 0x811c9dc5); // FNV offset basis
        const h2 = this.fnv1a(item, 0x01000193); // Different seed
        const combined = (h1 + i * h2) % this.size;
        return combined >= 0 ? combined : combined + this.size;
    }
    /**
     * Add an item to the filter.
     */
    add(item) {
        for (let i = 0; i < this.hashCount; i++) {
            const idx = this.getHashIndex(item, i);
            this.bits[idx] = 1;
        }
    }
    /**
     * Check if an item MIGHT be in the filter.
     * Returns false if the item is definitely NOT in the filter.
     * Returns true if the item MIGHT be in the filter (could be false positive).
     */
    mightContain(item) {
        for (let i = 0; i < this.hashCount; i++) {
            const idx = this.getHashIndex(item, i);
            if (this.bits[idx] === 0) {
                return false;
            }
        }
        return true;
    }
    /**
     * Create a filter pre-populated with known preserve patterns.
     * Contains first characters and key substrings that indicate lines
     * should be preserved (errors, diffs, code blocks, etc.).
     */
    static forPreservePatterns() {
        const filter = new BloomFilter(200, 0.01);
        // First chars of preserve patterns (case-insensitive)
        const preserveFirstChars = [
            "`", "{", "-", "+", "*", ">", "#", "[",
            "d", "i", "@", " ", "\t",
            "t", "e", "r", "s", "f", "p", "n",
            "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
        ];
        for (const ch of preserveFirstChars) {
            filter.add(ch);
            if (ch !== ch.toUpperCase()) {
                filter.add(ch.toUpperCase());
            }
        }
        // Key substrings that indicate preserved content
        const preserveSubstrings = [
            "Error", "ERROR", "FATAL", "Exception", "Traceback", "Stack",
            "panic", "PANIC", "ENOENT", "EACCES", "SyntaxError", "TypeError",
            "ReferenceError", "RuntimeError", "ImportError", "ModuleNotFoundError",
            "RangeError", "URIError", "EvalError", "UnhandledPromiseRejection",
            "Segmentation fault", "core dumped",
            "at ", "File ", "<string>",
            "npm ERR!", "git:",
            "diff ", "index ", "@@",
            "+++", "---",
            "FIXME", "TODO", "HACK", "XXX", "NOTE", "WARNING", "BREAKING",
            "IMPORTANT", "CRITICAL", "URGENT",
            "modified:", "added:", "deleted:", "renamed:",
            "new file:", "deleted file:",
            "[TOOL]", "[EXEC]", "[DEBUG]",
            "Reading file", "Writing file", "Creating file",
            "Updating file", "Deleting file", "Moving file",
            "Loading", "Initializing", "Connecting to",
            "Running command:", "Executing:",
        ];
        for (const sub of preserveSubstrings) {
            filter.add(sub);
            // Add lowercase variant for case-insensitive matching
            filter.add(sub.toLowerCase());
        }
        // First chars of fluff patterns for exclusion context
        const fluffFirstChars = ["s", "o", "c", "a", "n", "h", "l", "i", "u", "g", "y", "e", "w", "m", "b", "d", "f"];
        for (const ch of fluffFirstChars) {
            filter.add(`fluff:${ch}`);
        }
        return filter;
    }
}
//# sourceMappingURL=bloomFilter.js.map