import axios, { AxiosInstance } from 'axios';
import fs from 'fs';
import path from 'path';
import { 
  BaseModelProvider,
  ModelCapability, 
  PromptInput, 
  RequestOptions 
} from '../interfaces/ModelProvider.js';

/**
 * Configuration options for the LM Studio provider
 */
export interface LmStudioConfig {
  /**
   * The endpoint URL for the LM Studio API
   */
  endpoint: string;
  
  /**
   * Default model to use when not specified
   */
  defaultModel?: string;
  
  /**
   * Default request options to use when not specified
   */
  defaultOptions?: RequestOptions;
  
  /**
   * Timeout for API requests in milliseconds
   */
  timeout?: number;
  
  /**
   * Whether to log detailed API requests and responses
   */
  debug?: boolean;
}

/**
 * LM Studio provider implementation that connects to the LM Studio API
 */
export class LmStudioProvider extends BaseModelProvider {
  private api: AxiosInstance;
  private endpoint: string;
  private debug: boolean;
  
  /**
   * Create a new LM Studio provider
   * @param config Configuration options for the provider
   */
  constructor(config?: LmStudioConfig) {
    super('lmstudio', config);
    
    this.endpoint = this.getConfigValue<string>('endpoint', 'http://127.0.0.1:1234');
    this.debug = this.getConfigValue<boolean>('debug', false);
    
    // Set the default model if provided
    this.defaultModel = this.getConfigValue<string>('defaultModel', '');
    
    // Create axios instance for API requests
    this.api = axios.create({
      baseURL: this.endpoint,
      timeout: this.getConfigValue<number>('timeout', 60000),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Log API requests and responses if debug is enabled
    if (this.debug) {
      this.api.interceptors.request.use((request) => {
        console.log('LM Studio API Request:', request);
        return request;
      });
      
      this.api.interceptors.response.use((response) => {
        console.log('LM Studio API Response:', response.data);
        return response;
      }, (error) => {
        console.error('LM Studio API Error:', error);
        return Promise.reject(error);
      });
    }
  }
  
  /**
   * Test the connection to LM Studio
   * @returns Promise resolving to true if connection is successful
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.api.get('/v1/models');
      if (response.status === 200) {
        console.log('LM Studio API connection successful');
        
        // If we don't have a default model yet, use the first one
        if (!this.defaultModel && response.data.data && response.data.data.length > 0) {
          this.defaultModel = response.data.data[0].id;
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('LM Studio API connection failed:', error);
      return false;
    }
  }
  
  /**
   * Get the available models from LM Studio
   * @returns Promise resolving to an array of model IDs
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.api.get('/v1/models');
      if (response.status === 200 && response.data.data) {
        return response.data.data.map((model: any) => model.id);
      }
      return [];
    } catch (error) {
      console.error('Failed to get available models:', error);
      return [];
    }
  }
  
  /**
   * Get the capabilities of the LM Studio models
   * @returns Array of model capabilities
   */
  getCapabilities(): ModelCapability[] {
    // Base capabilities that all LM Studio models should have
    const baseCapabilities: ModelCapability[] = [
      {
        domain: 'chat',
        tasks: ['conversation', 'assistance'],
        performanceMetrics: {
          accuracy: 0.85,
          speed: 0.7,
        },
      }
    ];
    
    // Try to infer additional capabilities from the model name
    try {
      // If we have a default model, add capabilities based on its name
      if (this.defaultModel) {
        const modelName = this.defaultModel.toLowerCase();
        
        // Code generation capability
        if (
          modelName.includes('code') || 
          modelName.includes('deepseek') || 
          modelName.includes('wizard') ||
          modelName.includes('starcoder') ||
          modelName.includes('codellama')
        ) {
          baseCapabilities.push({
            domain: 'code',
            tasks: ['generation', 'explanation', 'verification'],
            languageSupport: ['python', 'javascript', 'typescript', 'c', 'cpp', 'java', 'rust'],
            specializations: ['functional', 'quantum'],
            performanceMetrics: {
              accuracy: 0.85,
              speed: 0.7,
            },
          });
        }
        
        // Reasoning capability
        if (
          modelName.includes('qwen') || 
          modelName.includes('llama') || 
          modelName.includes('mixtral') ||
          modelName.includes('deepseek') ||
          modelName.includes('mistral')
        ) {
          baseCapabilities.push({
            domain: 'reasoning',
            tasks: ['analysis', 'problemSolving', 'chainOfThought'],
            performanceMetrics: {
              accuracy: 0.8,
              speed: 0.6,
            },
          });
        }
        
        // Multilingual capability (especially for Qwen models)
        if (modelName.includes('qwen')) {
          baseCapabilities.push({
            domain: 'multilingual',
            tasks: ['translation', 'understanding'],
            performanceMetrics: {
              accuracy: 0.8,
              speed: 0.7,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error inferring model capabilities:', error);
    }
    
    // Ensure we always return at least the base capabilities
    return baseCapabilities;
  }
  
  /**
   * Send a completion request to LM Studio
   * @param promptData The prompt data to send
   * @param options Request options
   * @returns Promise resolving to the model's response
   */
  async completePrompt(
    promptData: PromptInput,
    options?: RequestOptions
  ): Promise<string> {
    // Merge default options with provided options
    const defaultOptions = this.getConfigValue<RequestOptions>('defaultOptions', {});
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Ensure we have a valid model
    let modelToUse = mergedOptions.model || this.defaultModel;
    
    // Get available models to check if the requested model exists
    const availableModels = await this.getAvailableModels();
    
    if (!availableModels.includes(modelToUse)) {
      console.warn(`Model ${modelToUse} not found. Available models: ${availableModels.join(', ')}`);
      
      // If we don't have any available models, throw an error
      if (availableModels.length === 0) {
        throw new Error('No models available on LM Studio server');
      }
      
      // Otherwise use the first available model
      console.log(`Falling back to ${availableModels[0]}`);
      modelToUse = availableModels[0];
    }
    
    // Prepare the API request
    const requestBody: any = {
      model: modelToUse,
      temperature: mergedOptions.temperature ?? 0.7,
      max_tokens: mergedOptions.max_tokens ?? 2000,
      stream: false,
    };

    // Add system message if provided
    if (mergedOptions.system_message) {
      requestBody.messages = [
        { role: 'system', content: mergedOptions.system_message },
      ];
    } else {
      requestBody.messages = [];
    }
    
    // Process different prompt input formats
    if (typeof promptData === 'string') {
      // Simple string prompt
      requestBody.messages.push({ role: 'user', content: promptData });
    } else if (typeof promptData === 'object') {
      // Complex prompt with text and possibly files
      let content: any[] = [{ type: 'text', text: promptData.text }];
      
      // Process files if present
      if (promptData.files && promptData.files.length > 0) {
        for (const filePath of promptData.files) {
          try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const fileName = path.basename(filePath);
            
            // Get file extension for syntax highlighting
            const fileExt = path.extname(fileName).substring(1); // Get extension without dot
            
            // Format file content with syntax highlighting based on extension
            const formattedContent = `# File: ${fileName}\n\`\`\`${fileExt}\n${fileContent}\n\`\`\`\n`;
            
            console.log(`Added text file ${fileName} content to prompt (${fileContent.length} bytes)`);
            content.push({
              type: 'text',
              text: formattedContent
            });
          } catch (error) {
            console.error(`Error reading file ${filePath}:`, error);
          }
        }
      }
      
      // Process images if present
      if (promptData.images && promptData.images.length > 0) {
        console.warn('Image support not fully implemented for LM Studio');
        // Would add image handling here
      }
      
      // Add the complex content to the message
      requestBody.messages.push({ 
        role: 'user', 
        content: content
      });
    }
    
    // Add stop sequences if provided
    if (mergedOptions.stop && mergedOptions.stop.length > 0) {
      requestBody.stop = mergedOptions.stop;
    }
    
    // Make the API request
    try {
      if (this.debug) {
        console.log('Sending request to model:', requestBody.model);
      }
      
      const response = await this.api.post('/v1/chat/completions', requestBody);
      
      if (response.status === 200 && response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content;
      } else {
        throw new Error('Invalid response from LM Studio API');
      }
    } catch (error: any) {
      console.error('LM Studio chat completion error:', error.message);
      
      // If the error is a 404, try a different endpoint variant
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        try {
          console.error('Attempting alternative endpoint structure...');
          
          // Try the /completions endpoint as fallback
          // Simplify the request for completions endpoint
          const completionRequest = {
            model: modelToUse,
            prompt: typeof promptData === 'string' ? promptData : (promptData.text || ''),
            temperature: mergedOptions.temperature ?? 0.7,
            max_tokens: mergedOptions.max_tokens ?? 2000,
            stop: mergedOptions.stop || undefined,
            stream: false,
          };
          
          const altResponse = await this.api.post('/v1/completions', completionRequest);
          
          if (altResponse.status === 200 && altResponse.data.choices && altResponse.data.choices.length > 0) {
            console.error('Alternative endpoint succeeded');
            return altResponse.data.choices[0].text || '';
          }
        } catch (altError) {
          console.error('Alternative endpoint also failed:', altError);
        }
      }
      
      throw new Error(`LM Studio API error: ${error.message}`);
    }
  }
  
  /**
   * Initialize the provider with configuration
   * @param config Provider-specific configuration
   */
  async initialize(config?: Record<string, any>): Promise<void> {
    // Apply any new configuration
    if (config) {
      this.config = { ...this.config, ...config };
      
      // Update endpoint if provided
      if (config.endpoint) {
        this.endpoint = config.endpoint;
        this.api.defaults.baseURL = this.endpoint;
      }
      
      // Update debug setting if provided
      if (typeof config.debug === 'boolean') {
        this.debug = config.debug;
      }
    }
    
    // Test the connection
    await this.testConnection();
  }
}
