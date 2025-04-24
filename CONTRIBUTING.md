# Contributing to LLM Arbitrator

Thank you for your interest in contributing to the LLM Arbitrator project! This document provides guidelines and instructions for contributing to the project.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Coding Guidelines](#coding-guidelines)
- [Pull Request Process](#pull-request-process)
- [Creating Custom Providers](#creating-custom-providers)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## Code of Conduct

Please be respectful and considerate of others when contributing to this project. We strive to maintain a welcoming and inclusive environment for all contributors.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Set up the development environment (see below)
4. Create a feature branch
5. Make your changes
6. Submit a pull request

## Development Setup

### Prerequisites

- Node.js v16.x or newer
- npm v7.x or newer
- TypeScript knowledge
- For testing: LM Studio and/or Ollama installed

### Environment Setup

```bash
# Clone your fork
git clone https://github.com/your-username/llm-arbitrator.git
cd llm-arbitrator

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode (watches for changes)
npm run dev
```

### Environment Variables

Set up the following environment variables for development:

```bash
# For debugging
export DEBUG_MODE=true
export LOG_LEVEL=debug

# For provider endpoints (if needed)
export LM_STUDIO_ENDPOINT="http://127.0.0.1:1234"
export OLLAMA_ENDPOINT="http://127.0.0.1:11434"
```

## Coding Guidelines

### TypeScript

- Use TypeScript for all new code
- Include proper type definitions
- Avoid using `any` type when possible
- Use interfaces for public APIs

### Style Guidelines

- Use 2 spaces for indentation
- Use single quotes for strings
- Use semicolons
- Use trailing commas in multiline objects and arrays
- Maximum line length of 100 characters
- Use camelCase for variables and methods
- Use PascalCase for class names and interfaces
- Use meaningful, descriptive names

### File Structure

- Place provider implementations in `src/providers/{provider-name}/`
- Place interfaces in `src/providers/interfaces/`
- Add tests in `test/` directory
- Use consistent naming for related files

## Pull Request Process

1. Ensure your code follows the style guidelines
2. Add/update tests for your changes
3. Update documentation to reflect your changes
4. Ensure all tests pass (`npm test`)
5. Submit a pull request with a clear title and description
6. Address any feedback from reviewers

## Creating Custom Providers

The LLM Arbitrator uses a provider-based architecture that allows for easy extension with new model providers. This section guides you through creating a custom provider.

### 1. Create Provider Implementation

Create a new directory in `src/providers` for your provider:

```bash
mkdir -p src/providers/your-provider
```

Create your provider implementation file:

```typescript
// src/providers/your-provider/YourProvider.ts
import { 
  BaseModelProvider,
  ModelCapability, 
  PromptInput, 
  RequestOptions 
} from '../interfaces/ModelProvider.js';

/**
 * Configuration options for your provider
 */
export interface YourProviderConfig {
  endpoint: string;
  defaultModel?: string;
  // Other provider-specific options
}

/**
 * Provider implementation for your model service
 */
export class YourProvider extends BaseModelProvider {
  // Provider implementation
  private api: any; // Your API client

  constructor(config?: YourProviderConfig) {
    super('your-provider-name', config);
    // Initialize your provider
    this.endpoint = this.getConfigValue<string>('endpoint', 'http://default-endpoint');
    this.defaultModel = this.getConfigValue<string>('defaultModel', 'default-model-name');
    
    // Set up API client or other infrastructure
    this.api = // Your API client initialization
  }

  /**
   * Test the connection to your service
   */
  async testConnection(): Promise<boolean> {
    try {
      // Implement connection test logic
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get available models from your service
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      // Implement model listing logic
      return ['model1', 'model2'];
    } catch (error) {
      console.error('Failed to get models:', error);
      return [];
    }
  }

  /**
   * Get capabilities of your models
   */
  getCapabilities(): ModelCapability[] {
    return [
      {
        domain: 'your-domain',
        tasks: ['task1', 'task2'],
        // Other capability declarations
      }
    ];
  }

  /**
   * Send completion request to your service
   */
  async completePrompt(
    promptData: PromptInput,
    options?: RequestOptions
  ): Promise<string> {
    // Implement completion logic
    try {
      // Process prompt input
      const formattedPrompt = typeof promptData === 'string' 
        ? promptData 
        : promptData.text;
        
      // Call your API
      const response = await this.api.complete({
        prompt: formattedPrompt,
        // Map options to your API parameters
      });
      
      // Return processed response
      return response.text || '';
    } catch (error) {
      console.error('Completion error:', error);
      throw new Error(`API error: ${error.message}`);
    }
  }
}
```

### 2. Register Provider in the Factory

Modify the `ProviderFactory.ts` file to include your provider:

```typescript
// Add import for your provider
import { YourProvider, YourProviderConfig } from './your-provider/YourProvider.js';

// Update ProviderType to include your provider
export type ProviderType = 'lmstudio' | 'ollama' | 'your-provider-name';

// In the createProvider method, add a case for your provider
static createProvider(config: ProviderConfig): ModelProvider {
  const { type, options } = config;
  
  // ...existing code...
  
  switch (type) {
    // ...existing cases...
    
    case 'your-provider-name':
      provider = new YourProvider(options as YourProviderConfig);
      break;
      
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
  
  // ...existing code...
}

// Update getAvailableProviders method to check for your provider
static async getAvailableProviders(): Promise<ProviderType[]> {
  const availableProviders: ProviderType[] = [];
  
  // ...existing code...
  
  // Add check for your provider
  try {
    const yourProvider = new YourProvider();
    const connected = await yourProvider.testConnection();
    
    if (connected) {
      availableProviders.push('your-provider-name');
    }
  } catch (error) {
    console.log('Your provider not available');
  }
  
  return availableProviders;
}
```

### 3. Create Tests for Your Provider

Create tests to verify your provider works correctly:

```typescript
// test-your-provider.js
import { YourProvider } from './build/providers/your-provider/YourProvider.js';

async function testYourProvider() {
  console.log('Testing Your Provider...');
  
  try {
    // Create provider
    const provider = new YourProvider({
      debug: true
    });
    
    // Test connection
    const connected = await provider.testConnection();
    console.log(`Connection test: ${connected}`);
    
    // Test model listing
    const models = await provider.getAvailableModels();
    console.log(`Available models: ${models.join(', ')}`);
    
    // Test completion
    const response = await provider.completePrompt(
      "Test prompt",
      { temperature: 0.7 }
    );
    console.log(`Completion response: ${response}`);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testYourProvider().catch(console.error);
```

### 4. Document Your Provider

Update the README.md to include your provider in the supported providers table:

```markdown
| Provider | Status | Models | Key Strengths |
|----------|--------|--------|--------------|
| ... existing providers ... |
| **Your Provider** | ✅ Supported | Model1, Model2 | Your provider's strengths |
```

## Testing Guidelines

### Unit Tests

- Write unit tests for all new functionality
- Place tests in the `test/` directory
- Name test files with a `.test.ts` suffix
- Use Jest for testing

### Provider Tests

- Create integration tests for providers
- Test all provider interface methods
- Verify error handling

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx jest path/to/test

# Run provider tests
node test-providers.js
```

## Documentation

- Update README.md for user-facing changes
- Document public APIs with JSDoc comments
- Update examples when API changes
- Keep architecture diagrams up to date

Thank you for contributing to LLM Arbitrator!
