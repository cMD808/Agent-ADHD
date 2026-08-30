/**
 * Worker thread for Agent-ADHD parallel batch processing.
 *
 * Each worker receives a chunk of text and processes it using the core
 * sanitize logic. Communication with the main thread is via structured
 * message passing (no shared state).
 */
import { parentPort } from 'node:worker_threads';
import { sanitize } from './sanitizer.js';
/**
 * Process a chunk of text using the core sanitizer.
 */
function processChunk(chunk) {
    return sanitize(chunk);
}
/**
 * Listen for messages from the main thread, process chunks, and reply.
 */
if (parentPort) {
    parentPort.on('message', (msg) => {
        try {
            const result = processChunk(msg.chunk);
            const response = {
                type: 'result',
                result,
                id: msg.id,
            };
            parentPort.postMessage(response);
        }
        catch (err) {
            const errorResponse = {
                type: 'error',
                error: err instanceof Error ? err.message : String(err),
                id: msg.id,
            };
            parentPort.postMessage(errorResponse);
        }
    });
    // Signal readiness to the main thread
    parentPort.postMessage({ type: 'ready' });
}
//# sourceMappingURL=workerThread.js.map