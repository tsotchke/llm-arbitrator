import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as mime from 'mime-types';
import { providersConfig, filesConfig, debugConfig } from '../config.js';
import { resolveProjectPath, fileExists, readProjectFile, getPathInfo } from '../utils/pathResolver.js';

/**
 * Helper function to get programming language name from file extension
 * Used for code block syntax highlighting
 */
function getLanguageFromExt(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const langMap: Record<string, string> = {
    '.js': 'javascript',
    '.ts': 'typescript',
    '.py': 'python',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.h': 'c',
    '.hpp': 'cpp',
    '.cs': 'csharp',
    '.go': 'go',
    '.rb': 'ruby',
    '.php': 'php',
    '.html': 'html',
    '.css': 'css',
    '.json': 'json',
    '.xml': 'xml',
    '.md': 'markdown',
    '.sql': 'sql',
    '.sh': 'bash',
    '.bat': 'batch'
  };
  
  return langMap[ext] || '';
}

/**
 * LM Studio OpenAI-compatible API client
 * Connects to a locally running LM Studio server to interact with the DeepSeek R1 model
 * Supports both text and multimodal inputs
 */
export class LmStudioClient {
  private client: AxiosInstance;
  private endpoint: string;
  private defaultModel: string;

  /**
   * Creates a new instance of LmStudioClient
   * @param endpoint Base URL for the LM Studio API server
   * @param defaultModel Default model to use (can be overridden in method calls)
   */
  constructor(
    endpoint: string = providersConfig.lmStudio.endpoint, 
    defaultModel: string = providersConfig.lmStudio.defaultModel
  ) {
    this.endpoint = endpoint;
    this.defaultModel = defaultModel;
    this.client = axios.create({
      baseURL: endpoint,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Tests the connection to the LM Studio API server
   * @returns Promise resolving to true if connection is successful
   * @throws Error if connection fails
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/v1/models');
      console.error('LM Studio API connection successful');
      return true;
    } catch (error) {
      console.error(`Failed to connect to LM Studio API at ${this.endpoint}`);
      if (axios.isAxiosError(error)) {
        console.error(`Status: ${error.response?.status}, Message: ${error.message}`);
      } else {
        console.error(`Error: ${error}`);
      }
      throw new Error(`Failed to connect to LM Studio API: ${error}`);
    }
  }

  /**
   * Generates completions from the DeepSeek R1 or other LM Studio model
   * @param prompt Prompt to send to the model (can be text or objects with file paths)
   * @param options Optional parameters for the completion
   * @returns Generated text from the model
   */
  async completePrompt(
    prompt: string | { text?: string; files?: string[] },
    options: {
      temperature?: number;
      max_tokens?: number;
      stop?: string[];
      system_message?: string;
      model?: string;
    } = {}
  ): Promise<string> {
    try {
      const {
        temperature = 0.7,
        max_tokens = 4000,
        stop = [],
        system_message = '',
        model = this.defaultModel,
      } = options;

      // Create messages array based on input type
      let messages = [];
      
      // Add system message if provided
      if (system_message) {
        messages.push({ role: 'system', content: system_message });
      }
      
      // Handle different prompt types
      if (typeof prompt === 'string') {
        // Simple text prompt
        messages.push({ role: 'user', content: prompt });
      } else {
        // Multimodal prompt with potential files
        let content = [];
        
        // Add file contents if provided
        if (prompt.files && prompt.files.length > 0) {
          let fileTextCount = 0;
          
          // Add the prompt text first if it exists
          if (prompt.text) {
            content.push({ type: 'text', text: prompt.text });
          }
            
            for (const filePath of prompt.files) {
              try {
                // Get file info
                const fileName = path.basename(filePath);
                const mimeType = mime.lookup(filePath) || 'application/octet-stream';
                
                // Resolve the file path and check if it exists
                const resolvedPath = resolveProjectPath(filePath);
                
                if (debugConfig.enabled) {
                  console.error(`File path info:`, getPathInfo(filePath));
                }
                
                // Only handle files that exist
                if (fileExists(resolvedPath)) {
                  // Check if file is within size limits
                  const stats = fs.statSync(resolvedPath);
                  if (stats.size > filesConfig.maxFileSize) {
                    console.error(`File too large (${stats.size} bytes): ${filePath}`);
                    continue;
                  }
                  
                  // Read the file
                  const fileBuffer = fs.readFileSync(resolvedPath);
                  
                  // Check if it's an image
                  if (mimeType.startsWith('image/')) {
                    // LM Studio accepts images as multimodal content
                    const base64Data = fileBuffer.toString('base64');
                    
                    // Add image content to the message
                    content.push({
                      type: 'image_url',
                      image_url: {
                        url: `data:${mimeType};base64,${base64Data}`,
                        detail: 'high'
                      }
                    });
                    
                    console.error(`Added image file ${fileName} (${mimeType}, ${fileBuffer.length} bytes)`);
                  } else {
                    // For non-image files, read as text and add as a separate text content item
                    const fileContent = fileBuffer.toString('utf-8');
                    // Format as a code block with file name and syntax highlighting
                    const formattedContent = `# File: ${fileName}\n\`\`\`${getLanguageFromExt(fileName)}\n${fileContent}\n\`\`\`\n`;
                    
                    // Add text file as a separate text content item
                    content.push({ type: 'text', text: formattedContent });
                    fileTextCount++;
                    
                    console.error(`Added text file ${fileName} as content item (${fileBuffer.length} bytes)`);
                  }
                } else {
                  console.error(`File not found: ${filePath} (resolved to ${resolvedPath})`);
                }
              } catch (fileError) {
                console.error(`Error processing file ${filePath}:`, fileError);
              }
            }
            
            console.error(`Added ${fileTextCount} text files as separate content items`);
          } else if (prompt.text) {
            // If there are no files but we have text, add it as a single content item
            content.push({ type: 'text', text: prompt.text });
          }
        
        // Add the multimodal content to messages
        if (content.length > 0) {
          messages.push({ role: 'user', content });
        } else {
          // Fallback to empty text if no content was created
          messages.push({ role: 'user', content: 'No valid content provided' });
        }
      }
      
      console.error(`Sending request to model: ${model}`);
      
      const response = await this.client.post('/v1/chat/completions', {
        model,
        messages,
        temperature,
        max_tokens,
        stop,
        stream: false,
      });

      if (response.data && response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content || '';
      }

      return '';
    } catch (error) {
      console.error('Error generating completion from LM Studio API:');
      if (axios.isAxiosError(error)) {
        console.error(`Status: ${error.response?.status}, Message: ${error.message}`);
        console.error(`Response data: ${JSON.stringify(error.response?.data)}`);
        console.error(`Request URL: ${error.config?.url}`);
        console.error(`Request data: ${JSON.stringify(error.config?.data)}`);
        
        // More detailed diagnostics
        console.error(`Full request that failed:`, {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          data: JSON.parse(error.config?.data as string || '{}'),
          baseURL: this.endpoint,
          model: options.model || this.defaultModel
        });
      } else {
        console.error(`Error: ${error}`);
      }
      
      // If the error is a 404, try a different endpoint variant
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        try {
          console.error('Attempting alternative endpoint structure...');
          // Try the /completions endpoint as fallback
          const useModel = options.model || this.defaultModel;
          const useTemperature = options.temperature || 0.7;
          const useMaxTokens = options.max_tokens || 4000;
          const useStop = options.stop || [];
          
          const altResponse = await this.client.post('/v1/completions', {
            model: useModel,
            prompt: typeof prompt === 'string' ? prompt : (prompt.text || ''),
            temperature: useTemperature,
            max_tokens: useMaxTokens,
            stop: useStop,
            stream: false,
          });
          
          if (altResponse.data && altResponse.data.choices && altResponse.data.choices.length > 0) {
            console.error('Alternative endpoint succeeded');
            return altResponse.data.choices[0].text || '';
          }
        } catch (altError) {
          console.error('Alternative endpoint also failed:', altError);
        }
      }
      
      throw new Error(`Failed to get completion from LM Studio API: ${error}`);
    }
  }
}
