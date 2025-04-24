# LLM Arbitrator Quick Start Guide

This quick start guide will get you up and running with the LLM Arbitrator in just a few minutes.

## Installation in 4 Steps

```bash
# 1. Clone the repository
git clone https://github.com/tsotchke/llm-arbitrator.git
cd llm-arbitrator

# 2. Install dependencies
npm install

# 3. Build the project
npm run build

# 4. Start the server
npm start
```

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Node.js v16+ installed (`node --version`)
- [ ] At least one of these model backends running:
  - [ ] LM Studio with API server enabled (port 1234)
  - [ ] Ollama running (`ollama serve`)

## Configuration (Optional)

The LLM Arbitrator uses a configuration file `.llm-arbitrator.config.json` with sensible defaults. Most users can start without any configuration changes.

For custom setup, edit this file or set environment variables:

```bash
# For LM Studio with custom settings
export LM_STUDIO_ENDPOINT="http://custom-address:port"
export LM_STUDIO_DEFAULT_MODEL="your-model-name"

# For Ollama with custom settings
export OLLAMA_ENDPOINT="http://custom-address:port"
export OLLAMA_DEFAULT_MODEL="your-model-name"
```

## MCP Integration

To use with Claude/Cline, add to your MCP configuration:

```json
{
  "servers": [
    {
      "name": "llm-arbitrator",
      "transport": "stdio",
      "command": "node /path/to/llm-arbitrator/build/index.js"
    }
  ]
}
```

## Common Tasks

### Generate Code with Context

```javascript
const result = await use_mcp_tool({
  server_name: "llm-arbitrator",
  tool_name: "enhance_code_generation",
  arguments: {
    taskDescription: "Create a React component that displays user profile data",
    language: "javascript",
    domain: "web",
    files: ["src/components/UserList.js"] // Optional context files
  }
});
```

### Find Related Context Files

```javascript
const contextFiles = await use_mcp_tool({
  server_name: "llm-arbitrator",
  tool_name: "get_context_files",
  arguments: {
    filePath: "src/components/App.js",
    maxFiles: 5 // Optional limit
  }
});
```

### Optimize a Prompt

```javascript
const optimizedPrompt = await use_mcp_tool({
  server_name: "llm-arbitrator",
  tool_name: "optimize_prompt",
  arguments: {
    originalPrompt: "Explain how this code works",
    files: ["src/utils/helpers.js"] // File to analyze
  }
});
```

### Verify a Solution

```javascript
const verification = await use_mcp_tool({
  server_name: "llm-arbitrator",
  tool_name: "verify_solution",
  arguments: {
    code: "function add(a, b) { return a + b; }",
    language: "javascript",
    taskDescription: "Create a function that adds two numbers"
  }
});
```

## Troubleshooting

If you encounter issues:

1. **Connection problems**: Ensure LM Studio or Ollama is running
2. **Model not found**: Check available models and spelling
3. **Debug mode**: Enable with `export DEBUG_MODE=true`

For detailed help, see the [full documentation](INSTALLATION.md).

---

Ready to explore more advanced features? See the [API Reference](API_REFERENCE.md) for complete tool documentation.
