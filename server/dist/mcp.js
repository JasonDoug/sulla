"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcpService = exports.MCPService = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/client/stdio.js");
class MCPService {
    constructor() {
        this.client = null;
        this.transport = null;
        this.process = null;
    }
    async connect(directory) {
        if (this.client) {
            await this.disconnect();
        }
        console.log(`Starting MCP server for directory: ${directory}`);
        // Spawn the MCP server process
        // We use npx to run the filesystem server
        this.transport = new stdio_js_1.StdioClientTransport({
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-filesystem", directory],
        });
        this.client = new index_js_1.Client({
            name: "sulla-reference-client",
            version: "1.0.0",
        }, {
            capabilities: {}
        });
        await this.client.connect(this.transport);
        console.log("MCP Client connected");
    }
    async disconnect() {
        if (this.client) {
            await this.client.close(); // gracefully close
            this.client = null;
        }
        if (this.transport) {
            // Transport usually closes when client closes, but we can ensure
            this.transport = null;
        }
        console.log("MCP Client disconnected");
    }
    async listTools() {
        if (!this.client)
            throw new Error("Not connected");
        return await this.client.listTools();
    }
    async callTool(name, args) {
        if (!this.client)
            throw new Error("Not connected");
        return await this.client.callTool({
            name,
            arguments: args,
        });
    }
    isConnected() {
        return !!this.client;
    }
}
exports.MCPService = MCPService;
exports.mcpService = new MCPService();
