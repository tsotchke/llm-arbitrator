/**
 * Base interface for model providers in the LLM Arbitrator system.
 * 
 * All model providers (LM Studio, Ollama, etc.) must implement this interface
 * to ensure consistent interaction patterns regardless of the underlying model API.
 */

/**
 * Represents the capabilities of a specific model
 */
export interface ModelCapability {
  // Domain of capability (e.g., 'code', 'reasoning', 'domain-specific')
  domain: string;
  
  // Specific tasks the model can perform (e.g., 'generation', 'explanation', 'verification')
  tasks: string[];
  
  // Programming languages supported (for code-related tasks)
  languageSupport?: string[];
  
  // Specialized domains (e.g., 'quantum', 'functional')
  specializations?: string[];
  
  // Performance metrics for capability-based routing
  performanceMetrics?: Record<string, number>;
}

/**
 * Options for model completion requests
 */
export interface RequestOptions {
  // Sampling temperature (higher = more creative, lower = more deterministic)
  temperature?: number;
  
  // Maximum tokens to generate
  max_tokens?: number;
  
  // Specific model to use (if provider supports multiple models)
  model?: string;
  
  // System message for setting model behavior
  system_message?: string;
  
  // Stop sequences to end generation
  stop?: string[];
  
  // Additional provider-specific options
  [key: string]: any;
}

/**
 * Input format for prompt data
 */
export type PromptInput = string | { 
  text: string; 
  files?: string[];
  images?: string[];
  [key: string]: any;
};

/**
 * Base interface that all model providers must implement
 */
export interface ModelProvider {
  /**
   * Get the provider's name
   * @returns Provider identifier
   */
  getName(): string;
  
  /**
   * Get the provider's capabilities
   * @returns Array of capabilities for the provider's models
   */
  getCapabilities(): ModelCapability[];
  
  /**
   * Test the connection to the provider
   * @returns Promise resolving to true if connection is successful
   */
  testConnection(): Promise<boolean>;
  
  /**
   * Send a completion request to the provider
   * @param promptData The prompt data to send to the model
   * @param options Additional options for the completion request
   * @returns Promise resolving to the model's response
   */
  completePrompt(
    promptData: PromptInput,
    options?: RequestOptions
  ): Promise<string>;
  
  /**
   * Get the available models from the provider
   * @returns Promise resolving to an array of available model identifiers
   */
  getAvailableModels(): Promise<string[]>;
  
  /**
   * Get the default model for this provider
   * @returns The default model identifier
   */
  getDefaultModel(): string;
  
  /**
   * Check if the provider supports a specific model
   * @param modelId The model identifier to check
   * @returns Promise resolving to true if the model is supported
   */
  supportsModel(modelId: string): Promise<boolean>;
  
  /**
   * Initialize the provider with configuration
   * @param config Provider-specific configuration
   * @returns Promise resolving when initialization is complete
   */
  initialize(config?: Record<string, any>): Promise<void>;
}

/**
 * Abstract base class implementing common provider functionality
 */
export abstract class BaseModelProvider implements ModelProvider {
  protected name: string;
  protected config: Record<string, any>;
  protected defaultModel: string;
  
  constructor(name: string, config?: Record<string, any>) {
    this.name = name;
    this.config = config || {};
    this.defaultModel = '';
  }
  
  getName(): string {
    return this.name;
  }
  
  abstract getCapabilities(): ModelCapability[];
  
  abstract testConnection(): Promise<boolean>;
  
  abstract completePrompt(
    promptData: PromptInput,
    options?: RequestOptions
  ): Promise<string>;
  
  abstract getAvailableModels(): Promise<string[]>;
  
  getDefaultModel(): string {
    return this.defaultModel;
  }
  
  async supportsModel(modelId: string): Promise<boolean> {
    const availableModels = await this.getAvailableModels();
    return availableModels.includes(modelId);
  }
  
  async initialize(config?: Record<string, any>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    // By default, just test the connection
    await this.testConnection();
  }
  
  protected getConfigValue<T>(key: string, defaultValue: T): T {
    return (this.config[key] as T) ?? defaultValue;
  }
}
