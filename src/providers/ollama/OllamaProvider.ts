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
 * Configuration options for the Ollama provider
 */
export interface OllamaConfig {
  /**
   * The endpoint URL for the Ollama API
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
 * Ollama provider implementation that connects to the Ollama API
 */
export class OllamaProvider extends BaseModelProvider {
  private api: AxiosInstance;
  private endpoint: string;
  private debug: boolean;
  
  /**
   * Create a new Ollama provider
   * @param config Configuration options for the provider
   */
  constructor(config?: OllamaConfig) {
    super('ollama', config);
    
    this.endpoint = this.getConfigValue<string>('endpoint', 'http://127.0.0.1:11434');
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
        console.log('Ollama API Request:', request);
        return request;
      });
      
      this.api.interceptors.response.use((response) => {
        console.log('Ollama API Response:', response.data);
        return response;
      }, (error) => {
        console.error('Ollama API Error:', error);
        return Promise.reject(error);
      });
    }
  }
  
  /**
   * Test the connection to Ollama
   * @returns Promise resolving to true if connection is successful
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.api.get('/api/tags');
      if (response.status === 200) {
        console.log('Ollama API connection successful');
        
      // Always update the default model with the first available one if we don't have a specific one set
      if ((!this.defaultModel || this.defaultModel === '') && response.data.models && response.data.models.length > 0) {
        this.defaultModel = response.data.models[0].name;
        console.log(`Using first available Ollama model as default: ${this.defaultModel}`);
      }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Ollama API connection failed:', error);
      return false;
    }
  }
  
  /**
   * Get the available models from Ollama
   * @returns Promise resolving to an array of model IDs
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.api.get('/api/tags');
      if (response.status === 200 && response.data.models) {
        return response.data.models.map((model: any) => model.name);
      }
      return [];
    } catch (error) {
      console.error('Failed to get available models from Ollama:', error);
      return [];
    }
  }
  
  /**
   * Get the capabilities of the Ollama models
   * @returns Array of model capabilities
   */
  getCapabilities(): ModelCapability[] {
    // Base capabilities that all Ollama models should have
    const baseCapabilities: ModelCapability[] = [
      {
        domain: 'chat',
        tasks: ['conversation', 'assistance'],
        performanceMetrics: {
          accuracy: 0.85,
          speed: 0.8,
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
            languageSupport: ['python', 'javascript', 'typescript', 'go', 'rust', 'java'],
            specializations: ['functional', 'web'],
            performanceMetrics: {
              accuracy: 0.82,
              speed: 0.8, // Generally faster than LM Studio for same model size
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
              accuracy: 0.78,
              speed: 0.75,
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
   * Send a completion request to Ollama
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
      // Ensure we have a valid model
      const modelToUse = mergedOptions.model || this.defaultModel;
      
      // Get available models to check if the requested model exists
      const availableModels = await this.getAvailableModels();
      
      if (!availableModels.includes(modelToUse)) {
        console.warn(`Model ${modelToUse} not found. Available models: ${availableModels.join(', ')}`);
        
        // If we don't have any available models, throw an error
        if (availableModels.length === 0) {
          throw new Error('No models available on Ollama server');
        }
        
        // Otherwise use the first available model
        console.log(`Falling back to ${availableModels[0]}`);
      }
      
      const requestBody: any = {
        model: availableModels.includes(modelToUse) ? modelToUse : availableModels[0],
        options: {
          temperature: mergedOptions.temperature ?? 0.7,
          num_predict: mergedOptions.max_tokens ?? 2000,
        },
        stream: false,
      };
    
    // Process different prompt input formats
    if (typeof promptData === 'string') {
      // Simple string prompt
      if (mergedOptions.system_message) {
        requestBody.messages = [
          { role: 'system', content: mergedOptions.system_message },
          { role: 'user', content: promptData }
        ];
      } else {
        requestBody.prompt = promptData;
      }
    } else if (typeof promptData === 'object') {
      // If using messages, build an array of content objects similar to LM Studio
      // This is more structured and flexible than a simple concatenated string
      if (mergedOptions.system_message) {
        requestBody.messages = [
          { role: 'system', content: mergedOptions.system_message }
        ];
        
        // Build user message with content array if possible
        const userContent = [];
        
        // Add the primary text content
        if (promptData.text) {
          userContent.push(promptData.text);
        }
        
        // Process files if present
        if (promptData.files && promptData.files.length > 0) {
          for (const filePath of promptData.files) {
            try {
              // Resolve the file path to ensure proper handling
              const resolvedPath = path.resolve(filePath);
              
              // Only proceed if the file exists
              if (fs.existsSync(resolvedPath)) {
                const fileContent = fs.readFileSync(resolvedPath, 'utf8');
                const fileName = path.basename(resolvedPath);
                const fileExt = path.extname(resolvedPath).substring(1); // Get extension without dot
                
                // Format file content with syntax highlighting based on extension
                const formattedContent = `# File: ${fileName}\n\`\`\`${fileExt}\n${fileContent}\n\`\`\`\n`;
                userContent.push(formattedContent);
                
                console.log(`Added file ${fileName} content to Ollama prompt (${fileContent.length} bytes)`);
              } else {
                console.error(`File not found: ${filePath} (resolved to ${resolvedPath})`);
              }
            } catch (error) {
              console.error(`Error reading file ${filePath}:`, error);
            }
          }
        }
        
        // Add user message with complete content
        requestBody.messages.push({
          role: 'user',
          content: userContent.join('\n\n')
        });
      } else {
        // For the /api/generate endpoint (without system message)
        // Fall back to the simpler concatenated prompt approach
        let combinedContent = promptData.text || '';
        
        // Process files if present
        if (promptData.files && promptData.files.length > 0) {
          // Create an array to store individual file contents
          let fileTexts = [];
          
          for (const filePath of promptData.files) {
            try {
              // Resolve the file path to ensure proper handling
              const resolvedPath = path.resolve(filePath);
              
              // Only proceed if the file exists
              if (fs.existsSync(resolvedPath)) {
                const fileContent = fs.readFileSync(resolvedPath, 'utf8');
                const fileName = path.basename(resolvedPath);
                const fileExt = path.extname(resolvedPath).substring(1); // Get extension without dot
                
                // Format file content with syntax highlighting based on extension
                const formattedContent = `# File: ${fileName}\n\`\`\`${fileExt}\n${fileContent}\n\`\`\`\n`;
                fileTexts.push(formattedContent);
                
                console.log(`Added file ${fileName} content to Ollama prompt (${fileContent.length} bytes)`);
              } else {
                console.error(`File not found: ${filePath} (resolved to ${resolvedPath})`);
              }
            } catch (error) {
              console.error(`Error reading file ${filePath}:`, error);
            }
          }
          
          // Combine all file contents
          if (fileTexts.length > 0) {
            combinedContent += `\n\n## Reference Files\n${fileTexts.join('\n')}\n`;
            console.log(`Added ${fileTexts.length} files to Ollama prompt`);
          }
        }
        
        requestBody.prompt = combinedContent;
      }
      
      // Note: Ollama doesn't support images in the same way as OpenAI API
      if (promptData.images && promptData.images.length > 0) {
        console.warn('Image support not available for Ollama provider');
      }
    }
    
    // Add stop sequences if provided
    if (mergedOptions.stop && mergedOptions.stop.length > 0) {
      requestBody.options.stop = mergedOptions.stop;
    }
    
    // Make the API request
    try {
      if (this.debug) {
        console.log('Sending request to Ollama model:', requestBody.model);
      }
      
      // Determine if we should use the chat or completion endpoint
      const endpoint = requestBody.messages ? '/api/chat' : '/api/generate';
      const response = await this.api.post(endpoint, requestBody);
      
      if (response.status === 200) {
        if (requestBody.messages) {
          // Chat completion response format
          return response.data.message?.content || '';
        } else {
          // Text completion response format
          return response.data.response || '';
        }
      } else {
        throw new Error('Invalid response from Ollama API');
      }
    } catch (error: any) {
      console.error('Ollama completion error:', error.message);
      throw new Error(`Ollama API error: ${error.message}`);
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
