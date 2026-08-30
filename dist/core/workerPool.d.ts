/**
 * Worker pool for parallel batch processing in Agent-ADHD.
 *
 * Splits large inputs across CPU cores for linear scaling.
 * Uses Node.js worker_threads for true parallelism without
 * blocking the main event loop.
 */
/**
 * Options for configuring the worker pool.
 */
export interface WorkerPoolOptions {
    concurrency?: number;
    /** Absolute path to the worker thread .js file. Auto-detected when omitted. */
    workerScript?: string;
}
/**
 * Worker pool for parallel batch processing.
 * Splits large inputs across CPU cores for linear scaling.
 */
export declare class WorkerPool {
    private workers;
    private tasks;
    private nextTaskId;
    private readonly concurrency;
    private readonly workerScript;
    private destroyed;
    constructor(options?: number | WorkerPoolOptions);
    /**
     * Resolve the path to the compiled worker thread script.
     * Handles both source (vitest) and compiled (production) environments.
     */
    private resolveWorkerScript;
    /**
     * Spawn all worker threads.
     */
    private spawnWorkers;
    /**
     * Create a single worker with message handlers.
     */
    private spawnOneWorker;
    /**
     * Process text through the filter using worker threads.
     */
    process(input: string): Promise<string>;
    /**
     * Dispatch a chunk to a free worker (round-robin).
     */
    private dispatchToWorker;
    /**
     * Process multiple inputs in parallel.
     * Each input is assigned to a worker in round-robin fashion.
     */
    processBatch(inputs: string[]): Promise<string[]>;
    /**
     * Shut down all workers gracefully.
     */
    destroy(): Promise<void>;
}
//# sourceMappingURL=workerPool.d.ts.map