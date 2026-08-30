/**
 * Agent-ADHD LSP Server
 * Exposes filtering as diagnostics for any LSP-compatible editor.
 *
 * Protocol: JSON-RPC over stdio (standard LSP transport)
 *
 * Capabilities:
 * - textDocument/didOpen: Filter opened files, publish diagnostics
 * - textDocument/didChange: Re-filter on changes
 * - workspace/didChangeWatchedFile: Re-filter on external changes
 * - agent-adhd/filter: Custom request to filter arbitrary text
 * - agent-adhd/stats: Get filtering statistics
 */
import { StreamSanitizer } from "../core/sanitizer.js";
// ─── LSP error codes ──────────────────────────────────────────
const LSP_ERRORS = {
    ParseError: -32700,
    InvalidRequest: -32600,
    MethodNotFound: -32601,
    InvalidParams: -32602,
    InternalError: -32603,
};
// ─── Diagnostic severity ──────────────────────────────────────
const Severity = {
    Error: 1,
    Warning: 2,
    Information: 3,
    Hint: 4,
};
// ─── In-memory document store ─────────────────────────────────
const documents = new Map();
const sessionStats = {
    totalLines: 0,
    suppressedLines: 0,
    outputLines: 0,
    fluffLines: 0,
    toolExecLines: 0,
    errorLines: 0,
    codeDiffLines: 0,
    codeBlockLines: 0,
    otherLines: 0,
    startTime: Date.now(),
};
// ─── Helper: build diagnostics from text ──────────────────────
function buildDiagnostics(text, uri) {
    const lines = text.split("\n");
    const diagnostics = [];
    const sanitizer = new StreamSanitizer({ verbose: false });
    const result = sanitizer.sanitize(text);
    sanitizer.finalize();
    const filteredLines = result.split("\n");
    const suppressedCount = lines.length - filteredLines.length;
    // Compare line by line to find which were suppressed
    let filteredIdx = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Check if this line appears in filtered output
        if (filteredIdx < filteredLines.length &&
            line === filteredLines[filteredIdx]) {
            filteredIdx++;
            continue;
        }
        // Line was suppressed — determine severity
        const isFluff = /^(Sure|Of course|Certainly|I apologize|Sorry|Done!|Hope this helps|Let me know|Thanks|Got it|Okay|Looking into|One moment|Here is the result)/i.test(line.trim());
        diagnostics.push({
            range: {
                start: { line: i, character: 0 },
                end: {
                    line: i,
                    character: line.length,
                },
            },
            severity: isFluff
                ? Severity.Warning
                : Severity.Information,
            source: "agent-adhd",
            message: isFluff
                ? `[Agent-ADHD] Fluff suppressed: "${line.trim().substring(0, 60)}"`
                : `[Agent-ADHD] Line suppressed: "${line.trim().substring(0, 60)}"`,
        });
    }
    return { uri, diagnostics };
}
// ─── Message reader ───────────────────────────────────────────
function readMessage() {
    return new Promise((resolve, reject) => {
        let headerBuffer = "";
        const onData = (chunk) => {
            const str = chunk.toString("utf8");
            headerBuffer += str;
            // Look for the end of headers
            const headerEnd = headerBuffer.indexOf("\r\n\r\n");
            if (headerEnd === -1)
                return;
            // Parse Content-Length
            const headerSection = headerBuffer.substring(0, headerEnd);
            const contentLengthMatch = headerSection.match(/Content-Length:\s*(\d+)/i);
            if (!contentLengthMatch) {
                reject(new Error("Missing Content-Length header"));
                process.stdin.removeListener("data", onData);
                return;
            }
            const contentLength = parseInt(contentLengthMatch[1], 10);
            const bodyStart = headerEnd + 4;
            const bodyAvailable = headerBuffer.length - bodyStart;
            if (bodyAvailable < contentLength)
                return; // Wait for more data
            const body = headerBuffer.substring(bodyStart, bodyStart + contentLength);
            headerBuffer = ""; // Reset for next message
            process.stdin.removeListener("data", onData);
            try {
                resolve(JSON.parse(body));
            }
            catch {
                reject(new Error("Invalid JSON in message body"));
            }
        };
        process.stdin.on("data", onData);
    });
}
// ─── Message writer ───────────────────────────────────────────
function sendMessage(response) {
    const body = JSON.stringify(response);
    const contentLength = Buffer.byteLength(body, "utf8");
    const header = `Content-Length: ${contentLength}\r\n\r\n`;
    process.stdout.write(header + body);
}
function sendNotification(method, params) {
    const msg = {
        jsonrpc: "2.0",
        method,
        params,
    };
    const body = JSON.stringify(msg);
    const contentLength = Buffer.byteLength(body, "utf8");
    const header = `Content-Length: ${contentLength}\r\n\r\n`;
    process.stdout.write(header + body);
}
// ─── Request handlers ─────────────────────────────────────────
function handleInitialize(_params) {
    return {
        capabilities: {
            textDocumentSync: {
                openClose: true,
                change: 1, // Full document sync
            },
            diagnosticProvider: {
                interFileDependencies: false,
                workspaceDiagnostics: false,
            },
        },
    };
}
function handleInitialized() {
    // Log ready — no response needed (notification)
    process.stderr.write("[Agent-ADHD LSP] Server initialized and ready\n");
}
function handleDidOpen(params) {
    const p = params;
    if (!p?.textDocument?.uri)
        return null;
    const uri = p.textDocument.uri;
    const text = p.textDocument.text ?? "";
    documents.set(uri, text);
    const diagnostics = buildDiagnostics(text, uri);
    // Update session stats
    const lines = text.split("\n");
    sessionStats.totalLines += lines.length;
    sessionStats.suppressedLines +=
        diagnostics.diagnostics.length;
    sessionStats.outputLines +=
        lines.length - diagnostics.diagnostics.length;
    return diagnostics;
}
function handleDidChange(params) {
    const p = params;
    if (!p?.textDocument?.uri || !p.contentChanges)
        return null;
    const uri = p.textDocument.uri;
    // Full document sync — take the last change's text
    const text = p.contentChanges[p.contentChanges.length - 1]?.text ?? "";
    documents.set(uri, text);
    const diagnostics = buildDiagnostics(text, uri);
    // Update session stats (simplified — counts approximate)
    const lines = text.split("\n");
    sessionStats.totalLines += lines.length;
    sessionStats.suppressedLines +=
        diagnostics.diagnostics.length;
    sessionStats.outputLines +=
        lines.length - diagnostics.diagnostics.length;
    return diagnostics;
}
function handleFilter(params) {
    const p = params;
    if (p?.text === undefined)
        return null;
    const options = p.options ?? {};
    const sanitizer = new StreamSanitizer(options);
    const filtered = sanitizer.sanitize(p.text);
    const finalized = sanitizer.finalize();
    const stats = sanitizer.getStats();
    return {
        filtered: finalized || filtered,
        stats,
    };
}
function handleStats() {
    return {
        ...sessionStats,
        endTime: Date.now(),
    };
}
function handleShutdown() {
    return null;
}
function handleExit() {
    process.exit(0);
}
// ─── Main loop ────────────────────────────────────────────────
async function main() {
    process.stderr.write("[Agent-ADHD LSP] Starting server...\n");
    while (true) {
        try {
            const message = await readMessage();
            if (message.method) {
                // It's a request or notification
                const req = message;
                let result = undefined;
                let error = undefined;
                switch (req.method) {
                    case "initialize":
                        result = handleInitialize(req.params);
                        break;
                    case "initialized":
                        handleInitialized();
                        // Notification — no response
                        continue;
                    case "textDocument/didOpen": {
                        const diag = handleDidOpen(req.params);
                        if (diag) {
                            sendNotification("textDocument/publishDiagnostics", diag);
                        }
                        result = undefined; // No response to didOpen
                        break;
                    }
                    case "textDocument/didChange": {
                        const diag = handleDidChange(req.params);
                        if (diag) {
                            sendNotification("textDocument/publishDiagnostics", diag);
                        }
                        result = undefined;
                        break;
                    }
                    case "agent-adhd/filter":
                        result = handleFilter(req.params);
                        if (result === null) {
                            error = {
                                code: LSP_ERRORS.InvalidParams,
                                message: "Missing required parameter: text",
                            };
                            result = undefined;
                        }
                        break;
                    case "agent-adhd/stats":
                        result = handleStats();
                        break;
                    case "shutdown":
                        result = handleShutdown();
                        break;
                    case "exit":
                        handleExit();
                        break;
                    default:
                        error = {
                            code: LSP_ERRORS.MethodNotFound,
                            message: `Method not found: ${req.method}`,
                        };
                        break;
                }
                // Send response if this was a request (has id)
                if (req.id !== undefined && req.id !== null) {
                    const response = {
                        jsonrpc: "2.0",
                        id: req.id,
                    };
                    if (error) {
                        response.error = error;
                    }
                    else {
                        response.result = result;
                    }
                    sendMessage(response);
                }
            }
        }
        catch (err) {
            process.stderr.write(`[Agent-ADHD LSP] Error: ${err instanceof Error ? err.message : String(err)}\n`);
        }
    }
}
main();
//# sourceMappingURL=server.js.map