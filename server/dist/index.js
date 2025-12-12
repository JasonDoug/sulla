"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mcp_js_1 = require("./mcp.js");
const llm_js_1 = require("./llm.js");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
let llmService = null;
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
        llmService = new llm_js_1.LLMService(apiKey, model);
        // Connect MCP
        await mcp_js_1.mcpService.connect(directory);
        res.json({ success: true, message: "Connected successfully" });
    }
    catch (err) {
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
    }
    catch (err) {
        console.error("Chat error:", err);
        res.status(500).json({ error: err.message });
    }
});
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
