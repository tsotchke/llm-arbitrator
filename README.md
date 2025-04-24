# 🧠 LLM Arbitrator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue.svg)](https://www.typescriptlang.org/)
[![MCP: Compatible](https://img.shields.io/badge/MCP-Compatible-brightgreen.svg)](https://github.com/modelcontextprotocol)
[![LM Studio](https://img.shields.io/badge/LM%20Studio-Compatible-blueviolet)](https://lmstudio.ai/)
[![Ollama](https://img.shields.io/badge/Ollama-Compatible-orange)](https://ollama.ai/)

> 🔮 Created by [tsotchke](https://github.com/tsotchke) - Transforming multi-model workflows through intelligent coordination.

<div align="center">
<h3>Why choose one AI model when you can have the best of all?</h3>

LLM Arbitrator is your AI orchestra conductor, seamlessly coordinating multiple language models to tackle complex tasks with unprecedented intelligence.

```
✨ The right model for the right job, automatically ✨
Combining the best models for the job, so you don't have to choose.
```

</div>

## 💡 What is LLM Arbitrator?

LLM Arbitrator is a brilliant framework that:

- 🔄 **Combines multiple AI models** to work together like a team of specialists
- 🎯 **Automatically routes tasks** to the models that will handle them best
- 🔍 **Preserves reasoning chains** so you can see exactly how decisions are made
- 📊 **Manages context intelligently** to maximize what each model can understand
- 🔗 **Integrates perfectly with Claude/Cline** through MCP protocol

Think of it as having a team of AI experts at your fingertips, each contributing their unique strengths to solve your problems with unprecedented intelligence.

## 📋 Table of Contents

- [🔍 Overview](#overview)
- [⚡ The Power of LLM Arbitration](#the-power-of-llm-arbitration)
- [🌟 Key Features](#key-features)
- [🤝 Supported Providers](#supported-providers)
- [🚀 Quick Start](#quick-start)
- [💻 Usage Examples](#usage-examples)
- [🏗️ Architecture](#architecture)
- [✨ Advanced Features](#advanced-features)
- [👨‍💻 Development](#development)
- [🔧 Troubleshooting](#troubleshooting)
- [🤲 Contributing](#contributing)

## 🔍 Overview

The LLM Arbitrator is your gateway to AI superpowers! It seamlessly connects Claude/Cline with your self-hosted models through multiple providers (LM Studio, Ollama, and more). Instead of being limited to just one AI brain, you get an entire team of specialists working together on your tasks. It intelligently routes tasks based on model capabilities, combines their strengths, and preserves detailed reasoning processes to enable more informed, transparent, and powerful AI workflows.

Think of it as your personal AI talent agent - always finding the perfect model for each specific task!

## ⚡ The Power of LLM Arbitration

### 🏆 Beyond Single Model Limitations

LLMs excel in different domains based on their training data, architecture, and optimization targets. No single model can be the best at everything:

- **DeepSeek R1** excels at code generation with exceptional reasoning
- **Qwen** shines in multilingual contexts and cross-lingual reasoning
- **Llama/Mistral** models provide fast responses for many general tasks
- **Specialized domain models** have deep expertise in specific fields

The LLM Arbitrator overcomes these limitations by orchestrating multiple models to collaborate on complex tasks, much like a team of specialists working together.

### Capability-Based Routing: The Science

The Arbitrator uses a sophisticated capability matching system that:

1. **Analyzes task requirements** by examining the task description, language, domain, and context files
2. **Evaluates model capabilities** through registered capability profiles that detail each model's strengths
3. **Calculates capability scores** to find the optimal model-task match using weighted scoring algorithms
4. **Routes dynamically** to the highest-scoring model for the specific parts of the task
5. **Preserves reasoning chains** across different model interactions

This approach ensures tasks are always handled by the most capable model, transforming the user experience from "which model should I use?" to "what problem do I need to solve?"

### Complex Workflow Benefits

Multi-model arbitration enables:

- **Specialized sub-task delegation**: Breaking complex tasks into sub-tasks for specialized models
- **Cross-validation**: Using different models to verify each other's outputs
- **Progressive refinement**: Iteratively improving results through multiple model passes
- **Context optimization**: Intelligent context management to maximize effective context window usage
- **Reasoning transparency**: Preserving the chain-of-thought across model boundaries

### Multi-Model Coordination

```
     User Request
          |
          v
     LLM Arbitrator
          |
          v
     Task Analysis
          |
          v
    Model Selection
       /        \
      /          \
     v            v
Code Tasks      Reasoning Tasks
     |            |
     v            v
Specialized    Reasoning
Code Model      Model
     |            |
     v            v
     \            /
      \          /
       v        v
   Result Integration
          |
          v
   Enhanced Response
          |
          v
         User
```

## 🌟 Key Features

- 🔌 **Provider-Based Architecture**: Like universal adapters for different AI models
- 🧠 **Smart Task Routing**: Automatically matches tasks to the perfect model
- 💭 **Thinking Transparency**: See exactly how models reach their conclusions
- 📚 **Context Awareness**: Intelligently finds and uses relevant files for better understanding
- 🤹 **Multi-Model Magic**: Combines specialized models for results no single AI could achieve
- 🔄 **Seamless Integration**: Works perfectly with Claude/Cline through MCP
- ⚡ **Blazing Performance**: Optimized for speed and efficiency with local models

## 🤝 Supported Providers

Our AI orchestra features these powerful players:

| Provider | Status | Models | Superpower |
|----------|--------|--------|------------|
| **🟣 LM Studio** | ✅ Full Support | DeepSeek R1, Qwen, Llama, etc. | 🧩 Specialized expertise and reasoning mastery |
| **🟠 Ollama** | ✅ Full Support | Deepseek, CodeLlama, Mixtral, etc. | ⚡ Fast, efficient, and lightning-quick responses |
| **🔧 Custom Providers** | 🛠️ Extensible | Any API-compatible model | 🧪 Add your own specialty models for ultimate flexibility |

## 🚀 Quick Start

Let's get your AI orchestra playing in harmony!

### 📋 Prerequisites

- 📦 [Node.js](https://nodejs.org/) v16.x or newer
- 🤖 At least one of these AI backends:
  - 🟣 [LM Studio](https://lmstudio.ai/) with your favorite models
  - 🟠 [Ollama](https://ollama.ai/) with some powerful models installed

### 🛠️ Installation

Just a few simple steps to get your AI team assembled:

```bash
# 📥 Clone the repository
git clone https://github.com/tsotchke/llm-arbitrator.git
cd llm-arbitrator

# 📦 Install dependencies
npm install

# 🔨 Build the project
npm run build

# 🚀 Start the server
npm start
```

### ⚙️ Configuration

The system is smart enough to auto-detect your available providers and models! Default endpoints:

- 🟣 LM Studio: `http://127.0.0.1:1234`
- 🟠 Ollama: `http://127.0.0.1:11434`

Want to customize? Just set these environment variables:

```bash
# 🐧 Linux/macOS
export LM_STUDIO_ENDPOINT="http://your-lm-studio-address:port"
export OLLAMA_ENDPOINT="http://your-ollama-address:port"

# 🪟 Windows
set LM_STUDIO_ENDPOINT=http://your-lm-studio-address:port
set OLLAMA_ENDPOINT=http://your-ollama-address:port
```

## 💻 Usage Examples

See the LLM Arbitrator in action with these practical examples!

### 🔍 Smart Context Management

Find all the right files automatically - no more hunting through codebases!

```javascript
// Automatically find relevant files for a task
const contextFiles = await use_mcp_tool({
  server_name: "llm-arbitrator",
  tool_name: "get_context_files",
  arguments: {
    filePath: "src/components/UserProfile.js",
    maxFiles: 15,          // Optional: limit number of files (default: 10)
    includeTests: true,    // Optional: include test files (default: true)
    includeDocs: true      // Optional: include documentation (default: true)
  }
});

// The result contains categorized files:
// {
//   "related_files": ["src/components/Avatar.js", "src/context/UserContext.js", ...],
//   "test_files": ["tests/components/UserProfile.test.js", ...],
//   "documentation_files": ["docs/components.md", ...],
//   "all_files": [/* Combined array of all files */]
// }
```

### 💻 Enhanced Code Generation

Get superhuman code from specialized models - perfect for complex programming tasks!

```javascript
// Generate code leveraging specialized models
const result = await use_mcp_tool({
  server_name: "llm-arbitrator",
  tool_name: "enhance_code_generation",
  arguments: {
    taskDescription: "Create a quantum circuit that implements Grover's algorithm for a 3-qubit system",
    language: "qiskit",
    domain: "quantum",
    files: ["project/existing_circuits.py", "project/utils.py"], // Optional context files
    provider: "lmstudio",  // Optional: specify provider (auto-selected if omitted)
    model: "deepseek-r1-distill-qwen-32b" // Optional: specify model
  }
});
```

### 🔎 Code Verification

Double-check your solutions with models that excel at reasoning and debugging!

```javascript
// Verify code solutions with reasoning-focused models
const verification = await use_mcp_tool({
  server_name: "llm-arbitrator",
  tool_name: "verify_solution",
  arguments: {
    code: "def factorial(n):\n  if n <= 1:\n    return 1\n  return n * factorial(n-1)",
    language: "python",
    taskDescription: "Implement a recursive factorial function",
    files: ["tests/test_factorial.py"], // Optional reference or test files
    provider: "ollama",  // Optional: specify provider
    model: "deepseek-r1:70b" // Optional: specify model
  }
});
```

### ✨ Prompt Optimization

Supercharge your prompts for better responses from any AI assistant!

```javascript
// Optimize prompts for more efficient processing
const optimizedPrompt = await use_mcp_tool({
  server_name: "llm-arbitrator",
  tool_name: "optimize_prompt",
  arguments: {
    originalPrompt: "I need code for quantum teleportation",
    domain: "quantum",
    files: ["docs/quantum_teleportation.md"], // Optional reference materials
  }
});
```

### 🔄 Multi-Model Workflow

Chain multiple models together in a powerful workflow - like an AI assembly line!

```javascript
// Example of a multi-model workflow
const contextFiles = await use_mcp_tool({
  server_name: "llm-arbitrator",
  tool_name: "get_context_files",
  arguments: { filePath: "src/main.js" }
});

// Generate code with a specialized code model
const codeResult = await use_mcp_tool({
  server_name: "llm-arbitrator",
  tool_name: "enhance_code_generation",
  arguments: {
    taskDescription: "Implement a caching layer for API requests",
    language: "javascript",
    files: contextFiles.all_files,
    domain: "performance"
  }
});

// Verify the solution with a reasoning-focused model
const verificationResult = await use_mcp_tool({
  server_name: "llm-arbitrator",
  tool_name: "verify_solution",
  arguments: {
    code: codeResult.implementation,
    language: "javascript",
    taskDescription: "Check for edge cases and performance issues"
  }
});

// Final result combines both model outputs
console.log({
  implementation: codeResult.implementation,
  reasoning: codeResult.reasoning,
  verification: verificationResult.analysis,
  suggestions: verificationResult.suggestions
});
```

## 🏗️ Architecture

The LLM Arbitrator uses a provider-based architecture to abstract different model backends:

```
                     +----------------+
                     |                |
                     |  Claude/Cline  |
                     |                |
                     +--------+-------+
                              |
                              | MCP Request
                              v
                     +--------+-------+
                     |                |
                     | LLM Arbitrator |<---+
                     |     Server     |    |
                     |                |    |
                     +--------+-------+    |
                              |            |
                              |            | Processed Results
          +-------------------+-------------------+
          |                   |                   ^
          | Provider          | Context           | Result
          | Selection         | Management        | Processing
          |                   |                   |
          v                   v                   v
    +-----+------+    +-------+-------+    +------+-------+
    |            |    |               |    |              |
    | Provider   |    |    Context    |    |    Result    |
    | Manager    |    |    Manager    |    |   Processor  +---+
    |            |    |               |    |              |   |
    +-----+------+    +-------+-------+    +------+-------+   |
          |                   |                   ^           |
          |                   |                   |           |
    +-----+-------+           |                   |           |
    |     |       |           | Queries           |           |
    v     v       v           v                   |           |
+---+--+--+---+---+--+  +-----+------+            |           |
|      |      |      |  |            |            |           |
|LM    |Ollama|Custom|  |   File     |            |           |
|Studio|      |APIs  |  |  System    |            |           |
|      |      |      |  |            |            |           |
+---+--+--+---+--+---+  +------------+            |           |
    |     |      |                                |           |
    |     |      | API Calls                      |           |
    v     v      v                                |           |
+---+--+--+---+--+---+                            |           |
|      |      |      |                            |           |
|LM    |Ollama|Custom|                            |           |
|Studio|API   |API   +----------------------------+           |
|API   |      |      |                                        |
|      |      |      |                         Results        |
+------+------+------+                                        |
          |                                                   |
          | Raw Model Responses                               |
          +---------------------------------------------------+
                     |
                     | Enhanced Response
                     v
              +------+-------+
              |              |
              | Claude/Cline |
              |              |
              +--------------+
```

### Provider Interface

All model providers implement a consistent interface:

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

## ✨ Advanced Features

### 🧠 Chain-of-Thought Preservation

See exactly how the AI reached its conclusions! All tools preserve the model's reasoning process:

```markdown
# Enhanced Solution

## Model Reasoning Process

I'll approach this caching implementation by breaking it down into components:
1. First, we need a cache storage mechanism
2. Then, we need to intercept API calls
3. We should implement cache invalidation strategies
4. Finally, we need to handle edge cases like errors

[detailed reasoning continues]

## Implementation

```javascript
class APICache {
  constructor(ttl = 300000) {
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  // Implementation details...
}
```

## Key Insights

1. Using a Map for cache storage provides O(1) lookup performance
2. TTL-based invalidation prevents stale data issues
3. Request parameter serialization is crucial for proper cache key generation
```

### 🎯 Model Selection Algorithm

The system intelligently selects the perfect model for each task through a sophisticated scoring system:

1. **📋 Task Analysis**: Extracts key requirements from the task description
2. **🧩 Capability Matching**: Maps task requirements to model capabilities 
3. **🔢 Score Calculation**:
   - Domain relevance (0-10)
   - Task type match (0-10)
   - Language support (0-5)
   - Specialization match (0-10)
   - Performance metrics (0-5)
4. **🏆 Provider Selection**: Chooses the highest-scoring provider
5. **🔄 Fallback Handling**: Gracefully handles unavailable models

This results in optimal model selection for each specific task - like having the perfect expert for every job!

### 🧩 Capability-Based Model Selection

The system matches task requirements to model capabilities with precision:

```typescript
// Example capability registration
{
  domain: 'code',
  tasks: ['generation', 'explanation', 'verification'],
  languageSupport: ['python', 'javascript', 'typescript', 'go', 'rust'],
  specializations: ['web', 'data-science', 'systems'],
  performanceMetrics: {
    accuracy: 0.85,
    speed: 0.7,
  }
}
```

This enables intelligent routing of tasks to the most suitable model automatically - no more guesswork about which model to use!

## 👨‍💻 Development

Ready to contribute or customize? The LLM Arbitrator is developer-friendly!

```bash
# 📦 Install dependencies
npm install

# 🏗️ Build the server in watch mode
npm run dev

# 🧪 Run tests
npm test

# 🔍 Run provider tests
node test-providers.js

# 🧠 Run other specific test suites
node test-chain-of-thought.js
node test-context-manager.js
node test-integrated-features.js

# ✅ Lint the code
npm run lint
```

### 🧩 Adding a Custom Provider

Want to add your own model providers? It's easy!

1. 📝 Implement the `ModelProvider` interface
2. 🔌 Register capabilities for intelligent routing
3. 🧰 Add to the provider factory

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed instructions on creating custom providers.

## 🔧 Troubleshooting

Hit a roadblock? We've got you covered!

### 🔌 Provider Connection Issues

#### 🟣 LM Studio
- 🚀 Ensure LM Studio is running with models loaded
- 🔗 Check that the API endpoint is set to `http://127.0.0.1:1234` in LM Studio
- 🔍 Verify the `LM_STUDIO_ENDPOINT` environment variable if using a custom endpoint
- ✅ Check the "Enable API server" option in LM Studio settings

#### 🟠 Ollama
- 🚀 Ensure Ollama is running (`ollama serve` command)
- 📋 Verify models are installed via `ollama list`
- 🔍 Check the `OLLAMA_ENDPOINT` environment variable if using a custom endpoint
- 📥 Try pulling a model if it's not showing up: `ollama pull deepseek-r1:70b`

### 🚫 Common Errors

| Error | Possible Causes | Solutions |
|-------|----------------|-----------|
| 🔌 `Provider not available` | Provider server not running | Start LM Studio or Ollama |
| 🔍 `Model not found` | Requested model not installed | Install model or use a different one |
| 🧱 `Connection refused` | Incorrect endpoint or server not running | Check endpoint and server status |
| 📚 `Context length exceeded` | Too many files or large content | Reduce context with fewer files |
| ⏱️ `Timeout error` | Model inference taking too long | Use a smaller model or increase timeout |

### 📊 Detailed Logging

Need to see what's happening under the hood? Enable detailed logging with:

```bash
# 🐧 Linux/macOS
export DEBUG_MODE=true
export LOG_LEVEL=debug

# 🪟 Windows
set DEBUG_MODE=true
set LOG_LEVEL=debug
```

### 🆘 Getting Help

Hit a snag? We're here to help!

- 🔍 Check the [GitHub Issues](https://github.com/tsotchke/llm-arbitrator/issues) for known problems
- 📚 See [CONTRIBUTING.md](CONTRIBUTING.md) for development questions
- 💬 Join our [Discord community](https://discord.gg/llm-arbitrator) for live support

## 🤲 Contributing

We ❤️ contributions! The LLM Arbitrator is better because of our amazing community.

See [CONTRIBUTING.md](CONTRIBUTING.md) for details on:
- ✏️ Code style and guidelines
- 🔄 Pull request process
- 🛠️ Development environment setup
- 🧩 Adding new providers
- 🧪 Testing requirements

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📚 Citation

If you use LLM Arbitrator in your research or applications, please cite it as:

```bibtex
@software{tsotchke2025llmarbitrator,
  author       = {tsotchke},
  title        = {{LLM Arbitrator: A Framework for Intelligent Model Coordination}},
  year         = {2025},
  publisher    = {GitHub},
  url          = {https://github.com/tsotchke/llm-arbitrator},
  note         = {An MCP-compatible framework for orchestrating multiple language models through capability-based routing}
}
```

---

## ✨ Ready to orchestrate your AI ensemble?

[Get started now](#quick-start) and experience the power of intelligent model coordination!

---

© 2025 tsotchke. All Rights Reserved.
