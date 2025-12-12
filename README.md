# Sulla - Reference MCP Filesystem Client

Sulla is a reference implementation of a client for the **Model Context Protocol (MCP)**. It specifically demonstrates how to build a chatbot interface that connects to a local **Filesystem MCP Server**, allowing an LLM (via OpenRouter) to read, list, and interact with your local files safely.

## Features

- **MCP Host Integration**: The Node.js backend acts as a host for the `@modelcontextprotocol/server-filesystem`.
- **LLM Integration**: Connects to **OpenRouter** (supporting models like Claude 3.5 Sonnet, Gemini 2.0 Flash, GPT-4o, etc.).
- **Tool Use**: The LLM automatically uses MCP tools (`list_directory`, `read_file`, etc.) to answer user queries.
- **Modern UI**: React + Tailwind CSS interface for chatting and configuration.
- **Dynamic Configuration**: Configure your API key, Model, and Target Directory directly from the UI.

## Prerequisites

- **Node.js** (v18 or higher)
- **OpenRouter API Key** (Get one at [openrouter.ai](https://openrouter.ai))
- `npx` (included with Node.js)

## Project Structure

```
sulla/
├── client/     # React frontend (Vite + Tailwind)
├── server/     # Node.js backend (Express + MCP SDK)
└── README.md
```

## Installation

1.  **Clone/Enter the repository:**
    ```bash
    cd /home/jason/Projects/sulla
    ```

2.  **Install Server Dependencies:**
    ```bash
    cd server
    npm install
    ```

3.  **Install Client Dependencies:**
    ```bash
    cd ../client
    npm install
    ```

## Running the Application

You need to run both the backend server and the frontend client.

### 1. Start the Backend Server
The backend runs on port `3001`.

```bash
cd server
npm run build
node dist/index.js
```

> **Note:** The server acts as the MCP Host. When you connect via the UI, it spawns the MCP Filesystem server as a child process.

### 2. Start the Frontend Client
The frontend runs on port `5173` (by default).

```bash
cd client
npm run dev
```

Open your browser to `http://localhost:5173`.

## Usage Guide

1.  **Configuration Screen:**
    Upon first load, you will see a configuration screen.
    *   **OpenRouter API Key:** Enter your key starting with `sk-or-...`.
    *   **Model Name:** Enter the model ID (e.g., `google/gemini-2.0-flash-exp:free`, `anthropic/claude-3.5-sonnet`, `openai/gpt-4o`).
    *   **Target Directory:** The absolute path on your computer that you want the bot to access (e.g., `/home/jason/Projects`).

2.  **Chatting:**
    Once connected, you can ask questions like:
    *   "What files are in the current directory?"
    *   "Read package.json and tell me the dependencies."
    *   "Summarize the contents of src/App.tsx."

    The bot will use the MCP tools to fetch the information and present it to you.

3.  **Changing Configuration:**
    Click the **Settings (Gear)** icon in the top right of the chat header to disconnect and return to the configuration screen.

## Troubleshooting

- **"Failed to connect":** Ensure the backend server is running on port 3001. Check the backend terminal logs for errors.
- **Tool Execution Errors:** If the bot tries to access a file outside the `Target Directory` you specified, the MCP server will likely deny access for security.
- **Model Errors:** Ensure your OpenRouter API key has credits (if using paid models) and the model name is correct.

## Architecture Details

*   **Backend (`server/src/mcp.ts`)**: Uses `StdioClientTransport` from the MCP SDK to spawn `npx -y @modelcontextprotocol/server-filesystem` as a subprocess. It maps MCP tools to OpenAI-compatible tool definitions.
*   **LLM Logic (`server/src/llm.ts`)**: Manages the chat loop. It sends messages to OpenRouter, detects `tool_calls`, executes them via the MCP connection, and sends the results back to the LLM.
