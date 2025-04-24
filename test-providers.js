#!/usr/bin/env node
/**
 * Test script to demonstrate the provider-based architecture
 * This tests the ModelProvider interface, provider implementations, and factory
 */

import { ProviderFactory } from './build/providers/ProviderFactory.js';
import { LmStudioProvider } from './build/providers/lmstudio/LmStudioProvider.js';
import { OllamaProvider } from './build/providers/ollama/OllamaProvider.js';

// ANSI color codes for output formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

/**
 * Test ModelProvider interface and implementations
 */
async function testProviders() {
  console.log(`${colors.bright}${colors.blue}===== Testing LLM Arbitrator Provider Framework =====${colors.reset}\n`);
  
  try {
    // Step 1: Get available providers
    console.log(`${colors.cyan}▶ Checking available providers...${colors.reset}`);
    const availableProviders = await ProviderFactory.getAvailableProviders();
    
    console.log(`${colors.green}✓ Found ${availableProviders.length} available providers: ${availableProviders.join(', ')}\n${colors.reset}`);
    
    // If no providers are available, exit early
    if (availableProviders.length === 0) {
      console.log(`${colors.yellow}! No providers available. Please ensure LM Studio or Ollama is running.${colors.reset}`);
      return;
    }
    
    // Step 2: Test LmStudioProvider if available
    if (availableProviders.includes('lmstudio')) {
      console.log(`${colors.cyan}▶ Testing LM Studio provider...${colors.reset}`);
      
      // Create provider instance
      const lmStudioProvider = new LmStudioProvider({
        debug: true
      });
      
      // Test connection
      const lmStudioConnected = await lmStudioProvider.testConnection();
      console.log(`${colors.green}✓ LM Studio connection: ${lmStudioConnected}\n${colors.reset}`);
      
      // Get available models
      console.log(`${colors.cyan}▶ Getting available models from LM Studio...${colors.reset}`);
      const lmStudioModels = await lmStudioProvider.getAvailableModels();
      console.log(`${colors.green}✓ Available models: ${lmStudioModels.join(', ')}\n${colors.reset}`);
      
      // Get provider capabilities
      console.log(`${colors.cyan}▶ Getting LM Studio capabilities...${colors.reset}`);
      const lmStudioCapabilities = lmStudioProvider.getCapabilities();
      console.log(`${colors.green}✓ Capabilities:${colors.reset}`);
      lmStudioCapabilities.forEach(capability => {
        console.log(`  Domain: ${capability.domain}`);
        console.log(`  Tasks: ${capability.tasks.join(', ')}`);
        if (capability.languageSupport) {
          console.log(`  Languages: ${capability.languageSupport.join(', ')}`);
        }
        if (capability.specializations) {
          console.log(`  Specializations: ${capability.specializations.join(', ')}`);
        }
        console.log('');
      });
      
      // Simple completion test if there are models available
      if (lmStudioModels.length > 0) {
        console.log(`${colors.cyan}▶ Testing simple completion with LM Studio...${colors.reset}`);
        try {
          const response = await lmStudioProvider.completePrompt(
            "Hello, can you explain what you are?",
            {
              temperature: 0.7,
              max_tokens: 100
            }
          );
          
          console.log(`${colors.green}✓ Completion response:${colors.reset}`);
          console.log(response.substring(0, 200) + (response.length > 200 ? '...' : ''));
          console.log('');
        } catch (error) {
          console.log(`${colors.red}✗ Completion failed: ${error.message}${colors.reset}\n`);
        }
      }
    }
    
    // Step 3: Test OllamaProvider if available
    if (availableProviders.includes('ollama')) {
      console.log(`${colors.cyan}▶ Testing Ollama provider...${colors.reset}`);
      
      // Create provider instance
      const ollamaProvider = new OllamaProvider({
        debug: true
      });
      
      // Test connection
      const ollamaConnected = await ollamaProvider.testConnection();
      console.log(`${colors.green}✓ Ollama connection: ${ollamaConnected}\n${colors.reset}`);
      
      // Get available models
      console.log(`${colors.cyan}▶ Getting available models from Ollama...${colors.reset}`);
      const ollamaModels = await ollamaProvider.getAvailableModels();
      console.log(`${colors.green}✓ Available models: ${ollamaModels.join(', ')}\n${colors.reset}`);
      
      // Get provider capabilities
      console.log(`${colors.cyan}▶ Getting Ollama capabilities...${colors.reset}`);
      const ollamaCapabilities = ollamaProvider.getCapabilities();
      console.log(`${colors.green}✓ Capabilities:${colors.reset}`);
      ollamaCapabilities.forEach(capability => {
        console.log(`  Domain: ${capability.domain}`);
        console.log(`  Tasks: ${capability.tasks.join(', ')}`);
        if (capability.languageSupport) {
          console.log(`  Languages: ${capability.languageSupport.join(', ')}`);
        }
        if (capability.specializations) {
          console.log(`  Specializations: ${capability.specializations.join(', ')}`);
        }
        console.log('');
      });
      
      // Simple completion test if there are models available
      if (ollamaModels.length > 0) {
        console.log(`${colors.cyan}▶ Testing simple completion with Ollama...${colors.reset}`);
        try {
          const response = await ollamaProvider.completePrompt(
            "Hello, can you explain what you are?",
            {
              temperature: 0.7,
              max_tokens: 100
            }
          );
          
          console.log(`${colors.green}✓ Completion response:${colors.reset}`);
          console.log(response.substring(0, 200) + (response.length > 200 ? '...' : ''));
          console.log('');
        } catch (error) {
          console.log(`${colors.red}✗ Completion failed: ${error.message}${colors.reset}\n`);
        }
      }
    }
    
    // Step 4: Test ProviderFactory
    console.log(`${colors.cyan}▶ Testing ProviderFactory...${colors.reset}`);
    
    // Create provider using factory
    const firstProvider = availableProviders[0];
    console.log(`Creating ${firstProvider} provider through factory...`);
    const provider = ProviderFactory.createProvider({
      type: firstProvider,
      options: {
        debug: false
      }
    });
    
    console.log(`${colors.green}✓ Factory created provider: ${provider.getName()}\n${colors.reset}`);
    
    // Test getBestProviderForTask
    console.log(`${colors.cyan}▶ Testing task-based provider selection...${colors.reset}`);
    
    // Test for code generation task
    const codeProvider = await ProviderFactory.getBestProviderForTask('code', 'generation');
    if (codeProvider) {
      console.log(`${colors.green}✓ Best provider for code generation: ${codeProvider.getName()}${colors.reset}`);
    } else {
      console.log(`${colors.yellow}! No suitable provider found for code generation${colors.reset}`);
    }
    
    // Test for reasoning task
    const reasoningProvider = await ProviderFactory.getBestProviderForTask('reasoning', 'analysis');
    if (reasoningProvider) {
      console.log(`${colors.green}✓ Best provider for reasoning analysis: ${reasoningProvider.getName()}${colors.reset}`);
    } else {
      console.log(`${colors.yellow}! No suitable provider found for reasoning analysis${colors.reset}`);
    }
    
    console.log(`\n${colors.bright}${colors.green}===== Provider tests completed successfully =====${colors.reset}\n`);
    
    // Summary
    console.log(`${colors.cyan}▶ Provider Framework Summary:${colors.reset}`);
    console.log(`- Provider abstraction allows easy switching between different LLM backends`);
    console.log(`- Capability-based selection enables intelligent task routing`);
    console.log(`- Factory pattern simplifies provider creation and management`);
    console.log(`- Multiple providers can be used together based on their strengths\n`);
    
    console.log(`${colors.magenta}This demonstrates how the LLM Arbitrator can leverage multiple models${colors.reset}`);
    console.log(`${colors.magenta}based on their capabilities and availability, providing a unified interface${colors.reset}`);
    console.log(`${colors.magenta}for all model interactions regardless of the underlying provider.${colors.reset}\n`);
    
  } catch (error) {
    console.error(`${colors.red}Error during provider tests:${colors.reset}`, error);
  }
}

// Run the tests
testProviders().catch(console.error);
