# LLM Arbitrator API Reference

This document provides a detailed reference for using the LLM Arbitrator's MCP tools and understanding the API structure.

## Table of Contents

- [MCP Protocol Integration](#mcp-protocol-integration)
- [Available Tools](#available-tools)
  - [enhance_code_generation](#enhance_code_generation)
  - [verify_solution](#verify_solution)
  - [optimize_prompt](#optimize_prompt)
  - [get_context_files](#get_context_files)
- [Data Structures](#data-structures)
- [Provider Interface](#provider-interface)
- [Error Handling](#error-handling)
- [Examples](#examples)

## MCP Protocol Integration

The LLM Arbitrator implements the [Model Context Protocol (MCP)](https://github.com/modelcontextprotocol) for seamless integration with Claude/Cline. 

### Setting up MCP Connection

1. Configure your MCP client to connect to the LLM Arbitrator:
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

2. Start the LLM Arbitrator server:
   ```bash
   npm start
   ```

3. Register the MCP server with your client using the appropriate method.

## Available Tools

### enhance_code_generation

Enhances code generation by leveraging specialized models for different domains.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "taskDescription": {
      "type": "string",
      "description": "Description of the coding task to be performed"
    },
    "projectContext": {
      "type": "string",
      "description": "Context about the project (optional)"
    },
    "language": {
      "type": "string",
      "description": "Programming language or framework (optional)"
    },
    "domain": {
      "type": "string",
      "description": "Specialized domain (e.g., quantum, functional, web) (optional)"
    },
    "files": {
      "type": "array",
      "description": "File paths to include as multimodal input (optional)",
      "items": {
        "type": "string"
      }
    },
    "model": {
      "type": "string",
      "description": "Specific model to use (optional)"
    }
  },
  "required": [
    "taskDescription"
  ]
}
```

**Example:**
```javascript
const result = await use_mcp_tool({
  server_name: "llm-arbitrator",
  tool_name: "enhance_code_generation",
  arguments: {
    taskDescription: "Create a React component that fetches and displays user data",
    language: "typescript",
    domain: "web",
    files: ["src/components/UserList.tsx"]
  }
});
```

**Response Structure:**
```javascript
{
  // Main code solution with full implementation
  "implementation": "// Code solution here...",
  
  // Detailed reasoning process from the model
  "reasoning": "I'll approach this by breaking it down into...",
  
  // Key insights about the solution
  "insights": [
    "Using React Query reduces boilerplate code",
    "TypeScript interfaces ensure type safety",
    "Error boundary implementation prevents cascading failures"
  ]
}
```

### verify_solution

Verifies a code solution using specialized models for analysis.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "code": {
      "type": "string",
      "description": "Code solution to verify"
    },
    "language": {
      "type": "string",
      "description": "Programming language of the code"
    },
    "taskDescription": {
      "type": "string",
      "description": "Description of what the code should do"
    },
    "files": {
      "type": "array",
      "description": "File paths to include as multimodal input (optional)",
      "items": {
        "type": "string"
      }
    },
    "model": {
      "type": "string",
      "description": "Specific model to use (optional)"
    }
  },
  "required": [
    "code",
    "language"
  ]
}
```

**Example:**
```javascript
const verification = await use_mcp_tool({
  server_name: "llm-arbitrator",
  tool_name: "verify_solution",
  arguments: {
    code: "function add(a, b) {\n  return a + b;\n}",
    language: "javascript",
    taskDescription: "Implement a function that adds two numbers"
  }
});
```

**Response Structure:**
```javascript
{
  // Overall verification result
  "isCorrect": true,
  
  // Detailed analysis of the solution
  "analysis": "The implementation correctly handles the addition of two numbers...",
  
  // Potential issues or edge cases
  "issues": [
    {
      "severity": "warning",
      "description": "No type checking for inputs",
      "suggestion": "Consider adding type validation or using TypeScript"
    }
  ],
  
  // Improvement suggestions
  "suggestions": [
    "Add input validation",
    "Consider handling edge cases like non-numeric inputs"
  ]
}
```

### optimize_prompt

Optimizes a user prompt for more efficient processing by Claude or other LLMs.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "originalPrompt": {
      "type": "string",
      "description": "Original user prompt"
    },
    "domain": {
      "type": "string",
      "description": "Specialized domain (e.g., quantum, functional, web) (optional)"
    },
    "files": {
      "type": "array",
      "description": "File paths to include as multimodal input (optional)",
      "items": {
        "type": "string"
      }
    },
    "model": {
      "type": "string",
      "description": "Specific model to use (optional)"
    }
  },
  "required": [
    "originalPrompt"
  ]
}
```

**Example:**
```javascript
const optimizedPrompt = await use_mcp_tool({
  server_name: "llm-arbitrator",
  tool_name: "optimize_prompt",
  arguments: {
    originalPrompt: "Write code for a website",
    domain: "web",
    files: ["design-spec.md"]
  }
});
```

**Response Structure:**
```javascript
{
  // The optimized prompt
  "optimizedPrompt": "Create a responsive website with the following specifications...",
  
  // Description of optimizations made
  "optimizations": [
    "Added specific requirements from design-spec.md",
    "Included technical constraints and browser compatibility needs",
    "Structured request for clearer deliverables"
  ],
  
  // Rationale for the optimizations
  "rationale": "The original prompt was too vague to produce a useful response..."
}
```

### get_context_files

Automatically finds related files for better context.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "filePath": {
      "type": "string",
      "description": "Path to the main source file to analyze"
    },
    "maxFiles": {
      "type": "number",
      "description": "Maximum number of context files to return (default: 10)"
    },
    "includeTests": {
      "type": "boolean",
      "description": "Whether to include related test files (default: true)"
    },
    "includeDocs": {
      "type": "boolean",
      "description": "Whether to include related documentation files (default: true)"
    }
  },
  "required": [
    "filePath"
  ]
}
```

**Example:**
```javascript
const contextFiles = await use_mcp_tool({
  server_name: "llm-arbitrator",
  tool_name: "get_context_files",
  arguments: {
    filePath: "src/components/DataGrid.js",
    maxFiles: 5,
    includeTests: true,
    includeDocs: true
  }
});
```

**Response Structure:**
```javascript
{
  // Main related files
  "related_files": [
    "src/components/DataCell.js",
    "src/components/DataHeader.js",
    "src/utils/gridHelpers.js"
  ],
  
  // Related test files
  "test_files": [
    "tests/components/DataGrid.test.js"
  ],
  
  // Related documentation files
  "documentation_files": [
    "docs/components/data-grid.md"
  ],
  
  // All files combined
  "all_files": [
    "src/components/DataCell.js",
    "src/components/DataHeader.js",
    "src/utils/gridHelpers.js",
    "tests/components/DataGrid.test.js",
    "docs/components/data-grid.md"
  ]
}
```

## Data Structures

### ModelCapability

Represents the capabilities of a specific model or provider.

```typescript
interface ModelCapability {
  domain: string;
  tasks: string[];
  languageSupport?: string[];
  specializations?: string[];
  performanceMetrics?: {
    accuracy: number;
    speed: number;
    [key: string]: number;
  };
}
```

### PromptInput

Represents input for a prompt to be sent to a language model.

```typescript
type PromptInput = string | {
  text?: string;
  files?: string[];
  images?: string[];
};
```

### RequestOptions

Options for model requests.

```typescript
interface RequestOptions {
  temperature?: number;
  max_tokens?: number;
  stop?: string[];
  system_message?: string;
  model?: string;
  [key: string]: any;
}
```

## Provider Interface

The core interface implemented by all model providers.

```typescript
interface ModelProvider {
  // Provider identification
  getName(): string;
  getCapabilities(): ModelCapability[];
  
  // Basic operations
  testConnection(): Promise<boolean>;
  getAvailableModels(): Promise<string[]>;
  getDefaultModel(): string;
  
  // Main functionality
  completePrompt(promptData: PromptInput, options?: RequestOptions): Promise<string>;
  
  // Configuration
  initialize(config?: Record<string, any>): Promise<void>;
  supportsModel(modelId: string): Promise<boolean>;
}
```

## Error Handling

LLM Arbitrator uses standardized error codes and messages:

| Error Code | Description | Common Causes |
|------------|-------------|---------------|
| `CONNECTION_ERROR` | Failed to connect to provider | Provider offline, incorrect endpoint |
| `MODEL_NOT_FOUND` | Model not available | Model not installed, typo in model name |
| `INVALID_INPUT` | Invalid input parameters | Missing required parameters, incorrect format |
| `CONTEXT_LIMIT` | Context limit exceeded | Too many files, files too large |
| `TIMEOUT` | Request timed out | Slow model inference, network issues |
| `FILE_ERROR` | File operation failed | File not found, permission denied |
| `PROVIDER_ERROR` | Provider-specific error | Varies based on provider |

Errors will include:
- `code`: The error code
- `message`: Human-readable error message
- `details`: Additional information (if available)

## Examples

### Complete Code Generation Example

```javascript
// Step 1: Get context files for better understanding
const contextFiles = await use_mcp_tool({
  server_name: "llm-arbitrator",
  tool_name: "get_context_files",
  arguments: {
    filePath: "src/components/App.js",
    maxFiles: 3
  }
});

// Step 2: Generate code with context
const codeResult = await use_mcp_tool({
  server_name: "llm-arbitrator",
  tool_name: "enhance_code_generation",
  arguments: {
    taskDescription: "Create a new UserProfile component that displays user information",
    language: "javascript",
    domain: "web",
    files: contextFiles.all_files
  }
});

// Step 3: Verify the generated solution
const verificationResult = await use_mcp_tool({
  server_name: "llm-arbitrator",
  tool_name: "verify_solution",
  arguments: {
    code: codeResult.implementation,
    language: "javascript",
    taskDescription: "Create a UserProfile component"
  }
});

// Step 4: If needed, optimize prompts for further refinement
const optimizedPrompt = await use_mcp_tool({
  server_name: "llm-arbitrator",
  tool_name: "optimize_prompt",
  arguments: {
    originalPrompt: "Fix issues with the UserProfile component",
    files: ["src/components/UserProfile.js"]
  }
});
```

### Direct Provider Selection

You can specify which provider to use for tasks requiring particular strengths:

```javascript
// Use LM Studio's DeepSeek R1 model for code generation
const lmStudioResult = await use_mcp_tool({
  server_name: "llm-arbitrator",
  tool_name: "enhance_code_generation",
  arguments: {
    taskDescription: "Create a quantum circuit simulator",
    language: "python",
    domain: "quantum",
    provider: "lmStudio",
    model: "deepseek-r1-distill-qwen-32b"
  }
});

// Use Ollama for faster reasoning tasks
const ollamaResult = await use_mcp_tool({
  server_name: "llm-arbitrator",
  tool_name: "verify_solution",
  arguments: {
    code: "# Some Python code here",
    language: "python",
    taskDescription: "Verify this quantum circuit simulator",
    provider: "ollama",
    model: "deepseek-r1:70b"
  }
});
```

---

## Additional Resources

- [Installation Guide](INSTALLATION.md)
- [README](README.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Decision Flow Documentation](docs/DECISION_FLOW.md)
- [Whitepaper](docs/WHITEPAPER.md)

---

© 2025 tsotchke. All Rights Reserved.
