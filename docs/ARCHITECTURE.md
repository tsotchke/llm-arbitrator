# LLM Arbitrator Architecture Guide

This document describes the internal architecture of the LLM Arbitrator framework, providing an overview of its components, data flows, and design patterns.

## System Architecture Overview

```
                                   ┌────────────────┐
                                   │ Client (AI API)│
                                   └────────┬───────┘
                                            │
                                            │ MCP Protocol
                                            ▼
                                   ┌────────────────┐
                                   │  MCP Adapter   │
                                   └────────┬───────┘
                                            │
                                            │ Internal APIs
                                            ▼
                        ┌──────────────────────────────────┐
                        │        Arbitration Core         ◄├────────────┐
                        └─┬─────────────┬──────────────┬───┘            │
                          │             │              │                │
        ┌─────────────────┘    ┌────────┘        ┌─────┘                │
        │                      │                 │                      │
        ▼                      ▼                 ▼                      │
┌───────────────┐    ┌─────────────────┐   ┌────────────────┐    ┌──────┴─────────┐
│ Context       │    │ Provider        │   │ Feature        │    │ Result         │
│ Manager       │◄───┤ Manager         │   │ Enhancers      │    │ Processor      │
└───┬─────┬─────┘    └─────┬─────┬─────┘   └──┬──────┬──────┘    └───────┬────────┘
    │     │                │     │            │      │                   ▲
    │     │                │     │            │      │                   │
    │     │                │     │            │      │                   │
    │     │                │     ▼            ▼      ▼                   │
    │     │                │  ┌──────────────────────────┐               │
    │     │                │  │ Provider Interface       │               │
    │     │                │  └───────┬──────────┬───────┘               │
    │     │                │          │          │                       │
    │     │                │          │          │                       │
    │     │                │          ▼          ▼                       │
    │     │                │  ┌──────────┐ ┌───────────┐                 │
    │     │                │  │ LM Studio│ │ Ollama    │                 │
    │     │                │  └─────┬────┘ └─────┬─────┘                 │
    │     │                │        │            │                       │
    │     │                │        └──────┬─────┘                       │
    │     │                │               │                             │
    │     │                └───────────────┼─────────────────────────────┘
    │     │                                │
    │     │                                ▼
    │     │      ┌───────────────────────────────────────┐
    │     │      │          Result Data                  │
    │     │      └───────────────────────────────────────┘
    │     │
    │     ▼
    │  ┌──────────────────┐
    │  │ Code Generator   │
    │  │ Enhancer         │
    │  └──────────────────┘
    │
    ▼
┌──────────────────┐
│ Verification     │
│ Enhancer         │
└──────────────────┘
```

## Core Components

### 1. MCP Adapter

**Purpose**: Handles communication between the client (Claude/Cline) and the LLM Arbitrator using the Model Context Protocol.

**Key Files**:
- `src/mcp-adapter.ts`
- `src/custom-transport.ts`

**Responsibilities**:
- Parse incoming MCP requests
- Route requests to appropriate handlers
- Format responses according to MCP specifications
- Manage communication channels

### 2. Arbitration Core

**Purpose**: Central coordination unit that manages the workflow between components.

**Key Files**:
- `src/index.ts`

**Responsibilities**:
- Initialize system components
- Route requests to appropriate enhancers
- Coordinate between providers and feature handlers
- Manage system lifecycle

### 3. Provider Manager

**Purpose**: Manages model providers and handles provider selection.

**Key Files**:
- `src/providers/ProviderFactory.ts`
- `src/providers/interfaces/ModelProvider.ts`

**Responsibilities**:
- Discover and initialize available providers
- Select appropriate providers based on task requirements
- Provide a unified interface to different model backends
- Handle fallbacks when providers are unavailable

### 4. Context Manager

**Purpose**: Discovers and manages context for model requests.

**Key Files**:
- `src/utils/contextManager.ts`

**Responsibilities**:
- Discover related files for a given source file
- Prioritize context based on relevance
- Format context for inclusion in model prompts
- Manage context window limitations

### 5. Feature Enhancers

**Purpose**: Specialized components that implement specific MCP tools.

**Key Files**:
- `src/enhancers/codeEnhancer.ts`
- `src/enhancers/verificationEnhancer.ts`
- `src/enhancers/promptEnhancer.ts`

**Responsibilities**:
- Implement specialized logic for each MCP tool
- Format prompts for models
- Process and structure model outputs
- Handle tool-specific error cases

### 6. Provider Implementations

**Purpose**: Concrete implementations for different model backends.

**Key Files**:
- `src/providers/lmstudio/LmStudioProvider.ts`
- `src/providers/ollama/OllamaProvider.ts`

**Responsibilities**:
- Connect to specific model backends
- Translate between common interface and provider-specific APIs
- Handle provider-specific error cases
- Manage provider capabilities

### 7. Result Processor

**Purpose**: Processes the results from model providers before returning to the client.

**Key Files**:
- `src/utils/resultProcessor.ts`

**Responsibilities**:
- Format model outputs into standardized response structures
- Apply post-processing to enhance model outputs
- Combine results from multiple models when needed
- Handle chain-of-thought preservation
- Apply error handling and fallback strategies

## Key Interfaces

### ModelProvider Interface

```typescript
interface ModelProvider {
  // Provider identification
  getName(): string;
  getCapabilities(): ModelCapability[];
  
  // Connection management
  testConnection(): Promise<boolean>;
  initialize(config?: Record<string, any>): Promise<void>;
  
  // Model management
  getAvailableModels(): Promise<string[]>;
  getDefaultModel(): string;
  supportsModel(modelId: string): Promise<boolean>;
  
  // Core functionality
  completePrompt(
    promptData: PromptInput, 
    options?: RequestOptions
  ): Promise<string>;
}
```

