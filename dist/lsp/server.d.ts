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
export {};
//# sourceMappingURL=server.d.ts.map