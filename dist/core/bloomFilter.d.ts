/**
 * Bloom filter for fast negative lookups.
 * Used to skip expensive regex checks for lines that CANNOT match any pattern.
 * False positives are safe (we'd check anyway); false negatives are impossible.
 *
 * Uses double hashing (Kirsch-Mitzenmacker) for efficiency:
 *   h_i(x) = h1(x) + i * h2(x)
 * where h1 and h2 are derived from FNV-1a hash with different seeds.
 */
export declare class BloomFilter {
    private bits;
    private size;
    private hashCount;
    /**
     * @param expectedItems  Expected number of items to insert
     * @param falsePositiveRate  Desired false positive probability (0 < rate < 1)
     */
    constructor(expectedItems?: number, falsePositiveRate?: number);
    /**
     * FNV-1a hash variant.
     * Returns an unsigned 32-bit integer.
     */
    private fnv1a;
    /**
     * Compute the i-th hash value using double hashing.
     * h_i(x) = h1(x) + i * h2(x), mod size
     */
    private getHashIndex;
    /**
     * Add an item to the filter.
     */
    add(item: string): void;
    /**
     * Check if an item MIGHT be in the filter.
     * Returns false if the item is definitely NOT in the filter.
     * Returns true if the item MIGHT be in the filter (could be false positive).
     */
    mightContain(item: string): boolean;
    /**
     * Create a filter pre-populated with known preserve patterns.
     * Contains first characters and key substrings that indicate lines
     * should be preserved (errors, diffs, code blocks, etc.).
     */
    static forPreservePatterns(): BloomFilter;
}
//# sourceMappingURL=bloomFilter.d.ts.map