/**
 * Worker pool for parallel batch processing in Agent-ADHD.
 *
 * Splits large inputs across CPU cores for linear scaling.
 * Uses Node.js worker_threads for true parallelism without
 * blocking the main event loop.
 */
import { Worker } from 'node:worker_threads';
import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
/** ESM-compatible __dirname */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/**
 * Worker pool for parallel batch processing.
 * Splits large inputs across CPU cores for linear scaling.
 */
export class WorkerPool {
    workers = [];
    tasks = new Map();
    nextTaskId = 1;
    concurrency;
    workerScript;
    destroyed = false;
    constructor(options) {
        if (typeof options === 'number') {
            this.concurrency = options;
            this.workerScript = '';
        }
        else {
            this.concurrency = options?.concurrency ?? cpus().length;
            this.workerScript = options?.workerScript ?? '';
        }
        // Resolve worker script path
        if (!this.workerScript) {
            this.workerScript = this.resolveWorkerScript();
        }
        this.spawnWorkers();
    }
    /**
     * Resolve the path to the compiled worker thread script.
     * Handles both source (vitest) and compiled (production) environments.
     */
    resolveWorkerScript() {
        // __dirname is either src/core (vitest) or dist/core (compiled)
        const workerJs = 'workerThread.js';
        // If we're in dist/core already, use it directly
        if (__dirname.endsWith(join('dist', 'core')) || __dirname.endsWith(join('dist', 'core'))) {
            return join(__dirname, workerJs);
        }
        // If we're in src/core (vitest), resolve to dist/core
        if (__dirname.endsWith(join('src', 'core')) || __dirname.endsWith(join('src', 'core'))) {
            const distPath = join(__dirname, '..', '..', 'dist', 'core', workerJs);
            return resolve(distPath);
        }
        // Fallback: same directory
        return join(__dirname, workerJs);
    }
    /**
     * Spawn all worker threads.
     */
    spawnWorkers() {
        for (let i = 0; i < this.concurrency; i++) {
            this.spawnOneWorker();
        }
    }
    /**
     * Create a single worker with message handlers.
     */
    spawnOneWorker() {
        const worker = new Worker(this.workerScript);
        this.workers.push(worker);
        worker.on('message', (msg) => {
            if (msg.id !== undefined && this.tasks.has(msg.id)) {
                const task = this.tasks.get(msg.id);
                this.tasks.delete(msg.id);
                if (msg.type === 'result') {
                    task.resolve(msg.result ?? '');
                }
                else if (msg.type === 'error') {
                    task.reject(new Error(msg.error ?? 'Unknown worker error'));
                }
            }
        });
        worker.on('error', () => {
            // Remove the dead worker and spawn a replacement
            const idx = this.workers.indexOf(worker);
            if (idx !== -1) {
                this.workers.splice(idx, 1);
            }
            this.spawnOneWorker();
        });
        return worker;
    }
    /**
     * Process text through the filter using worker threads.
     */
    process(input) {
        if (this.destroyed) {
            return Promise.reject(new Error('WorkerPool has been destroyed'));
        }
        if (input.length === 0) {
            return Promise.resolve('');
        }
        return this.dispatchToWorker(input);
    }
    /**
     * Dispatch a chunk to a free worker (round-robin).
     */
    dispatchToWorker(chunk) {
        return new Promise((resolve, reject) => {
            if (this.workers.length === 0) {
                reject(new Error('No workers available'));
                return;
            }
            const workerIdx = this.nextTaskId % this.workers.length;
            const worker = this.workers[workerIdx];
            const taskId = this.nextTaskId++;
            this.tasks.set(taskId, { id: taskId, resolve, reject });
            worker.postMessage({ type: 'process', chunk, id: taskId });
        });
    }
    /**
     * Process multiple inputs in parallel.
     * Each input is assigned to a worker in round-robin fashion.
     */
    processBatch(inputs) {
        if (this.destroyed) {
            return Promise.reject(new Error('WorkerPool has been destroyed'));
        }
        if (inputs.length === 0) {
            return Promise.resolve([]);
        }
        return Promise.all(inputs.map(input => this.dispatchToWorker(input)));
    }
    /**
     * Shut down all workers gracefully.
     */
    async destroy() {
        this.destroyed = true;
        // Reject any pending tasks
        for (const task of this.tasks.values()) {
            task.reject(new Error('WorkerPool destroyed'));
        }
        this.tasks.clear();
        // Terminate all workers
        const terminationPromises = this.workers.map(worker => {
            return new Promise((resolve) => {
                worker.once('exit', () => resolve());
                worker.terminate();
            });
        });
        await Promise.all(terminationPromises);
        this.workers = [];
    }
}
//# sourceMappingURL=workerPool.js.map