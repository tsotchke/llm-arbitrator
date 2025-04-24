import { ModelProvider } from './interfaces/ModelProvider.js';
import { LmStudioProvider, LmStudioConfig } from './lmstudio/LmStudioProvider.js';
import { OllamaProvider, OllamaConfig } from './ollama/OllamaProvider.js';

/**
 * Provider types supported by the factory
 */
export type ProviderType = 'lmstudio' | 'ollama';

/**
 * Configuration for provider creation
 */
export interface ProviderConfig {
  /**
   * Type of provider to create
   */
  type: ProviderType;
  
  /**
   * Configuration options for the provider
   */
  options?: Record<string, any>;
}

/**
 * Factory for creating model provider instances
 */
export class ProviderFactory {
  /**
   * Registry of created providers to avoid duplicate instances
   */
  private static providers: Map<string, ModelProvider> = new Map();
  
  /**
   * Create a provider instance based on configuration
   * @param config Provider configuration
   * @returns ModelProvider instance
   */
  static createProvider(config: ProviderConfig): ModelProvider {
    const { type, options } = config;
    
    // Create a cache key based on provider type and options
    const cacheKey = this.getCacheKey(type, options);
    
    // Return existing provider if it exists
    if (this.providers.has(cacheKey)) {
      return this.providers.get(cacheKey)!;
    }
    
    // Create a new provider instance
    let provider: ModelProvider;
    
    switch (type) {
      case 'lmstudio':
        provider = new LmStudioProvider(options as LmStudioConfig);
        break;
      
      case 'ollama':
        provider = new OllamaProvider(options as OllamaConfig);
        break;
      
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
    
    // Cache and return the provider
    this.providers.set(cacheKey, provider);
    
    return provider;
  }
  
  /**
   * Get all available providers based on environment
   * @returns Array of provider configurations
   */
  static async getAvailableProviders(): Promise<ProviderType[]> {
    const availableProviders: ProviderType[] = [];
    
    // Try to connect to LM Studio
    try {
      const lmStudioProvider = new LmStudioProvider();
      const lmStudioConnected = await lmStudioProvider.testConnection();
      
      if (lmStudioConnected) {
        availableProviders.push('lmstudio');
      }
    } catch (error) {
      console.log('LM Studio not available');
    }
    
    // Try to connect to Ollama
    try {
      const ollamaProvider = new OllamaProvider();
      const ollamaConnected = await ollamaProvider.testConnection();
      
      if (ollamaConnected) {
        availableProviders.push('ollama');
      }
    } catch (error) {
      console.log('Ollama not available');
    }
    
    return availableProviders;
  }
  
  /**
   * Initialize all available providers
   * @returns Map of provider type to provider instance
   */
  static async initializeAllProviders(): Promise<Map<ProviderType, ModelProvider>> {
    const availableProviders = await this.getAvailableProviders();
    const providerMap = new Map<ProviderType, ModelProvider>();
    
    for (const providerType of availableProviders) {
      try {
        const provider = this.createProvider({ type: providerType });
        await provider.initialize();
        providerMap.set(providerType, provider);
      } catch (error) {
        console.error(`Failed to initialize ${providerType} provider:`, error);
      }
    }
    
    return providerMap;
  }
  
  /**
   * Get the best provider for a specific capability domain and task
   * @param domain Capability domain (e.g., 'code', 'reasoning')
   * @param task Specific task (e.g., 'generation', 'verification')
   * @returns The provider with the highest capability rating, or undefined if none found
   */
  static async getBestProviderForTask(
    domain: string,
    task: string
  ): Promise<ModelProvider | undefined> {
    const providers = await this.initializeAllProviders();
    let bestProvider: ModelProvider | undefined;
    let bestScore = -1;
    
    for (const provider of providers.values()) {
      const capabilities = provider.getCapabilities();
      
      for (const capability of capabilities) {
        if (capability.domain === domain && capability.tasks.includes(task)) {
          // Use performance metrics if available, otherwise just use 1
          const score = capability.performanceMetrics?.accuracy || 1;
          
          if (score > bestScore) {
            bestScore = score;
            bestProvider = provider;
          }
        }
      }
    }
    
    return bestProvider;
  }
  
  /**
   * Clear the provider cache
   */
  static clearProviderCache(): void {
    this.providers.clear();
  }
  
  /**
   * Create a cache key from provider type and options
   */
  private static getCacheKey(type: string, options?: Record<string, any>): string {
    if (!options) {
      return type;
    }
    
    // Create a stable key from options by sorting keys
    const sortedOptions = Object.keys(options)
      .sort()
      .reduce((acc, key) => {
        acc[key] = options[key];
        return acc;
      }, {} as Record<string, any>);
    
    return `${type}:${JSON.stringify(sortedOptions)}`;
  }
}
