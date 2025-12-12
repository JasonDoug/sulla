import OpenAI from "openai";
import { mcpService } from "./mcp.js";

export class LLMService {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
    });
    this.model = model;
  }

  async processMessage(messages: any[]) {
    const MAX_TURNS = 5;
    let currentMessages = [...messages];

    for (let i = 0; i < MAX_TURNS; i++) {
        // 1. Get tools
        let tools: any[] = [];
        if (mcpService.isConnected()) {
            const mcpTools = await mcpService.listTools();
            tools = mcpTools.tools.map((t) => ({
                type: "function",
                function: {
                    name: t.name,
                    description: t.description,
                    parameters: t.inputSchema,
                },
            }));
        }

        // 2. Call LLM
        const response = await this.openai.chat.completions.create({
            model: this.model,
            messages: currentMessages,
            tools: tools.length > 0 ? tools : undefined,
        });

        const message = response.choices[0].message;
        currentMessages.push(message);

        // 3. Check for tool calls
        if (message.tool_calls && message.tool_calls.length > 0) {
            console.log("Tool calls detected:", message.tool_calls.map(tc => tc.type === 'function' ? tc.function.name : 'unknown'));
            
            for (const toolCall of message.tool_calls) {
                if (toolCall.type !== 'function') continue;

                const args = JSON.parse(toolCall.function.arguments);
                console.log(`Executing ${toolCall.function.name} with args:`, args);
                
                try {
                    const result = await mcpService.callTool(toolCall.function.name, args);
                    
                    // Add tool result to history
                    currentMessages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        content: JSON.stringify(result.content), // MCP returns { content: ... }
                    });
                } catch (err: any) {
                    console.error("Tool execution failed:", err);
                    currentMessages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        content: JSON.stringify({ error: err.message }),
                    });
                }
            }
            // Loop continues to next iteration to send tool results back to LLM
        } else {
            // No tool calls, we are done
            return message;
        }
    }
    
    return currentMessages[currentMessages.length - 1];
  }
}