### ModelCapability Interface

```typescript
interface ModelCapability {
  domain: string;       // e.g., 'code', 'reasoning'
  tasks: string[];      // e.g., ['generation', 'explanation']
  languageSupport?: string[]; // e.g., ['python', 'javascript']
  specializations?: string[]; // e.g., ['quantum', 'web']
  performanceMetrics?: Record<string, number>; // e.g., { accuracy: 0.85 }
}
```

### PromptInput Type

```typescript
type PromptInput = string | { 
  text: string; 
  files?: string[];
  images?: string[];
  [key: string]: any;
};
```

### RequestOptions Interface

```typescript
interface RequestOptions {
  temperature?: number;
  max_tokens?: number;
  model?: string;
  system_message?: string;
  stop?: string[];
  [key: string]: any;
}
```

## Data Flow

### 1. Request Processing Flow

```
Client Request
  │
  ▼
MCP Adapter parses request
  │
  ▼
Arbitration Core identifies handler
  │
  ▼
Feature Enhancer formats request
  │
  ▼
Context Manager adds relevant context
  │
  ▼
Provider Manager selects appropriate provider
  │
  ▼
Provider sends request to model
  │
  ▼
Provider receives and processes response
  │
  ▼
Result Processor formats and enhances output
  │
  ▼
Feature Enhancer structures final output
  │
  ▼
MCP Adapter formats and returns response
```

### 2. Provider Selection Flow

```
Task Requirements
  │
  ▼
Get available providers
  │
  ▼
For each provider:
  │
  ▼
Get provider capabilities
  │
  ▼
Calculate capability match score
  │
  ▼
Select provider with highest score
  │
  ▼
Fallback to next best if primary fails
```

### 3. Context Discovery Flow

```
Source File(s)
  │
  ▼
Identify import statements
  │
  ▼
Find related files (imports, references)
  │
  ▼
Discover test files
  │
  ▼
Find documentation
  │
  ▼
Prioritize by relevance
  │
  ▼
Format for inclusion in prompt
```

## Design Patterns Used

### 1. Factory Pattern

Used in `ProviderFactory` to create provider instances based on configuration.

```typescript
static createProvider(config: ProviderConfig): ModelProvider {
  switch (config.type) {
    case 'lmstudio':
      return new LmStudioProvider(config.options);
    case 'ollama':
      return new OllamaProvider(config.options);
    default:
      throw new Error(`Unknown provider type: ${config.type}`);
  }
}
```

### 2. Strategy Pattern

Used for selecting different enhancers based on the requested tool.

```typescript
// Conceptual example
const enhancers = {
  'enhance_code_generation': new CodeEnhancer(),
  'verify_solution': new VerificationEnhancer(),
  'optimize_prompt': new PromptEnhancer(),
  'get_context_files': new ContextEnhancer()
};

function handleRequest(request) {
  const enhancer = enhancers[request.tool_name];
  if (!enhancer) {
    throw new Error(`Unknown tool: ${request.tool_name}`);
  }
  return enhancer.handle(request);
}
```

### 3. Adapter Pattern

Used to adapt between different provider APIs and the common interface.

```typescript
// Converting LM Studio API responses to common format
async getAvailableModels(): Promise<string[]> {
  const response = await this.api.get('/v1/models');
  return response.data.data.map(model => model.id);
}
```

### 4. Observer Pattern

Used for logging and monitoring system behavior.

```typescript
// Conceptual example
class ArbitrationCore {
  private observers: Observer[] = [];
  
  addObserver(observer: Observer) {
    this.observers.push(observer);
  }
  
  notifyProviderSelection(provider: ModelProvider) {
    for (const observer of this.observers) {
      observer.onProviderSelected(provider);
    }
  }
}
```

## Configuration System

The configuration system uses a layered approach:

1. **Default Values**: Hard-coded sensible defaults
2. **Environment Variables**: Override defaults with environment settings
3. **Configuration File**: More detailed configurations from file
4. **Runtime Overrides**: Dynamic overrides passed at runtime

Example priority:
```
Runtime parameter > Config file > Environment variable > Default value
```

## Extension Points

### Adding a New Provider

1. Create a new directory in `src/providers/your-provider`
2. Implement the `ModelProvider` interface
3. Add to the `ProviderFactory`
4. Register capabilities

### Adding a New Enhancer

1. Create a new file in `src/enhancers/`
2. Implement the enhancer logic
3. Register with the MCP adapter in `src/index.ts`

### Adding New Tools

1. Define the tool schema in `src/mcp-adapter.ts`
2. Create an enhancer for the tool
3. Register the tool in the MCP adapter

## Performance Considerations

1. **Caching**: Results and context can be cached to improve performance
2. **Context Optimization**: Careful management of context window usage
3. **Provider Selection**: Performance-based routing to faster models when appropriate
4. **Parallel Processing**: Some operations can be parallelized

## Security Considerations

1. **Input Validation**: All inputs are validated before use
2. **Model Isolation**: Models run in isolated environments
3. **File Access**: Limited to explicitly provided paths
4. **Error Handling**: Sensitive information is stripped from error messages

## Testing Approach

1. **Unit Tests**: Test individual components in isolation
2. **Integration Tests**: Test interactions between components
3. **Provider Tests**: Test specific provider implementations
4. **End-to-End Tests**: Test complete workflows

## Logging and Debugging

The system provides detailed logging at different levels:

- **ERROR**: Critical issues that prevent operation
- **WARN**: Issues that don't prevent operation but may cause problems
- **INFO**: Important operational events
- **DEBUG**: Detailed information for troubleshooting

Enable debug logging with `DEBUG_MODE=true` and `LOG_LEVEL=debug`.
