import express from "express";
import cors from "cors";
import { mcpService } from "./mcp.js";
import { LLMService } from "./llm.js";

const app = express();
app.use(cors());
app.use(express.json());

let llmService: LLMService | null = null;
let config = {
  apiKey: "",
  model: "",
  directory: "",
};

app.post("/config", async (req, res) => {
  const { apiKey, model, directory } = req.body;
  
  if (!apiKey || !model || !directory) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  config = { apiKey, model, directory };
  
  try {
    // Initialize LLM Service
    llmService = new LLMService(apiKey, model);

    // Connect MCP
    await mcpService.connect(directory);

    res.json({ success: true, message: "Connected successfully" });
  } catch (err: any) {
    console.error("Connection failed:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/chat", async (req, res) => {
  const { messages } = req.body;

  if (!llmService) {
    res.status(400).json({ error: "Not configured. Please set config first." });
    return;
  }

  try {
    const response = await llmService.processMessage(messages);
    res.json(response);
  } catch (err: any) {
    console.error("Chat error:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
