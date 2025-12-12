import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";

export class MCPService {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private process: any = null;

  async connect(directory: string) {
    if (this.client) {
      await this.disconnect();
    }

    console.log(`Starting MCP server for directory: ${directory}`);
    
    // Spawn the MCP server process
    // We use npx to run the filesystem server
    this.transport = new StdioClientTransport({
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", directory],
    });

    this.client = new Client({
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
    if (!this.client) throw new Error("Not connected");
    return await this.client.listTools();
  }

  async callTool(name: string, args: any) {
    if (!this.client) throw new Error("Not connected");
    return await this.client.callTool({
      name,
      arguments: args,
    });
  }

  isConnected() {
    return !!this.client;
  }
}

export const mcpService = new MCPService();
