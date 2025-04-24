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
    this.defaultModel = this.getConfigValue<string>('defaultModel', 'deepseek-r1-distill-qwen-32b-uncensored-mlx');
    
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
    // This is a simplified approach - ideally would be more dynamic based on available models
    return [
      {
        domain: 'code',
        tasks: ['generation', 'explanation', 'verification'],
        languageSupport: ['python', 'javascript', 'typescript', 'c', 'cpp', 'java', 'rust'],
        specializations: ['functional', 'quantum'],
        performanceMetrics: {
          accuracy: 0.85,
          speed: 0.7,
        },
      },
      {
        domain: 'reasoning',
        tasks: ['analysis', 'problemSolving', 'chainOfThought'],
        performanceMetrics: {
          accuracy: 0.8,
          speed: 0.6,
        },
      },
    ];
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
    
    // Prepare the API request
    const requestBody: any = {
      model: mergedOptions.model || this.defaultModel,
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
            
            // For simplicity, we're treating all files as text
            // A more advanced implementation would handle different file types
            console.log(`Added text file ${fileName} content to prompt (${fileContent.length} bytes)`);
            content.push({
              type: 'text',
              text: `File: ${fileName}\n\n${fileContent}`
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
      console.error('LM Studio completion error:', error.message);
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
